`layout [
`html { lang="en" } [
    `head [
        `meta { charset="UTF-8" }
        `meta { name="viewport" content="width=device-width, initial-scale=1.0" }
        `title [ Vyasa Minimal Sample ]
        `style [
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
            .content { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; }
            h1 { color: #333; }
        ]
    ]
    `body [
        `div { class="content" } [
            {{ body }}
        ]
    ]
]
]

`item [
    {{ content }}
]
