# Views

Pick views by the question the reader needs answered. The big picture always comes first; every
other view answers one question. A working starter for each view is in
[../templates/diagrams/](../templates/diagrams/). Copy it, replace its example content, and keep its
status kit.

## Question → view

| The reader asks | View | Starter | Mermaid |
| --- | --- | --- | --- |
| What is this, and what does it change, at a glance? | Big picture | `big-picture.mmd` | `flowchart LR` |
| What is different for the user afterwards? | Before / after | `before-after.mmd` | `flowchart TB`, two subgraphs |
| What does the user do, step by step, and what if it fails? | User flow | `user-flow.mmd` | `flowchart TD` |
| Which screens are there, and how do I move between them? | Screen map | `screen-map.mmd` | `flowchart LR` |
| What is on this screen? | Screen sketch | `screen-sketch.mmd` | `block-beta` |
| Who calls whom, in what order? | Sequence | `sequence.mmd` | `sequenceDiagram` |
| Which parts of the code change, in which layer? | Components | `components.mmd` | `flowchart LR`, a subgraph per layer |
| What data is stored, and how is it related? | Data model | `data-model.mmd` | `erDiagram` |
| What states can it be in, and what moves it between them? | States | `states.mmd` | `stateDiagram-v2` |
| How is this decided? What are the rules? | Decision logic | `decision-logic.mmd` | `flowchart TD` |
| In what order will it be built? | Plan phases | `plan-phases.mmd` | `flowchart LR` |
| This part is too dense to read. | Zoom-in (L2) | the parent view's starter | as the parent |
| What do the colors and shapes mean? | Legend | `legend.mmd` | `flowchart TB` |

Some questions have no starter but are drawn with the same kit when they come up:

- a data pipeline or an event flow: `flowchart LR`, with `-.->` for the async hops;
- a deployment or infrastructure view: `flowchart`, with a subgraph per host or environment;
- class structure: `classDiagram`;
- what is in scope and what is out: `mindmap`;
- a release timeline: `timeline`.

Check that each of these renders before you build on it.

## Big picture (L0)

- **Answers:** what the subject is, which parts it touches, and what this task adds or changes, all on one screen.
- **Reader:** everyone. It is the entry point.
- **Build:** people on the left, the parts of the system grouped by zone (app, backend, jobs, …) as subgraphs, external systems on the right. Give every node a status class, and draw the path the task adds or changes with `==>`. The spec `user` preset draws it at the user's level (person → what they use → what they get). The `technical` preset extends the same diagram with the system's parts; it doesn't start a second one.
- **Limits:** 12 nodes, 4 zones. If a zone gets busy, collapse it into one node marked `focus` and open it in a zoom-in.
- **Watch out:** this is not an architecture diagram of the whole product. Draw only the parts this subject touches, plus the one or two neighbours a reader needs to get their bearings.

## Before / after

- **Answers:** what changes for the user, or for the caller when there is no end user.
- **Reader:** non-technical first.
- **Build:** two subgraphs, `before` and `after`, each a short chain, with `before ~~~ after` to stack them. Start both rows with the same person and the same first step so the eye finds the difference. Mark unchanged steps `existing`, new ones `new`, altered ones `changed`. Node ids must differ between the rows (`b1`, `a1`), because a node belongs to only one subgraph.
- **Limits:** 6 steps per row.
- **Watch out:** show outcomes, not implementation: "sees discount in total", not "PATCH /orders".

## User flow

- **Answers:** what the user does and sees, in order, including where it can fail.
- **Reader:** non-technical and engineers alike.
- **Build:** `flowchart TD`. Start and end with the person (the stadium shape). Screens and actions are boxes; decisions are diamonds with labelled `yes` / `no` branches. Draw the main error branch and where it returns to. Labels say what the user sees or does, in their words.
- **Limits:** 15 nodes and one scenario per diagram. A second scenario is a second view.
- **Watch out:** every branch has to end somewhere: a screen, an end, or a loop back.

## Screen map

- **Answers:** which screens exist and how the user moves between them.
- **Build:** `flowchart LR` with one node per screen or dialog. Label each edge with the action that moves the user (a button, a link, a redirect). Pages outside the product (a payment provider, an OAuth consent screen) are `external`. Use a self-loop for an action that stays on the same screen.
- **Limits:** 12 screens.

## Screen sketch

