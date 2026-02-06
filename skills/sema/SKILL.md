---
name: sema
description: "Semantic code search. Use for 'where is X', 'how does Y work', 'find Z logic' queries. Finds code by concept, not exact text."
version: 1.1.0
---

# sema - Semantic Code Search

Requires sema v0.1.5+. First search automatically indexes your codebase (no manual setup needed). Use `sema "<query>"` for semantic code search. Hybrid search (semantic + keyword) is the default.

## Usage

```bash
# Hybrid search (default) - best for natural language questions
sema "where is authentication handled?"
sema "error handling patterns" -l python

# Keyword search (-k) - fast, no model loading, good for identifiers
sema -k "parseArgs"
sema -k "ConfigLoader"

# Search within a directory
sema "API endpoints" src/
sema "database queries" ./backend/

# With filters
sema "error handling" -l zig -n 10
sema -g "src/**/*.ts" "authentication"
```

## Options

- `<path>`: Search within directory (positional, e.g., `sema "query" src/`)
- `-k, --keyword`: BM25 text search (no model loading, instant)
- `-n <num>`: Max results (default: 5)
- `-l <lang>`: Filter by language (python, javascript, zig, etc.)
- `-g <pattern>`: Filter by file path glob (e.g., "src/**/*.ts")
- `-c, --compact`: File paths only

## Search Modes

| Mode | Flag | Best For | First Run | Speed |
|------|------|----------|-----------|-------|
| Hybrid | (default) | Natural language questions | Keyword results immediately, semantic index in background | ~50ms (subsequent runs) |
| Keyword | `-k` | Exact identifiers, function names | FTS-only index built instantly, no model loading | ~5ms |

**Auto-Indexing**: On first search, sema automatically indexes your codebase:
- **Keyword mode** (`-k`): Builds lightweight FTS-only index instantly (no model needed)
- **Hybrid mode** (default): Shows keyword results immediately while building semantic index in background

**Server Lifecycle**: Hybrid search spawns a background server. The server auto-shuts down after 30 minutes of inactivity to prevent resource waste.

## When to Use

**Use sema (hybrid):**
- "Where is X handled?"
- "How does Y work?"
- Finding code by concept/meaning

**Use sema -k (keyword):**
- Searching for specific function/class names
- Finding exact identifiers
- When you know the exact term

**Use grep:**
- Exact string literals
- Regex patterns

## Ignore Patterns

By default, sema respects `.gitignore` files when indexing. You can also use `.semaignore` files for sema-specific exclusions (same syntax as `.gitignore`):

```bash
# .semaignore - exclude from sema but keep in git
generated/
*.min.js
vendor/
```

`.semaignore` files work at any directory level, just like `.gitignore`.

To index everything (ignore no patterns):

```bash
sema index --no-gitignore .
```

Or in config:

```json
{
    "respect_ignore": false
}
```
