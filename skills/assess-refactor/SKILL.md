---
name: assess-refactor
description: Before implementing a task, decide whether the code it touches needs a refactor first. Analysis only — writes no code.
---

# assess-refactor

Before implementing a feature or fix, decide whether the code it lands on should be refactored **first**. Analysis only — write no code.

Judge the code against the project rules, in particular:

- `[refactoring](../../../.rules/refactoring.md)`
- `[architecture](../../../.rules/architecture.md)`
- `[testing](../../../.rules/testing.md)`

Stay inside the task's blast radius: the files the change edits plus the seams they call directly. Messy code outside it stays as it is.

Recommend a refactor first only when it is in the path of the change, makes the change smaller, safer or clearer, and costs less now — tests included — than building on bad ground. When in doubt, don't refactor, but name the debt you accept. A violation of a mandatory rule in the touched code is always fixed.

**Test gate:** no refactor starts until its whole scope is covered by unit tests (plus integration tests where the behavior lives between pieces) that pass on the current code. The tests stay unchanged through the refactor — if an assertion has to change, it's a behavior change, not a refactor.

Answer briefly, in the user's language:

- **Verdict** — refactor first / refactor after / no refactor, and why.
- **Scope** — what to refactor and which tests to add first, or the debt left as is.
- **Open questions** for the user.

Then stop. If `implement` ran this skill, hand the verdict back to it.
