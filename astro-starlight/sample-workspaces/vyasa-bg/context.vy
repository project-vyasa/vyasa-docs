`title [Bhagavad Gita]

`set settings {
    default_whitespace = "single"
    break_after = "।॥"
}

// Common Semantic Definitions
`command-def { name="devanagari" category="content" }
`command-def { name="iast" category="content" }

`alias-def { name="v" target="verse" }

// Common Entities (Generic)
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }
`command-def { name="dhritarashtra" category="entity" }

// Action
`command-def { name="uvacha" category="action" }

// Semantic HTML Templates
`template { target="mula" }
`div { class="mula" style="white-space: pre-wrap;" $.body }

`template { target="iast" }
`div { class="iast" style="white-space: pre-wrap;" $.body }

`template { target="devanagari" }
`div { class="devanagari" style="white-space: pre-wrap;" $.body }

`template { target="uvacha" }
`span { class="action" [Uvacha] }

`template { target="uvaca" }
`span { class="action" [Uvaca] }

`template { target="dhritarashtra" }
`span { class="person" [Dhritarashtra] }

`template { target="sanjaya" }
`span { class="person" [Sanjaya] }

`template { target="arjuna" }
`span { class="person" [Arjuna] }

`template { target="krishna" }
`span { class="person" [Krishna] }
