---
title: User Guide
description: Complete guide to using Vyasa for scriptural texts.
---

# Vyasa User Guide

Vyasa is a high-performance markup language designed for scriptural texts. This guide covers the syntax and features supported by the Vyasa parser.

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## Project Structure

A Vyasa Project requires a specific directory structure to ensure correct building and URN generation.

**Required Layout:**
```text
my_project/
├── vyasa.toml       # Project Root Configuration (Required)
├── content/         # Source .vy files
│   ├── vol1/
│   │   ├── vyasa.toml (Context: volume=1)
│   │   └── book1.vy
├── config/          # Project-wide metadata (Metadata rules etc.)
└── sidecar/         # Audio/Translation files
```

-   **`vyasa.toml` (Root)**: Marks the directory as a project. Contains global metadata (Work Name, Version).
-   **`content/`**: Contains the hierarchy of Vyasa source files.
-   **`vyasa.toml` (Subdirectories)**: Defines context for that folder (e.g., `volume=1`), which is inherited by files inside.
-   **`sidecar/`**: Reserved for sidecar files (alignment/audio).

## CLI Usage

### Build Project
To compile the project into JSON:
```bash
vyasa build [PROJECT_ROOT] --output <OUTPUT_DIR>
```
If `PROJECT_ROOT` is omitted, it defaults to the current directory. The command will fail if `vyasa.toml` or `content/` is missing.

---

## Core Concepts

-   **Streams**: Documents are ordered streams of events (commands and text).
-   **Context**: Global metadata (like `Work`, `Translation`) defined in configuration.
-   **State**: Dynamic properties (like `Speaker`, `Scene`) that change as the stream flows.
-   **Entities**: Semantic objects (people, places, concepts) referenced in the stream.
-   **References**: Structural pointers (like `JHN.3.16`) used for alignment.

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

The following built-in commands are supported by the compiler:

| Command | Canonical Name | Description | Example |
| :--- | :--- | :--- | :--- |
| **Reference** | `reference` | Defines a URN-addressable segment and sets the context ID. | `` `reference 1.1 In the beginning... `` |
| **Set** | `set` | Updates environment configuration (context, aliases, entities). | `` `set context { work="Bible" } `` |
| **Entity** | `entity` | Defines or references a semantic entity. Used for state tracking (speaker) or inline tagging. | `` `entity Krishna `` |
| **Stream Definition** | `stream-def` | Defines a repeating pattern of commands for text blocks. | `` `stream-def { id="gita" pattern="d, i, e" } `` |
| **Text Stream** | `textstream` | Explicitly marks a block of text as content (useful if starting with special chars). | `` `textstream[ ... ] `` |

> **Note**: Short names (like `ref`) are typically enabled via **Aliases** in your `context.vy`. The compiler sees the canonical name.

## Syntax Reference

### 1. State Directives (`set` command)
Control the environment state.

**Syntax**: `` `set <arg> {key=value ...} ``

**Example**:
```text
`set file{id=BG chapter=1 symbols={d=deva i=iast}}
```

### 2. References (`reference` command)
Mark the start of a structural unit.

**Syntax**: `` `reference <number/dots> ``

**Examples**:
```text
`reference 1      --> Verse 1 (inherits Book/Chapter)
`reference 3.16   --> Chapter 3, Verse 16
```

### 3. Styled Blocks & Overlapping Scopes
Groups text under a specific tag/command.

**Standard Syntax**: `` `cmd [ ... ] ``
**Safe Block Syntax** (for overlapping/nesting): `` `cmd;DELIM [ ... ]DELIM ``

**Examples**:

