---
title: Streams and the URN spine
description: Why [streams.primary] is a URN alias, packed stream ids are folder names, and the build allow-list uses those packed names.
sidebar:
  order: 4
---

# Streams and the URN spine

A workspace is several **streams** of the same work: a spine text, a padapāṭha, a translation, a commentary. They share relative URNs (`1:1`, `1:1:1`) so the viewer can weave them into one reading or a grid.

The word **`primary` is easy to overuse**. In current Vyasa it has **one** meaning in Toml.

## Two identities

| Identity | Where it appears | What it is |
| :--- | :--- | :--- |
| **URN spine alias** | `[streams.primary]` only | Which stream **owns** sequence ids (the catalog tree). Other streams may only attach blocks to those ids. |
| **Packed / runtime id** | Folder name, or `stream.name` | What the `.vyview`, viewer, CSS, and grid layout actually store. |

```toml
[streams.primary]
path = "content/samhita"   # packed id is samhita, not "primary"
```

Examples:

- Ṛgveda: folder `samhita` → packed id `samhita`
- Aṣṭādhyāyī: folder `sutra` → packed id `sutra`
- Bhagavad-gītā fixture: folder `mula` → packed id `mula`
- A work with `path = "content/primary"` → packed id **is** `primary` (the folder)

Do not set `stream.name = "primary"` to “mark the spine”. That writes the alias into the database and breaks grid CSS and `layout.rows[].block`.

## What uses which name

**Spine alias (`primary`) — pack time only**

- `[streams.primary]` in `vyasac.toml`
- View templates: `` `stream { ref="primary" } ``
- Localization: `extend = "primary"`

The packer **rewrites** those refs to the packed folder name before they reach the `.vyview`.

**Packed folder name — everything after pack**

- `streams.name` rows, `manifest.primary_stream`, `streams_config`, `stream_separators`
- Grid JSON: `layout.rows[].block`
- CSS classes: `.vyasa-block-{stream}`
- `[build.default] streams` allow-list

The viewer must not map `primary` → `samhita` in TypeScript. If a live `.vyview` still has `streams.name = "primary"`, it was packed with an old sidecar `stream.name`; rebuild with current `vyasac`.

## The build-profile allow-list

`[build.<profile>] streams` is an optional **packed-name** filter. Omit it unless this profile should **exclude** some folders.

```toml
# Ṛgveda: only needed if you are leaving streams out of this pack
[build.default]
streams = ["samhita", "padapatha", "sayana"]
```

Pack **errors** (nothing is silently dropped) when the list contains:

- the alias `primary` while the packed folder is not named `primary`
- any other `[streams]` **table key** that is not also the packed name
- an unknown id

You cannot list both `primary` and `samhita` as two spellings of the same stream.

## Layout and CSS

In a view template you may still write the spine alias:

```text
`stream { ref="primary" }
```

In grid layout JSON and in stylesheets, use the packed id:

```json
{ "rows": [[{ "block": "samhita" }]] }
```

```css
.vyasa-block-samhita { /* spine column */ }
```

A class scrape that looks for `class="primary"` will not find `class="samhita"`.

## Segment separators

Optional per-stream string inserted between `SegmentBreak` (`|`) splits when weaving that stream:

```toml
[streams.primary]
path = "content/mula"
segment_separator = " "
```

The packed publication stores this under the **packed** stream name.

## Why this split exists

Pack order must not imply a spine: a translation folder must not become the catalog tree because it was listed first. `[streams.primary]` is that authority. Runtime surfaces need a stable, filesystem-visible id so publishers can write CSS and grid specs without a secret alias. Collapsing both into the word `primary` made Ṛgveda packs look like a stream named `primary` while every layout expected `samhita`.
