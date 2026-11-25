# visual.json: data format

One JSON file describes the whole visual. `scripts/build.mjs` validates it, then renders it into
the fixed template. A complete, working example is
[../examples/promo-codes.json](../examples/promo-codes.json): copy its structure.

Every prose field (`lede`, `text`, `desc`, `outcome`, `intro`, `why`, list items) accepts two inline
marks: `**bold**` and `` `code` ``. Nothing else; HTML is escaped.

## Top level

| Field | Type | Required | What it is |
| --- | --- | --- | --- |
| `lang` | `"ru"` \| `"en"` | no | Language of the page's own UI strings (buttons, labels). Default `en`. Write the content in the project's documentation language either way. |
| `task` | object | yes | The header. See below. |
| `sections` | array | yes | The sections, in reading order. See the types below. |
| `screens` | array | for `journey` | The mockup screens and their states. See [screens.md](screens.md). |
| `labels` | object | no | Overrides for UI strings, e.g. `{ "only": "Show changes only", "status": { "new": "neu" } }`. Keys as in the `I18N` table of `assets/template.html`; nested maps (`status`, `mark`, `phase`, `note`) merge, so one key is enough. Keys that also exist in the `MD` table of `scripts/build.mjs` (`status`, `before`, `after`, `pros`, `cons`, `chosen`, `why`, `files`, `reqs`, `branch`, `start`, `final`, `phase`, `note`, …) apply to `visual.md` too. |
| `footer` | string | no | A last line under all sections. |

### task

```json
"task": {
  "title": "Promo codes at checkout",
  "lede": "One or two sentences: what changes, for whom.",
  "path": "docs/tasks/042-promo-codes/visual.html",
  "meta": [["Status", "ready-to-implement"], ["Sources", "problem · design · plan/"], ["Updated", "2026-11-25"]]
}
```

`title` is required. The header also shows counters computed from the `architecture` cards (new,
changed, unchanged, removed) and the number of plan phases.

## Common section fields

| Field | Required | What it is |
| --- | --- | --- |
| `type` | yes | One of the types below. |
| `title` | yes | The section heading: name the question it answers. |
| `id` | no | Lowercase letters, digits, hyphens. Used for anchors and PNG names (`NN-<id>.png`). Default `<type>-<n>` (its position in `sections`, from 1). Must be unique, including against those defaults, and not one the page uses itself: `top`, `overview`, `nav`, `app`, `drawer`, `scrim`. |
| `nav` | no | Short label for the top navigation; default `title`. |
| `eyebrow` | no | Small line above the title, e.g. `"Checkpoint user · after happy-path.md"`. |
| `intro` | no | One or two sentences under the title: how to read the section. |

## Statuses

`new` (added by the task) · `changed` (modified) · `existing` (untouched, drawn for context) ·
`removed` (deleted by the task). Every card, step, entity, field, state, and sequence message can
carry one; the default is `existing`. Lists (`steps`, `cards`, `files`, `pros`, …) are always JSON
arrays, even with one item.

`"focus": true` on an architecture card is separate from its status: it marks a module that a
later section opens up (a violet ring, "opened below" in the side panel). An existing module can be
in focus; the counters still count it by its status.

## Section types

### beforeAfter

What changes for the user. Two step ribbons with a toggle; opens on `after`.

```json
{ "type": "beforeAfter", "title": "What changes for the customer",
  "before": { "label": "Today", "steps": [ { "title": "Cart", "text": "3 items" }, { "title": "Payment", "text": "full price" } ],
              "outcome": "Pays **€49.90**." },
  "after":  { "steps": [ { "title": "Cart" }, { "title": "Enters a promo code", "status": "new" }, { "title": "Payment", "status": "changed" } ],
              "outcome": "Pays **€44.91** and sees the saving." } }
```

`label` is optional (defaults: "Today" / "After this task"). Each step: `title` (required), `text`, `status`.

### architecture

The modules the task touches, as cards grouped by zone (layer, app, package, system), top to bottom
in call order. A card opens a side panel with its details.

```json
{ "type": "architecture", "title": "What the task touches",
  "zones": [
    { "title": "Client", "path": "apps/web", "color": "#5B5BD6", "link": "POST /orders/:id/promo",
      "cards": [
        { "id": "field", "name": "PromoCodeField", "icon": "tag", "status": "new",
          "desc": "Input, Apply button, error under the field.", "tags": ["React"],
          "changes": ["Five states: empty, typing, checking, applied, rejected"],
          "files": ["apps/web/src/features/checkout/PromoCodeField.tsx:1"], "reqs": ["FR-1", "FR-4"],
          "note": "Opened up in “Validation rules”." }
      ] } ] }
```

- Zone: `title` (required), `path` (where it lives), `color` (dot color, any CSS color), `link` (label on the arrow to the next zone: the protocol or call between them), `cards` (required).
- Card: `id` (required, unique across the visual; `plan` refers to it), `name` (required, as the code names it), `icon` (see below), `status`, `focus` (see Statuses), `desc` (one sentence), `tags` (technology), `changes` (what the task does to it), `files` (`path:line`; the build warns when a card has none), `reqs` (FR-/NFR-/AC- ids), `note`.
- Icons: `user users monitor phone globe tag code route server shield lock key layers database branch card cart box mail bell message clock queue zap cpu cloud plug file search settings chart calendar`. Unknown names draw `box` and warn.

### journey

The user's steps on the left, a live screen mockup on the right. Clicking a step shows its screen.