- **Answers:** what is on one screen, and roughly where.
- **Build:** `block-beta`. `columns N` sets the grid, `id["label"]:K` spans K columns, and `space` / `space:K` leaves cells empty. Draw regions, not pixels: header, list, form, summary, primary action, error area. Set statuses with `class a,b new` lines after the `classDef` block. Make one sketch per screen that changes.
- **Limits:** 12 blocks. It is a low-fidelity sketch, not a design; if a design exists elsewhere, link it under "What to notice".
- **Watch out:** `block-beta` is still a beta syntax. Render it before building more on top of it.

## Sequence

- **Answers:** who calls whom, in what order, and what comes back, for one flow.
- **Reader:** engineers.
- **Build:** `sequenceDiagram` with `autonumber`. Name participants as the code does (`participant API as Orders API`) and declare the person with `actor`.
  - Steps this task adds go inside `rect rgb(227, 244, 232)` with `Note over …: New in this task`.
  - Changed steps go inside `rect rgb(255, 243, 214)`; removed ones inside `rect rgb(253, 232, 232)`.
  - Error paths go in `alt` / `else`, optional steps in `opt`, parallel ones in `par`.
  - Messages are the real call (`POST /orders/:id/promo`, `validate(code, cart)`); responses use dashed arrows (`-->>`).
- **Limits:** 7 participants, 25 messages. Over that, split by phase, or draw one diagram for the happy path and one for the errors.
- **Watch out:** a `;` in message text ends the statement. Write it as `#59;`.

## Components

- **Answers:** which modules change, in which layer, and how they depend on each other.
- **Reader:** engineers.
- **Build:** `flowchart LR` with one subgraph per real layer or package, taken from `design.md` ("Layers & modules touched") or the code's folders. Put the entry layer first and give each subgraph `direction TB`. Nodes are the real modules, classes, or files. Use `==>` for dependencies the task adds and `-.->` for events, async calls, and migrations.
- **Limits:** 20 nodes, 5 layers.
- **Watch out:** respect the project's layering. An arrow against an allowed dependency is either a design problem to raise or a drawing mistake.

## Data model

- **Answers:** what is stored, how entities relate, and which fields this task adds.
- **Build:** `erDiagram` with only the entities and fields that matter for the subject, and key markers `PK`, `FK`, `UK`. `erDiagram` rejects `classDef`, so put the status in the attribute's comment: `"NEW"`, `"CHANGED"`, `"REMOVED"`, and `"NEW table"` on the key of a new entity.
- **Limits:** 8 entities, 8 fields each.
- **Watch out:** write types and names as the schema or migration does, and cite that file.

## States

- **Answers:** what states a thing can be in, and what moves it from one to the next.
- **Build:** `stateDiagram-v2`. Use `[*]` for start and end, and label every transition with its trigger (a user action, an event, a timer). Set statuses with `class A,B new` lines. It works for entity lifecycles (order, payment, job) and for UI states (idle / loading / empty / error / success). Give long names an alias: `state "Waiting for payment" as Waiting`.
- **Limits:** 10 states.
- **Watch out:** every state needs a way out unless it is a deliberate final state.

## Decision logic

- **Answers:** how a decision is made: the business rule, in order.
- **Build:** `flowchart TD`. Draw the input as a parallelogram, one question per diamond, and a label on every branch; every path ends in an outcome. Order the checks as the code or the spec applies them.
- **Limits:** 8 decisions. Split a bigger rule set by concern.
- **Watch out:** write thresholds and constants exactly as the source has them (`≥ 50`, `30 days`; write `≥` or `#gt;`, because a bare `>` disappears from labels), and cite it.

## Plan phases

- **Answers:** in what order the task will be built, what depends on what, and what each phase delivers.
- **Build:** `flowchart LR` with one node per phase from `plan/index.md`, labelled `"NN - name<br/>what it delivers"`; arrows are dependencies. Take each phase's status from the plan: done is `existing`, in progress is `focus`, not started is `new`. Optionally, add a row of subgraphs per layer with dotted edges from each phase to the layers it touches.
- **Limits:** one node per phase. If there are more than 10 phases, group them by milestone.

## Zoom-in (L2)

- **Answers:** how one dense element of the big picture or of a view works inside.
- **Build:** the same diagram type as the question needs (often a components, sequence, or states view), scoped to that one element. Mark the element `focus` in its parent, start the zoom-in's section with "Zooms into: <element>", and keep the element's name identical on both levels.
- **Limits:** the limits of its type.

## Legend

Copy `legend.mmd` into every `diagrams/` folder and delete the entries the visual never uses. It is
the first image in `visual.md`.
