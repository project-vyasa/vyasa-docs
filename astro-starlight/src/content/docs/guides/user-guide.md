---
title: User Guide
description: Complete guide to using Vyasa for scriptural texts.
---

# Vyasa User Guide

Vyasa is a high-performance semantic markup language designed for scriptural texts. This guide covers the syntax and features supported by the Vyasa parser.

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## Project Structure

A Vyasa Project requires a specific directory structure to ensure correct building and URN generation.

**Required Layout:**
```text
my_project/
├── vyasac.toml       # Project Root Configuration (Required)
├── content/         # Source .vy files
│   ├── vol1/
│   │   ├── vyasa.toml (Context: volume=1)
│   │   └── book1.vy
├── config/          # Project-wide metadata (Metadata rules etc.)
└── sidecar/         # Audio/Translation files
```

-   **`vyasac.toml` (Root)**: Marks the directory as a project. Contains build configuration (Streams, Templates).
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
| **State** | `state` | Updates the contextual state (speaker, scene, etc.) for subsequent nodes. | `` `state { speaker="Sanjaya" } `` |
| **Set** | `set` | Updates environment configuration (context, aliases, entities). | `` `set context { work="Bible" } `` |
| **Entity** | `entity` | Defines or references a semantic entity. Used for inline tagging. | `` `entity Krishna `` |
| **Interlinear Streams** | `interlinear-streams` | Defines a repeating pattern of commands for text blocks. | `` `interlinear-streams { id="gita" pattern="d, i, e" } `` |
| **Custom Command** | `command-def` | Defines a new command with specific attributes. | `` `command-def arjuna { category="entity" } `` |
| **Text Stream** | `textstream` | Explicitly marks a block of text as content (useful if starting with special chars). | `` `textstream[ ... ] `` |
| **Verse** | `verse` | A structural container for verse content. Inherits ID/URN from the active reference. | `` `verse[ ... ] `` |

> **Note**: Short names (like `r` for `reference`) are standard built-ins. You can define custom aliases using `def-alias` in your `context.vy`.

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

#### Identification (Fully Qualified Names)
The `reference` command (and its aliases like `r` or `ref`) is responsible for establishing the unique identity (URN) of the content that follows.

*   Arguments to `reference` (e.g., `1.1`) are appended to the active URN scheme defined in the project configuration.
*   **Inheritance**: Subsequent content nodes (like `verse` blocks or plain text) automatically inherit this active URN as their fully qualified ID. The `verse` command itself does not generate an ID; it adopts the ID set by the most recent `reference`.

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

```text
`set entities {
  Krishna = { type="Deity" role="Avatar" }
  Arjuna = { type="Person" role="Warrior" }
  Kuruksetra = { type="Place" coords="29.9,76.8" }
}
```

### 2. Setting State
Use the `state` command to update the **Flow State**. This state is propagated to all subsequent content nodes until changed.

**Example: Setting Speaker**
```text
`state { speaker="Sanjaya" }
`reference 1.1 ... (Attributes: speaker="Sanjaya")
`reference 1.2 ... (Attributes: speaker="Sanjaya")

`state { speaker="" }  <-- Clears the speaker state
```

### 3. Modeling Actions (Verbs)
You are not limited to nouns like "Speaker". You can model events by generic state keys.

```text
`state { actor="Sanjaya" action="speaking" }
`reference 1.1 ... (Attributes: actor="Sanjaya", action="speaking")
```

### 4. Inline Entities
When you provide an argument (the entity name), it creates a specific Entity Node. It inherits attributes from the Registry but **does not** change the global state.

**Benefits**:
*   **Semantic Tagging**: Explicitly marks a word/phrase as referring to a specific entity, even if using pronouns or epithets.
*   **Indexing**: Allows compilers to generate an index of where entities appear.
*   **Rich UI**: Enables features like hover-cards (showing the entity's description/role from the registry) or hyperlinks.

```text
`entity Krishna     <-- Inherits type="Deity" from registry
`entity Arjuna { mood="Despondent" } <-- Inherits registry + overrides mood
```

### 5. Command Templates (Macros)
You can create custom commands that act as templates by combining **Aliases** and the **Entity Registry**.

**Setup (`context.vy`):**
```text
`def-alias { name="speaking" target="state" }

`set entities {
  speaking = { action="speaking" }
}
```

**Usage:**
Using the alias as a command automatically merges its registry attributes into the node.

```text
`speaking
`reference 1.1 "This verse has action=speaking"
```

---

## Advanced Features

### Custom Commands (`command-def`)
You can define your own domain vocabulary within any document using `command-def`. This is useful for project-specific terms that aren't available in the core language.

**Syntax**:
```text
`command-def name { category="cat" ... }
```

**Example**:
```text
`command-def arjuna { category="entity" }
`command-def uvacha { category="verb" }

`arjuna `uvacha [ O Krishna... ]
```

### Interlinear Streams
For documents with repeating structures (like interlinear texts), you can define a pattern to implicitly tag lines.

**Syntax**:
```text
`interlinear-streams {
  id = "pattern_name"
  pattern = "cmd1, cmd2, cmd3"
}
```

**Usage**:
Use the pattern ID as a command. The lines inside will be automatically assigned to the commands defined in the pattern, cycling through them.

**Example**:
```text
`interlinear-streams{ id="verse" pattern="d, i, e" }

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
