---
name: spec-task
description: Turn a rough idea or task into a structured, reviewed spec folder (default docs/tasks/<slug>/) — worked through WITH the user one document at a time, from the raw problem down to a phased implementation plan. Scaffolds problem / requirements / out-of-scope / happy-path / design / acceptance-criteria / definition-of-done / open-questions docs and a plan/ folder split into numbered phases, all cross-linked from index.md. Learns the repository first (its rules, stack, commands, and existing spec conventions) so the design and plan fit the project instead of a generic template. Interactive and sequential — drafts each file, refines it with the user, gets sign-off, then moves to the next — foundational docs first, the implementation plan last. Use when the user says "spec out X", "shape this task", "let's plan feature Y properly", "write a spec for", "разложи задачу", "распиши задачу", or hands you an idea that needs discovery before coding. Produces docs, not code.
---

# spec-task

Takes a task or a raw idea and turns it into a **task spec folder** — a cross-linked set of
documents built **collaboratively with the user, one file at a time**, from the original problem
down to a phased implementation plan.

This is a **discovery / specification** skill. It writes **documents, not code**. When the plan is
signed off, it is handed to whoever builds it: an implementation skill or command if the project
has one, otherwise the user or a regular implementation session.

Works in any repository. The spec's structure is fixed; its **content** is shaped by the project it
lives in — its rules, its stack, its commands, its definition of done.

## When to use / skip

- **Use** for anything non-trivial, fuzzy, or multi-part that deserves discovery before code: a new feature, a reworked screen or endpoint, a subsystem change, a vague idea to explore.
- **Skip** for a tiny, obvious change (a one-field fix, a renamed constant). Don't scaffold a nine-document folder for a one-liner — just do it.

## How to converse

- **Speak in the user's language** (the language they wrote in). Write the spec documents in the project's documentation language — infer it from existing docs; if there are none, use the user's language and confirm once. Code identifiers, file names, and branch names stay as the project writes them.
- **Interactive and sequential — never dump all files at once.** Draft one document, show it, refine it with the user, get an explicit sign-off, then move to the next. The user is a co-author, not a reviewer of a finished pile.
- Ask the sharp questions as they arise and log them in `questions.md`. Resolve **blocking** questions before the plan.
- Look things up instead of asking. Anything the repository can answer — where a module lives, how tests run, what an entity looks like — is discovered, not put to the user.
- Keep running commentary tight. Between documents, say what's done and what's next in a line.

## Step 0 — Learn the project

Before scaffolding, build a short picture of the repository. Read only what exists; skip what doesn't.

1. **Rules and conventions.** Agent and contributor instructions at the root and in obvious places: `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, `CONTRIBUTING.md`, a `.rules/` or `docs/` folder of guidelines, architecture decision records. Note every **hard rule** — something the project forbids or mandates (layering, patterns, migrations, generated code, naming, commit style).
2. **Stack and layout.** The manifest(s) (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`, `pom.xml`, …) and the top-level source folders. Enough to name the layers a change crosses — not a full audit.
3. **Commands.** How the project lints, builds, and tests: manifest scripts, `Makefile`, task runners, CI workflows. These become the baseline of the definition of done.
4. **Existing spec conventions.** Look for an existing home for specs: `docs/tasks/`, `docs/specs/`, `specs/`, `rfcs/`, `docs/adr/`, `design-docs/`. If one exists, reuse its location and numbering scheme. If none exists, the default is `docs/tasks/<slug>/`.
5. **Neighbouring skills and commands.** Other skills or commands in the project (`.claude/skills/`, `.claude/commands/`, `.agents/skills/`, …) that the spec should hand off to or lean on: an implementation skill, a refactor assessment, a domain-pattern skill, a contract/codegen command. Reference them by name in `design.md` and the plan instead of restating their content.

Summarize what you found to the user in a few lines — location for the spec, hard rules you'll design within, the DoD commands, any skill the plan will hand off to — and let them correct it. If the repository is nearly empty, say so and proceed with the defaults.

## Kickoff

1. **Capture the input.** Take the arguments as the idea/task. If nothing was given, ask what the task is before scaffolding.
2. **Agree the slug.** Propose a kebab-case slug, following the existing numbering scheme if the project has one (e.g. `NNN-` or a ticket key prefix); confirm it.
3. **Resume if it exists.** If the target folder already exists, don't re-scaffold: read its `index.md`, report which documents are signed off and which are not, and continue from the first unsigned one.
4. **Scaffold from templates.** Copy the `templates/` folder that sits next to this `SKILL.md` into the spec folder, filling placeholders — `{{TASK_TITLE}}`, `{{SLUG}}`, `{{DATE}}` (today), `{{STATUS}}` (start `draft`), `{{OWNER}}` (the git user name, or ask). Rename `plan/01-phase-template.md` only when you create real phases. Confirm the folder exists, then start filling documents in order.

