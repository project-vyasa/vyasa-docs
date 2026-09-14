---
title: User Guide
description: Complete guide to using Vyasa for scriptural texts.
sidebar:
  order: 2
---

# Vyasa User Guide

Vyasa is a high-performance semantic markup language designed for scriptural texts. This guide covers the syntax and features supported by the Vyasa parser.

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## Project Structure

A work is a **workspace**: one `vyasac.toml`, language context, content streams, and HTML templates. Translations, commentary, and other layers are **streams** (sibling folders), not sidecars.

**Typical layout:**
```text
my_work/
├── vyasac.toml              # Workspace + streams + pack profile
├── context.vy               # URN scheme, aliases, entities
├── content/
│   ├── mula/                # Spine text ([streams.primary] → packed name `mula`)
│   │   ├── context.vy       # Optional folder context (e.g. chapter=1)
│   │   └── 1.vy
│   └── translation/         # Another stream, aligned by relative path
│       └── 1.vy
├── annotations/             # Graph overlays (annotate / note); not HTML streams
│   └── overlay.vy
└── templates/
    └── html/
        ├── views/           # Packed viewer layouts (e.g. reading.vy)
        └── theme.css        # Listed in [build.default] css
```

-   **`vyasac.toml`**: Hard build config — stream folders, URN spine, CSS lists, pack profile. See the [workspace configuration reference](/reference/workspace-config).
-   **`context.vy`**: Language preamble (commands, aliases, entities). Nested `context.vy` files add folder context.
-   **`content/<folder>/`**: One stream per folder. The packed stream id is that folder name (or `stream.name` if you set it).
-   **`templates/html/`**: Native templates and view layouts. Put styles in `.css` files, not inline in `theme.vy`.
-   **`annotations/`**: Optional graph overlays; see [Annotations](/guides/annotations).

How streams relate to URNs, packed names, and the optional build allow-list: [Streams and the URN spine](/guides/streams). How to pack, inspect, and publish: [Packing and publishing](/guides/publishing).

## CLI usage

Install the toolchain from this repo (`cargo install --path vyasac` and `cargo install --path vyasav`, or run `cargo run -p …`). Full flags: [CLI reference](/reference/cli).

### Pack for the viewer
```bash
vyasac pack
```
Writes `build/<workspace-id>.vyview` (SQLite). The default pack target is `view`. Use `[workspace] id` for a stable filename; otherwise the packer falls back to `name`.

### Check source without packing
```bash
vyasac check
```

### Inspect a packed publication
Packed `.vyview` files are inspected with the **viewer** CLI, not `sqlite3`:
```bash
vyasav inspect build/my-work.vyview
vyasav inspect --table manifest build/my-work.vyview
vyasav inspect --check build/my-work.vyview
```

### Publish into a catalog
```bash
vyasac publish
```
Copies the packed `.vyview` into `[publish] publisher_dir` and updates that publisher’s `catalog.json`. Requires `publisher.toml` in the publisher directory.

### Compile files (debug)
```bash
vyasac build [PROJECT_ROOT] --view <VIEW_NAME>
```
Writes JSON/HTML under `build/` for debugging templates. Reader apps consume **`.vyview` from `pack`**, not this tree.

---

## Core Concepts

-   **Streams (language):** Documents are ordered streams of events (commands and text).
-   **Streams (workspace):** Sibling content folders that share URNs; see [Streams and the URN spine](/guides/streams).
-   **Context**: Global metadata (like `Work`, `Translation`) defined in configuration.
-   **State**: Dynamic properties (like `Speaker`, `Scene`) that change as the stream flows.
-   **Entities**: Semantic objects (people, places, concepts) referenced in the stream.
-   **References**: Structural pointers (like `JHN.3.16`) used for alignment.
-   **Paratext**: Content surrounding the main text. Divided into **Frontmatter** (prologues, prefaces) and **Backmatter** (epilogues, indices). Because Vyasa's URNs are string-based, these do not require special compiler logic or code changes to `vyasac`. A prologue seamlessly integrates into the tree as `urn:vyasa:{corpus}:frontmatter:prologue:1` simply by placing it in a folder like `content/frontmatter/prologue.vy` or setting context variables.

