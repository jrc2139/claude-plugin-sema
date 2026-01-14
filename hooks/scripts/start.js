#!/usr/bin/env node
/**
 * SessionStart hook: starts sema serve for fast semantic searches.
 */

const { spawn, execSync } = require("child_process")
const { realpathSync } = require("fs")
const http = require("http")

/**
 * Check if server is responding on port.
 */
function checkServerHealth(port, timeout = 500) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, { timeout }, (res) => {
      resolve(res.statusCode === 200)
    })
    req.on("error", () => resolve(false))
    req.on("timeout", () => {
      req.destroy()
      resolve(false)
    })
  })
}

/**
 * Compute deterministic port for directory (matches Zig FNV-1a hash).
 */
function getPortForDir(cwd) {
  let h = 0xcbf29ce484222325n
  const bytes = Buffer.from(cwd)
  for (const byte of bytes) {
    h ^= BigInt(byte)
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn
  }
  return 8765 + Number(h % 1000n)
}

/**
 * Find executable in PATH.
 */
function which(cmd) {
  try {
    return execSync(`which ${cmd}`, { encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

function respond(message) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: message,
      },
    })
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  // Read payload from stdin
  let payload = {}
  try {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    const input = Buffer.concat(chunks).toString().trim()
    if (input) {
      payload = JSON.parse(input)
    }
  } catch {
    // Use defaults
  }

  const cwd = payload.cwd || process.cwd()
  let realCwd
  try {
    realCwd = realpathSync(cwd)
  } catch {
    realCwd = cwd
  }
  const port = getPortForDir(realCwd)

  // Check if server already running
  if (await checkServerHealth(port)) {
    respond(`sema serve already running (port ${port}); prefer \`sema "<complete question>"\` over grep.`)
    return
  }

  // Verify sema is in PATH
  const semaPath = which("sema")
  if (!semaPath) {
    respond("Warning: sema not found in PATH. Install with: curl -fsSL https://sema.sh/install.sh | sh")
    return
  }

  // Start server as detached background process
  const child = spawn(semaPath, ["serve"], {
    cwd: realCwd,
    stdio: ["ignore", "ignore", "ignore"],
    detached: true,
  })
  child.unref()

  // Wait for server to be ready (up to 3s)
  for (let i = 0; i < 30; i++) {
    await sleep(100)
    if (await checkServerHealth(port)) {
      break
    }
  }

  respond(`sema serve started (port ${port}); prefer \`sema "<complete question>"\` over grep (plain output is agent-friendly).`)
}

main().catch(console.error)
