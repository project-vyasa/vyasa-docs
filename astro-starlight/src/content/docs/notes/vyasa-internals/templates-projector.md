---
title: Templates & Projector Logic
description: Internals of the semantic-to-HTML expansion engine.
---

# Templates & Projector

The **Projector** (`src/projector.rs`) is the engine responsible for bridging the gap between Semantic Vyasa commands and the output (usually HTML).

## Core Concept
Instead of hardcoding HTML generation in Rust (e.g. `write!(w, "<h1>{}</h1>", title)`), the compiler uses **Templates** defined in Vyasa itself (`stdlib.vy` or `context.vy`).

### The Expansion Loop
1.  **Input**: Semantic Node (e.g. `` `heading { The Title } ``).
2.  **Lookup**: The Projector checks `env.templates` for a matching `heading` template.
3.  **Expansion**: If found, it replaces the Semantic Node with the template's body, interpolating variables.
4.  **Recursion**: The output is processed again (allowing templates to use other templates).

## Template Definition
Templates are defined using the `template` command (usually sugar syntax in `.vy`):

```vy
`template { target="heading"
    `h2 { $.text }
}
```

## Interpolation Syntax

*   **`$.text`**: Replaced by the semantic command's children.
*   **`$.var`**: Replaced by the value of attribute `var` from the semantic command.
*   **`$.context.key`**: (Advanced) Access global context.

## Control Flow

The Projector supports basic logic:

### `if` Command
Conditionals based on attribute values.

```vy
`if { lhs="$.type" op="eq" rhs="warning"
    `div { class="alert warning" ... }
}
```

### `each` Command
Iterating over lists (collections).

```vy
`each { "work.chapters"
    `li {
        `a { href="$.url" $.title }
    }
}
```

## View vs Collection Templates

*   **View Template**: Used to render a single source file. Defines the `body` command behavior.
*   **Collection Template**: Used to generate an index page (e.g. Table of Contents) by iterating over build stats (`work.items`).
