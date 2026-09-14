---
title: CLI reference
description: vyasac (compiler) and vyasav (viewer runtime) command-line interfaces.
sidebar:
  order: 1
---

# CLI reference

Two binaries ship from the `vyasa` workspace:

| Binary | Role |
| :--- | :--- |
| **`vyasac`** | Compile, pack, check, and publish workspaces |
| **`vyasav`** | Inspect packed `.vyview` files and weave URNs with the viewer runtime |

Build them with `cargo build -p vyasac --release` and `cargo build -p vyasav --release` (vyasav’s `cli` feature is on by default). The WASM library used by web apps is a separate `wasm-pack` artifact; native `cargo test` does not refresh it.

Publisher walkthrough: [Packing and publishing](/guides/publishing).

## `vyasac`

```text
vyasac <COMMAND>
```

### `vyasac pack [PATH]`

Pack the workspace into `PATH/build/<id>.<ext>` (`PATH` defaults to `.`).

| Flag | Default | Meaning |
| :--- | :--- | :--- |
| `--profile <NAME>` | `default` | `[build.<NAME>]` in `vyasac.toml` |
| `--strict` | off | Fail on verification warnings (including bloat hard-gates) |

Filename is `<workspace.id or name>.<ext>`, or `<id>-<profile>.<ext>` when the profile is not `default`. Extension follows `[build.<profile>] target`:

| `target` | File | Typical use |
| :--- | :--- | :--- |
| `view` (default) | `.vyview` | Reader apps |
| `sqlite` | `.sqlite` | Tooling database |
| `zip` | `.zip` | Source-exchange archive |
| `vyir` | `.vyir` | Intermediate representation |

### `vyasac check [PATH]`

Load the workspace and validate source without writing a package. `--strict` fails on warnings.

### `vyasac publish [PATH]`

Copy `build/<id>.vyview` into `[publish] publisher_dir` and update that publisher’s `catalog.json`. Requires `publisher.toml`.

### `vyasac build [PATH]`

Compile to files under `--output` (default `build/`) for template debugging. Reader apps do not load this tree.

| Flag | Meaning |
| :--- | :--- |
| `-o, --output <DIR>` | Output directory |
| `--target <json\|html\|…>` | File format |
| `--template <NAME>` | HTML shell / template name |
| `--collection <NAME>` | Collection (e.g. `toc`) |
| `--view <NAME>` | Shorthand for template + collection |
| `--projection <NAME>` | Projection profile (`html`, `voice`, …) |
| `--strict` | Fail on warnings |

### `vyasac parse <FILE>`

Parse one `.vy` file and print the AST (debug).

## `vyasav`

```text
vyasav <COMMAND>
```

Native-only (not compiled into the WASM library). JSON is the default when stdout is not a TTY.

### `vyasav inspect <PATH>`

Inspect a packed `.vyview` without `sqlite3`.

```bash
vyasav inspect dist/pub.vyview
vyasav inspect --table html_templates dist/pub.vyview
vyasav inspect --table html_blocks --urn 1:1 dist/pub.vyview
vyasav inspect --table manifest dist/pub.vyview
vyasav inspect --check dist/pub.vyview
vyasav inspect --analyze dist/pub.vyview
```

| Flag | Meaning |
| :--- | :--- |
| `--table <NAME>` | Dump one table (`html_templates`, `html_blocks`, `streams`, `manifest`, …) |
| `--urn <REL>` | Filter block/graph rows to a relative URN (e.g. `1:1`) |
| `--format json\|text` | Override TTY detection |
| `--limit <N>` | Row cap; omit for per-table defaults; `0` = all rows |
| `--check` | Logical checks: streams, layout `{{ body }}`, truncated CSS, leading newlines in packed HTML |
| `--analyze` | `dbstat` table-size analysis |

With no `--table` / `--urn`, prints a summary (tables, views, next commands).

### `vyasav weave <PATH>`

Weave one URN with the same runtime the browser uses. Prints **`vyasa.weave_diagnostics.v1` JSON** (counts and events), not the HTML.

```bash
vyasav weave --urn 1:1 --view reading dist/pub.vyview
vyasav weave --urn 1:1 --layout '{"rows":[[{"block":"mula"}]]}' dist/pub.vyview
```

| Flag | Meaning |
| :--- | :--- |
| `--urn <REL>` | Relative or full URN (**leaf** address that has a block) |
| `--view <NAME>` | Packed view name (default `reading`) |
| `--layout <JSON>` | Layout spec for `weave_layout`; overrides `--view` |

`--layout` `block` values are **packed stream names** (folder ids), not the Toml key `primary`. See [Streams and the URN spine](/guides/streams).
