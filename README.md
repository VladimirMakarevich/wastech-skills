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

# for every project on this machine
npx skills add VladimirMakarevich/wastech-skills --skill spec-task -g
```

Requires Node.js 22.20+. Manual install works too: copy `skills/<name>/` into your project's
`.claude/skills/` (or `~/.claude/skills/` for all projects).

## Skills

| Skill | What it does |
| --- | --- |
| [spec-task](skills/spec-task/SKILL.md) | Turns a rough idea into a reviewed spec folder — problem, requirements, scope, happy path, design, acceptance criteria, definition of done, open questions — and a phased implementation plan. Co-written with you one document at a time. Learns the repository's rules and commands first, so the design fits the project. |

### spec-task

Run `/spec-task <your idea>` or ask the agent to "spec out" a task. It will:

1. Read the project's rules, stack, build/test commands, and any existing spec folder.
2. Agree a slug and scaffold `docs/tasks/<slug>/` (or the project's existing spec location).
3. Draft each document with you, one at a time, and wait for your sign-off before the next.
4. Write the implementation plan last, split into small ordered phases.

It writes documents only — no code.

## License

MIT
