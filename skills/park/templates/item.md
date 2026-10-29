<!-- One parked task. Written for someone who remembers nothing of the session that parked it. -->

# {{TASK_TITLE}}

- **Slug:** `{{SLUG}}`
- **Status:** parked <!-- parked → resumed → done | dropped -->
- **Parked:** {{DATE}}
- **Owner:** {{OWNER}}
- **Remaining effort:** {{REMAINING}} <!-- rough size of what's left, e.g. "~2 days", "S / M / L" -->
- **Code:** {{CODE_STATE}} <!-- branch `parked/<slug>` @ <sha> | patch `<slug>.patch` on <base sha> | none | dropped -->
- **Base commit:** `{{BASE_COMMIT}}` <!-- HEAD of the main line when parked; resume diffs against it -->

## Why it's parked

<!-- The user's reason: cost, priority, a blocker, waiting on someone. -->

## Resume when

<!-- The condition that makes this worth picking up again. "When there's time" is allowed — say so. -->

## Goal

<!-- What the task is for, in the user's framing. 2–3 sentences. -->

## Where it stopped

### Done

<!-- What is finished, with paths. -->

### In progress

<!-- What is half-done, and the exact state it was left in. -->

### Not started

<!-- What remains. -->

## Next step

<!-- The single concrete action to take first on resume — specific enough to start without asking anything.
     Then the rough sequence after it. -->

1. 

## Decisions

<!-- One row per settled decision. The reason matters more than the conclusion. -->

| Decision | Why | Rejected options |
| --- | --- | --- |
|  |  |  |

## Findings

<!-- Facts found in the code or environment that cost effort to find. Cite `path:line`. -->

- 

## Dead ends

<!-- What was tried and didn't work, and why. -->

- 

## Open questions

<!-- Unresolved decisions, and who can answer them. -->

- 

## Artifacts

<!-- Referenced, not copied: spec folder (and where in it the work stopped), plan, ADRs, issues, PRs, branches.
     If the work ran under a skill, name it and where it stood, e.g. "spec-task — design.md drafted, not signed off". -->

- **Skill in use:** 
- 

## Change log

- {{DATE}} — parked.
