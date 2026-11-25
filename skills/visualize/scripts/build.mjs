#!/usr/bin/env node
// visualize — build visual.html, PNG snapshots, and visual.md from visual.json.
//
//   node build.mjs <path/to/visual.json> [--check] [--no-png]
//   node build.mjs --install-browser
//
// Next to the JSON it writes:
//   visual.html            the interactive page (template from ../assets/template.html + the JSON)
//   visual/NN-<id>.png     one snapshot per section, light theme, 2x
//   visual/screens/<id>.png one snapshot per screen state of the mockup
//   visual.md              Markdown for GitHub / PRs: the snapshots plus the content as text
//
// --check validates the JSON and writes nothing. --no-png skips the browser (visual.md is text only).
// No npm dependencies of its own: for PNGs it installs a pinned puppeteer into a per-user cache
// (override with VISUALIZE_CACHE) and drives an installed Chrome / Edge / Chromium when it finds one
// (choose with PUPPETEER_EXECUTABLE_PATH); with none installed, puppeteer downloads its own once.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { basename, delimiter, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PUPPETEER_VERSION = '25.19.0';
const VIEWPORT = { width: 1200, height: 900, deviceScaleFactor: 2 };
const isWin = process.platform === 'win32';
const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(here, '..', 'assets', 'template.html');

const log = (m) => console.error(`visualize: ${m}`);

// ---------------------------------------------------------------- args
function parseArgs(argv) {
  const o = { input: null, check: false, png: true, installBrowser: false };
  for (const a of argv) {
    if (a === '--check') o.check = true;
    else if (a === '--no-png') o.png = false;
    else if (a === '--install-browser') o.installBrowser = true;
    else if (a === '-h' || a === '--help') { usage(0); }
    else if (a.startsWith('-')) { console.error(`Unknown option: ${a}`); usage(2); }
    else if (!o.input) o.input = a;
    else usage(2);
  }
  if (!o.input && !o.installBrowser) usage(2);
  return o;
}
function usage(code) {
  (code ? console.error : console.log)(`Usage:
  node build.mjs <visual.json> [--check] [--no-png]
  node build.mjs --install-browser

  --check      validate visual.json only; write nothing
  --no-png     build visual.html and a text-only visual.md, without a browser

Environment:
  PUPPETEER_EXECUTABLE_PATH   browser to drive (default: installed Chrome / Edge / Chromium)
  VISUALIZE_CACHE             where puppeteer is installed (default: per-user cache folder)`);
  process.exit(code);
}

// ---------------------------------------------------------------- validation
const STATUS = ['new', 'changed', 'existing', 'removed'];
const ID = /^[a-z0-9][a-z0-9-]*$/;
// ids the template itself uses; a section must not take one
const RESERVED_IDS = ['top', 'overview', 'nav', 'app', 'drawer', 'scrim', 'dr-title', 'dr-status', 'dr-body', 'dr-close', 'only-changes', 'only-label', 'visual-data'];
const TYPES = ['beforeAfter', 'architecture', 'journey', 'decision', 'rules', 'dataModel', 'sequence', 'states', 'plan', 'notes', 'image'];
const BLOCKS = ['box', 'row', 'heading', 'text', 'message', 'rows', 'field', 'chip', 'summary', 'button', 'tabs', 'table', 'image', 'divider'];
const ICONS = ['user', 'users', 'monitor', 'phone', 'globe', 'tag', 'code', 'route', 'server', 'shield', 'lock', 'key', 'layers', 'database', 'branch', 'card', 'cart', 'box', 'mail', 'bell', 'message', 'clock', 'queue', 'zap', 'cpu', 'cloud', 'plug', 'file', 'search', 'settings', 'chart', 'calendar'];

