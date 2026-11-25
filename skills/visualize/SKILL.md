---
name: visualize
description: Visualize a task, a feature, or a part of an application as an interactive page — visual.html built from one visual.json, plus PNG snapshots and a visual.md for GitHub. Rich components instead of plain diagrams — architecture as layered cards (icon, description, tech tags, status, a side panel with files and requirements), a user journey whose steps drive a live screen mockup with NEW / CHANGED marks, before/after, decision cards with pros and cons, business-rule chains, data-model tables, call sequences, state lifecycles, and a plan whose phases highlight the modules they touch. Works from a spec folder (spec-task calls it at its checkpoints), from the code (how existing logic, a subsystem, or a user interaction works, every module cited to path:line), or from an idea in the conversation. The agent writes only the JSON; a bundled Node script validates it, renders the fixed template, and snapshots it through an installed Chrome or Edge. Use when the user says "visualize", "show me how X works", "give me the big picture", "show what will change", "визуализируй", "покажи, как это будет работать", or wants to see a change before it is built.
argument-hint: "<what to visualize> | <spec folder> [user|technical|plan]"
---

# visualize

Turns a task, a feature, or a part of an application into an **interactive visual**: one page
that shows the whole picture at a glance and the details on demand.

- **The big picture:** a header with counters (new / changed / unchanged modules, plan phases), then sections that each answer one question.
- **The details:** click a module card for its files, requirements, and plan phases; step through the user journey and watch the screen change; open a failed rule on the screen; click a plan phase to light up the modules it touches; toggle "only changes".

You write **only data**: `visual.json`. The template, the styling, and the interactivity are fixed in
this skill, so every visual looks and behaves the same. The build script turns the JSON into:

```
<folder>/
  visual.json          the source: the only file you edit
  visual.html          the interactive page (open in a browser; works offline, fonts fall back)
  visual.md            for GitHub and PRs: snapshots plus the same content as text
  visual/00-overview.png, NN-<section>.png, screens/<state>.png
```

A visual is **derived**. It shows what its sources say (the spec documents, the code, the
conversation) and decides nothing. When building it exposes a gap or a contradiction, raise it with
the user; don't fill it in the picture.

For plain Mermaid diagrams embedded in Markdown instead, use the `mermaid-visualize` skill.

## How to converse

- Speak the user's language. Write the content in the project's documentation language, and set `"lang"` (`ru` or `en`) for the page's own buttons and labels.
- Look facts up yourself; ask the user only for decisions (the reader, the sections, where to save).
- Propose the sections in one short message and go ahead on the user's word. Not an interview.

## Bundled files

| File | What it is for |
| --- | --- |
| [references/sections.md](references/sections.md) | Which section answers which question; presets; how to write good content; size limits |
| [references/data-format.md](references/data-format.md) | The `visual.json` format, field by field, with an example per section |
| [references/screens.md](references/screens.md) | The screen-mockup language: blocks, states as base + patch, change marks |
| [examples/promo-codes.json](examples/promo-codes.json) | A complete example using every section type: copy its structure |
| [templates/visual.json](templates/visual.json) | A starter with `{{TODO: …}}` placeholders; the build refuses to run until they are all replaced |
| [assets/template.html](assets/template.html) | The page template: styling and interactivity. Not edited per visual |
| [scripts/build.mjs](scripts/build.mjs) | Validates the JSON and writes `visual.html`, the PNGs, and `visual.md` |

Paths are relative to this `SKILL.md`; resolve them to the folder the skill is installed in.

## Pick the mode: where the facts come from

