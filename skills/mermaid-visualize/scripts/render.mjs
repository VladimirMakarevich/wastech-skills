#!/usr/bin/env node
// mermaid-visualize — render Mermaid sources (*.mmd) to SVG and PNG with mermaid-cli.
//
//   node render.mjs <dir | file.mmd> [--format svg,png] [--check] [--only a,b] [--jobs N]
//   node render.mjs --install-browser
//
// No npm dependencies of its own. On first run it installs a pinned mermaid-cli into a per-user
// cache (override the location with MERMAID_VISUALIZE_CACHE). It drives an installed Chrome, Edge or
// Chromium when it finds one (choose one with PUPPETEER_EXECUTABLE_PATH), so no browser is
// downloaded; with none installed, puppeteer downloads its own headless Chrome once.
//
// Outputs are written next to each source: <name>.svg, <name>.png. --check renders into a
// temporary folder and writes nothing next to the sources: a syntax check only.

import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MERMAID_CLI_VERSION = '12.2.0';
const MERMAID_VERSION = '12.3.0';
const PUPPETEER_VERSION = '25.19.0';
const PNG_SCALE = 2;
const BACKGROUND = 'white';
const FORMATS = ['svg', 'png', 'pdf'];

const isWin = process.platform === 'win32';
const here = dirname(fileURLToPath(import.meta.url));
const MERMAID_CONFIG = resolve(here, '..', 'assets', 'mermaid-config.json');

const log = (msg) => console.error(`mermaid-visualize: ${msg}`);

function usage(code) {
  const text = `Usage:
  node render.mjs <dir | file.mmd> [options]   render every *.mmd in <dir> (or one file)
  node render.mjs --install-browser            download puppeteer's headless Chrome

Options:
  --format svg,png   output formats (svg, png, pdf); default: svg,png
  --check            syntax check only: render to a temp folder, write nothing
  --only a,b         render only these sources (basenames, with or without .mmd)
  --jobs N           parallel renders; default: 3

Environment:
  PUPPETEER_EXECUTABLE_PATH   browser to drive (default: installed Chrome / Edge / Chromium)
  MERMAID_VISUALIZE_CACHE             where mermaid-cli is installed (default: per-user cache folder)`;
  (code === 0 ? console.log : console.error)(text);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { target: null, formats: ['svg', 'png'], check: false, only: null, jobs: 3, installBrowser: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) { console.error(`Missing value for ${a}`); usage(2); }
      return v;
    };
    if (a === '--format' || a === '-f') opts.formats = value().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--check') opts.check = true;
    else if (a === '--only') opts.only = new Set(value().split(',').map((s) => s.trim().replace(/\.mmd$/i, '')));
    else if (a === '--jobs' || a === '-j') opts.jobs = Math.max(1, Number.parseInt(value(), 10) || 1);
    else if (a === '--install-browser') opts.installBrowser = true;
    else if (a === '-h' || a === '--help') usage(0);
    else if (a.startsWith('-')) { console.error(`Unknown option: ${a}`); usage(2); }
    else if (!opts.target) opts.target = a;
    else { console.error(`Unexpected argument: ${a}`); usage(2); }
  }
  const bad = opts.formats.filter((f) => !FORMATS.includes(f));
  if (bad.length || !opts.formats.length) { console.error(`Unknown format: ${bad.join(', ')}`); usage(2); }
  if (!opts.target && !opts.installBrowser) usage(2);
  return opts;
}

function cacheRoot() {
  if (process.env.MERMAID_VISUALIZE_CACHE) return resolve(process.env.MERMAID_VISUALIZE_CACHE);
  if (isWin) return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'mermaid-visualize');
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'mermaid-visualize');
  return join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'mermaid-visualize');
}

const installDir = join(cacheRoot(), `mermaid-cli-${MERMAID_CLI_VERSION}-mermaid-${MERMAID_VERSION}`);
const cliPackageJson = join(installDir, 'node_modules', '@mermaid-js', 'mermaid-cli', 'package.json');

