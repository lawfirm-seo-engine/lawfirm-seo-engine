const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const caseName = process.argv[2]

if (!caseName) {
  console.error("사건명을 입력하세요.")
  console.error("예: npm run case-create 올스프링글로벌인베스트")
  process.exit(1)
}

/*
slug 생성
*/

const slug = caseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

/*
경로 설정
*/

const root = process.cwd()

const casesDir = path.join(
  root,
  "content",
  "daeonlawfintech",
  "cases"
)

const templatePath = path.join(
  casesDir,
  "_template.mdx"
)

const outputPath = path.join(
  casesDir,
  `${slug}.mdx`
)

/*
템플릿 존재 확인
*/

if (!fs.existsSync(templatePath)) {
  console.error("_template.mdx 파일이 없습니다.")
  process.exit(1)
}

/*
중복 파일 방지
*/

if (fs.existsSync(outputPath)) {
  console.error("이미 존재하는 MDX 파일입니다.")
  process.exit(1)
}

/*
대표이미지 생성 준비
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
  fs.mkdirSync(outputImageDir, { recursive: true })
}

/*
대표이미지 파일명 (slug 기준 통일)
*/

const avifPath = path.join(
  outputImageDir,
  `${slug}.avif`
)

const pngPath = path.join(
  outputImageDir,
  `${slug}.png`
)

const titleText = `${caseName}`
const subText = "피해 회복을 위한 법률 정보"

/*
SVG overlay 생성
*/

const svgOverlay = `
<svg width="1200" height="630">
<style>
.title {
fill:white;
font-size:58px;
font-weight:900;
text-anchor:middle;
}

.subtitle {
fill:white;
font-size:28px;
font-weight:700;
text-anchor:middle;
}
</style>

<rect width="1200" height="630"
fill="rgba(0,0,0,0.28)" />

<text x="600" y="135" class="title">
${titleText}
</text>

<text x="600" y="188" class="subtitle">
${subText}
</text>

</svg>
`

;(async () => {

  /*
  AVIF 생성
  */

  await sharp(templateImagePath)
    .resize(1200, 630, {
      fit: "cover",
      position: "center"
    })
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }
    ])
    .avif({
      quality: 72,
      effort: 6
    })
    .toFile(avifPath)

  console.log("대표이미지 AVIF 생성 완료")


  /*
  PNG 생성 (네이버 검색 썸네일용 대표이미지)
  */

  await sharp(templateImagePath)
    .resize(1200, 630, {
      fit: "cover",
      position: "center"
    })
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }
    ])
    .png({
      quality: 90
    })
    .toFile(pngPath)

  console.log("대표이미지 PNG 생성 완료")


  /*
  MDX 생성
  */

  const template = fs.readFileSync(templatePath, "utf-8")

  /*
  네이버 검색 썸네일 대응 → PNG 연결
  */

  const imagePath = `/images/cases/${slug}.png`

  const imageAlt =
    `${caseName} 사기 사칭 피해 회복을 위한 법률 정보 이미지`

  const imageCaption =
    `${caseName} 사기 사칭 피해 사례 및 대응 방법 안내`

  const imageDescription =
    `${caseName} 사기 사칭 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`

  const result = template
    .replaceAll("{{CASE_NAME}}", caseName)
    .replaceAll("{{IMAGE_PATH}}", imagePath)
    .replaceAll("{{IMAGE_ALT}}", imageAlt)
    .replaceAll("{{IMAGE_CAPTION}}", imageCaption)
    .replaceAll("{{IMAGE_DESCRIPTION}}", imageDescription)
    .replaceAll("{{SLUG}}", slug)

  fs.writeFileSync(
    outputPath,
    result,
    "utf-8"
  )

  console.log("")
  console.log("MDX 생성 완료:")
  console.log(outputPath)

  console.log("")
  console.log("접속 주소:")
  console.log(`/cases/${slug}`)

})()