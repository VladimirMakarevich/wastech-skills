# Screens: the mockup language

A `journey` section shows a screen mockup that changes with each step. Screens are defined in the
top-level `screens` array as a small tree of **blocks**: no HTML, no coordinates. The mockup is a
low-to-mid fidelity sketch in a neutral light style: it shows what is on the screen, where roughly,
and what this task adds. It is not a design. If a design exists (Figma, a design system), say so in
the section `intro` and link it.

## A screen

```json
{ "id": "empty", "label": "Empty", "url": "shop.example/checkout",
  "title": "Checkout", "aside": "Step 3 of 3",
  "columns": [ [ …blocks… ], [ …blocks… ] ] }
```

- `id` (required): lowercase letters, digits, and hyphens; referenced by journey steps and rules, and used as the snapshot's file name (`visual/screens/<id>.png`).
- `label`: the state tab under the mockup.
- `url`: shown in the browser bar.
- `title`, `aside`: the screen's own heading and its right-hand note.
- `columns`: one or two arrays of blocks. Two columns give a main column and a narrower side column. On a phone frame, columns stack.

## States: base + patch

Most states differ from one screen in a few blocks. Define the screen once, then each state as a
patch of it:

```json
{ "id": "typing", "label": "Typing", "base": "empty",
  "patch": { "promo": { "value": "AUTUMN10", "actionState": "" } } },
{ "id": "applied", "label": "Applied", "base": "empty",
  "patch": { "promo-box": { "blocks": [ { "type": "chip", "tone": "ok", "text": "AUTUMN10 · −10%", "action": "Remove" } ] },
             "pay": { "text": "Pay €44.91" } } }
```

- `base`: another screen id; bases can chain (`checking` → `typing` → `empty`).
- `patch`: keys are block `id`s anywhere in the tree. The value is merged into that block (its fields replace the base's); `null` removes the block. The build warns when a key matches no block.
- A state may also override `label`, `url`, `title`, `aside`, or the whole `columns`.

Give an `id` to every block a state will change. Keep one base per real screen.

## Blocks

Every block has `type`, and may have `id` (for patches) and `mark`.

| type | Fields | Draws |
| --- | --- | --- |
| `box` | `title`, `blocks` | A bordered group: a card, a panel, a form section. |
| `row` | `blocks` | Blocks side by side (buttons, chips). |
| `heading` | `text`, `aside` | A bold line with an optional right-hand note. |
| `text` | `text`, `tone`: `muted` \| `ok` \| `err` \| `warn` | A line of copy. |
| `message` | `text`, `tone`: `info` \| `ok` \| `err` \| `warn` | A tinted banner: alerts, confirmations. |
| `rows` | `items`: `[[label, value], …]` | Label / value list: line items, properties. |
| `field` | `label`, `value`, `placeholder`, `state`: `""` \| `error` \| `ok` \| `disabled`, `action`, `actionState`: `""` \| `disabled` \| `loading`, `loadingText`, `hint`, `hintTone`: `err` \| `ok` | An input, optionally with an inline button and a hint under it. |
| `chip` | `text`, `action`, `tone`: `ok` \| `info` | A pill, e.g. an applied filter or code, with an optional action. |
| `summary` | `lines`: `[{label, value, tone}]`, `total`: `{label, value}` | Totals: subtotal, discount, amount due. |
| `button` | `text`, `variant`: `primary` \| `secondary` \| `link`, `state`: `""` \| `disabled` \| `loading` \| `focus`, `block`: `false` for inline | A button, full width by default. |
| `tabs` | `items`, `active` (index) | A tab bar. |
| `table` | `columns`, `rows` | A small data table. |
| `image` | `label`, `height` | A placeholder for a picture, chart, or map. |
| `divider` | — | A horizontal rule. |

## Marks: what the task changes on the screen

`"mark": "new" | "changed" | "removed"` on a block draws a dashed ring and a label ("NEW",
"CHANGED", "REMOVED") around it. The viewer can hide the marks with a toggle.

- Mark the **outermost** block that the task adds or changes (the whole promo `box`, not each field inside).
- Leave untouched blocks unmarked: they are context.
- Marks belong in the base screen; states inherit them.

## Content

- Use the real copy and plausible real data from the spec: the product names, the prices, the error texts that `requirements.md` or the code define. Never lorem ipsum.
- Error and empty states are screens too. Every error message a `rules` check can produce deserves a state, so its "On screen" button can show it.
- About 4–10 blocks per screen. A mockup that needs more is two screens, or the wrong section.
