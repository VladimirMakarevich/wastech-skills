# Mermaid: safe syntax and render errors

The render script pins mermaid 12.3 (see the constants at the top of
[../scripts/render.mjs](../scripts/render.mjs)). The rules and error messages below were checked
against that version.

## Rules that prevent most errors

1. **Quote every label:** `id["Label"]`, `id("Label")`, `id{"Label?"}`, `-->|"label"|`. Inside a shape, an unquoted `(`, `)`, `[`, `]`, `{` or `}` ends the label early.
2. **Node ids are ASCII:** `promoField`, `p1`. Labels can be in any language.
3. **Never name a node `end`.** It closes a subgraph. Use `done` or `finish`.
4. **Watch ids that start with `o` or `x` right after a link.** `A---oB` draws an edge ending in a circle, and `A--xB` one ending in a cross. Put a space before the id or rename it.
5. **Line breaks:** `<br/>` inside a quoted label.
6. **Special characters by entity code:** `#quot;` for `"`, `#59;` for `;`, `#35;` for `#`.
7. **No bare `>` in a label.** It is silently dropped: `"total >= min"` renders as `total = min`, with no error. Write `≥` / `≤` or `#gt;` (`<` survives).
8. **Subgraphs:** `subgraph id["Title"]` … `end`, with ids unique and different from every node id. Every `subgraph` needs its `end`.
9. **A node belongs to the first subgraph that defines it.** To show the same thing in two places (before and after), use two ids.
10. **One statement per line.** Chains like `a --> b --> c` are fine.
11. **Comments** are lines starting with `%%`. Don't add `%%{init: …}%%` blocks; the theme comes from the config file.

## Per diagram type

### flowchart

- Header: `flowchart LR`, `flowchart TD`, `flowchart TB`, or `flowchart RL`. Use `flowchart`, not the legacy `graph`.
- `id:::new` on a node and `class a,b new` lines both work, and `classDef` lines may come after the nodes.
- `~~~` is an invisible link for layout. It also works between subgraphs.

### sequenceDiagram

- `participant API as Orders API`, `actor C as Customer`.
- Blocks: `alt … else … end`, `opt … end`, `loop … end`, `par … and … end`, `rect rgb(r, g, b) … end`. Every block closes with `end`.
- Notes: `Note over A,B: text`, `Note right of A: text`.
- Message text is unquoted and runs to the end of the line. A `;` ends the statement, so write it as `#59;`.
- Arrows: `->>` call, `-->>` response, `-x` failure, `-)` async.

### stateDiagram-v2

- `[*]` is start and end; transitions are `A --> B: trigger`.
- Names with spaces need an alias: `state "Waiting for payment" as Waiting`.
- `classDef` and `class A,B new` work. `[*]` can't be styled.
- Composite states: `state Checkout { … }`.

### erDiagram

- Entities in UPPER_SNAKE or as the table is named. Attributes: `type name [PK|FK|UK] ["comment"]`.
- Cardinality: `||` exactly one, `o|` zero or one, `}|` one or more, `}o` zero or more. `--` is identifying, `..` non-identifying. Example: `ORDER ||--o{ ORDER_ITEM : contains`.
- **No `classDef` and no `class`.** They fail with "Lexical error … Unrecognized text". Put the status in an attribute comment instead.
- A relationship label is one word or a quoted phrase: `: "applies to"`.

### block-beta

- `columns N`; `id["label"]:K` spans K columns; `space` or `space:K` leaves cells empty.
- Set statuses with `class id1,id2 new` lines after the `classDef` block.
- `<br/>` works inside labels.

## Error → fix

The render script prints the parser's message under `FAIL <file>`, with the line and a caret
pointing at the problem.

| Message | Usual cause | Fix |
| --- | --- | --- |
| `Parse error on line N: … Expecting 'SQE', … got 'PS'` | An unquoted label containing `(` or `)`, such as `b(Process (main))` | Quote it: `b("Process (main)")` |
| `Parse error on line N: … got 'end'` | A node named `end` | Rename it: `done`, `finish` |
| `Parse error on line N: … Expecting … 'end' … got '1'` (N is past the last line) | A `subgraph`, `alt`, `loop`, or `rect` without its `end` | Count the openings against the `end`s |
| `Parse error on line N: … Expecting '()', 'SOLID_OPEN_ARROW', … got 'NEWLINE'` in a sequence | A `;` in message text, so the rest of the line is read as a new statement | Write `#59;` |
| `Lexical error on line N. Unrecognized text.` on a `classDef` or `class` line in an `erDiagram` | ER diagrams have no classes | Remove the line and use attribute comments |
| `Lexical error on line N. Unrecognized text.` elsewhere | A character the parser doesn't accept outside quotes | Quote the label, or use an entity code |
| `UnknownDiagramError: No diagram type detected` | The first line that isn't a comment is not a valid header: a typo, a byte-order mark, or stray text | Start with `flowchart LR`, `sequenceDiagram`, `erDiagram`, … |
| Renders, but a `>` is missing from a label (`>=` shows as `=`) | A bare `>` in label text is stripped | Write `≥`, `≤`, or `#gt;` |
| Renders, but a label is split mid-word | A long identifier wrapped automatically | Break it yourself with `<br/>` at a dot or underscore |
| Renders, but the layout is a tangle | Too many nodes, or the wrong direction | Split per [views.md](views.md), switch `LR` ↔ `TD`, or regroup the subgraphs |
| `Could not find Chrome` / `Failed to launch the browser process` | No usable browser | Install Chrome, Edge, or Chromium, set `PUPPETEER_EXECUTABLE_PATH`, or run `render.mjs --install-browser` |
| The first-run install fails | No network access to the npm registry, Node.js older than 22.13, or npm blocked | Fix the cause, or use the fallbacks in `SKILL.md`, Step 5 |
