-- Core document metadata
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    title TEXT,
    urn TEXT,
    parent_id INTEGER REFERENCES documents(id)
);

-- AST nodes (flat representation)
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY,
    doc_id INTEGER REFERENCES documents(id),
    parent_id INTEGER REFERENCES nodes(id),
    position INTEGER,  -- Order within parent
    type TEXT CHECK(type IN ('Command', 'Text', 'SegmentBreak')),
    cmd TEXT,          -- Command name (if type='Command')
    argument TEXT,     -- [argument]
    value TEXT         -- Text content (if type='Text')
);

-- Node attributes (key-value)
CREATE TABLE IF NOT EXISTS node_attrs (
    node_id INTEGER REFERENCES nodes(id),
    key TEXT,
    value TEXT,
    PRIMARY KEY (node_id, key)
);

-- Entity registry
CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    category TEXT,
    label_dev TEXT,
    label_iast TEXT
);

-- Context/settings (JSON blob for flexibility)
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT  -- JSON
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nodes_doc ON nodes(doc_id);
CREATE INDEX IF NOT EXISTS idx_nodes_cmd ON nodes(cmd) WHERE type = 'Command';
CREATE INDEX IF NOT EXISTS idx_docs_urn ON documents(urn);
