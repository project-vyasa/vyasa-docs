// Default View Body Projection
`set meta { stream="mula" }
`body [ 
    `verse 
]

`alias-def { name="v" target="verse" }

`template { target="html" name="refer" } [
    `span { class="vyasa-refer" "data-target"="[$.urn]" style="display:none" } []
]

// Invisible Speaker Metadata Markers (with debug class)
`dhritarashtra [ `span { class="vyasa-debug-marker" "data-entity"="dhritarashtra" } [] ]
`sanjaya [ `span { class="vyasa-debug-marker" "data-entity"="sanjaya" } [] ]
`arjuna [ `span { class="vyasa-debug-marker" "data-entity"="arjuna" } [] ]
`krishna [ `span { class="vyasa-debug-marker" "data-entity"="krishna" } [] ]
`uvaca [ `span { class="vyasa-debug-marker" "data-action"="uvaca" } [] ]

// Verse Container
`verse [
    `div { class="verse-content" } [
        $.body
    ]
]

// Components
`devanagari [
    `div { class="devanagari" } [$.body]
]

`iast [
    `div { class="iast" } [$.body]
]

`translation [
    `div { class="translation-box" } [
        `div { class="section-title" } [Translation]
        `div { style="white-space: pre-line;" } [$.body]
    ]
]

`purport [
    `div { class="purport-box" } [
        `div { class="section-title" } [Purport]
        `div { style="white-space: pre-line;" } [$.body]
    ]
]

`synonyms [
    `div { class="synonyms-box" } [
        `div { class="section-title" } [Synonyms]
        `div { class="synonyms-grid" style="display: grid; grid-template-columns: max-content 1fr; gap: 0.2rem 1rem; margin-top: 0.5rem;" } [$.body]
    ]
]

`mula [
    `div { class="mula" style="white-space: pre-line;" } [$.body]
]

// Formatting
`ref [ `a { href="$.urn" } [$.body] ]
`e1 [ `strong [$.body] ]
`e2 [ `em [$.body] ]

`term [ `div { class="synonym-term" } [ `strong [$.iast] ] ]
`meaning [ `div { class="synonym-meaning" } [$.body] ]

`stream [
    `div { "data-vyasa-stream"=$.ref class="stream-slot" } []
]
