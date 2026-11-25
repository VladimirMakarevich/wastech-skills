---
name: mermaid-visualize
description: Visualize a task, a feature, or a part of an application as a Markdown document (visual.md) with diagrams rendered to SVG and PNG — the big picture first, then focused views that each answer one question (before/after, user flow, screen map and sketches, sequence, components, data model, states, decision logic, plan phases), with every element traced to its source. Works from a spec folder (spec-task calls it at its checkpoints to show what will be built and how it will work), from the code (how existing logic, a technical subsystem, or a user interaction really works, every element cited to path:line), or from an idea in the conversation. Diagrams are Mermaid sources (.mmd) in one shared visual language — new / changed / removed / existing — rendered by a bundled Node script through mermaid-cli. Use when the user says "visualize", "draw", "diagram", "show me how X works", "give me the big picture", "визуализируй", "нарисуй схему", "покажи, как это работает", or wants to see a change before it is built.
argument-hint: "<what to visualize> | <spec folder> [user|technical|plan]"
---

# mermaid-visualize

Turns a task, a feature, or a part of an application into a **visual document**: `visual.md` with
diagrams rendered to SVG and PNG. It shows the **big picture first**, then **focused views** that
each answer one question, then the **details** behind every element, each cited to its source.

It covers three kinds of subject:

- **A task being specified:** what will be built, how it will work, what changes and what stays. `spec-task` calls this skill at its checkpoints, and the user can run it on any spec folder.
- **Existing logic:** how a flow, a subsystem, or a piece of technical machinery works today, traced through the code.
- **User interaction:** what the user sees and does: screens, flows, states.

A visual is **derived**. It draws what its sources say (the spec documents, the code, the
conversation) and decides nothing on its own. When drawing exposes a gap or a contradiction, raise
it with the user; don't resolve it in the picture.

Scale to the request. One question ("how does login refresh tokens?") gets one diagram; a task gets
the full document.

## How to converse

- Speak the user's language. Write diagram labels and `visual.md` in the project's documentation language: infer it from the existing docs, and with none, use the user's language. Identifiers stay as the code writes them.
- Look facts up yourself. Ask the user only for decisions: the reader, the views, where to save.
- Propose the set of views in one short message and go ahead on the user's word. This is not an interview.
- After rendering, say in a line what each view shows.

## Bundled files

| File | What it is for |
| --- | --- |
| [references/views.md](references/views.md) | Which view answers which question, and how to build each |
| [references/style.md](references/style.md) | The visual language: statuses, shapes, arrows, layout, names, size limits |
| [references/mermaid-syntax.md](references/mermaid-syntax.md) | Safe Mermaid syntax, and render errors with their fixes |
| [templates/visual.md](templates/visual.md) | The document skeleton |
| [templates/diagrams/](templates/diagrams/) | A working starter `.mmd` for every view, plus the legend |
| [assets/mermaid-config.json](assets/mermaid-config.json) | Theme and fonts shared by every render |
| [scripts/render.mjs](scripts/render.mjs) | Renders `.mmd` to `.svg` and `.png`; `--check` validates without writing |

These paths are relative to this `SKILL.md`. Resolve them to the folder the skill is installed in
before running anything.

## Pick the mode: where the facts come from

