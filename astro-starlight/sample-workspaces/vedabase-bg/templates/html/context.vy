// Default View Body Projection
`body [ 
    `dhritarashtra `sanjaya `arjuna `krishna `uvacha 
    `verse 
]

// Generic Entity Templates
`dhritarashtra [
    `div { class="entity-header" } [ $.entities.dhritarashtra.label ]
]
`sanjaya [
    `div { class="entity-header" } [ $.entities.sanjaya.label ]
]
`arjuna [
    `div { class="entity-header" } [ $.entities.arjuna.label ]
]
`krishna [
    `div { class="entity-header" } [ $.entities.krishna.label ]
]

// Uvacha Wrapper
`uvacha [
    `div { class="uvacha-label" } [ $.labels.uvacha ]
    $.body
]

// Verse Container
`verse [
    `div { class="verse-box" } [
        `div { class="verse-ref" } [ Verse $.argument ]
        $.body
    ]
]

// Components
`devanagari [
    `div { class="devanagari" } [ $.body ]
]

`iast [
    `div { class="iast" } [ $.body ]
]

`translation [
    `div { class="translation-box" } [
        `div { class="section-title" } [ Translation ]
        $.body
    ]
]

`purport [
    `div { class="purport-box" } [
        `div { class="section-title" } [ Purport ]
        $.body
    ]
]

`synonyms [
    `div { class="synonyms-box" } [
        `div { class="section-title" } [ Synonyms ]
        $.body
    ]
]

// Formatting
`ref [ `a { href="$.argument" } [ $.body ] ]
`e1 [ `strong [ $.body ] ]
`e2 [ `em [ $.body ] ]

`term [ `div { class="synonym-term" } [ $.body ] ]
`meaning [ `div { class="synonym-meaning" } [ $.body ] ]
