import fs from "fs";
import path from "path";
import sharp from "sharp";

const caseName = process.argv.slice(2).join(" ").trim();

if (!caseName) {
  console.error('사건명을 입력하세요. 예: npm run case-image "VIP603"');
  process.exit(1);
}

const root = process.cwd();

const templatePath = path.join(
  root,
  "public",
  "images",
  "templates",
  "case-template.png"
);

const outputDir = path.join(root, "public", "images", "cases");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const safeFileName = caseName
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, "-");

const outputFileName = `${safeFileName}-사기.avif`;
const outputPath = path.join(outputDir, outputFileName);

const titleText = `${caseName} (사칭) 사기`;
const subText = "피해 회복을 위한 법률 정보";

const escapeXml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/*
  1200 x 630 기준
  전체 높이 630px
  상단 1/3 영역 = 0px ~ 210px

  title y="135"
  subtitle y="188"

  즉 글자가 이미지 중앙이 아니라
  상단 1/3 영역 안에서 가운데 정렬됩니다.
*/

const svgOverlay = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title {
      fill: #ffffff;
      font-size: 58px;
      font-weight: 900;
      font-family: "Arial", sans-serif;
      letter-spacing: -2px;
    }

    .subtitle {
      fill: #ffffff;
      font-size: 28px;
      font-weight: 700;
      font-family: "Arial", sans-serif;
      letter-spacing: -1px;
    }
  </style>

  <rect x="0" y="0" width="1200" height="630" fill="rgba(0,0,0,0.28)" />

  <text
    x="600"
    y="135"
    text-anchor="middle"
    class="title"
  >${escapeXml(titleText)}</text>

  <text
    x="600"
    y="188"
    text-anchor="middle"
    class="subtitle"
  >${escapeXml(subText)}</text>
</svg>
`;

await sharp(templatePath)
  .resize(1200, 630, {
    fit: "cover",
    position: "center",
  })
  .composite([
    {
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0,
    },
  ])
  .avif({
    quality: 72,
    effort: 6,
  })
  .toFile(outputPath);

console.log(`대표이미지 생성 완료 → /images/cases/${outputFileName}`);