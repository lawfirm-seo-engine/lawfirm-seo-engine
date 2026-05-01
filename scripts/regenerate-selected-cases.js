const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const root = process.cwd()
const casesDir = path.join(root, "content", "daeonlawfintech", "cases")
const backupRoot = path.join(root, "backup-regenerate-mdx", "selected")

const groups = [
  [
    "벨라비 사기 쇼핑몰 사칭",
    "bellaxb.com 사기 쇼핑몰 사칭",
    "bellaxb 사기 쇼핑몰 사칭",
  ],
  [
    "디프엘리마켓 사기 쇼핑몰 사칭",
    "deepelliemarket.com 사기 쇼핑몰 사칭",
    "deepelliemarket 사기 쇼핑몰 사칭",
    "deepellie 사기 쇼핑몰 사칭",
    "디프엘리 사기 쇼핑몰 사칭",
  ],
]

function slugify(caseName) {
  return caseName
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
}

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

const backupDir = path.join(backupRoot, timestamp())
fs.mkdirSync(backupDir, { recursive: true })

const cases = groups.flat()

for (const caseName of cases) {
  const file = `${slugify(caseName)}.mdx`
  const source = path.join(casesDir, file)

  if (fs.existsSync(source)) {
    fs.renameSync(source, path.join(backupDir, file))
  }
}

for (const group of groups) {
  for (const caseName of group) {
    const result = spawnSync(
      process.execPath,
      [path.join(root, "scripts", "create-case.js"), caseName],
      {
        cwd: root,
        encoding: "utf-8",
        stdio: "inherit",
      }
    )

    if (result.status !== 0) {
      console.error(`Failed to regenerate: ${caseName}`)
      console.error(`Backup remains at: ${backupDir}`)
      process.exit(result.status || 1)
    }
  }
}

console.log(`Selected cases regenerated. Backup: ${backupDir}`)