function validate(d) {
  const errors = [];
  const warnings = [];
  const err = (p, m) => errors.push(`${p}: ${m}`);
  const warn = (p, m) => warnings.push(`${p}: ${m}`);
  const isArr = (v) => Array.isArray(v);
  const need = (obj, key, p) => { if (obj == null || obj[key] === undefined || obj[key] === '' || obj[key] === null) { err(p, `"${key}" is required`); return false; } return true; };
  const status = (v, p) => { if (v !== undefined && !STATUS.includes(v)) err(p, `status "${v}" is not one of ${STATUS.join(', ')}${v === 'focus' ? ' ("focus" is a separate flag: "focus": true)' : ''}`); };
  // a field that is present must be an array (a string would pass `.length` and break `.map`)
  const arrays = (obj, keys, p) => { if (!obj) return; keys.forEach((k) => { if (obj[k] !== undefined && !isArr(obj[k])) err(p, `"${k}" must be an array`); }); };

  // only the starter's placeholders: {{TODO …}}. Other {{…}} may be real template syntax being shown.
  const raw = JSON.stringify(d);
  const tokens = raw.match(/\{\{\s*TODO\b[^}]*\}\}/g);
  if (tokens) err('(anywhere)', `starter placeholders left: ${[...new Set(tokens)].slice(0, 5).join(', ')}`);

  if (d.lang && !['ru', 'en'].includes(d.lang)) warn('lang', `"${d.lang}" has no built-in UI strings; English is used (override with "labels")`);
  need(d, 'task', '$') && need(d.task, 'title', 'task');
  arrays(d.task, ['meta'], 'task');
  if (d.task && isArr(d.task.meta)) d.task.meta.forEach((m, i) => { if (!isArr(m) || m.length !== 2) err(`task.meta[${i}]`, 'must be a [label, value] pair'); });
  if (d.labels !== undefined && (typeof d.labels !== 'object' || isArr(d.labels))) err('labels', 'must be an object');
  if (!isArr(d.sections) || !d.sections.length) { err('sections', 'must be a non-empty array'); return { errors, warnings }; }
  arrays(d, ['screens'], '$');

  // screens
  const screenIds = new Set();
  const blockIds = {};
  const blockFields = (b, bp) => {
    arrays(b, ['blocks', 'items', 'columns', 'rows', 'lines'], bp);
    if (b.type === 'rows' && isArr(b.items)) b.items.forEach((r, k) => { if (!isArr(r)) err(`${bp}.items[${k}]`, 'must be a [label, value] pair'); });
    if (b.type === 'table' && isArr(b.rows)) b.rows.forEach((r, k) => { if (!isArr(r)) err(`${bp}.rows[${k}]`, 'must be an array of cells'); });
  };
  const walk = (blocks, p, ids) => {
    if (!isArr(blocks)) { err(p, 'must be an array of blocks'); return; }
    blocks.forEach((b, i) => {
      const bp = `${p}[${i}]`;
      if (!b || !BLOCKS.includes(b.type)) { err(bp, `block type "${b && b.type}" is not one of ${BLOCKS.join(', ')}`); return; }
      if (b.mark && !['new', 'changed', 'removed'].includes(b.mark)) err(bp, `mark "${b.mark}" must be new, changed, or removed`);
      if (b.id) ids.add(b.id);
      blockFields(b, bp);
      if (isArr(b.blocks)) walk(b.blocks, `${bp}.blocks`, ids);
    });
  };
  const screensList = isArr(d.screens) ? d.screens : [];
  screensList.forEach((s, i) => {
    const p = `screens[${i}]`;
    if (!need(s, 'id', p)) return;
    // screen ids become file names (visual/screens/<id>.png) and Markdown links
    if (!ID.test(s.id)) err(p, `id "${s.id}" must be lowercase letters, digits, and hyphens`);
    if (screenIds.has(s.id)) err(p, `duplicate screen id "${s.id}"`);
    screenIds.add(s.id);
    if (s.patch !== undefined && (typeof s.patch !== 'object' || s.patch === null || isArr(s.patch))) err(p, '"patch" must be an object of block id → changes');
    else if (s.patch) Object.entries(s.patch).forEach(([k, v]) => { if (v && typeof v === 'object') { blockFields(v, `${p}.patch.${k}`); if (isArr(v.blocks)) walk(v.blocks, `${p}.patch.${k}.blocks`, new Set()); } });
  });
  screensList.forEach((s, i) => {
    const p = `screens[${i}] (${s.id})`;
    const ids = new Set();
    if (s.base) {
      if (!screenIds.has(s.base)) err(p, `base "${s.base}" is not a screen id`);
    } else if (!isArr(s.columns)) {
      err(p, '"columns" (an array of columns, each an array of blocks) is required when there is no "base"');
    }
    if (isArr(s.columns)) s.columns.forEach((col, ci) => walk(col, `${p}.columns[${ci}]`, ids));
    blockIds[s.id] = ids;
  });
  const allBlockIds = (id, seen = new Set()) => {
    if (seen.has(id)) return new Set();
    seen.add(id);
    const s = screensList.find((x) => x.id === id);
    if (!s) return new Set();
    const ids = new Set(blockIds[id] || []);
    if (s.base) for (const x of allBlockIds(s.base, seen)) ids.add(x);
    return ids;
  };
  screensList.forEach((s, i) => {
    if (!s.patch) return;
    const known = allBlockIds(s.id);
    Object.keys(s.patch).forEach((k) => { if (!known.has(k)) warn(`screens[${i}] (${s.id}).patch`, `"${k}" matches no block id in this screen or its base`); });
  });

  // architecture cards first, so plan can reference them
  const cardIds = new Set();
  d.sections.forEach((s, si) => {
    if (!s || s.type !== 'architecture' || !isArr(s.zones)) return;
    s.zones.forEach((z, zi) => (z && isArr(z.cards) ? z.cards : []).forEach((c, ci) => {
      const p = `sections[${si}].zones[${zi}].cards[${ci}]`;
      if (need(c, 'id', p)) { if (cardIds.has(c.id)) err(p, `duplicate card id "${c.id}"`); cardIds.add(c.id); }
    }));
  });

  // section ids: explicit ones, or the template's default "<type>-<n>"; all must be unique and
  // must not take an id the template uses itself
  const sectionIds = new Set();
  d.sections.forEach((s, si) => {
    const p = `sections[${si}]${s && s.type ? ` (${s.type})` : ''}`;
    if (!s || !TYPES.includes(s.type)) { err(p, `type "${s && s.type}" is not one of ${TYPES.join(', ')}`); return; }
    need(s, 'title', p);
    if (s.id !== undefined && !ID.test(String(s.id))) err(p, `id "${s.id}" must be lowercase letters, digits, and hyphens`);
    const sid = s.id || `${s.type}-${si + 1}`;
    if (RESERVED_IDS.includes(sid)) err(p, `id "${sid}" is used by the page itself; pick another`);
    if (sectionIds.has(sid)) err(p, `duplicate section id "${sid}"${s.id ? '' : ' (the default id of an unnamed section)'}`);
    sectionIds.add(sid);
    const list = (key) => { if (!isArr(s[key]) || !s[key].length) { err(p, `"${key}" must be a non-empty array`); return []; } return s[key]; };
    switch (s.type) {
      case 'beforeAfter':
        ['before', 'after'].forEach((k) => {
          if (!s[k] || !isArr(s[k].steps) || !s[k].steps.length) { err(`${p}.${k}`, '"steps" must be a non-empty array'); return; }
          s[k].steps.forEach((st, i) => { need(st, 'title', `${p}.${k}.steps[${i}]`); status(st.status, `${p}.${k}.steps[${i}]`); });
        });
        break;
      case 'architecture':
        list('zones').forEach((z, zi) => {
          const zp = `${p}.zones[${zi}]`;
          need(z, 'title', zp);
          if (!isArr(z.cards) || !z.cards.length) { err(zp, '"cards" must be a non-empty array'); return; }
          z.cards.forEach((c, ci) => {
            const cp = `${zp}.cards[${ci}]`;
            need(c, 'name', cp); status(c.status, cp);
            arrays(c, ['tags', 'changes', 'files', 'reqs'], cp);
            if (c.focus !== undefined && typeof c.focus !== 'boolean') err(cp, '"focus" must be true or false');
            if (c.icon && !ICONS.includes(c.icon)) warn(cp, `icon "${c.icon}" is unknown; "box" is drawn. Known: ${ICONS.join(', ')}`);
            if (!isArr(c.files) || !c.files.length) warn(cp, `"${c.name}" has no files; cite path:line where the module exists`);
          });
        });
        break;
      case 'journey':
        list('steps').forEach((st, i) => {
          need(st, 'title', `${p}.steps[${i}]`);
          if (st.screen && !screenIds.has(st.screen)) err(`${p}.steps[${i}]`, `screen "${st.screen}" is not defined in "screens"`);
        });
        if (!screenIds.size) err(p, 'a journey needs top-level "screens"');
        if (s.frame && !['browser', 'phone'].includes(s.frame)) err(p, 'frame must be "browser" or "phone"');
        arrays(s, ['tabs'], p);
        if (isArr(s.tabs)) s.tabs.forEach((t) => { if (!screenIds.has(t)) err(`${p}.tabs`, `screen "${t}" is not defined in "screens"`); });
        break;
      case 'decision': {
        const opts = list('options');
        opts.forEach((o, i) => { need(o, 'title', `${p}.options[${i}]`); arrays(o, ['pros', 'cons'], `${p}.options[${i}]`); });
        if (opts.length && !opts.some((o) => o.chosen)) warn(p, 'no option is "chosen": true');
        if (opts.length === 1) warn(p, 'a decision with one option shows no alternative');
        break;
      }
      case 'rules':
        list('checks').forEach((r, i) => {
          need(r, 'title', `${p}.checks[${i}]`);
          if (r.screen && !screenIds.has(r.screen)) err(`${p}.checks[${i}]`, `screen "${r.screen}" is not defined in "screens"`);
        });
        break;
      case 'dataModel':
        list('entities').forEach((e, i) => {
          const ep = `${p}.entities[${i}]`;
          need(e, 'name', ep); status(e.status, ep);
          if (!isArr(e.fields) || !e.fields.length) err(ep, '"fields" must be a non-empty array');
          else e.fields.forEach((f, fi) => { need(f, 'name', `${ep}.fields[${fi}]`); status(f.status, `${ep}.fields[${fi}]`); });
        });
        arrays(s, ['relations'], p);
        break;
      case 'sequence': {
        const ids = new Set(list('participants').map((x, i) => (need(x, 'id', `${p}.participants[${i}]`) && need(x, 'label', `${p}.participants[${i}]`), x.id)));
        list('items').forEach((it, i) => {
          const ip = `${p}.items[${i}]`;
          if (it.divider !== undefined || it.note !== undefined) {
            arrays(it, ['over'], ip);
            (isArr(it.over) ? it.over : []).forEach((o) => { if (!ids.has(o)) err(ip, `"over" names unknown participant "${o}"`); });
            return;
          }
          if (!ids.has(it.from)) err(ip, `"from" "${it.from}" is not a participant id`);
          if (!ids.has(it.to)) err(ip, `"to" "${it.to}" is not a participant id`);
          need(it, 'text', ip); status(it.status, ip);
        });
        break;
      }
      case 'states': {
        const ids = new Set(list('states').map((x, i) => (need(x, 'id', `${p}.states[${i}]`), need(x, 'label', `${p}.states[${i}]`), status(x.status, `${p}.states[${i}]`), x.id)));
        arrays(s, ['transitions'], p);
        (isArr(s.transitions) ? s.transitions : []).forEach((t, i) => {
          if (!ids.has(t.from)) err(`${p}.transitions[${i}]`, `"from" "${t.from}" is not a state id`);
          if (!ids.has(t.to)) err(`${p}.transitions[${i}]`, `"to" "${t.to}" is not a state id`);
        });
        if (s.start && !ids.has(s.start)) err(p, `start "${s.start}" is not a state id`);
        break;
      }
      case 'plan':
        list('phases').forEach((ph, i) => {
          const pp = `${p}.phases[${i}]`;
          need(ph, 'title', pp);
          if (ph.state && !['done', 'active', 'todo'].includes(ph.state)) err(pp, 'state must be done, active, or todo');
          arrays(ph, ['cards'], pp);
          (isArr(ph.cards) ? ph.cards : []).forEach((c) => { if (!cardIds.has(c)) err(pp, `card "${c}" is not a card id in an architecture section`); });
        });
        break;
      case 'notes':
        list('items').forEach((n, i) => {
          need(n, 'title', `${p}.items[${i}]`);
          if (n.tone && !['info', 'risk', 'question', 'ok', 'out'].includes(n.tone)) err(`${p}.items[${i}]`, 'tone must be info, risk, question, ok, or out');
        });
        break;
      case 'image':
        need(s, 'src', p);
        break;
      default:
    }
  });
  return { errors, warnings };
}

