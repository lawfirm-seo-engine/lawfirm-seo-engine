const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const root = process.cwd()
const casesDir = path.join(root, "content", "daeonlawfintech", "cases")
const backupRoot = path.join(root, "backup-regenerate-mdx")

function readFrontmatterValue(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return match ? match[1].trim() : ""
}

function caseNameFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\s+/g, " ").trim()
}

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("")
}

if (!fs.existsSync(casesDir)) {
  console.error(`cases directory not found: ${casesDir}`)
  process.exit(1)
}

const files = fs
  .readdirSync(casesDir)
  .filter((file) => file.endsWith(".mdx"))
  .filter((file) => file !== "_template.mdx")

const cases = files.map((file) => {
  const slug = file.replace(/\.mdx$/, "")
  const source = fs.readFileSync(path.join(casesDir, file), "utf-8")
  const caseName = readFrontmatterValue(source, "caseName") || caseNameFromSlug(slug)
  const stat = fs.statSync(path.join(casesDir, file))

  return {
    file,
    caseName,
    birthtime: stat.birthtime.getTime(),
  }
})

const backupDir = path.join(backupRoot, timestamp())
fs.mkdirSync(backupDir, { recursive: true })

for (const item of cases) {
  fs.renameSync(
    path.join(casesDir, item.file),
    path.join(backupDir, item.file)
  )
}

console.log(`Backed up ${cases.length} MDX files to ${backupDir}`)

const orderedCases = cases.sort((a, b) => a.birthtime - b.birthtime)

for (const item of orderedCases) {
  console.log(`\nRegenerating: ${item.caseName}`)

  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "create-case.js"), item.caseName],
    {
      cwd: root,
      encoding: "utf-8",
      stdio: "inherit",
    }
  )

  if (result.status !== 0) {
    console.error(`Failed to regenerate: ${item.caseName}`)
    console.error(`Backup remains at: ${backupDir}`)
    process.exit(result.status || 1)
  }
}

console.log(`\nRegenerated ${orderedCases.length} MDX files.`)
