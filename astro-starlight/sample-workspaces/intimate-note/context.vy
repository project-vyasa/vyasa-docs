

`command-def { name="knowledge-sheet" args="number,title,date,location" category="structure" }
`command-def { name="lines" whitespace="preserve" category="formatting" }
`command-def { name="extras" category="structure" }
`command-def { name="center" category="formatting" }
`command-def { name="right" category="formatting" }
`command-def { name="speaker" category="entity" }

`command-def { name="knowledge" whitespace="preserve" category="structure" }

// Native Templates
`template `knowledge-sheet `for "html" {
   `div { class="sheet-meta" } [
       `div { class="sheet-date" } [ $.date ]
       `div { class="sheet-location" } [ $.location ]
       `h1 { class="sheet-title" } [ $.number.   $.title ]
   ]
}

`template `knowledge `for "html" {
   `div { class="knowledge" } [ $.text ]
}

`template `lines `for "html" {
   `div { class="lines" } [ $.text ]
}

`template `center `for "html" {
   `div { class="align-center" } [ $.text ]
}

`template `right `for "html" {
   `div { class="align-right" } [ $.text ]
}

`template `speaker `for "html" {
   `strong [ $.text ]
}

`template `emphasis `for "html" {
   `strong [ $.text ]
}

`template `extras `for "html" {
   `div { class="extras" } [ $.text ]
}

`template `break `for "html" {
   `br
}
