const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const caseName = process.argv[2]

if (!caseName) {
  console.error("사건명을 입력하세요.")
  process.exit(1)
}

const cleanCaseName = caseName.trim().replace(/\s+/g, " ")

const hasScamKeyword = cleanCaseName.includes("사기")
const hasImpersonationKeyword = cleanCaseName.includes("사칭")

const normalizedCaseNameForDisplay = cleanCaseName
  .replace(/\s*\(사칭\)\s*/g, " ")
  .replace(/\s+/g, " ")
  .trim()

const slug = cleanCaseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const root = process.cwd()

const casesDir = path.join(root, "content", "daeonlawfintech", "cases")
const templatePath = path.join(casesDir, "_template.mdx")
const outputPath = path.join(casesDir, `${slug}.mdx`)

if (!fs.existsSync(templatePath)) {
  console.error("_template.mdx 파일 없음")
  process.exit(1)
}

if (fs.existsSync(outputPath)) {
  console.error("이미 존재하는 MDX")
  process.exit(1)
}

const templateImagePath = path.join(
  root,
  "public",
  "images",
  "templates",
  "case-template.png"
)

const outputImageDir = path.join(root, "public", "images", "cases")

if (!fs.existsSync(outputImageDir)) {
  fs.mkdirSync(outputImageDir, { recursive: true })
}

const avifPath = path.join(outputImageDir, `${slug}.avif`)
const pngPath = path.join(outputImageDir, `${slug}.png`)

const titleText = hasImpersonationKeyword
  ? normalizedCaseNameForDisplay
  : `${normalizedCaseNameForDisplay} (사칭)`

const subText = "피해 회복을 위한 법률 정보"

const escapeXml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

const escapeYaml = (text) =>
  text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')

const seoTitle = `${cleanCaseName}${hasScamKeyword ? "" : " 사기"}${
  hasImpersonationKeyword ? "" : " 사칭"
} 피해회복`

const seoDescription = `${cleanCaseName}${
  hasScamKeyword ? "" : " 사기"
} 피해 사례 및 대응 전략 안내`

const frontmatter = `---
title: "${escapeYaml(seoTitle)}"
caseName: "${escapeYaml(cleanCaseName)}"
description: "${escapeYaml(seoDescription)}"
slug: "${escapeYaml(slug)}"
---

`

const svgOverlay = `
<svg width="1200" height="630">
<style>
.title {
  fill: white;
  font-size: 58px;
  font-weight: 900;
  text-anchor: middle;
}

.subtitle {
  fill: white;
  font-size: 28px;
  font-weight: 700;
  text-anchor: middle;
}
</style>

<rect width="1200" height="630" fill="rgba(0,0,0,0.28)" />

<text x="600" y="135" class="title">
${escapeXml(titleText)}
</text>

<text x="600" y="188" class="subtitle">
${escapeXml(subText)}
</text>
</svg>
`

function removeDuplicateImpersonationText(text) {
  if (!hasImpersonationKeyword) return text

  return text
    .replaceAll("{{CASE_NAME}} (사칭)", "{{CASE_NAME}}")
    .replaceAll("{{CASE_NAME}}(사칭)", "{{CASE_NAME}}")
    .replaceAll(`${cleanCaseName} (사칭)`, cleanCaseName)
    .replaceAll(`${cleanCaseName}(사칭)`, cleanCaseName)
    .replaceAll(`${normalizedCaseNameForDisplay} (사칭)`, normalizedCaseNameForDisplay)
    .replaceAll(`${normalizedCaseNameForDisplay}(사칭)`, normalizedCaseNameForDisplay)
    .replaceAll("사칭 (사칭)", "사칭")
    .replaceAll("사칭(사칭)", "사칭")
    .replaceAll("사칭 사칭", "사칭")
}

function stripVisibleFrontmatterLines(text) {
  return text
    .replace(/^title:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/^caseName:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/^description:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/^slug:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
}

;(async () => {
  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: Buffer.from(svgOverlay) }])
    .avif({ quality: 72 })
    .toFile(avifPath)

  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: Buffer.from(svgOverlay) }])
    .png({ quality: 90 })
    .toFile(pngPath)

  console.log("대표이미지 생성 완료")

  const fixedNumbers = ["02", "03", "04", "05", "06", "07", "08"]
  const extensions = ["png", "jpg", "jpeg", "gif"]
  const imageExtMap = {}

  fixedNumbers.forEach((num) => {
    let foundFile = null

    for (const ext of extensions) {
      const candidate = path.join(outputImageDir, `template-${num}.${ext}`)

      if (fs.existsSync(candidate)) {
        foundFile = candidate
        break
      }
    }

    if (!foundFile) {
      console.warn(`template-${num} 없음`)
      return
    }

    const realExt = path.extname(foundFile)
    imageExtMap[num] = realExt

    const target = path.join(outputImageDir, `${slug}-${num}${realExt}`)

    fs.copyFileSync(foundFile, target)

    console.log(`생성 완료: ${slug}-${num}${realExt}`)
  })

  let template = fs.readFileSync(templatePath, "utf-8")

  template = stripVisibleFrontmatterLines(template)
  template = removeDuplicateImpersonationText(template)

  const imagePath = `/images/cases/${slug}.png`

  let result = template
    .replaceAll("{{CASE_NAME}}", cleanCaseName)
    .replaceAll("{{IMAGE_PATH}}", imagePath)
    .replaceAll("{{SLUG}}", slug)

  result = removeDuplicateImpersonationText(result)
  result = stripVisibleFrontmatterLines(result)

  fixedNumbers.forEach((num) => {
    const realExt = imageExtMap[num]

    if (!realExt) return

    result = result.replace(
      new RegExp(`template-${num}\\.(png|jpg|jpeg|gif)`, "g"),
      `${slug}-${num}${realExt}`
    )
  })

  result = frontmatter + result.replace(/^---[\s\S]*?---\s*/, "")

  fs.writeFileSync(outputPath, result, "utf-8")

  console.log("")
  console.log("MDX 생성 완료")
  console.log(`/cases/${slug}`)
})()