# Feature Matrix

This matrix tracks the coverage of Vyasa language features across the available sample workspaces.

| Feature Category | Feature | Syntax / Command | `minimal` | `bible` | `intimate-note` | `bhagavad-gita` |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Structure** | Command Definition | `` `command-def `` | ❌ | ✅ | ✅ | ✅ |
| | Alias Definition | `` `alias-def `` | ❌ | ✅ | ❌ | ✅ |
| | Context Settings | `` `set context `` | ❌ | ❌ | ❌ | ✅ |
| | Entity Registry | `` `set entities `` | ❌ | ❌ | ❌ | ✅ |
| **Content** | Text Stream | *text* | ✅ | ✅ | ✅ | ✅ |
| | Command Arguments | `` `cmd "arg" `` | ✅ | ✅ | ✅ | ✅ |
| | Attributes | `{ key="val" }` | ❌ | ❌ | ✅ | ✅ |
| | Segments | `|` | ❌ | ❌ | ❌ | ✅ |
| **Templating** | Native Templates | `` `template `` | ❌ | ✅ | ✅ | ✅ |
| | Variable Sub. | `$.text`, `$.arg` | ❌ | ✅ | ✅ | ✅ |
| | HTML Tags | `` `div { ... } `` | ❌ | ✅ | ✅ | ✅ |
| **Events/State** | Inline Entity | `` `entity `` | ❌ | ❌ | ❌ | ✅ |
| | Event Header | `` `( ... ) `` | ❌ | ❌ | ❌ | ❌ |
| **Formatting** | Preserve Whitespace | `whitespace="preserve"` | ❌ | ❌ | ✅ | ✅ |
| | Line Break | `` `break `` | ❌ | ✅ | ✅ | ❌ |

## Legend
- ✅ : Implemented
- ❌ : Not used

## Sample Overviews

### minimal
A bare-bones example relying on default behavior. Shows basic text and standard commands.

### bible
Demonstrates flow-oriented content.
- Uses `alias-def` for `v` -> `verse`.
- Uses simple Templates for formatting (`wj` - Words of Jesus).

### intimate-note
Demonstrates unstructured/semi-structured note-taking.
- Heavily uses `whitespace="preserve"`.
- Uses styling templates (`center`, `right`).

### bhagavad-gita
The most complex sample, demonstrating structured data and state.
- **State Management**: Uses `set entities` and `entity` commands to track speakers.
- **Context**: Sets URN schemes.
- **Complex Templates**: Renders multi-part verses (Sanskrit, Translation, Purport).
- **Segments**: Uses `|` to separate fields in structured data rows.