```json
{ "type": "journey", "title": "The customer's path", "frame": "browser",
  "steps": [
    { "title": "Opens checkout", "text": "Sees the summary and an empty promo field.", "screen": "empty", "ref": "FR-1" },
    { "title": "Code rejected", "text": "The field turns red, the reason shows under it.", "screen": "rejected", "ref": "FR-4", "branch": "error branch" }
  ] }
```

- `frame`: `browser` (default) or `phone`.
- Step: `title` (required), `text`, `screen` (a screen id), `ref` (requirement or AC ids), `branch` (`true` or a label: an alternative path; shown with `!` instead of a number).
- Needs top-level `screens` — see [screens.md](screens.md). Screens used by steps also appear as state tabs under the mockup; add more tabs with `"tabs": ["screen-id", …]`.
- A visual can have several journey sections (one per scenario, or a long one split in two). Each has its own mockup; a rule's "On screen" button shows the screen in the journey that uses it.

### decision

One key decision: the options side by side, pros and cons, the chosen one highlighted.

```json
{ "type": "decision", "title": "Where to validate the code",
  "options": [
    { "title": "PromoRules in the API", "text": "Pure functions in the service layer.", "chosen": true,
      "pros": ["One place for the logic"], "cons": ["Two DB queries"] },
    { "title": "In the database", "pros": ["Atomic"], "cons": ["Logic moves into SQL"] } ],
  "why": "Business logic lives in the service layer per `.rules/architecture.md`." }
```

Two to four options; mark exactly one `chosen` (the build warns otherwise). One section per decision.

### rules

A business rule as an ordered chain of checks. Each failed check shows its user-facing message; with
a `screen`, a button shows that message on the mockup.

```json
{ "type": "rules", "title": "Validation rules",
  "checks": [ { "title": "Code exists?", "code": "promo_codes.code = :code", "fail": "Promo code not found", "screen": "rejected-notfound" } ],
  "success": { "title": "Discount applied", "code": "discount = total × percent_off / 100" } }
```

### dataModel

Tables or entities the task touches, with only the fields that matter; new and changed fields are highlighted.

```json
{ "type": "dataModel", "title": "Data model",
  "entities": [ { "name": "orders", "status": "changed", "note": "Amounts in cents.",
    "fields": [ { "name": "id", "type": "uuid", "key": "PK" }, { "name": "discount_cents", "type": "int", "status": "new", "note": "default 0" } ] } ],
  "relations": ["orders.promo_code → promo_codes.code (optional)"] }
```

### sequence

Who calls whom, in order, drawn as lanes. Numbered automatically.

```json
{ "type": "sequence", "title": "Calls on Apply",
  "participants": [ { "id": "U", "label": "Customer", "kind": "person" }, { "id": "API", "label": "OrdersController", "status": "changed" },
                    { "id": "PSP", "label": "Payment provider", "kind": "external" } ],
  "items": [
    { "from": "U", "to": "API", "text": "POST /orders/:id/promo", "status": "new" },
    { "note": "New in this task", "over": ["U", "API"], "status": "new" },
    { "divider": "code rejected" },
    { "from": "API", "to": "U", "text": "422 { reason }", "reply": true, "status": "new" },
    { "from": "API", "to": "API", "text": "log the attempt" } ] }
```

- Participant: `id`, `label` (required), `kind` (`person` \| `system` \| `external`), `status`.
- Item: a message (`from`, `to`, `text`, `reply` for a dashed return arrow, `status`; `from` = `to` draws a self-call), a `note` (`over` two participant ids, default all), or a `divider` (a labelled dashed line: an alt/else branch). A `status` other than `existing` tints the row.

### states

A lifecycle: one card per state with its outgoing transitions.

```json
{ "type": "states", "title": "Order lifecycle", "start": "draft",
  "states": [ { "id": "draft", "label": "Draft", "text": "Editable." }, { "id": "paid", "label": "Paid", "status": "new" } ],
  "transitions": [ { "from": "draft", "to": "paid", "trigger": "payment captured" } ] }
```

The `start` state is tagged "start"; a state with no outgoing transition is tagged "final".

### plan

Implementation phases. Clicking a phase highlights the architecture cards it touches.

```json
{ "type": "plan", "title": "Plan",
  "phases": [ { "n": "01", "title": "Schema", "text": "promo_codes + migration", "state": "done", "cards": ["db", "mig"] },
              { "n": "02", "title": "Rules", "state": "active", "progress": 60, "cards": ["rules"] } ] }
```

`state`: `done` \| `active` \| `todo` (default). `progress`: 0–100 (default 100 for done, 0 otherwise).
`cards`: architecture card ids; the build errors on an unknown id.

### notes

Short cards for risks, open questions, out-of-scope items, and other notes.

```json
{ "type": "notes", "title": "Risks and open questions",
  "items": [ { "title": "Race on the last use", "tone": "risk", "text": "Two orders apply the last use at once." },
             { "title": "Admin UI", "tone": "out", "text": "A separate task." },
             { "title": "Stacks with sale prices?", "tone": "question", "tag": "blocking" } ] }
```

`tone`: `info` (default) \| `risk` \| `question` \| `ok` \| `out`. `tag` overrides the badge text.

### image

An escape hatch for a picture the components can't express, e.g. a diagram rendered by
`mermaid-visualize`: `{ "type": "image", "title": "…", "src": "diagrams/03-deploy.svg", "alt": "…", "caption": "…" }`.
`src` is relative to `visual.html`.
