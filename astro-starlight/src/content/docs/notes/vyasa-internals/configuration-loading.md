---
title: Configuration Loading
description: How configuration, settings, and definitions are loaded.
---

# Configuration Loading

Vyasac uses a layered configuration system to allow global defaults to be overridden by local folder settings.

## Loading Order (Precedence)

When compiling a file, the environment is built in this order (last one wins):

1.  **Workspace Root `vyasac.toml`**: Global settings (e.g. Project Title, default structure).
2.  **Workspace Root `context.vy`**: Global definitions (Entities, Templates, Custom Commands).
3.  **Local `vyasac.toml`**: Folder-specific settings.
4.  **Local `context.vy`**: Folder-specific definitions.
5.  **In-File Definitions**: `command-def` or `set` commands at the top of the file.

## Logic: `config.rs`

The `apply_definitions` function maps configuration nodes to the `VyasaEnvironment`. It handles:

*   **`command-def`**: Registers new commands (metadata, validation rules).
*   **`alias-def`**: Creates shortcuts (e.g. `p` -> `paragraph`).
*   **`set entities`**: Populates the Entity Registry.
*   **`set settings`**: Updates compiler flags (e.g. `whitespace="preserve"`).

## Structural vs Metadata

*   **Flow Commands**: If a command is defined with `category="flow"` (e.g. `chapter`), encountering it updates the **Context Stack** (e.g. `chapter.id=1`).
*   **URN Generation**: If `urn="true"`, the command gets a unique ID generated from the active context and scheme.
