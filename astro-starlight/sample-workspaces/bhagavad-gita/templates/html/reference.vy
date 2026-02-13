// Reference: verses only
`body [ `dhritarashtra `sanjaya `arjuna `krishna `uvacha `verse ]

`collection { extract="devanagari, iast" infer_speaker="dhritarashtra, sanjaya, arjuna, krishna" } [
    `h1 [ All Verses ]
    `each work.items [
        `div { class="chapter-entry" } [
            `h2 [ $.title ]
            `p [
                `span { class="speaker" } [ $.speaker_label_dev $.speaker_label_iast ]
            ]
            `div { class="verse-text" } [
                 `p { class="devanagari" } [ $.devanagari ]
                 `p { class="iast" } [ $.iast ]
            ]
            `p [
                `ref $.url [ Read Full Verse ]
            ]
        ]
    ]
]

// Named Collection: TOC
`collection "toc" [
    `h1 [ Table of Contents ]
    `ul [
        `each work.chapters [
            `li [
                `ref $.url [ $.title ]
            ]
        ]
    ]
]
