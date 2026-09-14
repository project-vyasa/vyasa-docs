---
title: Publisher Guide
description: Documentation for packaging and distributing Vyasa content.
---

# Publisher Guide

As a **Publisher**, you compile workspaces into `.vyview` files, style them with CSS, and merge them into a catalog the viewer can load.

The step-by-step workflow is in [Packing and publishing](/guides/publishing). Configuration tables: [Workspace configuration](/reference/workspace-config). Commands: [CLI reference](/reference/cli).

## 1. Identity

Set a stable `[workspace] id`. Pack writes `build/<id>.vyview`. Publish copies that file into `[publish] publisher_dir` and updates `catalog.json`. Generic names like `workspace` collide in catalogs.

```toml
[workspace]
id = "vedabase-bg"
name = "Bhagavad-gita As It Is"
```

## 2. Pack

```bash
vyasac pack
```

Default target is `view` → `.vyview` (SQLite for the reader). This is the artifact apps load. Other `[build.default] target` values (`zip`, `sqlite`, `vyir`) are for tooling, not the hosted viewer.

## 3. Inspect

```bash
vyasav inspect build/vedabase-bg.vyview
vyasav inspect --check build/vedabase-bg.vyview
```

## 4. Publish

```toml
[publish]
publisher_dir = "../.."
```

```bash
vyasac publish
```

Requires `publisher.toml` in that directory (`identifier`, `content_themes`, optional `[org]`). Catalog fields: [Packing and publishing](/guides/publishing).
