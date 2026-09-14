---
title: Packing and publishing
description: How to pack a workspace to .vyview, style it, inspect it, and publish it to a catalog.
sidebar:
  order: 3
---

# Packing and publishing

This is the publisher workflow: declare streams, pack a `.vyview`, check it, then copy it into a catalog. Syntax for `.vy` files is in the [User Guide](/guides/user-guide). Stream identity (URN spine vs packed folder names) is explained in [Streams and the URN spine](/guides/streams).

:::note
Vyasa is still in alpha and subject to change.
:::

## 1. Declare the work

Minimum `vyasac.toml`:

```toml
[workspace]
id = "vedabase-bg"
name = "Bhagavad Gita"

[streams.primary]
path = "content/mula"

[urn]
scheme = "urn:vyasa:bg:{chapter}:{verse}"
hierarchy = ["chapter", "verse"]

[build.default]
css = ["templates/html/theme.css"]
```

`[streams.primary]` is required. It names the **URN spine** (which stream owns sequence ids). The packed stream id is the folder (`mula` here), not the word `primary`.

Do **not** add `[build.default] streams = [...]` unless you need to **exclude** some folders from this pack. When you do list streams, use packed names (`mula`), never the alias `primary` unless that folder is actually named `primary`. Unknown names are pack errors.

## 2. Pack

From the workspace root:

```bash
vyasac pack
# optional:
vyasac pack --profile default --strict
```

Output: `build/<id>.vyview` (or `build/<id>-<profile>.vyview` when `--profile` is not `default`).

`[build.<profile>] target` defaults to `view` (the reader database). Other targets (`zip`, `sqlite`, `vyir`) exist for tooling; apps load `.vyview`.

`--strict` turns pack warnings (including bloat hard-gates) into errors.

## 3. Styles and content themes

Presentation for the HTML target is **CSS files**, concatenated at pack time. List paths in the build profile:

| Field | Relative to | Use |
| :--- | :--- | :--- |
| `css` | workspace root | This work’s sheets |
| `publisher_css` | `[publish] publisher_dir` | Shared publisher sheets (packed first so workspace CSS can override) |

Do not walk `..` in `css`; shared files belong in `publisher_css`. A missing listed file is a pack error. Prefer a stub `theme.vy` (`layout [ {{ body }} ]`) or omit it; the packer supplies a default HTML shell and inlines the concatenated CSS.

**Content themes** are the slugs the viewer cycles (`html.theme-{slug}` on the iframe). Declare them once on the publisher:

```toml
# publisher.toml
[publisher]
identifier = "vysamples"
content_themes = ["light", "dark"]   # first entry is the default
```

Every work inherits that list. Override per pack only when this work’s CSS is a subset:

```toml
[build.default]
content_themes = ["light", "dark"]
```

Each listed slug must appear as `html.theme-{slug}` in the packed CSS. The packer does not invent `light` / `dark` / `parchment`. An omitted list (publisher and work) is a pack error.

## 4. Inspect the `.vyview`

Use **`vyasav`**, the viewer-runtime CLI:

```bash
vyasav inspect build/vedabase-bg.vyview
vyasav inspect --table html_templates build/vedabase-bg.vyview
vyasav inspect --table html_blocks --urn 1:1 build/vedabase-bg.vyview
vyasav inspect --table manifest build/vedabase-bg.vyview
vyasav inspect --check build/vedabase-bg.vyview
vyasav inspect --analyze build/vedabase-bg.vyview
```

`--check` validates packed streams, layout `{{ body }}`, truncated CSS, and leading newlines in HTML. `--analyze` prints SQLite table sizes.

To weave one URN with the same runtime the browser uses and print diagnostics JSON:

```bash
vyasav weave --urn 1:1 --view reading build/vedabase-bg.vyview
```

Use a **leaf** relative URN (the address that has a block), not a container. Flags: [CLI reference](/reference/cli).

## 5. Publish to a catalog

```toml
[publish]
publisher_dir = "../.."   # directory that contains publisher.toml
```

```bash
vyasac pack
vyasac publish
```

Publish copies `build/<id>.vyview` into the publisher `dist/` tree and merges the work into `catalog.json`. The viewer catalog then points at that file.

### `catalog.json` contract

`vyasac publish` writes (or updates) `[publish] publisher_dir/dist/catalog.json`. Schema version is **`catalog:1.1.0`**. Catalog `id` / `title` come from `publisher.toml` (`identifier`, `title`). Each publication entry:

| Field | Source |
| :--- | :--- |
| `id` | `[workspace] id` (else `name`) |
| `title` | `[workspace] title` (else `id`) |
| `vyviewUrl` | `<id>/<id>.vyview` relative to `dist/` |
| `updated` | Unix seconds at publish time (**required**; rewritten every publish) |
| `description` | `[workspace] description` |
| `type` / `language` / `license` | `[catalog]` in `vyasac.toml` |

Root-level `description` / `homepage` / `publisher` (`[org]`) come from `publisher.toml`. Missing `build/<id>.vyview` logs a warning and still updates the catalog row.

## Related

- [Workspace configuration](/reference/workspace-config) — every `vyasac.toml` / `publisher.toml` field
- [Native templates](/guides/template-guide) — view layouts and `stream { ref="primary" }`
- [Annotations](/guides/annotations) — graph overlays in the same pack
- [Dependencies and localization](/guides/dependencies)
- [Embedding viewers](/guides/embedding-viewer) — URN links in host apps