Templates to instantiate: `index.md`, `problem.md`, `requirements.md`, `out-of-scope.md`,
`happy-path.md`, `design.md`, `acceptance-criteria.md`, `definition-of-done.md`,
`questions.md`, `plan/index.md` (+ `plan/NN-*.md` per phase).

## The flow — one document at a time

Fill **foundational docs first, the plan last.** For each: draft → review with the user → sign off
(tick it ☑ in `index.md`) → next. `index.md` and `questions.md` are **living** — update them
throughout, not once.

1. **`problem.md`** — capture the original problem faithfully, in the user's framing. No solutioning yet. This anchors every "why" downstream.
2. **`requirements.md`** — derive verifiable FR-/NFR- from the problem. Behavior and outcomes, not implementation. Keep only the NFRs that apply. Flag persistence, contract, and compatibility touchpoints.
3. **`out-of-scope.md`** — fence the scope: what's explicitly excluded, deferred, or a non-goal. Fight creep here.
4. **`happy-path.md`** — make it concrete for a non-technical reader: Before/After, plain-language examples, and small Mermaid diagrams. If you can't tell the story simply, the requirements aren't ready — loop back. For a change with no end user (a library, an internal service), the "user" is the caller — tell the story from their side.
5. **`design.md`** — the technical HOW as a vertical slice across the project's real layers, honoring its hard rules (below). Name the actual modules and files. Record the heavy decision(s) — context, options, why — inline. Delete template sections that don't apply to this project rather than leaving them empty.
6. **`acceptance-criteria.md`** — testable Given/When/Then per requirement, plus edge/error cases and NFR checks, with a verification method each.
7. **`definition-of-done.md`** — the project's baseline DoD (from Step 0, with the real commands) + task-specific gates.
8. **`questions.md`** — keep current the whole time; before signing off the plan, every **blocking** question must be Resolved.
9. **`plan/`** — **last.** Break the work into ordered phases (`plan/index.md` + one `NN-<name>.md` each), sequenced by dependency (schema before the code that reads it, contract before its consumers, shared pieces before the features on top). Each phase is small and leaves the project building and green. This is the handoff to implementation.

Keep `index.md` in sync as you go: flip document status, keep the links right, write the Summary once the docs settle, and append to the change log.

## Respect the project's hard rules

`design.md` and every plan phase must conform to the rules found in Step 0. The spec **plans
within** them — it doesn't get to wish them away. Typical examples of what to carry through:

- Mandated architecture and layering — where logic may live, which layers may call which.
- Persistence rules — schema changes only through migrations, frozen migrations, data compatibility with existing installs or deployments.
- Generated code that must never be hand-edited, and the command that regenerates it.
- Required wrappers, patterns, or libraries over raw alternatives.
- Testing obligations — what must ship with tests.
- Conventions for text, styling, i18n, security, and privacy if the project defines them.

If the task genuinely needs to bend a rule, don't decide it silently: record the conflict in
`design.md` and raise it as a blocking question.

Where the project has no stated rules, follow what the codebase already does and say so in
`design.md`. Bias the design and plan toward **minimal, reversible** slices that preserve existing
boundaries (KISS > YAGNI > DRY).

## Definition of done (for the spec itself)

- The spec folder exists with every document filled (no leftover placeholder text) and each signed off ☑ in `index.md`.
- No **blocking** open questions remain.
- `plan/index.md` lists ordered phases with dependencies, each honoring the project's hard rules, ready to implement.
- `index.md` Summary + document table are accurate; `status` reflects reality (`ready-to-implement` when the plan is signed off).

## What not to do

- Don't generate all documents in one shot — co-author them one at a time with sign-off.
- Don't write the plan before the problem, requirements, and design are settled.
- Don't smuggle solutions into `problem.md`, or restate another skill's or doc's patterns instead of referencing them.
- Don't invent rules, layers, or commands the project doesn't have — design from what Step 0 found.
- Don't plan anything that violates a hard rule to make the task easier — raise the conflict.
- Don't write code or run builds/migrations here — this skill produces the spec.
- Don't leave placeholder tokens (`{{…}}`) or empty template sections in a document you've marked done.
