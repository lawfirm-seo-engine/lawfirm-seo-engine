const fs = require("node:fs")
const path = require("node:path")

const rootDir = process.cwd()
const casesDir = path.join(rootDir, "content", "daeonlawfintech", "cases")
const imageDir = path.join(rootDir, "public", "images", "cases")
const shouldDelete = process.argv.includes("--delete")

function collectImageSources(source) {
  return Array.from(source.matchAll(/(?:src=["']|!\[[^\]]*]\()([^"')]+)(?:["']|\))/g))
    .map((match) => match[1].split("?")[0])
    .filter((src) => src.startsWith("/images/cases/"))
    .map((src) => path.basename(src))
}

function getFileSize(file) {
  return fs.statSync(path.join(imageDir, file)).size
}

function main() {
  if (!fs.existsSync(casesDir) || !fs.existsSync(imageDir)) {
    console.error("cases or image directory not found")
    process.exit(1)
  }

  const mdxFiles = fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))

  const slugs = new Set(mdxFiles.map((file) => file.replace(/\.mdx$/, "")))
  const keep = new Set()

  mdxFiles.forEach((file) => {
    const source = fs.readFileSync(path.join(casesDir, file), "utf8")
    collectImageSources(source).forEach((image) => keep.add(image))
  })

  slugs.forEach((slug) => {
    keep.add(`${slug}.png`)
    keep.add(`${slug}.avif`)
  })

  fs.readdirSync(imageDir)
    .filter((file) => file.startsWith("template-"))
    .forEach((file) => keep.add(file))

  const imageFiles = fs
    .readdirSync(imageDir)
    .filter((file) => fs.statSync(path.join(imageDir, file)).isFile())

  const removable = imageFiles.filter((file) => !keep.has(file)).sort()
  const removableBytes = removable.reduce((total, file) => total + getFileSize(file), 0)

  if (shouldDelete) {
    removable.forEach((file) => {
      fs.unlinkSync(path.join(imageDir, file))
    })
  }

  console.log(`mdx=${mdxFiles.length}`)
  console.log(`images=${imageFiles.length}`)
  console.log(`keep=${keep.size}`)
  console.log(`removable=${removable.length}`)
  console.log(`removableMB=${(removableBytes / 1024 / 1024).toFixed(2)}`)
  console.log(`mode=${shouldDelete ? "delete" : "dry-run"}`)

  removable.slice(0, 20).forEach((file) => {
    console.log(`${shouldDelete ? "deleted" : "would delete"}: ${file}`)
  })
}

main()
