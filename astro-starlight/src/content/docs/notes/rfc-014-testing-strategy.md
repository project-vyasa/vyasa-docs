---
title: RFC 014 - Zero-Touch Testing Strategy
description: comprehensive testing strategy with zero human involvement
---

# RFC 014: Zero-Touch Testing Strategy

## Summary
To ensure the stability and reliability of the Vyasa language and compiler suite as it evolves, we need a comprehensive, automated testing strategy. The goal is "zero human involvement" in the regression testing loop. This RFC proposes a three-tier testing architecture targeting native, WASM, and browser environments.

## Components Under Test

### 1. `vyasac` Native CLI
The core Rust compiler binary.
- **Environment**: Native OS (macOS/Linux/Windows).
- **Role**: Baseline truth. Fast feedback loop for language semantics and core compile logic.
- **Verification**: Standard `cargo test` unit tests + integration tests running the binary against sample workspaces.

### 2. `vyasa-wasm` CLI (Headless)
A new CLI tool that wraps the WASM runtime in a headless environment (Node.js or similar).
- **Environment**: Node.js / Wasmtime (No DOM).
- **Role**: Validates that the core WASM artifact functions identically to the native binary. Detects regressions specific to the `wasm32-unknown-unknown` target (e.g., file system abstraction issues, threading panics).
- **Verification**: Runs the same suite of sample workspaces as the Native CLI, asserting bit-for-bit (or semantic) equivalence of outputs.

### 3. Browser-Based Test Fixture
A Playwright/Puppeteer-driven test harness that loads the full `PlayArea` application.
- **Environment**: Real Browser (Chrome/Firefox/Safari) - Headless or Headed.
- **Role**: Ensures end-to-end functionality in the user's actual environment. Detects DOM-specific issues, hydration errors (like the recent icon crash), and interactions between the WASM module and the UI thread.
- **Verification**: 
    - Loads a workspace in the virtual file system.
    - Clicks "Run".
    - Verifies the rendered preview iframe content match expected snapshots.
    - Checks browser console for errors/warnings.

## Test Scope & Taxonomy

### A. Language Syntax & Semantics
Every literal command and language construct must be exercised.
1.  **Command Variants**:
    - **No Arguments**: `\pagebreak`
    - **With Arguments**: `\image "fig1.png"`
    - **With Parameters**: `\verse { class="shloka" }`
    - **Combinations**: `\command "arg" { key="value" }`
2.  **Whitespace & Formatting**:
    - Leading/trailing whitespace.
    - Multi-line commands.
    - Indentation sensitivity (if applicable).
3.  **Error Conditions** (Negative Testing):
    - Invalid syntax.
    - Unknown commands.
    - Type mismatches in parameters.
    - **Goal**: Verify that *useful, correct* error messages are generated (containing line numbers, file paths, and hints).

### B. Workspace Configuration
Tests focusing on `vyasac.toml` and project structure.
1.  **Defaults**: Compile a zero-config workspace.
2.  **Custom Paths**:
    - Custom template folder location.
    - Custom primary stream folder.
3.  **Failure Scenarios**:
    - Missing config file.
    - Invalid TOML.
    - Pointing to non-existent templates or streams.

### C. Projection Targets
Output verification for each supported backend.
1.  **Targets**: HTML, JSON (AST), SQLite (if applicable), potential future formats (SRT, VTT).
2.  **Template Overrides**:
    - **Default**: Verify output using built-in or default templates.
    - **User-Specified**: Verify output when a specific template is requested via CLI (`--template`).
3.  **Snapshot Testing**:
    - Compare generated output files against "Gold Standard" or "Snapshot" files committed to the repo.
    - Any deviation fails the test (requires manual approval to update snapshot).

### D. Pack & Graph Queries
Tests scope beyond single-file compilation.
1.  **Cross-File Queries**:
    - Verify `\knowledge` or `\ref` commands that pull data from other files in the workspace.
    - Ensure graph consistency (e.g., all links resolve).
2.  **Pack Generation**:
    - Verify `vyasac pack` creates valid archives (zip/sqlite).
    - Content integrity check of the generated pack.

### E. Persona-Based Scenarios
Tests designed to mimic real-world user workflows.

#### 1. The Linguist (Precision)
- **Focus**: Textual accuracy, diacritics, transliteration.
- **Test**: Input highly complex Sanskrit text with specific IAST/Devanagari requirements. Verify that no character corruption occurs during the round-trip (Parse -> AST -> HTML).

#### 2. The Publisher (Presentation)
- **Focus**: Formatting, layout, templates.
- **Test**: Compile a "Book" project with custom HTML/CSS templates. Verify the DOM structure matches the design system requirements (classes, IDs, nesting).

#### 3. The Curator (Organization)
- **Focus**: Metadata, references, organization.
- **Test**: Large workspace with thousands of inter-linked nodes. Verify query performance and link resolution completeness.

## Implementation Roadmap

### Phase 1: Native Baseline (Immediate)
- [ ] Establish standard test runner (likely Rust's `cargo test` framework or a Python/Shell wrapper).
- [ ] Create a `tests/fixtures/` directory with `input.vy`, `vyasac.toml`, and `expected_output/` for each scenario.
- [ ] Implement snapshot diffing logic.

### Phase 2: WASM Headless (Short-term)
- [ ] Create `vyasac-wasm-cli` package.
- [ ] Write a wrapper script that loads `vyasac_bg.wasm` + `vyasac.js` in Node.
- [ ] Port/Run the Phase 1 test suite against this wrapper.

### Phase 3: Browser Integration (Medium-term)
- [ ] Set up Playwright/Cypress in `vyasa-docs` or `vyasa-ui`.
- [ ] Write "Happy Path" tests: Load PlayArea -> Select 'Gita' -> Run -> Verify Preview.
- [ ] Write "Crash Detection" tests: Load malformed files -> Verify UI handles error gracefully (no white screen).
