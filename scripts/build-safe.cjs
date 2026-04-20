const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

function removeNextDir() {
  try {
    fs.rmSync(path.join(process.cwd(), ".next"), { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}

function copyStandaloneAssets() {
  const root = process.cwd()
  const standaloneRoot = path.join(root, ".next", "standalone")
  const standaloneNextDir = path.join(standaloneRoot, ".next")
  const sourceStaticDir = path.join(root, ".next", "static")
  const targetStaticDir = path.join(standaloneNextDir, "static")
  const sourcePublicDir = path.join(root, "public")
  const targetPublicDir = path.join(standaloneRoot, "public")

  if (!fs.existsSync(standaloneRoot)) return

  if (fs.existsSync(sourceStaticDir)) {
    fs.mkdirSync(standaloneNextDir, { recursive: true })
    fs.cpSync(sourceStaticDir, targetStaticDir, { recursive: true, force: true })
  }

  if (fs.existsSync(sourcePublicDir)) {
    fs.cpSync(sourcePublicDir, targetPublicDir, { recursive: true, force: true })
  }
}

removeNextDir()

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next")
// Force webpack: this repo uses webpack config, and Turbopack can crash on Windows (E.g. "Call retries were exceeded").
const child = spawn(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    // Keep build output clean when baseline data lag warnings are emitted by transitive tooling.
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA:
      process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA || "true",
    BROWSERSLIST_IGNORE_OLD_DATA:
      process.env.BROWSERSLIST_IGNORE_OLD_DATA || "true",
  },
})

let combinedOutput = ""
let baselineWarningsSuppressed = 0

function sanitizeBuildOutput(text) {
  const lines = text.split(/\r?\n/)
  const kept = []

  for (const line of lines) {
    if (
      line.includes(
        "[baseline-browser-mapping] The data in this module is over two months old."
      )
    ) {
      baselineWarningsSuppressed += 1
      continue
    }
    kept.push(line)
  }

  return kept.join("\n")
}

child.stdout.on("data", (chunk) => {
  const text = sanitizeBuildOutput(chunk.toString())
  combinedOutput += text
  process.stdout.write(text)
})

child.stderr.on("data", (chunk) => {
  const text = sanitizeBuildOutput(chunk.toString())
  combinedOutput += text
  process.stderr.write(text)
})

child.on("close", (code) => {
  if (code === 0) {
    copyStandaloneAssets()
    process.exit(0)
  }

  const hasSuccessfulRouteOutput = combinedOutput.includes("Route (app)")
  const hasBuildError = combinedOutput.includes("Build error occurred")
  const hasKnownSwcDllCrash = combinedOutput.includes("DLL") && combinedOutput.includes("swc-win32-x64-msvc")

  if (!hasBuildError && hasSuccessfulRouteOutput && hasKnownSwcDllCrash) {
    copyStandaloneAssets()
    console.warn("\n[build-safe] Next build completed, but SWC DLL crashed after output. Treating build as success.")
    process.exit(0)
  }

  process.exit(code || 1)
})
