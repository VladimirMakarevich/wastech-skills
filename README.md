# wastech-skills

Agent skills from WastechLab. Each skill is a folder with a `SKILL.md`: it works in Claude Code
and in any other agent that reads the open Agent Skills format.

## Install

From the root of your project:

```bash
# pick skills interactively
npx skills add VladimirMakarevich/wastech-skills

# one skill, for Claude Code only
npx skills add VladimirMakarevich/wastech-skills --skill spec-task -a claude-code

# implement together with the skill it runs first
npx skills add VladimirMakarevich/wastech-skills --skill implement --skill assess-refactor

# interview, then write the spec
npx skills add VladimirMakarevich/wastech-skills --skill interview-to-spec --skill interview --skill spec-task

# spec with visual checkpoints: an interactive page of the task, with snapshots for GitHub
npx skills add VladimirMakarevich/wastech-skills --skill spec-task --skill visualize

# the same checkpoints as plain Mermaid diagrams in Markdown
npx skills add VladimirMakarevich/wastech-skills --skill spec-task --skill mermaid-visualize

# park a task in the backlog and resume it later
npx skills add VladimirMakarevich/wastech-skills --skill park

# everything, for every project on this machine
npx skills add VladimirMakarevich/wastech-skills --skill '*' -g
```

Requires Node.js 22.20+. Manual install works too: copy `skills/<name>/` into your project's
`.claude/skills/` (or `~/.claude/skills/` for all projects).

## Skills

| Skill | What it does |
| --- | --- |
| [spec-task](skills/spec-task/SKILL.md) | Turns a rough idea into a reviewed spec folder — problem, requirements, scope, happy path, design, acceptance criteria, definition of done, open questions — and a phased implementation plan. Co-written with you one document at a time. Learns the repository's rules and commands first, so the design fits the project. |
| [implement](skills/implement/SKILL.md) | Builds a task or a plan phase end to end under the project's own rules: reads the rules, checks the ground with `assess-refactor`, builds with the cleanup it needs, runs lint / build / tests, and finishes with a code review. |
| [assess-refactor](skills/assess-refactor/SKILL.md) | Before a change, decides whether the code it lands on needs a refactor first. Bounded to the change's blast radius, gated on passing tests, analysis only. |
| [interview](skills/interview/SKILL.md) | Interviews you about a plan or idea until you share an understanding: rounds of numbered questions over the decision tree, each with a recommended answer. Looks up facts itself, leaves the decisions to you. |
| [interview-to-spec](skills/interview-to-spec/SKILL.md) | Runs `interview`, then hands the settled decisions to `spec-task` so they land in the spec without being asked again. |
| [visualize](skills/visualize/SKILL.md) | Shows a task, a feature, or a part of the app as an interactive page built from one `visual.json`: module cards by layer with their files and requirements, a user journey that drives a screen mockup with NEW / CHANGED marks, before/after, decision cards with pros and cons, rule chains, data model, call sequence, states, and a plan whose phases light up the modules they touch. Also writes PNG snapshots and a `visual.md` for GitHub. |
| [mermaid-visualize](skills/mermaid-visualize/SKILL.md) | Draws a task, a feature, or a part of the app as `visual.md` with diagrams rendered to SVG and PNG: the big picture first, then views that each answer one question (user flow, screens, sequence, components, data model, states, rules, plan phases), with every element traced to the spec or to `path:line`. New, changed, and existing parts are marked in one shared visual language. |
| [handoff](skills/handoff/SKILL.md) | Compacts the current conversation into one copy-pasteable prompt, so a fresh session can pick up the work. Invoked by you only, as `/handoff`. |
| [park](skills/park/SKILL.md) | Parks a task that isn't worth finishing now: writes a card to `docs/backlog/` with why it stopped, what's done, the decisions and their reasons, open questions, and the exact next step, and keeps the uncommitted code on a WIP branch or in a patch. `/park resume <slug>` checks what went stale since, restores the code, and continues from that step. |

