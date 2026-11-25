# Choosing and writing sections

The header (title, one-sentence lede, counters, legend) is always there. Each section below answers
one question. Pick the ones whose question the reader actually has; order them from the user's view
to the technical view to the plan.

## Question → section

| The reader asks | Section | Typical source |
| --- | --- | --- |
| What changes for the user? | `beforeAfter` | `happy-path.md` Before/After; the current UI |
| What does the user do and see, step by step? | `journey` + `screens` | `happy-path.md` examples; the UI code |
| Which parts of the system does it touch, and how? | `architecture` | `design.md` "Layers & modules touched"; the code tree |
| Why this solution and not another? | `decision` | `design.md` "Key decisions" |
| How exactly is it decided? What are the rules? | `rules` | `requirements.md`, `design.md`; the validation code |
| What data is stored, and what is added? | `dataModel` | `design.md` "Data model"; the schema, migrations |
| Who calls whom, in what order? | `sequence` | `design.md` "Interfaces"; the handlers and services |
| What states can it be in? | `states` | `design.md`; the state machine or status enum |
| In what order will it be built? | `plan` | `plan/index.md` |
| What could go wrong? What is open, what is out? | `notes` | `questions.md`, `out-of-scope.md`, risks in `plan/` |

## Presets for spec-task checkpoints

All presets write to the same `visual.json`; a later preset adds sections and keeps the earlier ones.

| Preset | When | Sections |
| --- | --- | --- |
| `user` | after `happy-path.md` | `beforeAfter`, `journey` with its `screens` (when there is UI), `notes` for out-of-scope items |
| `technical` | after `design.md` | `architecture`, a `decision` per key decision, `rules` if there are business rules, `dataModel` if storage changes, `sequence` of the main flow with its main error branch, `states` if something has a lifecycle |
| `plan` | after `plan/` | `plan` (linked to the architecture cards), `notes` for risks and blocking questions |

For a visual of existing code (no task), skip `beforeAfter` and `plan`, and mark everything `existing`
unless the visual is about a pending change.

## Writing good content

- **Names as the source writes them.** Card names are the real module, class, or file names; screen copy is the real copy; table and field names are the schema's. A reader must be able to search for any of them.
- **Every card cites its files** (`path:line` where it helps) and its requirements. These are what the side panel is for.
- **Status is a fact, not a guess.** It comes from `design.md` or the diff. When it is unclear, ask.
- **One sentence per `desc` and `text`.** The side panel and `changes` hold the rest.
- **Order means something.** Zones top to bottom in call order; journey steps in the user's order; checks in the order the code runs them; phases by dependency.
- **Nothing invented.** No module, call, screen, or rule the sources don't support. A gap is a question for the user (and a line in `questions.md` in spec mode), not a card.

## Size limits

| Section | Keep to |
| --- | --- |
| architecture | 4 zones, 6 cards per zone |
| journey | 8 steps; 10 screens |
| decision | 2–4 options, 5 pros and 5 cons each |
| rules | 8 checks |
| dataModel | 6 entities, 10 fields each |
| sequence | 7 participants, 25 items |
| states | 10 states |
| plan | 10 phases |
| notes | 8 items |

Over a limit, split: two `architecture` sections (overview, then one zone in depth), two `sequence`
sections (happy path, errors), or a separate visual for a sub-feature.
