# sema - Claude Code Plugin

Semantic code search for Claude Code.

## Installation

### Option 1: Add Marketplace (Recommended)

```bash
claude plugins marketplace add jrc2139/sema-plugins
claude plugins install sema
```

### Option 2: Clone and Link

```bash
git clone https://github.com/jrc2139/sema-plugins.git
claude plugins link ./sema-plugins/packages/claude
```

## Prerequisites

The `sema` binary (v0.2.0+) must be installed:

```bash
curl -fsSL https://sema.sh/install.sh | sh
```

## Usage

Use the `/sema` skill or run sema directly:

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

## How It Works

1. **Auto-Indexing**: First search automatically indexes your codebase (no manual `sema index` required)
   - Keyword mode (`-k`): Builds FTS-only index instantly, no model loading
   - Hybrid mode: Shows keyword results immediately while semantic index builds in background

2. **Server Lifecycle**: Hybrid search spawns `sema serve` in the background for fast searches (~50ms)
   - Server auto-shuts down after 30 minutes of inactivity
   - SessionEnd hook cleans up any remaining processes

3. **Search**: Queries are sent to the server for instant results (subsequent runs)

## Options

- `<path>`: Search within directory (positional, e.g., `sema "query" src/`)
- `-k, --keyword`: BM25 text search (no model loading, instant)
- `-n <num>`: Max results (default: 5)
- `-l <lang>`: Filter by language (python, javascript, zig, etc.)
- `-g <pattern>`: Filter by file path glob (e.g., "src/**/*.ts")
- `-c, --compact`: File paths only

## Search Modes

| Mode | Flag | Best For | Speed |
|------|------|----------|-------|
| Hybrid | (default) | Natural language questions | ~50ms |
| Keyword | `-k` | Exact identifiers, function names | ~5ms |

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

## License

[AGPL-3.0](./LICENSE)
