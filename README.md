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
| [handoff](skills/handoff/SKILL.md) | Compacts the current conversation into one copy-pasteable prompt, so a fresh session can pick up the work. Invoked by you only, as `/handoff`. |

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

It writes documents only — no code.

## License

MIT
