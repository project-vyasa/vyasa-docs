`layout [
`title [Intimate Note]

`link { href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" }

`style [
    body {
        font-family: 'Noto Serif', serif;
        color: #333;
        background-color: #fdfdfd;
    }

    .reading-body {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        line-height: 1.6;
        font-size: 1.1rem;
    }

    .sheet-meta {
        border-bottom: 1px solid #ddd;
        padding-bottom: 1rem;
        margin-bottom: 2rem;
        text-align: left;
        color: #666;
        font-size: 0.9rem;
    }

    .knowledge,
    .lines,
    .extras {
        white-space: pre-wrap;
    }

    .sheet-title {
        color: #2c3e50;
        margin-top: 0.5rem;
        font-size: 1.5rem;
    }

    .lines {
        margin-bottom: 1rem;
    }

    .align-center {
        text-align: center;
    }

    .align-right {
        text-align: right;
    }

    .extras {
        margin-top: 3rem;
        padding-top: 1rem;
        border-top: 1px dashed #ccc;
        font-size: 0.9rem;
        color: #7f8c8d;
    }
]

`div { class="reading-body" } [
    {{ body }}
]
]

`item [
`div [ `stream { ref="primary" } ]
]
