---
name: assess-refactor
description: Before implementing a feature or fixing a defect, decide whether a focused refactor of the code the change will touch should happen FIRST. Maps the blast radius of the change, reads the health of that code against the project's own rules (logic in the wrong layer, bypassed mandatory wrappers or patterns, oversized files the change would grow, near-violations of hard rules, weak tests), and weighs the cost of building on it as-is versus cleaning it first. Enforces a test gate — no refactor without passing characterization tests over its whole scope. Analysis-only — recommends refactor-first / refactor-after / no-refactor with a bounded scope and writes no code. Bounded by YAGNI, so only what this concrete change touches is in play. Use after the task is understood and before implementation, or when the user asks "should we refactor this first" or "is this code ok to build on".
---

# assess-refactor

Runs **before** implementation of a feature or bug fix, once you know roughly _what_ it is and
_where_ in the codebase it lands. Its job: answer the question usually skipped — **is the existing
code we're about to build on healthy enough, or should we refactor it first?**

It is **analysis-only**: it recommends, scopes, and surfaces trade-offs. It writes **no code**.

The baseline it serves: **every feature and fix leaves the code it touched better than it found
it, bounded by the task's blast radius.** That ride-along cleanup is normal work. This skill
decides whether a cleanup has to come **first**, as its own step, instead of riding along inside
the change.

## Where it sits

- **`assess-refactor` (this skill)** judges the **ground** — is the existing code fit to build on?
- An implementation skill (such as `implement`) runs it as its first step and builds on its verdict.
- A spec (such as one produced by `spec-task`) records its conclusion in the design.

Natural order: (clarify scope if fuzzy) → **`assess-refactor`** → build.

## Know the project's rules first

Judge the code against **this project's** rules, not a generic ideal. Find them in this order and
stop at the first source that gives a clear answer:

1. `CLAUDE.md` / `AGENTS.md` at the repository root — and whatever rules index or rule files they point to.
2. A rules index at `.rules/README.md`, and the rule files it lists.
3. Other conventional places: `CONTRIBUTING.md`, `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`, a `docs/` folder of guidelines, architecture decision records.
4. If nothing is written down, the conventions the codebase already follows consistently — and say so in the output, since unwritten rules are weaker ground.

Pay particular attention to the project's architecture/layering rules, its mandatory patterns and
wrappers, its persistence and generated-code rules, its testing rules (tiers, commands, what must
be covered), and any rule of its own about refactoring. **Where the project has its own refactoring
rule, it overrides the defaults in this skill.**

## When to skip — say so plainly

- Tiny, isolated change in healthy code (one constant, one field).
- Genuinely new code with no existing structure to refactor.
- The area is messy but **stable and out of the change's path** — leave it alone.

Skipping this skill does **not** cancel the ride-along cleanup of the files the task edits — that
one is a standing practice, not a verdict of this assessment.

## How to run

1. **Restate the change** in a line, and **map its blast radius** across the project's real layers or modules — the files the change edits plus the seams they call directly. Refactor judgement applies **only inside this radius**.
2. **Assess the health** of that radius against the smells below. Read the code; don't guess.
3. **Check the test safety net — it is a hard gate.** No refactor starts until the whole refactor scope is covered by tests that pass on the current code (see "Test gate"). Inventory the tests that already exist for that scope, name what's missing at each tier, and count the cost of writing it into the cost of the refactor. New or changed logic ships with tests regardless, as the project's testing rules require.
4. **Weigh the debt** — cost of building on it as-is (now + interest later) vs a bounded refactor first. Be honest about both.
5. **Decide and scope** — one verdict, refactor bounded to what the change needs, and the named risk of not doing it.

## Debt smells (only in the blast radius)

- **Logic in the wrong layer / no clean seam** — business rules, data access, or computations living where the project's architecture says they must not (e.g. in UI components, controllers, or handlers instead of the layer meant for them). The strongest "refactor first" signal.
- **Layer leak** — a mandatory wrapper, adapter, or service bypassed in favor of the raw library or API; data access outside the data layer; feature code inside shared/core modules.
- **Oversized unit** — a file, class, or function already several hundred lines long that the change would pile onto. Split the piece you touch first to keep the change small.
- **Near-violations of hard rules** — anything the project forbids or mandates, found broken or half-followed in the radius: schema changes outside the migration mechanism, hand-edits to generated code, banned patterns, missing required structure. A change must not cement these.
- **Duplication about to hit three** — the change would copy a helper a third time.
- **Weak or missing tests** in the area the change modifies.

## How to judge (YAGNI guards against gold-plating)

Refactor-first is justified **only** when all hold:

- it's **in the path** of this change;
- doing it first makes the change **smaller, safer, or clearer** — a concrete, nameable benefit;
- the cost now — **including the tests the gate requires** — is **less** than building on bad ground plus cleaning later.

If the coverage the gate needs is too expensive to write for this task, that's an argument against
refactoring now, never for refactoring without it.

Refuse the refactor — build directly — when the messy code is **out of the path** (scope creep),
when it's **behavior-changing dressed up as refactor**, when the mess is real but **stable and
untouched**, or when it would **balloon the diff** (rough guide: a refactor bigger than the change
it serves is no longer local). Default to **minimal, reversible** changes; when close, prefer no
refactor and let the rule of three decide later — but name the debt you accept.

Restoring a **mandatory** project rule in code the change touches is never "optional cleanup" — a
change must not build on top of a violation.

## If you recommend a refactor

- **Behavior-preserving** — it changes structure, never what the system does, and it lands together with the change it clears the ground for.
- **Tests come first, always** — the test gate below is met before the first structural edit.
- **The project's rules still apply** — a structural change touching a schema still needs a migration; one touching a generated contract still goes through regeneration.

## Test gate (mandatory before any refactor)

1. **Unit tests cover the whole refactor scope** — every function, method, mapper, calculation, validator, and data-access method the refactor moves or reshapes, not only the piece the change needs. They are characterization tests: they pin down what the code does **today**, odd cases included, not what it should do.
2. **Integration tests too, when the behavior lives between pieces** — when the refactor moves logic across a seam, changes dependency wiring, or touches persistence, add tests that exercise those pieces together. When behavior is only observable end to end (a download, a file picker, a multi-step flow), cover it with the project's end-to-end suite if it has one. Needing a test tier the project doesn't have yet is a question for the user, not a silent addition.
3. **Green on the current code before the first edit** — the project's test command passes against the unrefactored code. A test written after the refactor proves only that the new code agrees with itself.
4. **The tests stay unchanged through the refactor** — only import paths and the setup of moved units may be adjusted. If an assertion has to change, the refactor changed behavior; stop and treat that part as a feature change.

The only exemption is free cleanups that cannot change behavior: unused imports, dead commented-out
code, comments that merely restate the code.

## Output

Concisely, in the user's language:

- **Verdict** — Refactor first / Refactor after / No refactor — with the core reason.
- **Blast radius** — with a health read per layer or module.
- **If refactoring** — bounded scope, concrete benefit, risk of skipping, and the **test plan for the gate**: existing coverage, and the unit and integration/e2e tests to add first, per file.
- **If building directly** — the debt consciously accepted.
- **Rules used** — where the rules came from (file names, or "inferred from the codebase").
- **Trade-offs for the user** and **open questions**.

Then **stop** — write no code. When an implementation skill ran this one, the verdict goes back to
it and the build continues from there.
