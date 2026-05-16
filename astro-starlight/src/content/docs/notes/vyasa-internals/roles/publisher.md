---
title: Publisher Guide
description: Documentation for packaging and distributing Vyasa content.
---

# Publisher Guide

As a **Publisher**, your primary role is to compile, package, and distribute Vyasa workspaces to end-users or centralized repositories. You manage the final artifact generation and ensure that your workspace adheres to the global URN ecosystem.

## 1. Preparing the Workspace

Before packaging your content, ensure your `vyasac.toml` has a properly defined `name` field in the `[workspace]` section.

```toml
[workspace]
name = "vedabase-bg"
description = "Bhagavad-gita As It Is"
```

> [!IMPORTANT]
> The `name` is critical. It acts as the global identity for your Work. When you generate a package, Vyasa will automatically use this name to create the filename (e.g., `vedabase-bg.vypkg`). Using generic names like "workspace" will cause collisions in central registries.

## 2. Packaging the Content

Vyasa provides the `vyasa pack` command to compile the entire workspace into a standard distribution format defined in RFC 006.

### The Source Exchange Format (`.vypkg`)

The `.vypkg` file is a ZIP archive containing your compiled AST nodes as JSON files. This format is ideal for tooling, intermediate storage, and incremental compilers.

To generate a `.vypkg`:
```bash
vyasa pack
```
This will automatically output a file named after your workspace, such as `vedabase-bg.vypkg`.

### The Application Database (`.db`)

The `.db` format is a monolithic SQLite database optimized for direct consumption by reading apps (like mobile applications or web readers) that require random-access queries.

To generate an Application Database:
```bash
vyasa pack --target sqlite
```
This will automatically output a file named after your workspace, such as `vedabase-bg.db`.

## 3. Advanced Usage

If you need to override the default naming convention (for example, when experimenting or creating multiple variations), you can manually specify the output path:

```bash
vyasa pack --output my-custom-build.vypkg
```

> [!NOTE]
> Future releases of Vyasa will support stream-level packaging (e.g., packing only the English translation `translation/en` stream). The dynamic naming architecture lays the foundation for outputting target-specific packages like `vedabase-bg-en.vypkg`.
