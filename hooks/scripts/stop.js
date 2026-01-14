#!/usr/bin/env node
/**
 * SessionEnd hook: stops sema serve for current project.
 */

const { realpathSync, existsSync, readFileSync, writeFileSync, renameSync } = require("fs")
const { homedir, tmpdir } = require("os")
const { join } = require("path")

/**
 * Get path to global server registry.
 */
function getRegistryPath() {
  return join(homedir(), ".local", "share", "sema", "servers.json")
}

/**
 * Check if a process is still running.
 */
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * Send SIGTERM to a process.
 */
function killPid(pid) {
  try {
    process.kill(pid, "SIGTERM")
    return true
  } catch {
    return false
  }
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

  const registryPath = getRegistryPath()

  if (!existsSync(registryPath)) {
    return
  }

  try {
    // Read current registry
    let servers = []
    try {
      const content = readFileSync(registryPath, "utf8")
      servers = JSON.parse(content)
    } catch {
      servers = []
    }

    // Process servers
    const remaining = []
    for (const server of servers) {
      // Kill server for this project
      if (server.project_root === realCwd && typeof server.pid === "number") {
        killPid(server.pid)
        continue
      }

      // Keep server if still alive (cleanup stale entries)
      if (typeof server.pid === "number" && isProcessAlive(server.pid)) {
        remaining.push(server)
      }
    }

    // Atomic write via temp file + rename
    if (remaining.length !== servers.length || JSON.stringify(remaining) !== JSON.stringify(servers)) {
      const tempPath = join(tmpdir(), `sema-registry-${Date.now()}.json`)
      writeFileSync(tempPath, JSON.stringify(remaining, null, 2))
      renameSync(tempPath, registryPath)
    }
  } catch {
    // Silent fail is acceptable for cleanup hook
  }
}

main().catch(() => {
  // Silent fail
})
