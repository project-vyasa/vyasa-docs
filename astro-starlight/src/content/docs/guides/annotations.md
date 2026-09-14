---
title: Annotations
description: How to attach graph metadata to URNs with annotate, note, and frame without editing the spine text.
sidebar:
  order: 5
---

# Annotations

Use a top-level **`annotations/`** directory (peer of `content/` and `templates/`) to attach metadata to relative URNs. Pack does **not** store those files as HTML streams. They become rows in `graph_nodes` / `graph_edges` that the viewer uses for Explore facets and named spans.

This is the **in-pack** model: the same workspace that owns the text also owns the graph. Who else may contribute overlays (an external SME, a second publication that overrides a URN) is **under review** and may need an RFC — see the toolchain note `notes/task-annotations-feature-review.md` in the `vyasa` repo. Do not treat RFC 019’s `annotate-range` examples as shipped syntax.

:::note
Vyasa is still in alpha and subject to change.
:::

## Workspace layout

```text
my_work/
├── vyasac.toml
├── context.vy          # command-def for annotate, note, frame
├── content/…
├── annotations/
│   ├── context.vy      # optional
│   └── overlay.vy
└── templates/…
```

Declare the commands in `context.vy` (they are not in the standard library):

```text
`command-def { name="annotate", category="metadata", flexible_args="true" }
`command-def { name="note", category="metadata", flexible_args="true" }
`command-def { name="frame", category="metadata", flexible_args="true" }
```

## `annotate`

Argument (or `target` / `urn` attribute) is a relative URN, a last-component range, or a comma list. Pack expands `"1:1..1:20"` to each leaf in that span (cap 10 000). Attributes other than `target` / `urn` / `id` become **value nodes** plus an edge typed as the **uppercase** key.

```text
`annotate "1:24:2" { rishi=vamadeva, devata=agni, chandas=gayatri }

`annotate "4:5:0:0" { featured=sri_rudram }
```

The viewer treats each key as a facet (`attr:featured`, `attr:rishi`, …). There is no hardcoded `featured` or Taittirīya vocabulary in the compiler.

Nested commands inside an annotate body inherit the expanded URN list (for example an event alias anchored to every verse in the range).

Use packed **relative** paths (`1:1`, `4:5:1:1`), not `urn:vyasa:…` prefixes, for local overlays.

## `note`

Editorial gloss (variant reading, damage). Packed as a `Note` node and `HAS_NOTE` edge. Optional fragment after `#` is stripped for sequence id encoding.

```text
`note "4:1:12#phrase-2" { type="variant" source="Ms-B" } [
    Alternative reading on folio 4b.
]
```

## `frame`

Groups nested annotate/note under a named context (`IN_FRAME` edges). Useful for a ritual day or a commentary campaign.

```text
`frame { id="yv-agnicayana-day-1" type="ritual-context" name="Agnicayana" } [
    `annotate "1:1..1:2" { role="invocation" } [ … ]
]
```

## What pack does not do

- `annotations/`, `enrichment/`, and `vocabulary/` are **not** content streams. They do not appear as `.vyasa-block-*` columns.
- Large graphs: `vyasac pack` warns when annotation edges exceed the viewer budget (see performance guards in the toolchain repo).
- A second publisher cannot yet attach an overlay `.vyview` with its own catalog id. `[dependencies]` merges extra **content** streams; it does not replace spine HTML. See [Dependencies and localization](/guides/dependencies).

## Related

- [Command reference](/reference/commands#annotate) — `annotate`, `note`, `frame`
- [Streams and the URN spine](/guides/streams) — relative URNs and packed names
- RFC notes 008 / 010 / 019 — design history; some proposed forms did not ship
