#!/bin/bash
# Build script for Bhagavad Gita Workspace

# Determine absolute path to the workspace (where this script is)
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine relative path to compiler from workspace
# Workspace: .../project-vyasa/vyasa-docs/astro-starlight/sample-workspaces/bhagavad-gita
# Compiler:  .../project-vyasa/vyasa/vyasac
# Path: ../../../../vyasa/vyasac

COMPILER_DIR="$WORKSPACE_DIR/../../../../vyasa/vyasac"

echo "Building Gita Workspace..."
echo "Source: $WORKSPACE_DIR"
echo "Compiler: $COMPILER_DIR"

if [ -d "$COMPILER_DIR" ]; then
    # Run via cargo
    # cargo run --manifest-path "$COMPILER_DIR/Cargo.toml" --quiet -- build "$WORKSPACE_DIR" --target html
    cargo run --manifest-path "$COMPILER_DIR/Cargo.toml" --quiet -- build "$WORKSPACE_DIR" --target html --template reference
else
    echo "Error: Compiler directory not found at $COMPILER_DIR"
    echo "Attempting to use 'vyasac' from PATH..."
    if command -v vyasac &> /dev/null; then
        vyasac build "$WORKSPACE_DIR" --target html
    else
        echo "Error: 'vyasac' not found in PATH."
        exit 1
    fi
fi

echo "Build complete. Check 'dist/html' for output."
