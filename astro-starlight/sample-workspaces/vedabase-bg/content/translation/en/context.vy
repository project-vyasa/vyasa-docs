`title [Bhagavad Gita - Translation]

// Semantic Definitions 
`command-def { name="translation" category="content" }

`command-def { name="synonyms" category="content" }
`command-def { name="purport" category="content" }

// Entities (Nouns)
`command-def { name="dhritarashtra" category="entity" }
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }

// Actions (Verbs)
`command-def { name="uvacha" category="action" }

// Localization (English)
`set meta { stream = "en" }
`set entities { 
    dhritarashtra = { label = "Dhritarashtra" }
    sanjaya = { label = "Sanjaya" }
    arjuna = { label = "Arjuna" }
    krishna = { label = "The Supreme Personality of Godhead" }
}

`set labels { 
    uvacha = "said" 
}

// Definitions


// Visual Templates
`template `synonyms `for "html" {
    `div { class="synonyms-box" } [ $.body ]
}

`template `term `for "html" {
    `div { class="synonym-term" } [ $.body ]
}

`template `meaning `for "html" {
    `div { class="synonym-meaning" } [ $.body ]
}

// Formatting for translation text (no box wrapper)
`template `translation `for "html" {
    `div { class="translation-box" } [ 
        `strong [ Translation: ] 
        $.body 
    ]
}

`template `purport `for "html" {
    `div { class="purport-box" } [ 
        `h3 [ Purport ]
        $.body 
    ]
}