- **spec:** a spec folder (`docs/tasks/<slug>/` from `spec-task`, or the project's equivalent). The sources are `problem.md`, `requirements.md`, `out-of-scope.md`, `happy-path.md`, `design.md`, and `plan/`. Elements cite FR-/NFR- ids and document sections, and `design.md` says what is added, changed, or removed.
- **code:** something that already exists. Trace the real path through the code, from the entry point to storage and back. For a broad area, send a sub-agent to map it, then check what it reports. Every element cites `path:line`. Everything is `existing`, unless the visual is about a pending change (uncommitted work, a branch, a PR); then the diff decides `new`, `changed`, and `removed`.
- **idea:** something not yet specified or built, taken from the conversation. Everything is `new`, except the existing parts it attaches to; look those up in the code.

## Step 1 — Frame

Settle these, mostly by looking rather than asking:

1. **Subject:** what exactly is drawn, and where it stops.
2. **Reader:** non-technical (product, business, support), engineers, or both. The reader sets the vocabulary and which views come first.
3. **Questions:** the two to five things the reader must be able to answer after looking. Each becomes a view.
4. **Location:**
   - spec mode: `<spec folder>/visual.md` and `<spec folder>/diagrams/`;
   - otherwise, the project's existing home for diagrams (`docs/visuals/`, `docs/diagrams/`, `docs/architecture/`, …). Without one, use `docs/visuals/<slug>/visual.md` and `docs/visuals/<slug>/diagrams/`, with a kebab-case slug you propose;
   - if the user wants nothing saved in the repository, render into a temporary folder and give them the full paths.
5. **Existing diagrams:** if the project already keeps diagrams in another tool (PlantUML, D2, draw.io, Structurizr), say so and ask whether to follow it. This skill's kit is Mermaid.

If a visual already exists at that location, don't start over. Read `visual.md` and its `diagrams/`
folder, then update or extend them.

## Step 2 — Choose the views

The **big picture** always comes first. Add the views that answer the questions from Step 1,
usually two to five, using the question → view table in [references/views.md](references/views.md).

In spec mode, `spec-task` passes a preset at each of its checkpoints:

| Preset | When | Views |
| --- | --- | --- |
| `user` | after `happy-path.md` | big picture at the user's level · before/after · user flow · screen map and screen sketches when there is UI |
| `technical` | after `design.md` | the big picture extended with the system's parts · components · sequence of the main flow with its main error branch · data model if storage changes · states if something has a lifecycle · decision logic if there are business rules |
| `plan` | after `plan/` | plan phases: order, dependencies, what each phase delivers |

All presets add to the same `visual.md`. A later preset updates the big picture instead of adding a
second one. Drop a view that would be empty or trivial, and say why in one line.

Propose the list in one message, one line per view (the view and the question it answers), and go
ahead on the user's word.

## Step 3 — Gather the facts

For each view, collect the elements and their relations from the mode's sources:

- **Names exactly as the source writes them:** the screen name from the spec, the class or module from the code. A reader must be able to search for any label.
- **A status for every element:** `new`, `changed`, `removed`, or `existing`. See [references/style.md](references/style.md).
- **A source for every element:** an FR-id, `doc.md#section`, or `path:line`. These fill the details tables.
- **Nothing invented.** Draw no component, call, or screen that the sources don't support. If a view needs something the sources don't say, that is a gap: ask the user, and in spec mode log it in `questions.md`. Don't draw a guess.

## Step 4 — Draw

1. Create the `diagrams/` folder. Copy the starters you need from [templates/diagrams/](templates/diagrams/) and rename them `NN-<view>.mmd`: `00-big-picture.mmd` first, then `01-…`, `02-…` in reading order. Copy `legend.mmd` under its own name and delete the entries the visual won't use.
2. Replace each starter's example content completely. Keep its status kit (the `classDef` block at the bottom) unchanged.
3. Follow [references/style.md](references/style.md) for shapes, arrows, statuses, layout direction, and label length.
4. Keep to the size limits: 12 nodes for the big picture; 20 nodes for any other view; 7 participants and 25 messages for a sequence. Over a limit, split the diagram: keep the overview, mark the dense element `focus`, and open it in a **zoom-in** view whose section names its parent ("Zooms into: <element>").
5. Write safe syntax, per [references/mermaid-syntax.md](references/mermaid-syntax.md). Quote every label.

**Levels.** L0 is the big picture: the whole subject on one screen. L1 is the views, one question
each. L2 is the zoom-ins: one dense element of L0 or L1, opened up. An element keeps the same name
on every level.

## Step 5 — Render

```bash
node <skill folder>/scripts/render.mjs <diagrams folder>
```

- It renders every `.mmd` in the folder to an `.svg` and a `.png` next to it. Options: `--format svg,png,pdf`, `--only <name>` for one diagram, `--check` to validate syntax without writing anything.
- **It needs Node.js 22.13 or newer.** The first run installs a pinned mermaid-cli into a per-user cache, which takes about a minute. It drives an installed Chrome, Edge, or Chromium; only when none is installed does it download a headless Chrome (about 150–200 MB). Tell the user before that download happens.
- A diagram that fails is reported with its line number and the parser's message, and its old images are deleted so nothing stale stays behind. Fix the `.mmd` using [references/mermaid-syntax.md](references/mermaid-syntax.md) and run again until every file reports `ok`.

If rendering is impossible here (no Node.js, no browser and no network, a locked-down machine),
offer these, in this order:

1. Install what is missing: Node.js, or a browser via `node <skill folder>/scripts/render.mjs --install-browser`.
2. A remote renderer (kroki.io, mermaid.ink), **only with the user's explicit consent**, because it sends the diagrams' content to a third party.
3. Write `visual.md` with the diagrams inline as ```` ```mermaid ```` blocks instead of images (GitHub and most editors render them). Tell the user the images are missing and give them the one command that will produce them later.

## Step 6 — Look at the result

Open every PNG you rendered and check it as the reader will see it:

- The text is legible at normal size. No label is cut off, overlapped, or crossed by a line.
- The proportions are readable: not a thin strip ten screens wide, not a tall tower.
- Few lines cross, and the highlighted path (new and changed) is easy to follow.
- The statuses match the facts from Step 3.

To fix a problem: switch the direction (`LR` ↔ `TD`), regroup the subgraphs, shorten labels (`<br/>`
for a manual break), or split off a zoom-in. Then render and look again.

## Step 7 — Assemble visual.md

Fill [templates/visual.md](templates/visual.md):

- One sentence on what the visual shows, its sources, the date, and the re-render command with the diagrams folder's path from the repository root.
- **How to read:** the legend image and two lines on the reading order.
- One section per diagram, in file-number order:
  - the embedded SVG, with links to its PNG and its `.mmd`;
  - two to four "What to notice" bullets: the things a reader would miss on their own;
  - a details table: element, what it is or does, source, status.
- A glossary, when a non-technical reader will meet unfamiliar terms; otherwise delete the section.
- A change-log line.

Embed the SVG because it stays sharp when zoomed; the PNG is for pasting into chats, tickets, and
slides. Leave no `{{…}}` tokens and no empty template sections.

## Step 8 — Show it and iterate

Tell the user where `visual.md` is, what each view shows (a line each), and what the big picture
reveals at a glance. Make their corrections in the `.mmd` files, then render, look, and update
`visual.md` again. Offer to commit the folder following the project's conventions. Never commit
without a yes.

## In a spec folder

- `spec-task` offers a preset at each checkpoint. The user can also ask for any view at any time.
- Add the `visual.md` row to the documents table in the spec's `index.md` if it isn't there: `| — | [visual.md](visual.md) | Diagrams of the task, rendered to SVG/PNG | ☐ |`. Tick it ☑ once the user has reviewed the visual, and append a line to the change log.
- **The documents stay the source.** When a view draws what `happy-path.md` or `design.md` also draws inline, copy that ```` ```mermaid ```` block into the view's `.mmd` (then add the status kit) and leave the document's block where it is. When the document's diagram changes, update the `.mmd` from it and re-render. Never replace a document's diagram with an image of the visual: the visual can be deleted or replaced by `visualize`, and the document must not lose its diagram with it.
- A view that exposes a gap in the spec (an unhandled error branch, a component nobody owns, a state with no exit) goes into `questions.md` and is raised with the user.

## Keeping it in sync

A visual follows its sources. When a source changes (a document is revised, code is merged), update
the affected `.mmd` files, render them, look at the images again, and add a change-log line. A
visual that disagrees with its sources is worse than none: if you can't update it now, put a
one-line "Out of date since <date>: <what changed>" note at the top of `visual.md`.

## Done when

- Every view answers a question the user agreed to, and the big picture comes first.
- Every `.mmd` renders `ok`, its SVG and PNG sit next to it, and you have looked at every PNG.
- Every element appears in a details table with its source, and every name matches its source.
- `visual.md` has no placeholders, its links resolve, and the user has seen it.
- In spec mode, the `index.md` row and change log are updated.

## What not to do

- Don't invent elements, calls, or screens to make a picture look complete. A gap is a question.
- Don't decide in a diagram anything the sources haven't decided.
- Don't cram a diagram: one question per view, and split above the size limits.
- Don't hand-edit SVG or PNG files. Edit the `.mmd` and render again.
- Don't send diagram content to an online renderer without the user's consent.
- Don't change the theme or the status colors for one diagram. All views share one visual language.
- Don't commit without the user's go-ahead.
