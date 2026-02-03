---
title: Command Reference
description: Comprehensive reference for all built-in Vyasa commands and syntax.
---

This reference documents the **Standard Library** of commands available in the Vyasa compiler.
These are defined in the embedded `stdlib.vy`.

## Core Commands

### `marker` (Alias: `m`)
Defines a URN-addressable segment and sets the active context ID.

**Syntax**: `` `marker <number|dots> ``

**Description**:
The `marker` command establishes the unique identity (URN) of the content that follows. Arguments are appended to the active URN scheme defined in the project's `context.vy`. Subsequent content nodes automatically inherit this identity.

**Examples**:
```vyasa
`marker 1     --> Verse 1 (inherits ID)
`m 3.16       --> Chapter 3, Verse 16 (using alias 'm')
```

### `ref` (Alias: `r`, `cite`)
References or cites another text segment.

**Syntax**: `` `ref "target" ``

**Description**:
Used to create a citation or cross-reference to another segment (marker). This does *not* set the ID of the current block, but rather points to an existing one.

**Example**:
```vyasa
As stated in `ref "John 3:16" ...
```

### `state`
Updates the contextual state (e.g., speaker, scene) for subsequent nodes.

**Syntax**: `` `state { key="value" ... } ``

**Description**:
State properties are propagated to all subsequent nodes until changed or cleared. This allows you to tag large sections of text without repeating attributes on every node.

**Examples**:
```vyasa
`state { speaker="Sanjaya" }
`reference 1.1 ... (Inherits speaker="Sanjaya")
`state { speaker="" }  <-- Clears the state
```

### `set`
Updates environment configuration (settings, context, aliases, entities).

**Syntax**: `` `set <target> { key="value" ... } ``
**Shorthand**: `` `set { key="value" ... } `` (Equivalent to `set context { ... }`)

**Targets**:
- `settings`: Workspace-wide configuration (e.g., `whitespace`).
- `context`: Flow variables (e.g., `work`, `urn_scheme`, `chapter`).
- `entities`: Registers semantic entities.

**Examples**:
```vyasa
`set settings { whitespace = "preserve" }  <- Opt-out of whitespace stripping
`set context { work="Bible" urn_scheme="urn:bible:{book}:{chapter}:{id}" }
`set { chapter=1 }
```

### `entity`
Defines or references a semantic entity.

**Syntax**: `` `entity <Name> { type="...", speaker="...", urn="..." } ``

**Description**:
Creates a specific Entity Node. If defined in the registry, it inherits those attributes. Useful for inline semantic tagging and indexing.

**Registy Example**:
```vyasa
`set entities {
  Krishna = { type="Deity" role="Avatar" }
}
```

**Usage**:
```vyasa
`entity Krishna     <-- Inherits type="Deity"
```

## Structure Commands

### `verse` (Alias: `v`)
A structural container for verse content, optionally defining its identity.

**Syntax**:
- Standard: `` `verse <id> [ content... ] ``
- Anonymous: `` `verse [ content... ] ``

**Description**:
The `verse` command delimits a block as a verse.
- If an `id` is provided (e.g., `v 1 [...]`), it acts like a `marker`, appending the ID to the active URN and setting the context.
- If no `id` is provided, it inherits identification from the most recent `marker` command.

**Example**:
```vyasa
`v 1 [ In the beginning... ]
```

### `textstream`
Explicitly marks a block of text as content.

**Syntax**: `` `textstream [ content... ] ``

**Description**:
Useful when content starts with special characters that might be confused for commands, or to group multiple lines.

### `interlinear-streams`
Defines a repeating pattern of commands for text blocks.

**Syntax**: `` `interlinear-streams { id="pattern_name" pattern="cmd1, cmd2..." } ``

**Description**:
Allows implicit tagging of lines within a block matching the pattern ID.

**Example**:
```vyasa
`interlinear-streams { id="verse" pattern="d, i, e" }

`verse[
  Line 1   --> `d[Line 1]
  Line 2   --> `i[Line 2]
  Line 3   --> `e[Line 3]
]
```

## Formatting Commands

Vyasa supports explicit commands for text formatting.

| Command | Alias | HTML Mapping | Syntax |
| :--- | :--- | :--- | :--- |
| **Emphasis (Bold)** | `e1` | `<strong>` | `` `e1[text] `` |
| **Emphasis (Italic)** | `e2` | `<em>` | `` `e2[text] `` |
| **Line Break** | `br` | `<br />` | `` `br `` |

## Meta Commands

### `command-def`
Defines a new custom command.

**Syntax**: `` `command-def <name> { category="cat" ... } ``

**Description**:
Allows extending the language vocabulary within a document or project.

**Example**:
```vyasa
`command-def uvacha { category="verb" }
`uvacha [ Said... ]
```

### `alias-def`
Defines a shortcut for an existing command with preset attributes.

**Syntax**: `` `alias-def { name="alias" target="cmd" params="k=v" } ``

**Example**:
```vyasa
`alias-def { name="speaking" target="state" params="action=speaking" }
`speaking  <-- Equivalent to `state { action="speaking" }`
```

## Syntax Elements

### Comments
- **Line Comment**: `` ` `` followed by space.
- **Block Comment**: `` `[ ... ] ``

### Segments (`|`)
Used for hard alignment anchors within a text node.

```vyasa
`d[Word A | Word B]
```

### Delimited Blocks
Used for overlapping scopes or nesting.

**Syntax**: `` `cmd;DELIM [ ... ]DELIM ``

### Entity-Action Pattern
A convention for defining Subject-Verb relationships naturally, designed for semantic graph mapping.

**Pattern**: `Subject` `Action` `[ Content ]`

1.  **Subject (Entity)**: A command representing the actor (e.g., `` `Krishna ``).
2.  **Action (Verb)**: A command representing the event (e.g., `` `uvacha `` meaning "said").
3.  **Content**: The block following the action.

**Compiler Semantics**:
When an Action command immediately follows an Entity command, the Entity is treated as the **Subject** of that Action.

**Example**:
```vyasa
`Krishna `uvacha { to="Arjuna" } [
  `v 1 [ ... ]
]
```
*Graph Translation*: `(Krishna)-[SAID {to: Arjuna}]->(Verse 1)`
