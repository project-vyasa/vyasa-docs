---
title: Native Templates Guide
description: Learn how to create custom templates using Vyasa's native template system.
sidebar:
  order: 900
---

# Native Templates

Vyasa uses a **Native Template System** (RFC-011) that allows you to define how commands are rendered directly within your `.vy` files.

Unlike external template engines (like Jinja2 or Handlebars), Vyasa templates are written in **Vyasa syntax**. This ensures your templates are part of the compilation graph and can use standard language features.

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## 1. Directory Structure

Vyasa organizes templates by **Target Format** using a convention-based directory structure:

```text
workspace/
├── templates/
│   ├── html/          <-- Target: "html"
│   │   ├── default.html   <-- Default Shell
│   │   ├── main.vy        <-- Template definitions
│   │   └── reference.html <-- Optional shell (usage: --template reference)
│   └── json/          <-- Target: "json"
```

## 2. Defining a Template

When you place a `.vy` file inside a target folder (e.g., `templates/html/`), you can use **Implicit Syntax**.

### Implicit Syntax (Recommended)

File: `templates/html/main.vy`
```text
// Defines a template for `verse` in the "html" target
`verse {
    `div { class="verse-box" } [
        `span { class="ref" } [ $.argument ]
        `p { class="content" } [ $.text ]
    ]
}
```

### Explicit Syntax

You can also explicitly define the target, which is useful for single-file examples or overrides outside the `templates/` folder.

```text
`template `verse `for "html" {
    ...
}
```

### Structural Commands

Templates are composed of commands that map to the target format. For HTML, the `SimpleHtmlBackend` supports:
*   **Block**: `div`, `span`, `p`, `blockquote`
*   **Text**: `em`, `strong`, `b`, `i`
*   **List**: `ul`, `ol`, `li`
*   **Link**: `a`
*   **Heading**: `h1`, `h2`, `h3`, `title`
*   **Breaks**: `br`

## 3. Substitution Variables

Inside the template body, you can use special variables starting with `$.` to inject content from the source node.

| Variable | Description |
| :--- | :--- |
| `$.text` | The full content (children) of the source node. |
| `$.argument` | The argument of the command (e.g., the "1.1" in `` `verse 1.1 ``). |
| `$.attribute` | Any attribute value from the source node (e.g., `$.class`, `$.id`). |

### Example: Attribute Injection

Given source:
```text
`quote { author="Gandhi" } [ Be the change. ]
```

Template:
```text
`template `quote `for "html" {
    `blockquote [
        $.text
        `footer [ — $.author ]
    ]
}
```

Output (HTML equivalent):
```html
<blockquote>
    Be the change.
    <footer>— Gandhi</footer>
</blockquote>
```


## 4. Pass-Through Templates

Sometimes you want a command to be purely semantic (for the graph) but render transparently (flattened) in the output.

Use `$.text` alone to unwrap the node.

```text
// Remove the `uvacha` wrapper but keep its content
`uvacha {
    $.text
}
```

## 5. CSS Classes

Since templates use Vyasa syntax, you add CSS classes using standard attribute syntax:

```text
`div { class="my-class" style="color: red;" } [ ... ]
```

## 6. Context Interaction

Templates can access global entity definitions if they are passed as attributes.

If your context defines:
```text
`set entities {
    krishna = { label="Lord Krishna" }
}
```

And you have a command representing Krishna:
```text
`krishna {
    `span { class="speaker" } [ Lord Krishna ]
}
```
*(Note: Direct entity lookup in templates `entities[name]` is planned but currently templates rely on static definitions or attribute passing.)*

## 7. Handling Streams (Composition)

A common pattern in Vyasa is **Streams**—where a block contains a sequence of different data types (like Devanagari, IAST, and English lines).

**Approach: Composition, not Extraction.**

Instead of trying to "address" or "split" the segments inside the parent template, you should:
1.  Ensure the content is structured into commands (e.g., using `stream-def` to implicitly tag lines as `d`, `i`, `e`).
2.  Define simple templates for those child commands.
3.  Use `$.text` in the parent to render them all in order.

**Example:**

Source (`stream-def` applied):
```text
`verse 1.1 [
    `d [ धर्मक्षेत्रे कुरुक्षेत्रे... ]
    `i [ dharma-kshetre... ]
]
```

Parent Template:
```text
`verse {
    `div { class="verse-card" } [
        $.text  // Renders `d` then `i`
    ]
}
```

Child Templates:
```text
`d {
    `div { class="devanagari" } [ $.text ]
}

`i {
    `div { class="translation" } [ $.text ]
}
```

This composable approach keeps templates simple and modular.
