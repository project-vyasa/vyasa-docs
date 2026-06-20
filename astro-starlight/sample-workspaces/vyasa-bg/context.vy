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
`command-def { name="uvaca" category="action" }