### How the skills find your project's rules

`spec-task`, `implement`, and `assess-refactor` carry no rules of their own about your stack. They
read yours, in this order:

1. `CLAUDE.md` / `AGENTS.md` at the repository root, and whatever rule files they point to.
2. A rules index at `.rules/README.md`, and the rule files it lists.
3. `CONTRIBUTING.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, a `docs/` folder of guidelines.
4. Failing all of these, the conventions your code already follows.

The more precise your rules, the closer the result fits. A `.rules/README.md` that lists each rule
file and when it applies (always, or only when touching user-facing text, the schema, etc.) is the
most direct way to give them.

`implement` runs `assess-refactor` before writing code. Install both; without it, `implement`
falls back to a shorter built-in check.

### spec-task

Run `/spec-task <your idea>` or ask the agent to "spec out" a task. It will:

1. Read the project's rules, stack, build/test commands, and any existing spec folder.
2. Agree a slug and scaffold `docs/tasks/<slug>/` (or the project's existing spec location).
3. Draft each document with you, one at a time, and wait for your sign-off before the next.
4. Write the implementation plan last, split into small ordered phases.

With `visualize` (or `mermaid-visualize`) installed, it also offers a visual at three checkpoints:
after the happy path (what the user will see), after the design (how it will work), and after the
plan (the build order).

### visualize

Run `/visualize <what>` or ask "show me how X works", "show what this task will change". It works
from a spec folder, from the code, or from an idea you describe. It:

1. Settles who the visual is for and which questions it must answer, then proposes the sections.
2. Gathers the facts: names as the source writes them, a status for every element (new / changed / existing / removed), and the files and requirements behind each module.
3. Writes them into `visual.json`. That is all the agent writes: the page template, its styling, and its interactivity are fixed in the skill.
4. Builds and checks: the bundled script validates the JSON, renders `visual.html`, snapshots every section and every screen state to PNG, and writes `visual.md` with the snapshots and the same content as text. The agent then looks at every snapshot.

```
docs/tasks/<slug>/
  visual.json     the source
  visual.html     open in a browser: click modules, step through the journey, filter to changes
  visual.md       for GitHub and reviews
  visual/         00-overview.png, one PNG per section, screens/<state>.png
```

The build needs **Node.js 22.13+**. For snapshots it installs a pinned puppeteer into a per-user
cache on first run and drives your installed Chrome, Edge, or Chromium; only if none is installed
does it download a headless Chrome (~150–200 MB). `--no-png` builds without a browser.

### mermaid-visualize

Run `/mermaid-visualize <what>` or ask "show me how X works", "draw the big picture of Y". It works from a
spec folder, from the code (how existing logic, a subsystem, or a user interaction really works), or
from an idea you describe. It:

1. Settles who the visual is for and which questions it must answer, then proposes the views.
2. Gathers the facts from the spec or the code: names as the source writes them, a status for every element (new / changed / removed / existing), and a source for each.
3. Writes each diagram as a Mermaid `.mmd`, renders it to SVG and PNG, and checks the images for legibility.
4. Assembles `visual.md`: legend, big picture, then one section per view with "what to notice" notes and a details table.

The result lands next to the spec (`docs/tasks/<slug>/visual.md` + `diagrams/`) or in
`docs/visuals/<slug>/`. SVGs are embedded in the Markdown; PNGs are for chats, tickets, and slides.

Rendering needs **Node.js 22.13+**. The bundled script installs a pinned mermaid-cli into a per-user
cache on first run and drives your installed Chrome, Edge, or Chromium. Only if none is installed
does it download a headless Chrome (~150–200 MB). Without a way to render, the diagrams go into
`visual.md` as Mermaid blocks, which GitHub and most editors display.

## License

MIT

### Credits

The `interview` skill is adapted from [grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) by Matt Pocock (MIT). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