// ---------------------------------------------------------------- html
function buildHtml(d) {
  const tpl = readFileSync(TEMPLATE, 'utf8');
  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const json = JSON.stringify(d).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  // function replacers: a "$'" or "$&" in the content must stay literal
  return tpl
    .replace('__VISUAL_LANG__', () => escHtml(d.lang || 'en'))
    .replace('__VISUAL_TITLE__', () => escHtml(d.task.title))
    .replace('/*VISUAL_DATA*/', () => json);
}

// ---------------------------------------------------------------- browser + puppeteer
function cacheRoot() {
  if (process.env.VISUALIZE_CACHE) return resolve(process.env.VISUALIZE_CACHE);
  if (isWin) return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'visualize');
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'visualize');
  return join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'visualize');
}
const installDir = join(cacheRoot(), `puppeteer-${PUPPETEER_VERSION}`);
const puppeteerPkg = join(installDir, 'node_modules', 'puppeteer', 'package.json');

function findBrowser() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) {
    if (existsSync(fromEnv)) return fromEnv;
    log(`PUPPETEER_EXECUTABLE_PATH points to a missing file: ${fromEnv}; ignoring it`);
    // puppeteer reads the variable itself (to skip its download and to launch), so drop it for real
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const c = [];
  if (isWin) {
    for (const root of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean)) {
      c.push(join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'), join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), join(root, 'Chromium', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    for (const base of ['/Applications', join(homedir(), 'Applications')]) {
      c.push(join(base, 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'), join(base, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'), join(base, 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'));
    }
  } else {
    const dirs = (process.env.PATH || '').split(delimiter).filter(Boolean);
    for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable']) for (const dir of dirs) c.push(join(dir, n));
  }
  return c.find((p) => existsSync(p)) || null;
}

function npm(cmd, env) {
  return spawnSync(`npm ${cmd}`, { cwd: installDir, shell: true, stdio: 'inherit', env });
}

function ensurePuppeteer(browser) {
  if (existsSync(puppeteerPkg)) return true;
  mkdirSync(installDir, { recursive: true });
  writeFileSync(join(installDir, 'package.json'), `${JSON.stringify({ name: 'visualize-snapshots', private: true, dependencies: { puppeteer: PUPPETEER_VERSION } }, null, 2)}\n`);
  log(`first run: installing puppeteer ${PUPPETEER_VERSION} into ${installDir} (one-time)`);
  const env = { ...process.env };
  if (browser) { env.PUPPETEER_SKIP_DOWNLOAD = 'true'; log(`using the installed browser ${browser}; no browser download`); }
  else log('no installed Chrome, Edge or Chromium found: puppeteer downloads a headless Chrome (~150-200 MB, one-time)');
  const r = npm('install --no-audit --no-fund --loglevel=error', env);
  return r.status === 0 && existsSync(puppeteerPkg);
}

async function loadPuppeteer() {
  const req = createRequire(join(installDir, 'package.json'));
  const mod = await import(pathToFileURL(req.resolve('puppeteer')).href);
  return mod.default || mod;
}

// ---------------------------------------------------------------- snapshots
async function snapshot(htmlPath, outDir, browserPath) {
  const puppeteer = await loadPuppeteer();
  const launch = { headless: true, args: process.platform === 'linux' ? ['--no-sandbox', '--disable-setuid-sandbox'] : [] };
  if (browserPath) launch.executablePath = browserPath;
  const browser = await puppeteer.launch(launch);
  const shots = { overview: null, sections: {}, screens: {} };
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
    // The web font loads without blocking the page. Wait a few seconds for it; if the font host is
    // slow or blocked, the snapshots use the system font instead of failing.
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.visual && window.visual.ready, { timeout: 15000 });
    await page.waitForFunction(() => {
      const l = document.querySelector('link[data-fonts]');
      return !l || l.media === 'all' || l.dataset.failed;
    }, { timeout: 6000 }).then(() => page.evaluate(() => document.fonts.ready.then(() => true))).catch(() => {
      log('the web font did not load in time; snapshots use the system font');
    });
    await page.evaluate(() => { document.documentElement.classList.add('snapshot'); document.documentElement.dataset.theme = 'light'; });
    const info = await page.evaluate(() => ({ sections: window.visual.sections, screens: window.visual.screens }));

    mkdirSync(outDir, { recursive: true });
    const hero = await page.$('[data-snap="overview"]');
    if (hero) {
      const file = join(outDir, '00-overview.png');
      await hero.screenshot({ path: file });
      shots.overview = file;
    }
    let n = 0;
    for (const s of info.sections) {
      n++;
      const el = await page.$(`[data-snap="${s.id}"]`);
      if (!el) continue;
      const file = join(outDir, `${String(n).padStart(2, '0')}-${s.id}.png`);
      await el.screenshot({ path: file });
      shots.sections[s.id] = file;
    }
    if (info.screens.length) {
      const dir = join(outDir, 'screens');
      mkdirSync(dir, { recursive: true });
      for (const id of info.screens) {
        // shows the screen in the journey that uses it and returns that journey's device frame
        const selector = await page.evaluate((x) => window.visual.showScreen(x), id);
        const el = selector && (await page.$(selector));
        if (!el) continue;
        const file = join(dir, `${id}.png`);
        await el.screenshot({ path: file });
        shots.screens[id] = file;
      }
    }
  } finally {
    await browser.close();
  }
  return shots;
}

