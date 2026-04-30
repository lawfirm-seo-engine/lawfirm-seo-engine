const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

/*
========================================
입력 사건명
========================================
*/

const caseName = process.argv[2]

if (!caseName) {
  console.error("사건명을 입력하세요.")
  process.exit(1)
}

const cleanCaseName = caseName.trim().replace(/\s+/g, " ")
const caseDisplayName = cleanCaseName.includes("사칭")
  ? cleanCaseName
  : `${cleanCaseName} (사칭)`

/*
========================================
slug 생성
========================================
*/

const slug = cleanCaseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const root = process.cwd()

const casesDir = path.join(
  root,
  "content",
  "daeonlawfintech",
  "cases"
)

const templatePath = path.join(casesDir, "_template.mdx")

const outputPath = path.join(
  casesDir,
  `${slug}.mdx`
)

if (!fs.existsSync(templatePath)) {
  console.error("_template.mdx 없음")
  process.exit(1)
}

if (fs.existsSync(outputPath)) {
  console.error("이미 존재")
  process.exit(1)
}

/*
========================================
cluster 정규화 엔진
========================================
*/

function normalizeCluster(text) {
  return text
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(
      /\.(com|net|org|co|kr|vip|shop|site|store|io)/g,
      ""
    )
    .replace(
      /사기|사칭|피해|사례|대응|거래소|쇼핑몰|리딩방|공모주|비상장|골드바/g,
      ""
    )
    .replace(
      /market|mall|shop|store|company|investment|finance|securities/g,
      ""
    )
    .replace(/[0-9]/g, "")
    .replace(/[^a-z가-힣]/g, "")
}

/*
========================================
대표 slug 자동 탐색
========================================
*/

function findRepresentativeSlug() {
  if (!fs.existsSync(casesDir)) return null

  const files = fs.readdirSync(casesDir)

  const current = normalizeCluster(slug)

  let candidate = null

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue
    if (file === "_template.mdx") continue

    const existSlug = file.replace(".mdx", "")

    const normalized = normalizeCluster(existSlug)

    if (
      normalized.includes(current) ||
      current.includes(normalized)
    ) {
      candidate = existSlug
      break
    }
  }

  return candidate
}

const representativeSlug =
  findRepresentativeSlug()

/*
========================================
대표 링크 삽입 블록 생성
========================================
*/

let representativeBlock = ""

if (representativeSlug) {
  representativeBlock = `

## 관련 대표 사건 안내

해당 사건은 아래 대표 사건과 동일 유형입니다.

👉 /cases/${representativeSlug}

`
}

/*
========================================
이미지 생성
========================================
*/

const templateImagePath = path.join(
  root,
  "public",
  "images",
  "templates",
  "case-template.png"
)

const outputImageDir = path.join(
  root,
  "public",
  "images",
  "cases"
)

if (!fs.existsSync(outputImageDir)) {
  fs.mkdirSync(outputImageDir, {
    recursive: true
  })
}

const pngPath = path.join(
  outputImageDir,
  `${slug}.png`
)

const avifPath = path.join(
  outputImageDir,
  `${slug}.avif`
)

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function splitTitleLines(text, maxLength = 18) {
  const words = text.split(" ")
  const lines = []
  let current = ""

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (next.length <= maxLength) {
      current = next
      return
    }

    if (current) {
      lines.push(current)
    }

    current = word
  })

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 2)
}

const titleLines = splitTitleLines(caseDisplayName)
const titleY = titleLines.length > 1 ? 105 : 130
const titleTspans = titleLines
  .map((line, index) => {
    const dy = index === 0 ? 0 : 72
    return `<tspan x="600" dy="${dy}">${escapeXml(line)}</tspan>`
  })
  .join("")

const svgOverlay = `
<svg width="1200" height="630">
  <style>
    .title {
      fill: #ffffff;
      font-size: 58px;
      font-weight: 900;
      text-anchor: middle;
      font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
    }

    .subtitle {
      fill: #ffffff;
      font-size: 28px;
      font-weight: 800;
      text-anchor: middle;
      font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
    }
  </style>

  <rect width="1200" height="630" fill="rgba(0,0,0,0.28)" />
  <text x="600" y="${titleY}" class="title">${titleTspans}</text>
  <text x="600" y="220" class="subtitle">피해 회복을 위한 법률 정보</text>
</svg>
`

async function generateImages() {
  const overlay = Buffer.from(svgOverlay)

  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: overlay }])
    .png({ quality: 90 })
    .toFile(pngPath)

  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: overlay }])
    .avif({ quality: 70 })
    .toFile(avifPath)

  console.log("대표 이미지 생성 완료")
}

/*
========================================
frontmatter 생성
========================================
*/

const seoTitle = `${caseDisplayName} 피해회복`

const seoDescription = `${cleanCaseName} 피해 사례 및 대응 전략 안내`

const frontmatter = `---
title: "${seoTitle}"
caseName: "${cleanCaseName}"
description: "${seoDescription}"
slug: "${slug}"
---

${representativeBlock}
`

/*
========================================
template 처리
========================================
*/

function buildMdx() {
  let template = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  const imagePath = `/images/cases/${slug}.png`

  template = template
    .replaceAll(
      "{{CASE_NAME}}",
      cleanCaseName
    )
    .replaceAll(
      "{{CASE_DISPLAY_NAME}}",
      caseDisplayName
    )
    .replaceAll(
      "{{IMAGE_PATH}}",
      imagePath
    )
    .replaceAll(
      "{{IMAGE_ALT}}",
      `${caseDisplayName} 피해 회복을 위한 법률 정보 이미지`
    )
    .replaceAll(
      "{{IMAGE_CAPTION}}",
      `${caseDisplayName} 피해 사례 및 대응 방법 안내`
    )
    .replaceAll(
      "{{IMAGE_DESCRIPTION}}",
      `${caseDisplayName} 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`
    )
    .replaceAll(
      "{{SLUG}}",
      slug
    )

  template =
    frontmatter +
    template.replace(
      /^---[\s\S]*?---\s*/,
      ""
    )

  fs.writeFileSync(
    outputPath,
    template,
    "utf-8"
  )

  console.log("MDX 생성 완료")
}

/*
========================================
실행
========================================
*/

;(async () => {
  await generateImages()

  buildMdx()

  console.log("")
  console.log(`/cases/${slug}`)
})()
