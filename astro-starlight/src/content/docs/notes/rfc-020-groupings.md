# RFC-018: Groupings and HTML Template Headers/Footers

## Goal
To offload semantic UI structuring (like group headers and footers) from the `vyasac.toml` build configuration and place them directly into the View HTML templates (`.vy`). This ensures `vyasac.toml` strictly handles file inputs/outputs, while linguists and UI designers manage the presentational semantics.

## Motivation
Previously, grouping logic was hinted via `[build.reading]` as `group_by = "chapter"`. However, a group header typically contains custom UI elements, like "Chapter X has Y verses", which cannot be represented simply by a string configuration flag.

We propose that authors define the grouping UI boundaries using `vyasa-slot` and a dedicated `group` command directly within their template files (e.g., `templates/html/views/reading.vy`).

## Proposed Syntax

Inside `reading.vy` or similar view templates, authors can wrap their list layout with grouping commands:

```vyasa
`group { level="chapter" } [
    `group-header [
        `div { class="chapter-header" } [
            `h2 [ Chapter ${group.chapter_number} ]
        ]
    ]
    `group-body [
        `vyasa-slot []
    ]
    `group-footer [
        `div { class="chapter-footer" } [
            `h2 [ Chapter ${group.chapter_number} has ${group.count} verses ]
        ]
    ]
]
```

### Compiler Processing

1. The `vyasac` compiler parses the `.vy` template and looks for `group` commands.
2. The compiler stores the `group-header` and `group-footer` fragments alongside the regular `layout` and `item` fragments in the `html_templates` SQLite database.
3. The `level` attribute maps directly to the hierarchical elements defined in the URN scheme (e.g., `scheme = "urn:vyasa:bg:{chapter}:{verse}"`).

### Viewer Rendering

1. The UI (e.g., `VyasaViewer.svelte`) fetches the templates from the `html_templates` table.
2. As it iterates over the ordered URN items for the current page, it tracks changes in the variable corresponding to the `level` attribute (e.g., `chapter`).
3. Whenever the `chapter` changes:
   - The UI finishes the previous group by rendering the `group-footer` HTML, populating context variables like `${group.count}`.
   - It begins a new group by rendering the `group-header` HTML, interpolating variables like `${group.chapter_number}` (derived from the URN).
4. Items continue to render inside the implicit `vyasa-slot` region.

This approach gives total expressive freedom to the template authors without relying on rigid JSON/TOML data models.
