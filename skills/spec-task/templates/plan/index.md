<!-- The implementation plan: the whole task broken into ordered phases. This is the FINAL artifact —
     written only after problem/requirements/design/acceptance are settled. Each phase is its own
     file (01-…, 02-…). Order by dependency: schema before the code that reads it, contract before
     its consumers, shared pieces before the features built on them. -->

# Implementation plan — {{TASK_TITLE}}

[⌂ index](../index.md) · builds [design.md](../design.md) toward [acceptance-criteria.md](../acceptance-criteria.md)

## Strategy

<!-- One paragraph: the sequence and why it's ordered this way. Note the critical path and the biggest risk. -->

## Phases

| # | Phase | Delivers | Depends on | Status |
| --- | --- | --- | --- | --- |
| 01 | [<name>](01-<name>.md) | <outcome> | — | ☐ |
| 02 | [<name>](02-<name>.md) | <outcome> | 01 | ☐ |
| 03 | [<name>](03-<name>.md) | <outcome> | 02 | ☐ |

<!-- Keep phases small and independently reviewable. Prefer vertical slices that each leave the project green. -->

## Cross-cutting

<!-- Fill from the project's conventions; drop lines that don't apply. -->

- **Branching & commits:** <the project's branch naming and commit convention>.
- **Migrations:** any schema change goes through the project's migration mechanism, sequenced before its consumers.
- **Contracts & generated code:** contract changes and regeneration happen before the code that consumes them.
- **Tests:** <what must ship with tests, per the project's rules>.
- **DoD gate:** [definition-of-done.md](../definition-of-done.md).

## Handoff

<!-- Who or what builds this: the project's implementation skill/command if it has one, otherwise a
     regular implementation session. Name it. -->

## Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| | | |
