// Reference: verses only
`h1 [ All Verses ]
`each work.urns [
    `div { class="verse-box" } [
        `div { class="verse-ref" } [ Verse $.id ]
        `div { class="verse-text" } [
                `div { class="devanagari" } [ $.mula.body ]
                `div { class="iast" } [ $.iast.body ]
        ]
        `p [
            `a { href="$.urns.url" } [ Read Full Verse ]
        ]
    ]
]

