---
title: Text Extraction & Whitespace
description: Internals of text handling in Vyasac.
---

# Text Extraction

Handling text in a markup compiler is deceptively complex. Vyasac isolates this logic in `src/utils.rs` via the `extract_text` function.

## The Problem

When extracting "text" from a node tree, we might want:
1.  **Plain Text**: For titles, metadata, or search indexing.
2.  **HTML Fragment**: For embedding in attributes or specific output contexts.

Additionally, concepts like `SegmentBreak` (newline) need different representations in each mode.

## Implementation: `utils::extract_text`

The signature is:

```rust
pub fn extract_text(nodes: &[Node], mode: &ExtractMode) -> String
```

### ExtractMode

```rust
pub enum ExtractMode {
    Plain, // Breaks become ' ', tags are stripped
    Html,  // Breaks become '<br />', tags are preserved?? (Actually assumes content)
}
```

*   **Plain Mode**: `SegmentBreak` converts to a space ` `. This ensures that a multi-line title in source:
    ```vy
    `title {
        The
        Bhagavad Gita
    }
    ```
    becomes `"The Bhagavad Gita"` and not `"TheBhagavad Gita"`.

*   **Html Mode**: `SegmentBreak` converts to `<br />`.

## Whitespace Stripping

By default, the compiler strips "insignificant" whitespace (whitespace-only text nodes that contain newlines) to keep the AST clean. Exceptions:

1.  **Inline Whitespace**: "Hello World" (space preserved).
2.  **Preserve Mode**: Commands defined with `whitespace="preserve"` (e.g., `code`, `pre`) opt-out of stripping.

This logic resides in `src/pipeline.rs` (`strip_whitespace`).
