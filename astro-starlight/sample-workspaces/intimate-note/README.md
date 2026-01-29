# Intimate Note Sample

This sample workspace demonstrates how Vyasa handles **loosely structured, whitespace-sensitive content** such as poetry, personal letters, and transcripts.

It mimics the style of "Intimate Notes to the Sincere Seeker" (Knowledge Sheets), where the layout, line breaks, and flow are integral to the meaning.

## Key Features

### 1. Global Whitespace Preservation
Unlike standard Markdown or HTML which collapse whitespace, this workspace preserves **all line breaks and spaces** by default.
-   **Implementation**: The template applies `white-space: pre-wrap` to the main content container.
-   **Benefit**: You don't need special commands for poetry or lists. Just type as you want it to appear.

### 2. Semantic Commands
The workspace defines specific commands in `context.vy` to handle structural elements common in these notes:

| Command | Usage | Description |
| :--- | :--- | :--- |
| `knowledge-sheet` | `{ number="107" title="..." ... }` | Metadata for the sheet (Number, Title, Date, Location). Renders as a formatted header. |
| `speaker` | `` `speaker[Name] says: `` | Semantic tagging for dialogue in transcripts. Renders as **Bold**. |
| `extras` | `` `extras[...] `` | A section for "News Flashes" or metadata at the bottom. Renders with italic styling and a separator. |
| `lines` | `` `lines[...] `` | (Optional) Semantic grouping for stanzas. Mainly useful if specific block styling is needed. |

### 3. Text Alignment
Simple formatting commands allow for visual control:
-   `` `center[...] ``: Centers the text (e.g., separators `* * *`).
-   `` `right[...] ``: Right-aligns text (e.g., Signatures).

### 4. Typography
-   **Font**: Uses **Noto Serif** (from Google Fonts) to match the printed book aesthetic.
-   **Layout**: Carefully tuned margins and line-height (1.4) for readability.

## Content Structure
-   **`context.vy`**: Defines the custom commands.
-   **`content/*.vy`**: The knowledge sheets.
-   **`templates/default.html`**: The Jinja2 template that implements the rendering logic and CSS.
