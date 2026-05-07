/**
 * 신규 사기 의심 업체 일괄 감시 목록 MDX 생성기
 *
 * 사용법:
 *   npm run case-watchlist "리스트명" "한글 상호명,영문 상호명,사이트명,사기유형,사이트주소,리딩방명칭" ...
 *
 * 항목 형식 (쉼표 구분, 순서 엄수):
 *   1. 한글 상호명 : 업체 한글 상호명             (없으면 빈칸 → -)
 *   2. 영문 상호명 : 업체 영문 상호명             (없으면 빈칸 → -)
 *   3. 사이트명    : 사이트 이름/슬러그           (없으면 빈칸 → -)
 *   4. 사기유형    : 쇼핑몰 사칭 / 리딩방 사기 등 (기본값: 사칭 사기)
 *   5. 사이트주소  : 도메인 (예: site.com)        (없으면 빈칸 → -)
 *   6. 리딩방명칭  : 카카오톡·텔레그램 방 이름    (없으면 빈칸 → -)
 *
 * 예시 (PowerShell — 줄 이음에 백틱 사용):
 *   npm run case-watchlist "신규 사기 의심 업체 리스트-5월7일" `
 *     "퍼스트몰,fistmal,,쇼핑몰 사칭,fistmall.com," `
 *     "올스프링,AllSpring,allspring,리딩방 사기,allspring.kr,AllSpring 전문가방"
 *
 * 생성 파일:
 *   content/daeonlawfintech/cases/{slug}.mdx      (케이스 본문)
 *   content/daeonlawfintech/cases/{slug}.keywords  (키워드 목록)
 *   public/images/cases/{slug}.png                 (OG 썸네일)
 *   public/images/cases/{slug}.avif                (페이지 대표 이미지)
 *
 * 특징:
 *   - caseGroupId / representativeSlug 없음 (그룹핑 없음)
 *   - 여러 업체를 1개 MDX에 통합 → 키워드 밀도 확보
 *   - 이미지 자동 생성 (sharp 사용)
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const casesDir = path.join(__dirname, "..", "content", "daeonlawfintech", "cases")

// ── 인수 파싱 ────────────────────────────────────────────────────────────────
const [listName, ...itemArgs] = process.argv.slice(2)

if (!listName || itemArgs.length === 0) {
  console.error(`
사용법:
  npm run case-watchlist "리스트명" "한글 상호명,영문 상호명,사이트명,사기유형,사이트주소,리딩방명칭" ...

항목 형식 (쉼표 구분, 순서 엄수):
  1. 한글 상호명 : 업체 한글 상호명             (없으면 빈칸 → -)
  2. 영문 상호명 : 업체 영문 상호명             (없으면 빈칸 → -)
  3. 사이트명    : 사이트 이름/슬러그           (없으면 빈칸 → -)
  4. 사기유형    : 쇼핑몰 사칭 / 리딩방 사기 등 (기본값: 사칭 사기)
  5. 사이트주소  : 도메인 (예: site.com)        (없으면 빈칸 → -)
  6. 리딩방명칭  : 카카오톡·텔레그램 방 이름    (없으면 빈칸 → -)

예시 (PowerShell):
  npm run case-watchlist "신규 사기 의심 업체 리스트-5월7일" \`
    "퍼스트몰,fistmal,,쇼핑몰 사칭,fistmall.com," \`
    "올스프링,AllSpring,allspring,리딩방 사기,allspring.kr,AllSpring 전문가방"
`)
  process.exit(1)
}

// ── 도메인 유효성 검사 (TLD 포함 여부 확인) ──────────────────────────────────
const isValidDomain = (s) => /\.[a-zA-Z]{2,}$/.test(s)

// ── 항목 파싱 ────────────────────────────────────────────────────────────────
const items = itemArgs.map((arg, i) => {
  const parts = arg.split(",").map((s) => s.trim())
  return {
    korName:    parts[0] || "",          // 1. 한글 상호명
    engName:    parts[1] || "",          // 2. 영문 상호명
    siteName:   parts[2] || "",          // 3. 사이트명
    type:       parts[3] || "사칭 사기", // 4. 사기유형
    siteUrl:    parts[4] || "",          // 5. 사이트주소 (도메인)
    ridingbang: parts[5] || "",          // 6. 리딩방명칭
  }
})

// ── 슬러그 생성 ───────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

const slug = listName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const mdxPath = path.join(casesDir, `${slug}.mdx`)
const keywordsPath = path.join(casesDir, `${slug}.keywords`)

if (fs.existsSync(mdxPath)) {
  console.error(`❌ 이미 존재하는 파일: ${mdxPath}`)
  console.error("   다른 리스트명을 사용하거나 기존 파일을 삭제 후 재실행하세요.")
  process.exit(1)
}

// ── 키워드 목록 생성 ─────────────────────────────────────────────────────────
const keywords = []
items.forEach(({ korName, engName, siteName, type, siteUrl, ridingbang }) => {
  if (korName)   keywords.push(korName)
  if (engName)   keywords.push(engName)
  if (siteName)  keywords.push(siteName)
  if (siteUrl && isValidDomain(siteUrl)) {
    keywords.push(siteUrl)
    const root = siteUrl.split(".")[0]
    if (root && root !== siteName && root !== engName && root !== korName) keywords.push(root)
  }
  const primaryName = korName || engName || siteName
  if (primaryName) {
    keywords.push(`${primaryName} 사기`)
    keywords.push(`${primaryName} 사칭`)
  }
  if (engName && engName !== primaryName) keywords.push(`${engName} 사기`)
  if (ridingbang) keywords.push(ridingbang)
  keywords.push(type)
})

// ── MDX 본문 생성 ─────────────────────────────────────────────────────────────
const seoTitle = `${listName} | 사기 의심 업체 경보`
const caseName = listName

const itemSections = items
  .map(({ korName, engName, siteName, type, siteUrl, ridingbang }, i) => {
    const num = i + 1
    const fullSiteUrl = siteUrl && isValidDomain(siteUrl) ? `https://${siteUrl}` : ""

    const displayKor     = korName    || "-"
    const displayEng     = engName    || "-"
    const displaySite    = siteName   || "-"
    const displayUrl     = fullSiteUrl || "-"
    const displayRiding  = ridingbang || "-"

    // 섹션 제목: 한글 상호명 우선, 없으면 영문, 없으면 사이트명
    const titleName = korName || engName || siteName || `업체${num}`
    const subLabel  = engName && engName !== titleName ? ` / ${engName}` : ""

    return `
## ${num}. ${titleName}${subLabel} — ${type}

${titleName}${subLabel}은 피해 상담을 통해 신규로 접수된 **${type}** 의심 업체입니다.

<table className="case-scam-table case-watchlist-table">
  <colgroup>
    <col style={{ width: "110px" }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th>항목</th>
      <th>내용</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>한글 상호명</td>
      <td>${displayKor}</td>
    </tr>
    <tr>
      <td>영문 상호명</td>
      <td>${displayEng}</td>
    </tr>
    <tr>
      <td>사이트명</td>
      <td>${displaySite}</td>
    </tr>
    <tr>
      <td>사이트 주소</td>
      <td>${displayUrl}</td>
    </tr>
    <tr>
      <td>리딩방 명칭</td>
      <td>${displayRiding}</td>
    </tr>
    <tr>
      <td>사기 유형</td>
      <td>${type}</td>
    </tr>
  </tbody>
</table>

**피해 특징:**
- 정상 플랫폼을 사칭하거나 실제로 존재하지 않는 수익 구조를 내세워 입금을 유도합니다.
- 출금 요청 시 세금·보증금·수수료 등을 명목으로 추가 입금을 요구합니다.
- ${titleName}${subLabel} 명칭으로 접근을 받았다면 추가 입금 전에 반드시 피해 여부를 확인하세요.
`
  })
  .join("\n---\n")

const primaryNames = items.map((it) => it.korName || it.engName || it.siteName).filter(Boolean).join(", ")
// 유효한 도메인만 주의 도메인 목록에 포함
const validDomains = items.filter((it) => it.siteUrl && isValidDomain(it.siteUrl)).map((it) => it.siteUrl).join(", ")

const mdxContent = `---
title: "${seoTitle}"
caseName: "${caseName}"
description: "${primaryNames} 등 신규 사기 의심 업체 경보 및 피해 대응 안내"
slug: "${slug}"
publishedAt: "${today}"
---

## ${listName} — 신규 사기 의심 업체 경보

대온 법률사무소 핀테크센터에서 ${today} 기준으로 접수된 신규 피해 상담을 바탕으로,
주의가 필요한 의심 업체 목록을 안내드립니다.

아래 업체명 또는 사이트 주소로 접근을 받으셨다면 **추가 입금 전에 반드시 상담**을 받으시기 바랍니다.

> **주의 업체:** ${primaryNames}
>
> **주의 도메인:** ${validDomains || "목록 참고"}

---
${itemSections}

---

## 공통 피해 대응 요령

위 업체들로부터 피해를 입으셨거나 현재 진행 중이라면 아래 순서로 즉시 대응하세요.

1. **추가 입금 즉시 중단** — 어떤 명목으로든 추가 요구에 응하지 마세요.
2. **증거 확보** — 대화 내역, 입금 내역, 사이트 주소, 담당자 연락처를 캡처해 보관하세요.
3. **전문가 상담** — 초기 대응 속도가 피해 회복률에 직접적인 영향을 미칩니다.

상담은 24시간 접수 가능하며, 초기 상담은 무료입니다.

👉 대온 법률사무소 핀테크센터: https://daeonlawfintech.com
👉 네이버 카페 (피해 사례 공유): https://cafe.naver.com/daeonlawfintech
`

// ── 파일 저장 ────────────────────────────────────────────────────────────────
if (!fs.existsSync(casesDir)) {
  fs.mkdirSync(casesDir, { recursive: true })
}

fs.writeFileSync(mdxPath, mdxContent, "utf-8")
fs.writeFileSync(keywordsPath, [...new Set(keywords)].join("\n"), "utf-8")

// ── 이미지 생성 ───────────────────────────────────────────────────────────────
const templatePath = path.join(__dirname, "..", "public", "images", "templates", "case-template.png")
const imageDir = path.join(__dirname, "..", "public", "images", "cases")
const imagePngPath = path.join(imageDir, `${slug}.png`)
const imageAvifPath = path.join(imageDir, `${slug}.avif`)

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true })
}

const escapeXml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

// 긴 제목은 두 줄로 분할 (24자 기준)
const MAX_LINE = 24
let titleLine1 = listName
let titleLine2 = ""
if (listName.length > MAX_LINE) {
  const breakAt = listName.lastIndexOf(" ", MAX_LINE) > 0
    ? listName.lastIndexOf(" ", MAX_LINE)
    : MAX_LINE
  titleLine1 = listName.slice(0, breakAt)
  titleLine2 = listName.slice(breakAt).trim()
}

const titleY1 = titleLine2 ? "110" : "135"
const titleY2 = "168"
const subtitleY = titleLine2 ? "210" : "188"

const svgOverlay = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title {
      fill: #ffffff;
      font-size: 54px;
      font-weight: 900;
      font-family: "Arial", sans-serif;
      letter-spacing: -2px;
    }
    .subtitle {
      fill: #ffffff;
      font-size: 26px;
      font-weight: 700;
      font-family: "Arial", sans-serif;
      letter-spacing: -1px;
    }
  </style>
  <rect x="0" y="0" width="1200" height="630" fill="rgba(0,0,0,0.28)" />
  <text x="600" y="${titleY1}" text-anchor="middle" class="title">${escapeXml(titleLine1)}</text>
  ${titleLine2 ? `<text x="600" y="${titleY2}" text-anchor="middle" class="title">${escapeXml(titleLine2)}</text>` : ""}
  <text x="600" y="${subtitleY}" text-anchor="middle" class="subtitle">피해 회복을 위한 법률 정보</text>
</svg>`

let imageStatus = ""
if (fs.existsSync(templatePath)) {
  try {
    const svgBuf = Buffer.from(svgOverlay)

    await sharp(templatePath)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .composite([{ input: svgBuf, top: 0, left: 0 }])
      .png({ quality: 90 })
      .toFile(imagePngPath)

    await sharp(templatePath)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .composite([{ input: svgBuf, top: 0, left: 0 }])
      .avif({ quality: 72, effort: 6 })
      .toFile(imageAvifPath)

    imageStatus = `🖼️  PNG  : ${imagePngPath}\n🖼️  AVIF : ${imageAvifPath}`
  } catch (err) {
    imageStatus = `⚠️  이미지 생성 실패: ${err.message}`
  }
} else {
  imageStatus = `⚠️  템플릿 없음 (${templatePath}) — 이미지 미생성`
}

console.log(`
✅ 감시 목록 케이스 생성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 MDX  : ${mdxPath}
🔑 키워드: ${keywordsPath}
${imageStatus}
🔗 URL  : https://daeonlawfintech.com/cases/${encodeURIComponent(slug)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 등록 업체 (${items.length}개):
${items.map((it, i) => {
  const name = it.korName || it.engName || it.siteName || `업체${i+1}`
  const eng  = it.engName && it.engName !== name ? ` / ${it.engName}` : ""
  const site = it.siteName ? ` [사이트명: ${it.siteName}]` : ""
  const url  = it.siteUrl  ? ` [${it.siteUrl}]` : ""
  const rb   = it.ridingbang ? ` (리딩방: ${it.ridingbang})` : ""
  return `  ${i + 1}. ${name}${eng}${site}${url}${rb}  — ${it.type}`
}).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  그룹핑 없음 (caseGroupId / representativeSlug 미설정)
`)
