// Semantic HTML Templates

`mula [
`div { class="mula" style="white-space: pre-line;" } [$.body]
]

`iast [
`div { class="iast" style="white-space: pre-line;" } [$.body]
]

`devanagari [
`div { class="devanagari" style="white-space: pre-line;" } [$.body]
]

// Formatting helpers
`ref [ `a { href="$.argument" } [$.body] ]
`e1 [ `strong [$.body] ]
`e2 [ `em [$.body] ]

// Invisible Speaker Metadata Markers (with debug class)
`dhritarashtra [ `span { class="vyasa-debug-marker" "data-entity"="dhritarashtra" } [] ]
`sanjaya [ `span { class="vyasa-debug-marker" "data-entity"="sanjaya" } [] ]
`arjuna [ `span { class="vyasa-debug-marker" "data-entity"="arjuna" } [] ]
`krishna [ `span { class="vyasa-debug-marker" "data-entity"="krishna" } [] ]
`uvaca [ `span { class="vyasa-debug-marker" "data-action"="uvaca" } [] ]
