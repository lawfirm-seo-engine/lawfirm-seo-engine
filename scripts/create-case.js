const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const caseName = process.argv[2]

if (!caseName) {
  console.error("사건명을 입력하세요.")
  process.exit(1)
}

const slug = caseName
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

const titleText = caseName.includes("사칭")
  ? caseName
  : `${caseName} (사칭)`

const subText = "피해 회복을 위한 법률 정보"

const escapeXml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

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

  const template = fs.readFileSync(templatePath, "utf-8")
  const imagePath = `/images/cases/${slug}.png`

  let result = template
    .replaceAll("{{CASE_NAME}}", caseName)
    .replaceAll("{{IMAGE_PATH}}", imagePath)
    .replaceAll("{{SLUG}}", slug)

  fixedNumbers.forEach((num) => {
    const realExt = imageExtMap[num]

    if (!realExt) return

    result = result.replace(
      new RegExp(`template-${num}\\.(png|jpg|jpeg|gif)`, "g"),
      `${slug}-${num}${realExt}`
    )
  })

  fs.writeFileSync(outputPath, result, "utf-8")

  console.log("")
  console.log("MDX 생성 완료")
  console.log(`/cases/${slug}`)
})()