function clearPngs(dir) {
  for (const d of [dir, join(dir, 'screens')]) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) if (f.toLowerCase().endsWith('.png')) rmSync(join(d, f), { force: true });
  }
}

// ---------------------------------------------------------------- markdown
function mergeLabels(base, over) {
  const isMap = (x) => x && typeof x === 'object' && !Array.isArray(x);
  for (const [k, v] of Object.entries(over || {})) base[k] = isMap(v) && isMap(base[k]) ? { ...base[k], ...v } : v;
  return base;
}

const MD = {
  ru: {
    interactive: 'Интерактивная версия', open: 'откройте в браузере: карточки раскрываются, шаги сценария переключают экран, фазы плана подсвечивают модули',
    generated: 'Сгенерировано скилом visualize из `visual.json`. Правьте JSON и пересобирайте; этот файл и картинки не редактируются руками.',
    status: { new: 'новое', changed: 'меняется', existing: 'без изменений', removed: 'удаляется', focus: 'раскрыто ниже' },
    module: 'Модуль', what: 'Что делает', files: 'Файлы', reqs: 'Требования', st: 'Статус',
    before: 'Сейчас', after: 'После задачи', screens: 'Экраны по шагам', branch: 'ветка',
    pros: 'Плюсы', cons: 'Минусы', chosen: 'выбрано', why: 'Почему', no: 'нет',
    field: 'Поле', type: 'Тип', key: 'Ключ', state: 'Состояние', transitions: 'Переходы', start: 'старт', final: 'финал',
    phaseCol: 'Фаза', delivers: 'Что даёт', modules: 'Модули', phase: { done: 'готово', active: 'в работе', todo: 'впереди' },
    note: { info: 'заметка', risk: 'риск', question: 'вопрос', ok: 'решено', out: 'вне задачи' }, stats: 'Модули',
  },
  en: {
    interactive: 'Interactive version', open: 'open it in a browser: cards expand, journey steps switch the screen, plan phases highlight their modules',
    generated: 'Generated by the visualize skill from `visual.json`. Edit the JSON and rebuild; never edit this file or the images by hand.',
    status: { new: 'new', changed: 'changed', existing: 'unchanged', removed: 'removed', focus: 'opened below' },
    module: 'Module', what: 'What it does', files: 'Files', reqs: 'Requirements', st: 'Status',
    before: 'Today', after: 'After this task', screens: 'Screens by step', branch: 'branch',
    pros: 'Pros', cons: 'Cons', chosen: 'chosen', why: 'Why', no: 'no',
    field: 'Field', type: 'Type', key: 'Key', state: 'State', transitions: 'Transitions', start: 'start', final: 'final',
    phaseCol: 'Phase', delivers: 'Delivers', modules: 'Modules', phase: { done: 'done', active: 'in progress', todo: 'ahead' },
    note: { info: 'note', risk: 'risk', question: 'question', ok: 'resolved', out: 'out of scope' }, stats: 'Modules',
  },
};