*Standard Block*:
```text
`textstream[
  `d[Content]
]
```

*Overlapping Block (Red Letter)*:
```text
`wj;RED[
  `reference 16 For God so loved...
  `reference 17 ...
]RED
```

### 4. Inline Commands
Short-form commands for formatting or semantic tagging.

**Syntax**: `` `tag{attributes}[content] ``

**Examples**:
```text
`d[Sanskrit Text]
`p{id=god}[God]
```

### 5. Segments (`|`)
The pipe `|` character acts as a hard anchor for alignment.

**Example**:
```text
`d[Word A | Word B]
`e[Trans A | Trans B]
```

### 6. Comments
- **Line Comment**: `` ` `` followed by space.
- **Block Comment**: `` `[ `` (Backtick + `[` + whitespace).

**Example**:
```text
` This is a line comment
`[
  This whole block is ignored
]
```

## Entities and State
 
In Vyasa, **Entities** are semantic anchors. They can be used to set the active **State** or to tag specific segments.

### Definition
An Entity is any named concept—a Person, Deity, Place, Time Period, or Abstract Idea.

### 1. Entity Registry (`context.vy`)
You can define entities centrally to keep your content clean.

```vyasa
`set entities {
  Krishna = { type="Deity" role="Avatar" }
  Arjuna = { type="Person" role="Warrior" }
  Kuruksetra = { type="Place" coords="29.9,76.8" }
}
```

### 2. Setting State
When you use `entity` without arguments or as a standalone command settings attributes, it updates the **Flow State**. This state is propagated to all subsequent content nodes until changed.

**Example: Setting Speaker**
```vyasa
`entity { speaker="Sanjaya" }
`reference 1.1 ... (Attributes: speaker="Sanjaya")
`reference 1.2 ... (Attributes: speaker="Sanjaya")

`entity { speaker="" }  <-- Clears the speaker state
```

### 3. Modeling Actions (Verbs)
You are not limited to nouns like "Speaker". You can model events by generic state keys.

```vyasa
`entity { actor="Sanjaya" action="speaking" }
`reference 1.1 ... (Attributes: actor="Sanjaya", action="speaking")
```

### 4. Inline Entities
When you provide an argument (the entity name), it creates a specific Entity Node. It inherits attributes from the Registry but **does not** change the global state.

```vyasa
`entity Krishna     <-- Inherits type="Deity" from registry
`entity Krishna     <-- Inherits type="Deity" from registry
`entity Arjuna { mood="Despondent" } <-- Inherits registry + overrides mood
```

### 5. Command Templates (Macros)
You can create custom commands that act as templates by combining **Aliases** and the **Entity Registry**.

**Setup (`context.vy`):**
```vyasa
`set aliases {
  Krishna = "entity"
  speaking = "entity"
}

`set entities {
  Krishna = { actor="Krishna" type="Deity" }
  speaking = { action="speaking" }
}
```

**Usage:**
Using the alias as a command automatically merges its registry attributes into the node.

```vyasa
`Krishna `speaking
`reference 1.1 "This verse has actor=Krishna and action=speaking"
```

---

## Advanced Features

### Text Stream Patterns
For documents with repeating structures (like interlinear texts), you can define a pattern to implicitly tag lines.

**Syntax**:
```text
`stream-def {
  id = "pattern_name"
  pattern = [ "cmd1", "cmd2", "cmd3" ]
}
```

**Usage**:
Use the pattern ID as a command. The lines inside will be automatically assigned to the commands defined in the pattern, cycling through them.

**Example**:
```text
`stream-def{ id="verse"; pattern=[d, i, e] }

`verse[
  धृतराष्ट्र उवाच           
  dhṛtarāṣṭra uvāca       
  Dhṛtarāṣṭra said...     
]
```
*Equivalent to*:
```text
`d[धृतराष्ट्र उवाच]
`i[dhṛtarāṣṭra uvāca]
`e[Dhṛtarāṣṭra said...]
```

## Sample Document

```text
`set file{id=BG chapter=1}

` Reference to Verse 1
`reference 1 
`textstream[
  `d[धर्मक्षेत्रे | कुरुक्षेत्रे]
  `i[dharmakṣētrē | kurukṣētrē]
  `e[On the field of Dharma | on the field of the Kurus]
]

` Overlapping red letter example
`wj;RED[
  `reference 2 ...
  `reference 3 ...
]RED
```
