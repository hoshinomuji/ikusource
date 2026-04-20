const fs = require("node:fs")
const path = require("node:path")
const { spawn } = require("node:child_process")

const rootDir = process.cwd()
const webpackCacheDir = path.join(rootDir, ".next", "dev", "cache", "webpack")

try {
  fs.rmSync(webpackCacheDir, { recursive: true, force: true })
} catch (error) {
  console.warn(`[dev-safe] Failed to clear webpack cache: ${error.message}`)
}

const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next")
const child = spawn(process.execPath, [nextBin, "dev", "--webpack"], {
  cwd: rootDir,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
})

const shouldHideLine = (line) => line.includes("[baseline-browser-mapping]")

const pipeFiltered = (stream, output) => {
  let buffer = ""
  stream.on("data", (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!shouldHideLine(line)) {
        output.write(`${line}\n`)
      }
    }
  })

  stream.on("end", () => {
    if (buffer && !shouldHideLine(buffer)) {
      output.write(buffer)
    }
  })
}

pipeFiltered(child.stdout, process.stdout)
pipeFiltered(child.stderr, process.stderr)

const terminateChild = () => {
  if (!child.killed) {
    child.kill("SIGTERM")
  }
}

process.on("SIGINT", terminateChild)
process.on("SIGTERM", terminateChild)

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
