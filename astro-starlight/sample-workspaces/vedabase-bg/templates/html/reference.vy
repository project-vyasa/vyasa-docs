// Reference: verses only
`body [ 
    `h1 [ All Verses ]
    `each work.urns [
        `div { class="chapter-entry" } [
            `h2 [ Verse $.id ]
            `div { class="verse-text" } [
                 `div { class="devanagari" } [ $.mula.body ]
                 `div { class="iast" } [ $.iast.body ]
            ]
            `p [
                `ref $.url [ Read Full Verse ]
            ]
        ]
    ]
]

