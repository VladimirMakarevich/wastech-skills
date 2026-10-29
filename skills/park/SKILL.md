---
name: park
description: Park the current task in the project's backlog — snapshot where the work stopped (goal, progress, decisions and their reasons, findings, open questions, the exact next step, and the uncommitted code) into a card under docs/backlog/, so it can be picked up later from the same place by any session. Also resumes a parked task: finds the card, checks what went stale since, restores the code, and continues. Use when the user decides a task costs more than it is worth right now — "park this", "shelve it", "put this in the backlog", "let's stop here and come back later", "отложи задачу" — or wants one back — "resume <task>", "pick up <task> from the backlog", "what's in the backlog".
argument-hint: "[why it's parked] | resume [slug]"
---

# park

Two modes. **Park** freezes the current task into a backlog card, durable and in the repository, so the work stops without being lost. **Resume** brings a parked card back and continues from its next step.

Pick the mode from the arguments and the request: `resume`, a slug, or a request to pick something up means resume; anything else means park. Any other arguments while parking are the reason for parking.

Unlike `handoff`, which prints a one-off prompt for the next session, a parked card is a file that lives in the repository for weeks and is read by someone who remembers nothing of this conversation. Write it for that reader.

Speak in the user's language. Write the card in the project's documentation language — infer it from existing docs; if there are none, use the user's language.

## Where the backlog lives

Look for an existing home first: `docs/backlog/`, `backlog/`, `.backlog/`, or a backlog location named in `CLAUDE.md` / `AGENTS.md` or the project's rules. Reuse it and its conventions if it exists. Otherwise the default is `docs/backlog/`, created on first use:

```
docs/backlog/
  README.md          # index of every card — from templates/backlog-index.md
  <slug>.md          # one card per parked task — from templates/item.md
  <slug>.patch       # only when the code was parked as a patch
```

## Park

### 1. Gather the state — from the conversation and the repository

Collect before writing anything. Facts you can look up, look up; don't ask the user for them.

- **Goal** — what the task is for, in the user's framing, two or three sentences.
- **Why it's parked** — the user's reason (cost, priority, a blocker, waiting on someone). If they gave none, ask: this is what a future reader uses to decide whether to bring it back.
- **Progress** — what is done, what is half-done (and in what state exactly), what was not started.
- **Decisions** — every decision settled so far, with the reason and the options rejected. The reason is the part that goes stale first and is hardest to rebuild.
- **Findings** — facts found in the code or environment that cost effort to find, each with a `path:line` citation.
- **Dead ends** — what was tried and didn't work, and why, so nobody tries it again.
- **Open questions** — unresolved decisions, and who can answer them.
- **Next step** — the single concrete action to take first on resume, then the rough sequence after it.
- **Remaining effort** — a rough size of what's left, and the risks that make it big.
- **Resume when** — the condition that would make this worth picking up (a release ships, a dependency lands, priority changes). "When there's time" is allowed but say so.
- **Skill in use** — if the work was running under a skill (`spec-task`, `interview`, `implement`, …), name it and where it stood, so resume can hand back to it.
- **Code state** — run `git status`, `git branch --show-current`, `git rev-parse HEAD`; list the files the task touched.

Reference, never copy, what already exists elsewhere: a spec folder, a plan, an ADR, an issue, a PR, a branch. The card points at it by path or URL and says where in it the work stopped. A card that duplicates a spec is two documents that will disagree.

Redact secrets, credentials, and personal data.

### 2. Agree the slug and the code handling

Propose a kebab-case slug (reuse the spec folder's slug if there is one) and, if there is uncommitted work, how to keep it. Uncommitted changes that belong to the task must not stay only in the working tree. Recommend one and let the user choose:

- **WIP commit on a branch** (default) — commit the task's changes as `wip: <slug> (parked)` on the task's own branch, or on a new `parked/<slug>` branch if the work sits on a shared branch; then return the user to the branch they want to be on. Record the branch and the commit SHA in the card.
- **Patch file** — `git diff` the task's changes into `<backlog>/<slug>.patch` next to the card and record the base commit. Good for a small diff, or where WIP branches aren't wanted. Include untracked files the task created.
- **Discard** — only on the user's explicit word; note in the card that the code was dropped and the card is the only record.

Never use `git stash`: it is local, invisible, and silently lost. If the working tree mixes the task's changes with unrelated ones, ask which files belong to the task before touching anything. Never push without asking.

### 3. Write the card and the index

Create `<backlog>/<slug>.md` from [templates/item.md](templates/item.md), filling every section from step 1. Delete a section that genuinely doesn't apply rather than leaving it empty; leave no `{{…}}` tokens. The **Next step** section must be concrete enough that a fresh agent could start on it without asking anything.

Add a row to `<backlog>/README.md`, creating it from [templates/backlog-index.md](templates/backlog-index.md) on first use.

If the task has a spec folder, append a line to its `index.md` change log: `<date> — parked, see <path to card>`. Do not edit its documents otherwise.

### 4. Confirm and commit

Show the user the card's summary — why parked, where it stopped, the next step, where the code is — and let them correct it. Then offer to commit the card, the index, and the patch (if any), following the project's commit conventions. The backlog only helps if it reaches the shared branch; say so if the user declines.

## Resume

### 1. Find the card

With a slug, open `<backlog>/<slug>.md`. Without one, show the index — title, parked date, why, remaining effort — and let the user pick. If no backlog exists, say so and stop.

### 2. Read it, then check what went stale

Read the card and every artifact it references. Then check the ground before trusting it:

- `git log --oneline <base commit>..HEAD -- <touched files>` — what changed in the task's area since parking.
- Every `path:line` in **Findings** and every file in **Progress** — does it still exist and still say what the card claims?
- The WIP branch or patch — does it still exist, and does it rebase or apply cleanly on the current code?
- Each **Decision** whose reason rests on a fact that changed — mark it for re-confirmation.
- **Open questions** — has any been answered in the meantime (commits, issues, docs)?

### 3. Brief the user and get a go-ahead

In a few lines: the goal, where it stopped, what changed since parking and what that breaks, decisions to re-confirm, and the next step. Wait for the user's go-ahead before changing anything — they may decide it stays parked.

### 4. Restore and continue

- Restore the code: check out the WIP branch or apply the patch on a fresh branch (ask first). If the last commit is the `wip: … (parked)` commit, offer to undo it with `git reset --soft HEAD~1` so the work is uncommitted again.
- Set the card's status to `resumed` with today's date, update the index row, append to the card's change log.
- If the card names a skill in use, invoke it and resume from where the card says it stood (for `spec-task`, its own resume picks up the first unsigned document). Otherwise continue from **Next step**.

The card stays in the backlog while the task is active. When the task ships or is dropped, set the status to `done` or `dropped` and offer to delete the card and its index row — git history keeps them.

## Done when

- **Park:** the card exists with every section filled from the real state, the next step is concrete, the code is on a recorded branch or in a recorded patch (or was dropped on the user's word), the index lists the card, and the user has confirmed it.
- **Resume:** the user has been briefed on what went stale, the code is restored, the card and index say `resumed`, and work has continued from the next step.

## What not to do

- Don't park from memory alone — check `git status` and the files, and cite them.
- Don't copy a spec, a plan, or a diff into the card — reference it.
- Don't leave the task's changes only in the working tree or a stash.
- Don't commit, switch branches, or push without the user's go-ahead.
- Don't resume by trusting the card blindly — check what changed first.
