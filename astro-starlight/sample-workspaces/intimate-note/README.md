# Intimate Note Sample

This sample workspace demonstrates how Vyasa handles **loosely structured content** where **formatting and whitespace** are critically important, such as:

*   Poetry
*   Personal letters
*   Knowledge sheets
*   Lists

## Key Features

1.  **Whitespace Preservation**: Uses a tailored `preformatted` command in `context.vy` and CSS `white-space: pre-wrap` to respect line breaks exactly as authored.
2.  **Flexible Metadata**: Uses a custom `knowledge-sheet` command to capture domain-specific metadata (Sheet Number, Location, Date) while keeping the body purely textual.
3.  **Minimal Command Usage**: The content files are almost entirely plain text, minimizing distraction for the author.
