---
title: User Guide
description: Complete guide to using Vyasa for scriptural texts.
sidebar:
  order: 1
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

For a complete list of **Standard Library** commands and detailed usage, see the **[Command Reference](/reference/commands)**.

### Quick Summary

| Command | Description | Example |
| :--- | :--- | :--- |
| **`reference`** | Defines URN/ID | `` `reference 1.1 `` |
| **`state`** | Sets context state | `` `state { speaker="Sanjaya" } `` |
| **`set`** | Updates config | `` `set context { ... } `` |
| **`entity`** | Semantic tagging | `` `entity Krishna `` |

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
