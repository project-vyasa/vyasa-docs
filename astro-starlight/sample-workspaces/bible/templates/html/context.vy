`stream [
    `div { "data-vyasa-stream"=$.ref class="stream-slot" } []
]

`v [
    `div { class="verse" style="white-space: pre-line; margin-bottom: 1.5rem;" } [
      `strong { style="display: block; color: #64748b; font-size: 0.9em; margin-bottom: 0.25rem;" } [Verse $.argument]
      $.body
    ]
]
