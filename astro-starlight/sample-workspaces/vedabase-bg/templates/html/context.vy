// Default View Body Projection
`set meta { stream="mula" }
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
    `div { class="verse-content" } [
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
        `div { class="synonyms-grid" } [ $.body ]
    ]
]

// Formatting
`ref [ `a { href="$.urn" } [ $.body ] ]
`e1 [ `strong [ $.body ] ]
`e2 [ `em [ $.body ] ]

`term [ `div { class="synonym-term" } [ $.iast ] ]
`meaning [ `div { class="synonym-meaning" } [ $.body ] ]

`stream [
    `div { "data-vyasa-stream"=$.ref class="stream-slot" } []
]
`template-def { id="e1" template="<em class=\"e1\">{{ body }}</em>" }
`template-def { id="e2" template="<strong class=\"e2\">{{ body }}</strong>" }
`template-def { id="synonyms" template="<div class=\"synonyms-section\"><strong>Synonyms</strong><div class=\"synonyms-grid\" style=\"display: grid; grid-template-columns: max-content 1fr; gap: 0.2rem 1rem; margin-top: 0.5rem;\">{{ body }}</div></div>" }
`template-def { id="term" template="<div class=\"term\"><strong>{{ $.iast }}</strong></div>" }
`template-def { id="meaning" template="<div class=\"meaning\">{{ body }}</div>" }