- **spec:** a spec folder (`docs/tasks/<slug>/` from `spec-task`, or the project's equivalent). Sources: `problem.md`, `requirements.md`, `out-of-scope.md`, `happy-path.md`, `design.md`, `questions.md`, `plan/`. Cards cite FR-/NFR- ids; statuses come from `design.md`.
- **code:** something that already exists. Trace the real path through the code; for a broad area, send a sub-agent to map it and check what it reports. Every card cites `path:line`. Everything is `existing`, unless the visual is about a pending change (uncommitted work, a branch, a PR): then the diff decides `new`, `changed`, `removed`. Screens mirror the real UI.
- **idea:** something not yet specified or built. Everything is `new`, except the existing parts it attaches to: look those up in the code.

## Step 1 — Frame

1. **Subject:** what is shown, and where it stops.
2. **Reader:** non-technical, engineers, or both. Non-technical readers lead with `beforeAfter` and `journey`; engineers with `architecture` and `sequence`.
3. **Questions:** the two to six things the reader must be able to answer afterwards. Each becomes a section.
4. **Location:**
   - spec mode: `<spec folder>/visual.json`;
   - otherwise the project's existing home for such docs (`docs/visuals/`, `docs/architecture/`, …), else `docs/visuals/<slug>/visual.json` with a kebab-case slug you propose;
   - if the user wants nothing in the repository, use a temporary folder and give them the full paths.

If `visual.json` already exists there, don't start over: read it and update or extend it.

## Step 2 — Choose the sections

Map the questions to sections with the table in [references/sections.md](references/sections.md).
In spec mode, `spec-task` passes a preset:

| Preset | When | Sections |
| --- | --- | --- |
| `user` | after `happy-path.md` | `beforeAfter`, `journey` + `screens` (when there is UI), `notes` for what is out of scope |
| `technical` | after `design.md` | `architecture`, `decision` per key decision, and where they apply: `rules`, `dataModel`, `sequence`, `states` |
| `plan` | after `plan/` | `plan`, `notes` for risks and blocking questions |

Presets extend the same `visual.json`. Drop a section that would be empty or trivial, and say why
in one line. Propose the list (section and its question, one line each) and go ahead on the user's word.

## Step 3 — Gather the facts

- **Names exactly as the source writes them**: modules, screens, copy, tables, fields, requirement ids.
- **A status for every element**: `new`, `changed`, `existing`, or `removed`. A card that a later section opens up also gets `"focus": true`, on top of its status.
- **A source for every card**: `files` with `path:line`, `reqs` with FR-/NFR-/AC- ids.
- **Real content in screens**: the real copy, plausible real data, the real error messages.
- **Nothing invented.** If a section needs a fact the sources don't have, that is a gap: ask, and in spec mode log it in `questions.md`.

## Step 4 — Write visual.json

Start from [templates/visual.json](templates/visual.json), or copy the shape of
[examples/promo-codes.json](examples/promo-codes.json). Follow
[references/data-format.md](references/data-format.md) for every field and
[references/screens.md](references/screens.md) for the mockups:

- one base screen per real screen, each state as a `patch` of it; give an `id` to every block a state changes;
- mark only the outermost block the task adds or changes;
- one sentence per `desc` / `text`; the details go into `changes`, `files`, `reqs`;
- keep to the size limits in [references/sections.md](references/sections.md), and split when over.

## Step 5 — Build

```bash
node <skill folder>/scripts/build.mjs <folder>/visual.json
```

- It validates first: unknown section types, missing fields, bad statuses, a list written as a string, ids that are malformed, duplicated, or taken by the page itself, references to screens, cards, or participants that don't exist, and leftover `{{TODO: …}}` placeholders all stop the build with the exact JSON path. Warnings (unknown icon, a card without files, a patch key matching no block, a decision with nothing chosen) don't stop it, but fix them.
- Then it writes `visual.html`, removes the old snapshots, takes new ones (light theme, 2×), and writes `visual.md`.
- The page uses the Inter web font. If fonts.googleapis.com is slow or blocked, the page and the snapshots fall back to the system font; the build says so. Snapshots built on different machines can then differ in font.
- **Needs Node.js 22.13+.** The first run installs a pinned puppeteer into a per-user cache (seconds). It drives an installed Chrome, Edge, or Chromium; only when none is installed does it download a headless Chrome (~150–200 MB). Tell the user before that.
- `--check` validates only. `--no-png` skips the browser: `visual.html` and a text-only `visual.md`.

## Step 6 — Look at the result

Open the PNGs you produced: `visual/00-overview.png`, every section, and every `visual/screens/*.png`.
Check them as the reader will see them:

- No text cut off or overflowing; cards in a zone of similar length; no zone with a single lonely card when it could merge.
- Statuses match the facts: the counters in the overview should match what `design.md` says changes.
- Screens look like the real screen: copy, numbers, and error messages right, marks only on what changes.
- Each section answers its question at a glance; if its `intro` has to explain too much, the section is overloaded.

Fix the JSON and build again.

## Step 7 — Show it and iterate

Tell the user where the files are: `visual.html` to open in a browser (the interactive version), and
`visual.md` for GitHub and reviews. Say in a line what each section shows and what the overview
reveals. Take corrections as edits to `visual.json`, then rebuild and look again. Offer to commit the
folder following the project's conventions; never commit without a yes. Commit the PNGs together with
`visual.md`, because it embeds them.

## In a spec folder

- `spec-task` offers a preset at each checkpoint; the user can ask for any section at any time.
- Add the `visual.md` row to the documents table in the spec's `index.md` if it isn't there: `| — | [visual.md](visual.md) | Visual of the task; interactive version in visual.html | ☐ |`. Tick it ☑ once the user has reviewed the visual, and append a line to the change log.
- A section that exposes a gap (an error with no screen, a module nobody owns, a state with no exit) goes into `questions.md` and is raised with the user.
- One visual per spec folder: if the spec already has a `visual.md` from `mermaid-visualize`, ask which to keep before overwriting it. The documents keep their own Mermaid diagrams either way: `visualize` never edits them.

## Keeping it in sync

When a source changes (a document is revised, code is merged), update `visual.json`, rebuild, look
at the snapshots, and add the date to `task.meta`. A visual that disagrees with its sources is worse
than none: if it can't be updated now, add a `notes` item with `"tone": "risk"` saying what is out of date.

## Done when

- Every section answers a question the user agreed to.
- `build.mjs` runs with no errors and no warnings you haven't decided to accept; `visual.html`, the PNGs, and `visual.md` are written.
- You have looked at every PNG.
- Every card cites its files and requirements; every name matches its source.
- In spec mode, the `index.md` row and change log are updated.
- The user has seen it.

## What not to do

- Don't edit `visual.html`, `visual.md`, or the PNGs by hand; they are rebuilt from the JSON.
- Don't edit `assets/template.html` for one visual. If a component is missing, use `notes` or `image`, and tell the user what the template lacks.
- Don't invent modules, calls, screens, rules, or statuses to make a section look complete.
- Don't put decisions into the visual that the sources haven't made.
- Don't cram: split above the size limits.
- Don't commit without the user's go-ahead.
