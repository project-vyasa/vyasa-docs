---
title: Template Guide
description: Learn how to create custom templates for Vyasa workspaces.
---

Vyasa uses the **Tera** templating engine (which uses Jinja2-like syntax) to render your compiled content into HTML. This guide explains the structure of the data passed to your template and how to iterate through it.

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## Data Structure

When your template is rendered, it receives a `primary` object containing the `body` of your document. The `body` is a list of **Nodes**.

Each **Node** is a dictionary (object) that will have exactly **one** of the following keys:

1.  `Command`: A structured command (e.g., `ref`, `wj`, `set`).
2.  `Text`: A plain text segment.
3.  `SegmentBreak`: A logical break (like a paragraph or section break derived from the source).

### 1. Command Node
A `Command` node represents a command parsed from your `.vy` file.

```json
{
  "Command": {
    "cmd": "ref",           // The command name (e.g., "ref", "wj")
    "argument": "1",        // The optional argument (e.g., [1])
    "attributes": {         // Key-value pairs from attributes
      "title": "John 14" 
    },
    "children": [ ... ]     // List of child Nodes (recursive)
  }
}
```

### 2. Text Node
A `Text` node contains the raw text content.

```json
{
  "Text": {
    "value": "Hello world"  // The actual text content
  }
}
```

**Important**: You must access `.value` to get the string. Printing `node.Text` directly will print the object representation.

### 3. SegmentBreak Node
A `SegmentBreak` represents a structural break.

```json
{
  "SegmentBreak": {}
}
```

## Basic Template Pattern

The most robust way to render a recursive tree of nodes is to define a **Macro**.

### Example: `default.html`

```html
<!DOCTYPE html>
<html>
<body>
    
    <!-- 1. Define the macro -->
    {% macro render_nodes(nodes) %}
        {% for node in nodes %}
        
            <!-- Check which type of node it is -->
            {% if node.Command %}
            
                <!-- Handle specific commands specially -->
                {% if node.Command.cmd == "ref" %}
                    <br><span class="ref">[{{ node.Command.argument }}]</span>
                    
                {% elif node.Command.cmd == "section" %}
                    <h2>{{ node.Command.attributes.title }}</h2>
                    
                {% else %}
                    <!-- Default rendering for other commands -->
                    <span class="cmd-{{ node.Command.cmd }}">
                        <!-- Render children recursively -->
                        {% if node.Command.children %}
                            {{ self::render_nodes(nodes=node.Command.children) }}
                        {% endif %}
                    </span>
                {% endif %}
                
            {% elif node.Text %}
                <!-- Render text value -->
                {{ node.Text.value }}
                
            {% elif node.SegmentBreak %}
                <!-- Render break -->
                <hr class="segment" />
                
            {% endif %}
            
        {% endfor %}
    {% endmacro %}

    <!-- 2. Call the macro with the root body -->
    <div class="content">
        {{ self::render_nodes(nodes=primary.body) }}
    </div>

</body>
</html>
```

## Common Patterns

### Handling Titles (`set` command)
The `set` command with argument `file` usually contains metadata like the title.

```html
{% if node.Command.cmd == "set" and node.Command.argument == "file" %}
    <h1>{{ node.Command.attributes.title }}</h1>
{% endif %}
```

### Formatting Text (`wj`, `it`, etc.)
You can map commands to CSS classes easily:

```html
<span class="cmd-{{ node.Command.cmd }}">
    {{ self::render_nodes(nodes=node.Command.children) }}
</span>
```

Then in your CSS:

```css
.cmd-it { font-style: italic; }
```

## Best Practices

### Defensive Templating
Data in Vyasa streams can be flexible. A command might not always have the attributes you expect. Use the `default` filter to prevent runtime errors if a key is missing.

**Unsafe:**
```html
<h1>{{ node.Command.attributes.title }}</h1>
```

**Safe:**
```html
<h1>{{ node.Command.attributes.title | default(value="Untitled") }}</h1>
```

This ensures your template renders even if `title` is missing from the source content.