## Architectural Guarantees & Constraints

To ensure Vyasa remains performant, robust, and mathematically sound, the system enforces the following guarantees and constraints on all publishers and workflows:

1. **Publication Bloat Optimization:** The final SQLite/Zip publication size is a critical success factor to ensure lightweight viewer downloads. The compiler aggressively optimizes storage by shifting left error checking while minimizing duplication of content.
2. **Forward and Backward Compatibility:** `VyasaViewer` guarantees backward compatibility with older publications, while also remaining robustly forward-compatible against future grammar changes.
3. **Unified Runtime:** To prevent divergence between compiler logic and the UI, any semantic graph sorting or structural querying needed by the viewer is provided via a WASM runtime compiled from the exact same Rust source as `vyasac`.
4. **Numeric Relative Paths:** The Unique Resource Name (URN) separates the `global-prefix` (Corpus/Publication identifier) from the `relative-path` (e.g., `chapter:verse`). For structural integrity, the components of a `relative-path` must use machine-friendly, strongly-typed numeric values (especially for `layout="sequence"`) to allow for mathematical reasoning and sorting. The AST strictly references only the relative path.

## Segments and Interstitial Blocks

Vyasa supports "segments" inside markers (e.g., verses). The compiler reserves the lower 4 bits (16 possible values) of the Sequence ID for sub-segment addressing.

By default, a structural node gets segment `0`. Sub-segments increment from `1`.

### Pre and Post Segments (Interstitial Blocks)
Vyasa reserves segment values for interstitial blocks (content that appears *between* numbered markers, such as chapter introductions or verse summaries).

- **`pre` (Segment 15)**: Assigned to blocks appearing *before* the first numbered marker.
- **`post` (Segment 14)**: Assigned to blocks appearing *after* the main marker content, before the next marker.

You can configure these labels in `vyasac.toml`:
```toml
pre_segment_label = "uvacha"
post_segment_label = "purport"
```

## Unified Command Syntax

Vyasa uses a **Unified Command** structure. Every functional element is a command that can optionally take arguments, attributes, a custom delimiter, and a content body.

**General Syntax**:
```text
`cmd [arg] ;DELIM {k=v ...} [ ... ]
```

### Components
1.  **Backtick**: `` ` `` starts a command.
2.  **Command**: The name of the command (e.g., `set`, `r`, `wj`).
3.  **Argument** *(Optional)*: A value separated by space (e.g., `file` in `set file`).
4.  **Delimiter** *(Optional)*: `;` followed by an ID. Used for safe blocks.
5.  **Attributes** *(Optional)*: Key-value map in `{...}`.
6.  **Body** *(Optional)*: Content wrapped in `[...]`.

---

## Command Reference

For a complete list of **Standard Library** commands and detailed usage, see the **[Command Reference](/reference/commands)**.

### Quick Summary

| Command | Description | Example |
| :--- | :--- | :--- |
| **`marker`** | Defines URN/ID | `` `marker 1.1 `` |
| **`state`** | Sets context state | `` `state { speaker="Sanjaya" } `` |
| **`set`** | Updates config | `` `set context { ... } `` |
| **`set settings`** | Workspace config | `` `set settings { whitespace="preserve", break_after="।॥" } `` |
| **`entity`** | Semantic tagging | `` `entity Krishna `` |
| **`annotate`** | Graph overlay on URNs | `` `annotate "1:1" { rishi=vamadeva } `` |

## Sample Document

```text
`set file{id=BG chapter=1}

` Marker for Verse 1
`marker 1 
`textstream[
  `d[धर्मक्षेत्रे | कुरुक्षेत्रे]
  `i[dharmakṣētrē | kurukṣētrē]
  `e[On the field of Dharma | on the field of the Kurus]
]

` Overlapping red letter example
`wj;RED[
  `marker 2 ...
  `marker 3 ...
]RED
```