function buildMd(d, shots, baseDir) {
  // the same labels overrides as the page: keys that exist here apply to visual.md too
  const T = mergeLabels(JSON.parse(JSON.stringify(MD[d.lang] || MD.en)), d.labels);
  const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const rel = (f) => relative(baseDir, f).split('\\').join('/');
  const img = (alt, f) => (f ? `![${alt.replace(/[[\]]/g, '')}](${rel(f)})\n\n` : '');
  const st = (s) => T.status[s || 'existing'] || s;
  const out = [];
  const t = d.task;
  out.push(`<!-- ${T.generated} -->`, '', `# ${t.title}`, '');
  if (t.lede) out.push(t.lede, '');
  if (t.meta && t.meta.length) out.push(t.meta.map((m) => `**${m[0]}:** ${m[1]}`).join(' · '), '');
  out.push(`> **${T.interactive}:** [visual.html](visual.html) — ${T.open}.`, '');
  if (shots.overview) out.push(img(t.title, shots.overview).trimEnd(), '');

  const cards = {};
  d.sections.filter((s) => s.type === 'architecture').forEach((s) => s.zones.forEach((z) => z.cards.forEach((c) => { cards[c.id] = c; })));
  const screens = {};
  (d.screens || []).forEach((s) => { screens[s.id] = s; });

  d.sections.forEach((s, i) => {
    const id = s.id || `${s.type}-${i + 1}`;
    out.push(`## ${s.title}`, '');
    if (s.intro) out.push(s.intro, '');
    out.push(img(s.title, shots.sections[id]).trimEnd(), '');
    switch (s.type) {
      case 'beforeAfter':
        ['before', 'after'].forEach((k) => {
          const side = s[k];
          out.push(`**${side.label || T[k]}:** ${side.steps.map((x) => (x.status && x.status !== 'existing' ? `**${x.title}** _(${st(x.status)})_` : x.title)).join(' → ')}`, '');
          if (side.outcome) out.push(side.outcome, '');
        });
        break;
      case 'architecture':
        s.zones.forEach((z) => {
          out.push(`### ${z.title}${z.path ? ` · \`${z.path}\`` : ''}`, '', `| ${T.module} | ${T.st} | ${T.what} | ${T.files} | ${T.reqs} |`, '| --- | --- | --- | --- | --- |');
          z.cards.forEach((c) => out.push(`| **${cell(c.name)}** | ${st(c.status)}${c.focus ? ` · ${T.status.focus}` : ''} | ${cell(c.desc)} | ${(c.files || []).map((f) => `\`${cell(f)}\``).join('<br>')} | ${(c.reqs || []).join(', ')} |`));
          out.push('');
        });
        break;
      case 'journey': {
        let n = 0;
        s.steps.forEach((x) => out.push(`${x.branch ? '- ⚠' : `${++n}.`} **${x.title}**${x.branch ? ` _(${typeof x.branch === 'string' ? x.branch : T.branch})_` : ''}${x.text ? ` — ${x.text}` : ''}${x.ref ? ` · \`${x.ref}\`` : ''}`));
        out.push('');
        const ids = [...new Set(s.steps.map((x) => x.screen).filter(Boolean))];
        if (ids.some((x) => shots.screens[x])) {
          out.push('<details>', `<summary>${T.screens}</summary>`, '');
          ids.forEach((x) => { if (shots.screens[x]) out.push(`**${(screens[x] && screens[x].label) || x}**`, '', img(x, shots.screens[x]).trimEnd(), ''); });
          out.push('</details>', '');
        }
        break;
      }
      case 'decision':
        s.options.forEach((o) => {
          out.push(`### ${o.title}${o.chosen ? ` ✓ _${T.chosen}_` : ''}`, '');
          if (o.text) out.push(o.text, '');
          if (o.pros && o.pros.length) out.push(`**${T.pros}:**`, ...o.pros.map((x) => `- ${x}`), '');
          if (o.cons && o.cons.length) out.push(`**${T.cons}:**`, ...o.cons.map((x) => `- ${x}`), '');
        });
        if (s.why) out.push(`**${T.why}:** ${s.why}`, '');
        break;
      case 'rules':
        s.checks.forEach((r, k) => out.push(`${k + 1}. **${r.title}**${r.code ? ` \`${r.code}\`` : ''}${r.fail ? ` → ${T.no}: «${r.fail}»` : ''}`));
        if (s.success) out.push(`- ✓ **${s.success.title}**${s.success.code ? ` \`${s.success.code}\`` : ''}`);
        out.push('');
        break;
      case 'dataModel':
        s.entities.forEach((e) => {
          out.push(`### \`${e.name}\` · ${st(e.status)}`, '');
          if (e.note) out.push(e.note, '');
          out.push(`| ${T.field} | ${T.type} | ${T.key} | ${T.st} |`, '| --- | --- | --- | --- |');
          e.fields.forEach((f) => out.push(`| \`${cell(f.name)}\`${f.note ? ` — ${cell(f.note)}` : ''} | ${cell(f.type)} | ${cell(f.key)} | ${f.status ? st(f.status) : ''} |`));
          out.push('');
        });
        if (s.relations && s.relations.length) out.push(...s.relations.map((r) => `- ${r}`), '');
        break;
      case 'sequence': {
        const name = {};
        s.participants.forEach((p) => { name[p.id] = p.label; });
        let n = 0;
        s.items.forEach((it) => {
          if (it.divider !== undefined) out.push(`- _${it.divider}_`);
          else if (it.note !== undefined) out.push(`- 🛈 ${it.note}`);
          else out.push(`${++n}. ${name[it.from]} ${it.reply ? '⇠' : '→'} ${name[it.to]}: ${it.text}${it.status && it.status !== 'existing' ? ` _(${st(it.status)})_` : ''}`);
        });
        out.push('');
        break;
      }
      case 'states': {
        const label = {};
        s.states.forEach((x) => { label[x.id] = x.label; });
        out.push(`| ${T.state} | ${T.transitions} |`, '| --- | --- |');
        s.states.forEach((x) => {
          const tr = (s.transitions || []).filter((y) => y.from === x.id);
          const flag = x.id === s.start ? ` _(${T.start})_` : !tr.length ? ` _(${T.final})_` : '';
          out.push(`| **${cell(x.label)}**${flag} | ${tr.map((y) => `→ ${cell(label[y.to])}: ${cell(y.trigger)}`).join('<br>')} |`);
        });
        out.push('');
        break;
      }
      case 'plan':
        out.push(`| # | ${T.phaseCol} | ${T.delivers} | ${T.st} | ${T.modules} |`, '| --- | --- | --- | --- | --- |');
        s.phases.forEach((p, k) => out.push(`| ${p.n || k + 1} | **${cell(p.title)}** | ${cell(p.text)} | ${T.phase[p.state || 'todo']} | ${(p.cards || []).map((c) => (cards[c] ? cards[c].name : c)).join(', ')} |`));
        out.push('');
        break;
      case 'notes':
        s.items.forEach((x) => out.push(`- **${x.title}** _(${x.tag || T.note[x.tone || 'info']})_${x.text ? ` — ${x.text}` : ''}`));
        out.push('');
        break;
      case 'image':
        out.push(`![${s.alt || s.title}](${s.src})`, '');
        if (s.caption) out.push(s.caption, '');
        break;
      default:
    }
  });
  if (d.footer) out.push('---', '', d.footer, '');
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

