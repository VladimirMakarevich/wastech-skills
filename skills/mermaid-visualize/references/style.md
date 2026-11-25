# Visual language

One set of rules for every diagram, so that a reader who has learned to read one view can read them
all. The theme (fonts, neutral colors, lines) comes from
[../assets/mermaid-config.json](../assets/mermaid-config.json) and the render script applies it.
Don't override it in a diagram with a `%%{init: …}%%` block.

## Status: what the task does to each element

Status is the heart of a task visual: it shows at a glance what will be built and what stays as it
is. Every node in a flowchart, state diagram, or block diagram carries one.

| Class | Meaning | Looks like |
| --- | --- | --- |
| `new` | Added by this task | green fill, solid thick border |
| `changed` | Exists, and this task modifies it | amber fill, dashed border |
| `removed` | Exists, and this task deletes it | red fill, dotted border |
| `existing` | Exists, and this task leaves it alone; drawn for context | grey fill, thin border |
| `external` | Outside the system: a third-party service, another team's system | white fill, dashed grey border |
| `person` | A person or a role: customer, admin, support agent | blue fill |
| `focus` | Opened up in a zoom-in view below, or the plan phase in progress | violet fill, thick border |

Statuses differ by line style as well as by color, so a diagram still reads in grayscale and for
color-blind readers.

### The kit

Every flowchart, state, and block starter ends with this block. Keep it unchanged, and keep it in
every diagram so all of them look the same:

```
    %% --- status kit (references/style.md): keep as is ---
    classDef new fill:#E3F4E8,stroke:#2F855A,stroke-width:2.5px,color:#1C4532
    classDef changed fill:#FFF3D6,stroke:#B7791F,stroke-width:2px,stroke-dasharray:6 3,color:#5F370E
    classDef removed fill:#FDE8E8,stroke:#C53030,stroke-width:2px,stroke-dasharray:2 3,color:#742A2A
    classDef existing fill:#F4F6F8,stroke:#9AA5B1,stroke-width:1px,color:#323F4B
    classDef external fill:#FFFFFF,stroke:#7B8794,stroke-width:1.5px,stroke-dasharray:4 4,color:#323F4B
    classDef person fill:#E6EEFF,stroke:#3B5BDB,stroke-width:1.5px,color:#1E2A78
    classDef focus fill:#F3EBFF,stroke:#6B46C1,stroke-width:3px,color:#322659
```

Apply a status with `id["Label"]:::new` on the node (in flowcharts), or with a `class id1,id2 new`
line (in any type that accepts classes).

### Where the status comes from

- **spec mode:** `design.md` (the layers and modules touched, the data model, the interfaces); for the user-level views, the Before/After in `happy-path.md`.
- **code mode:** `existing`, unless the subject is a pending change (uncommitted work, a branch, a PR). Then the diff decides.
- **idea mode:** `new`, except for the existing parts it attaches to.

When an element's status is unclear, ask the user. Don't guess.

### Diagrams that don't accept classes

- `sequenceDiagram`: wrap the steps in a colored `rect`. New: `rect rgb(227, 244, 232)` plus `Note over …: New in this task`. Changed: `rect rgb(255, 243, 214)`. Removed: `rect rgb(253, 232, 232)`.
- `erDiagram`: it rejects `classDef` (checked with mermaid 12.3), so mark the field in its comment: `decimal discount "NEW"`.

## Shapes

| Element | Shape | Syntax |
| --- | --- | --- |
| Person or role | stadium | `id(["Customer"])` with `:::person` |
| Screen, page, UI component | rectangle | `id["Checkout page"]` |
| Logic: service, function, handler, job | rounded rectangle | `id("OrderService")` |
| Data store: database, table, cache, bucket | cylinder | `id[("Orders DB")]` |
| External system | subroutine | `id[["Payment provider"]]` with `:::external` |
| Decision | diamond | `id{"Code valid?"}` |
| Input, event, message, file, migration | parallelogram | `id[/"Promo code + cart"/]` |

## Arrows

| Meaning | Syntax |
| --- | --- |
| Call, request, main path, data flow | `-->` |
| Async, event, optional, background | `-.->` |
| The path this task adds or changes | `==>` |
| Layout only, with no meaning | `~~~` |

Arrow labels are short verb phrases or the actual call: `-->|"apply(code)"|`, `-.->|"OrderPaid event"|`.

## Layout

- Use `LR` for architecture, layers, pipelines, and screen maps. Arrows then enter subgraphs from the side instead of running through their titles.
- Use `TD` for user flows and decision trees, which are read from top to bottom.
- Group with subgraphs only by real zones: an app, a layer, a service, an environment. A subgraph's own `direction` is ignored once any of its nodes links outside it; it then follows the parent's direction.
- Order nodes the way they are read: entry points left or top, storage and external systems right or bottom.

## Labels and names

- Use the name the source uses: the screen title from the spec, the identifier from the code. A reader must be able to search for any label.
- Keep labels to about 5 words. Break long ones with `<br/>`, and break long identifiers yourself at a dot (`OrderService<br/>.applyPromo`): automatic wrapping can split a word in the middle.
- Write in sentence case, in the project's documentation language; identifiers stay as they are.
- Node ids are short ASCII camelCase (`promoField`), unique within the diagram.
- No emoji or icon fonts. Not every viewer renders them.

## Size

| Diagram | Limit |
| --- | --- |
| Big picture | 12 nodes |
| Flowchart, state, or block view | 20 nodes |
| Sequence | 7 participants, 25 messages |
| Data model | 8 entities |
| Any label | about 5 words |

Over a limit, split the diagram: see the zoom-in in [views.md](views.md).

## One idea per diagram

A diagram answers one question. If its "What to notice" list needs more than four points, or talks
about two unrelated things, it should be two diagrams.

## Legend

Every `visual.md` opens with the legend image, rendered from `legend.mmd` with the entries the visual
doesn't use deleted.
