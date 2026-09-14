---
title: Workspace configuration
description: vyasac.toml and publisher.toml fields used when packing a publication.
sidebar:
  order: 2
---

# Workspace configuration

Hard build config lives in **`vyasac.toml`**. Language (commands, aliases, entities) lives in **`context.vy`**. Shared catalog metadata lives in **`publisher.toml`**. Unknown keys in `vyasac.toml` tables that use `deny_unknown_fields` are pack/load errors.

Walkthrough: [Packing and publishing](/guides/publishing). Stream identity: [Streams and the URN spine](/guides/streams).

## `vyasac.toml`

### `[workspace]`

| Field | Role |
| :--- | :--- |
| `id` | Stable publication id (pack filename, catalog id). Prefer this over `name` for files. |
| `name` | Display title; used as filename fallback if `id` is omitted |
| `title` | Optional catalog title |
| `description` | Optional |
| `version` | Optional |
| `authors` | Optional list |

### `[urn]`

| Field | Role |
| :--- | :--- |
| `scheme` | URN template, e.g. `urn:vyasa:bg:{chapter}:{verse}` |
| `publisher` / `corpus` | Used when `scheme` / `prefix` are omitted |
| `prefix` | Alternate scheme builder with `hierarchy` |
| `hierarchy` | Relative-path levels (`["chapter", "verse"]`) |
| `path_schema` | Optional |
| `bit_layout` | Optional bit widths for packed sequence ids |

Legacy: top-level `urn_scheme` string still works if `[urn]` is absent.

### `[streams.<key>]`

Each table is one content stream. **`<key>` is not the packed id** except when it happens to match the folder (or `name`).

| Field | Required | Role |
| :--- | :--- | :--- |
| `path` | yes | Folder of `.vy` files, e.g. `content/mula` |
| `name` | no | Override packed id. Do **not** set this to `primary` to mark the spine. |
| `segment_separator` | no | Inserted between `SegmentBreak` splits when weaving this stream |

**`[streams.primary]` is required.** That key is the URN-spine alias. Packed id = last component of `path` (or `name`).

Other keys (`[streams.padapatha]`, `[streams.sayana]`, …) are ordinary streams. Choose keys that match packed names when you can, so humans do not confuse table keys with runtime ids.

### `[build.<profile>]`

Profile name `default` is what `vyasac pack` uses unless `--profile` is set. `target` defaults to `view`.

| Field | Role |
| :--- | :--- |
| `streams` | Optional **packed-name** allow-list. Omit unless excluding folders. Do not list the alias `primary` unless the folder is named `primary`. Unknown ids fail pack. |
| `target` | `view` (default), `zip`, `sqlite`, `vyir` |
| `layout` | Structural layout (`sequence`, …) |
| `publication` | Optional publication label |
| `enable_markdown` | Optional |
| `css` | CSS files relative to the **workspace root**. Missing file → pack error. No `..`. |
| `publisher_css` | CSS files relative to `[publish] publisher_dir`. Packed **before** `css`. Requires `publisher_dir`. |
| `content_themes` | Optional override of publisher theme slugs. Non-empty; each slug must exist as `html.theme-{slug}` in packed CSS. |

### `[publish]`

| Field | Role |
| :--- | :--- |
| `publisher_dir` | Directory containing `publisher.toml` (and shared CSS for `publisher_css`) |

### `[catalog]`

Optional metadata copied onto each `catalog.json` publication (`type`, `language`, `license`). `id`, `title`, `vyviewUrl`, and `updated` are always written; see [Packing and publishing](/guides/publishing#catalogjson-contract).

### `[dependencies]`

Named table of other packed works to merge at pack time:

```toml
[dependencies.bg]
package = "vedabase-bg"
```

`package` is the sibling directory name. vyasac ATTACHes that `.vyview` and copies streams as `dependency.<key>.<stream>` plus their HTML blocks. It does **not** replace this work’s spine content or merge graphs. Details: [Dependencies and localization](/guides/dependencies).

## `publisher.toml`

Resolved from `[publish] publisher_dir/publisher.toml`, or `publisher.toml` in the workspace root if that file exists.

```toml
[publisher]
identifier = "vysamples"
title = "Vyasa Samples"
description = "…"
homepage = "https://…"
content_themes = ["light", "dark"]   # required for view pack; [0] = default

[org]
id = "vysamples"
title = "Vyasa Samples"
homepage = "https://…"
```

| Field | Role |
| :--- | :--- |
| `[publisher] identifier` | Catalog / publisher id used by `vyasac publish` |
| `[publisher] content_themes` | Advertised paper/ink slugs inherited by every work |
| `[org]` | Optional org block copied into `catalog.json` |

`content_themes` slugs must match `[a-z0-9]+(?:-[a-z0-9]+)*` and appear in concatenated CSS as `html.theme-{slug}` (comments do not count). An empty array is a pack error. If both publisher and `[build.*] content_themes` are omitted, pack fails until a list is declared.

## Packed manifest keys (selected)

Written by `vyasac pack` for the viewer; inspect with `vyasav inspect --table manifest`.

| Key | Meaning |
| :--- | :--- |
| `primary_stream` | Packed spine id (folder), not the word `primary` unless that is the folder |
| `content_themes` | JSON array of theme slugs |
| `css_files` / `publisher_css_files` | Sheets that were packed |
| `streams_config` | Packed-name stream metadata |
| `stream_separators` | Per packed-name segment separators |
