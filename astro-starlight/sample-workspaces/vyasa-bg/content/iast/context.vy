`title [Bhagavad Gita - IAST]

// Semantic Definitions have to be repeated or inherited. Assuming inheritance from root context?
// Actually, since these are independent streams, we redefine for safety or rely on root context if we keep one.
// The plan implies these are independent.

`command-def { name="iast" category="content" }

// Entities (Nouns)
`command-def { name="dhritarashtra" category="entity" }
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }

// Actions (Verbs)
`command-def { name="uvacha" category="action" }

// Localization (IAST)
`set entities { 
    dhritarashtra = { label = "dhṛtarāṣṭra" }
    sanjaya = { label = "sañjaya" }
    arjuna = { label = "arjuna" }
    krishna = { label = "śrī-bhagavān" }
}

`set labels { 
    uvacha = "uvāca" 
}

`set meta { stream = "iast" }