// ---------------------------------------------------------------- main
async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.installBrowser) {
    if (!ensurePuppeteer(null)) process.exit(2);
    const env = { ...process.env };
    delete env.PUPPETEER_SKIP_DOWNLOAD;
    const r = npm('rebuild puppeteer --foreground-scripts', env);
    process.exit(r.status === 0 ? 0 : 2);
  }

  const input = resolve(o.input);
  if (!existsSync(input)) { log(`not found: ${input}`); process.exit(2); }
  let data;
  try { data = JSON.parse(readFileSync(input, 'utf8')); } catch (e) { log(`${basename(input)} is not valid JSON: ${e.message}`); process.exit(1); }

  const { errors, warnings } = validate(data);
  warnings.forEach((w) => console.log(`  warn  ${w}`));
  errors.forEach((e) => console.log(`  ERROR ${e}`));
  if (errors.length) { console.log(`visualize: ${errors.length} error(s), ${warnings.length} warning(s); nothing written`); process.exit(1); }
  if (o.check) { console.log(`visualize: ${basename(input)} is valid (${warnings.length} warning(s))`); return; }

  const dir = dirname(input);
  const htmlPath = join(dir, 'visual.html');
  const pngDir = join(dir, 'visual');
  writeFileSync(htmlPath, buildHtml(data));
  console.log(`  ok    ${relative(process.cwd(), htmlPath)}`);

  // every build starts from no snapshots, so none can outlive the JSON they were taken from
  clearPngs(pngDir);
  let shots = { overview: null, sections: {}, screens: {} };
  if (o.png) {
    const browser = findBrowser();
    if (!ensurePuppeteer(browser)) {
      log('could not install puppeteer; visual.md is written without images. Check Node.js (>= 22.13), npm, and network access.');
    } else {
      try {
        shots = await snapshot(htmlPath, pngDir, browser);
        console.log(`  ok    ${Object.keys(shots.sections).length} section snapshot(s), ${Object.keys(shots.screens).length} screen snapshot(s) in ${relative(process.cwd(), pngDir)}`);
      } catch (e) {
        log(`snapshots failed: ${e.message.split('\n')[0]}`);
        if (!browser) log('no browser available. Install Chrome / Edge / Chromium, set PUPPETEER_EXECUTABLE_PATH, or run: node build.mjs --install-browser');
      }
    }
  }
  const mdPath = join(dir, 'visual.md');
  writeFileSync(mdPath, buildMd(data, shots, dir));
  console.log(`  ok    ${relative(process.cwd(), mdPath)}`);
}

main().catch((e) => { console.error(e); process.exit(2); });
