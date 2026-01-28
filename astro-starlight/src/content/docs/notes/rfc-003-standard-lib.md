---
title: "RFC-003: Standard Library & Configuration"
status: "Implemented"
created: "2026-01-26"
---
2026-01-26

## Objective
Decouple core command definitions from the compiler binary by introducing a **Standard Library** (`builtins.vy`) and a configuration mechanism. This allows:
1.  **Domain Adaptation**: Linguists can define `devanagari`, while programmers might define `code-block`.
2.  **Extensibility**: Users can inspect and extend the "syntactic sugar" without forking the compiler.
3.  **Lean Compiler**: The compiler focuses on parsing and AST generation, not maintaining a registry of all possible world concepts.

## Proposal

### 1. The `builtins.vy` File
We propose a standard file (embedded in the binary but overridable, or distributed with the CLI) that defines the default environment.

// builtins.vy

// Meta Commands
`command-def { name="comment" category="meta" }
`command-def { name="set" category="meta" }
`command-def { name="alias-def" args="name,target" category="meta" }

// Formatting Commands
`command-def { name="emphasis" args="level" category="formatting" }
`command-def { name="heading" args="level" category="formatting" }
`command-def { name="break" args="type" category="formatting" }

// Aliases
`alias-def { name="h1" target="heading" params="level=1" }
`alias-def { name="br" target="break" params="type=line" }
`alias-def { name="e1" target="emphasis" params="level=1" }

### 2. Compiler Changes

#### a. Bootstrapping
On startup, `vyasac` will:
1.  Load an internal (embedded) string containing the minimal `base.vy` (core primitives).
2.  Look for a `builtins.vy` in the current workspace or a global config path.
3.  Merge these definitions into the `VyasaEnvironment`.

#### b. `command-def` Implementation
The `command-def` meta-command must be strictly implemented to populate the `CommandDefinition` map in `models.rs` dynamically.

### 3. Workspace Configuration
A workspace can define its own "prelude" or imports.

```toml
# vyasac.toml
[dependencies]
std = "0.1.0"
linguistics-pkg = "path/to/lib"
```

`command-def { name="bhashya" args="author" }
```

The compiler doesn't need to know what a "sutra" is; it just validates arguments based on this definition.

## Unified Context Configuration
Instead of introducing new configuration files (like `prelude.vy`), we utilize the existing **`context.vy`** mechanism.
-   **Root `context.vy`**: Placed at the workspace root, it acts as the global "prelude", defining commands and aliases available to the entire project.
-   **Leaf `context.vy`**: Placed in subdirectories, it defines local environment adjustments.

This approach keeps the configuration surface area small: `vyasac.toml` handles build settings, while `context.vy` handles semantic definitions.


## Implementation Details

### Embedded Standard Library
The `builtins.vy` file will be **embedded directly into the `vyasac` binary** (using Rust's `include_str!`). This ensures zero-configuration usage for standard commands. Users do not need to download or configure external files to get basic functionality.

### Versioning
The standard library version will be tied to the compiler version. `vyasac v0.1.0` will always include `std v0.1.0`.

## Migration Plan
1.  Create `src/builtins.vy` with current core commands.
2.  Modify `VyasaEnvironment::default()` to:
    -   Parse the embedded `builtins.vy`.
    -   Populate `command_definitions` from it.
3.  Refactor `models.rs` to remove hardcoded vectors.
