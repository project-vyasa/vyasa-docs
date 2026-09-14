---
title: Dependencies and localization
description: How localization extend merges labels inside a pack, and what [dependencies] actually merges from another .vyview.
sidebar:
  order: 6
---

# Dependencies and localization

Two pack-time composition tools exist today. Neither is a general “included publication overrides this URN’s text” feature. That composition model is part of the annotations feature review (`notes/task-annotations-feature-review.md` in the `vyasa` toolchain repo).

## Localization extend (same workspace)

Each stream may ship `localization.vy` (or `context.vy`) with vocabulary maps. A derived stream can **inherit** another stream’s labels and override keys:

```text
`localization { extend = "primary" }
`structure [
    "verse" = "śloka"
]
```

`extend = "primary"` is the URN-spine alias. Pack rewrites it to the packed folder name (e.g. `mula`) before it is stored. Child keys win; missing keys are copied from the base stream into the child’s `vocabulary` rows.

This overlays **UI labels** (structure words, entity display names), not `html_blocks`.

## `[dependencies]` (another packed work)

```toml
[dependencies.bg]
package = "vedabase-bg"
```

At pack time vyasac looks for a sibling `.vyview` / `.sqlite` (typical paths: `../<package>/build/<package>.vyview`, then a few `dist/` fallbacks). It **ATTACH**es that database and copies:

- streams, renamed to `dependency.<key>.<original-stream-name>`
- `html_blocks` for those new stream ids (`INSERT`; conflicts ignored)
- `block_attributes` (`INSERT OR IGNORE`)

The dependency does **not** replace the current work’s spine blobs. It does **not** merge `graph_edges`. Catalog tree still comes only from `[streams.primary]` of **this** pack.

If the file cannot be found, pack errors. Build the dependency first.

## Related

- [Workspace configuration](/reference/workspace-config)
- [Annotations](/guides/annotations)
- [Streams and the URN spine](/guides/streams)
