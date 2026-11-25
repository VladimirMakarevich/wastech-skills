<!-- A visual overview built with the mermaid-visualize skill. It is DERIVED from the sources listed below:
     to change a diagram, edit diagrams/*.mmd and re-render. Never hand-edit the SVG or PNG files.
     Delete the "⌂ index" line when this visual is not inside a spec folder.
     {{DIAGRAMS_PATH}} is the diagrams folder's path from the repository root, e.g. docs/tasks/042-promo-codes/diagrams. -->

# Visual — {{TITLE}}

[⌂ index](index.md)

> {{ONE_SENTENCE}}

- **Sources:** {{SOURCES}}
- **Updated:** {{DATE}}
- **Re-render** (from the repository root): `node <mermaid-visualize skill folder>/scripts/render.mjs {{DIAGRAMS_PATH}}`

## How to read

![Legend](diagrams/legend.svg)

<!-- Two lines: the reading order, and what the highlighting means for THIS visual. For example:
     "Start with the big picture; each section below opens one part of it.
     Green is what this task adds, amber what it changes, grey what stays as it is." -->

## 1. Big picture

![Big picture](diagrams/00-big-picture.svg)

<sub>[PNG](diagrams/00-big-picture.png) · [source](diagrams/00-big-picture.mmd)</sub>

**What to notice**

<!-- Two to four bullets: what the reader would miss on their own. Not a caption of every box. -->

- …

<details>
<summary>Details</summary>

| Element | What it is / does | Source | Status |
| --- | --- | --- | --- |
| | | <!-- FR-ID, doc.md#section, or path:line --> | <!-- new / changed / removed / existing --> |

</details>

## 2. {{VIEW_NAME}} — {{VIEW_QUESTION}}

<!-- Repeat this section once per diagram, in file-number order (01-…, 02-…). The heading names the
     view and the question it answers: "User flow — what the customer does at checkout".
     A zoom-in (L2) section starts with one line: "Zooms into: <element of the parent view>". -->

![{{VIEW_NAME}}](diagrams/01-{{VIEW_FILE}}.svg)

<sub>[PNG](diagrams/01-{{VIEW_FILE}}.png) · [source](diagrams/01-{{VIEW_FILE}}.mmd)</sub>

**What to notice**

- …

<details>
<summary>Details</summary>

| Element | What it is / does | Source | Status |
| --- | --- | --- | --- |
| | | | |

</details>

## Glossary

<!-- Optional: the terms a non-technical reader meets on the diagrams. Delete the section if there are none. -->

| Term | Meaning |
| --- | --- |
| | |

## Change log

<!-- One line per meaningful update: date — what changed and why (e.g. "design.md revised: sequence updated"). -->

- {{DATE}} — created: {{VIEWS}}.