function findBrowser() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) {
    if (existsSync(fromEnv)) return fromEnv;
    log(`PUPPETEER_EXECUTABLE_PATH points to a missing file: ${fromEnv}; ignoring it`);
    // puppeteer reads the variable itself (to skip its download and to launch), so drop it for real
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [];
  if (isWin) {
    const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    for (const root of roots) {
      candidates.push(
        join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        join(root, 'Chromium', 'Application', 'chrome.exe'),
      );
    }
  } else if (process.platform === 'darwin') {
    for (const base of ['/Applications', join(homedir(), 'Applications')]) {
      candidates.push(
        join(base, 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
        join(base, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        join(base, 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'),
      );
    }
  } else {
    const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
    const dirs = (process.env.PATH || '').split(delimiter).filter(Boolean);
    for (const name of names) for (const dir of dirs) candidates.push(join(dir, name));
  }
  return candidates.find((p) => existsSync(p)) || null;
}

function npm(command, env) {
  // A single command string: npm is a .cmd shim on Windows and needs a shell; no paths are passed.
  return spawnSync(`npm ${command}`, { cwd: installDir, shell: true, stdio: 'inherit', env });
}

function ensureMermaidCli(browser) {
  if (!existsSync(cliPackageJson)) {
    mkdirSync(installDir, { recursive: true });
    writeFileSync(join(installDir, 'package.json'), `${JSON.stringify({
      name: 'visualize-renderer',
      private: true,
      dependencies: {
        '@mermaid-js/mermaid-cli': MERMAID_CLI_VERSION,
        mermaid: MERMAID_VERSION,
        puppeteer: PUPPETEER_VERSION,
      },
    }, null, 2)}\n`);
    log(`first run: installing mermaid-cli ${MERMAID_CLI_VERSION} (mermaid ${MERMAID_VERSION}) into ${installDir} (one-time)`);
    const env = { ...process.env };
    if (browser) {
      env.PUPPETEER_SKIP_DOWNLOAD = 'true';
      log(`using the installed browser ${browser}; no browser download`);
    } else {
      log('no installed Chrome, Edge or Chromium found: puppeteer downloads a headless Chrome (~150-200 MB, one-time)');
    }
    const r = npm('install --no-audit --no-fund --loglevel=error', env);
    if (r.status !== 0 || !existsSync(cliPackageJson)) {
      log('installing mermaid-cli failed. Check Node.js (>= 22.13), npm, and network access, then run again.');
      process.exit(2);
    }
  }
  const { bin } = JSON.parse(readFileSync(cliPackageJson, 'utf8'));
  const rel = typeof bin === 'string' ? bin : bin.mmdc;
  return join(dirname(cliPackageJson), rel);
}

function installBrowser() {
  if (!existsSync(cliPackageJson)) ensureMermaidCli(null);
  log('downloading puppeteer\'s headless Chrome');
  const env = { ...process.env };
  delete env.PUPPETEER_SKIP_DOWNLOAD;
  const r = npm('rebuild puppeteer --foreground-scripts', env);
  process.exit(r.status === 0 ? 0 : 2);
}

function collectSources(target, only) {
  const abs = resolve(target);
  if (!existsSync(abs)) { log(`not found: ${abs}`); process.exit(2); }
  let files;
  if (statSync(abs).isDirectory()) {
    files = readdirSync(abs).filter((f) => f.toLowerCase().endsWith('.mmd')).sort().map((f) => join(abs, f));
  } else {
    files = [abs];
  }
  if (only) files = files.filter((f) => only.has(basename(f).replace(/\.mmd$/i, '')));
  if (!files.length) { log(`no .mmd sources in ${abs}${only ? ' matching --only' : ''}`); process.exit(2); }
  return files;
}

function writePuppeteerConfig(dir, browser) {
  const cfg = {};
  if (browser) {
    cfg.executablePath = browser;
    cfg.headless = true;
  }
  if (process.platform === 'linux') cfg.args = ['--no-sandbox', '--disable-setuid-sandbox'];
  const file = join(dir, 'puppeteer-config.json');
  writeFileSync(file, JSON.stringify(cfg));
  return file;
}

function runMmdc(cli, src, out, format, puppeteerConfig) {
  const args = [cli, '-i', src, '-o', out, '-c', MERMAID_CONFIG, '-p', puppeteerConfig,
    '-b', BACKGROUND, '-q'];
  if (format === 'png') args.push('-s', String(PNG_SCALE));
  return new Promise((done) => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    child.on('error', (e) => done({ ok: false, output: String(e) }));
    child.on('close', (code) => done({ ok: code === 0 && existsSync(out), output }));
  });
}

function summarizeError(output) {
  const lines = output.split(/\r?\n/)
    .filter((l) => l.trim())
    .filter((l) => !/^\s+at\s/.test(l) && !/node_modules|file:\/\//.test(l));
  return lines.slice(0, 10).join('\n') || 'mermaid-cli failed without a message';
}

async function pool(tasks, size) {
  const results = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, worker));
  return results;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.installBrowser) installBrowser();

  const sources = collectSources(opts.target, opts.only);
  const browser = findBrowser();
  const cli = ensureMermaidCli(browser);
  const work = mkdtempSync(join(tmpdir(), 'visualize-'));
  const puppeteerConfig = writePuppeteerConfig(work, browser);
  const formats = opts.check ? ['svg'] : opts.formats;

  log(`${opts.check ? 'checking' : 'rendering'} ${sources.length} diagram(s) with mermaid ${MERMAID_VERSION}`
    + ` (browser: ${browser || 'puppeteer default'})`);

  const tasks = sources.map((src) => async () => {
    const name = basename(src).replace(/\.mmd$/i, '');
    const outDir = opts.check ? work : dirname(src);
    const done = [];
    for (const format of formats) {
      const out = join(outDir, `${name}.${format}`);
      rmSync(out, { force: true }); // never leave a stale image next to a source that no longer renders
      const r = await runMmdc(cli, src, out, format, puppeteerConfig);
      if (!r.ok) {
        for (const f of formats) if (!opts.check) rmSync(join(outDir, `${name}.${f}`), { force: true });
        return { src, ok: false, error: summarizeError(r.output) };
      }
      done.push(format);
    }
    return { src, ok: true, done };
  });

  const results = await pool(tasks, opts.jobs);
  rmSync(work, { recursive: true, force: true });

  let failed = 0;
  for (const r of results) {
    const name = basename(r.src);
    if (r.ok) {
      console.log(`  ok    ${name}${opts.check ? '' : `  -> ${r.done.join(', ')}`}`);
    } else {
      failed++;
      console.log(`  FAIL  ${name}`);
      console.log(r.error.split('\n').map((l) => `        ${l}`).join('\n'));
    }
  }
  console.log(`mermaid-visualize: ${results.length - failed} ok, ${failed} failed`);

  if (failed && !browser && results.some((r) => !r.ok && /could not find|browser was not found|failed to launch/i.test(r.error))) {
    log('no browser available. Install Chrome / Edge / Chromium, set PUPPETEER_EXECUTABLE_PATH, or run: node render.mjs --install-browser');
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
