/**
 * 두 MDX 파일을 대표 사건 그룹으로 연동합니다.
 *
 * 사용법:
 *   npm run case-link "variant-slug" "representative-slug"
 *
 * 예시:
 *   npm run case-link "커넥트라-사기-connectra-쇼핑몰-사칭" "connectra-사기"
 *
 * 동작:
 *   1. variant 파일: caseGroupId, groupRole=variant, groupOrder, representativeSlug 설정
 *   2. representative 파일: caseGroupId, groupRole=representative, groupOrder=1 설정
 *   3. 이미 그룹이 있는 경우 기존 caseGroupId 재사용
 *   4. groupOrder 자동 계산 (기존 그룹 내 최대값 + 1)
 */

import fs from "fs"
import path from "path"

// ─── CLI 인수 ───────────────────────────────────────────────────────────────
const [, , variantSlug, repSlug] = process.argv

if (!variantSlug || !repSlug) {
  console.error("❌ 사용법: npm run case-link \"variant-slug\" \"representative-slug\"")
  console.error("   예시:   npm run case-link \"커넥트라-사기-connectra-쇼핑몰-사칭\" \"connectra-사기\"")
  process.exit(1)
}

if (variantSlug === repSlug) {
  console.error("❌ variant와 representative가 동일한 파일입니다.")
  process.exit(1)
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

const variantPath = path.join(casesDir, `${variantSlug}.mdx`)
const repPath     = path.join(casesDir, `${repSlug}.mdx`)

if (!fs.existsSync(variantPath)) {
  console.error(`❌ variant 파일 없음: ${variantPath}`)
  process.exit(1)
}
if (!fs.existsSync(repPath)) {
  console.error(`❌ representative 파일 없음: ${repPath}`)
  process.exit(1)
}

// ─── 프론트매터 유틸 ────────────────────────────────────────────────────────
function getFm(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*"([^"\\r\\n]*)"`, "m"))
  return m ? m[1].trim() : null
}

/**
 * 프론트매터 키가 있으면 값을 교체하고, 없으면 닫는 --- 직전에 삽입합니다.
 */
function setFm(content, key, value) {
  const pattern = new RegExp(`^(${key}:\\s*")([^"\\r\\n]*)(")(\\r?)$`, "m")
  if (pattern.test(content)) {
    return content.replace(pattern, `$1${value}$3$4`)
  }
  // 없으면 frontmatter 닫는 --- 직전에 삽입
  const firstDash = content.indexOf("---")
  const endFm = content.indexOf("\n---", firstDash + 3)
  if (endFm === -1) return content
  return content.slice(0, endFm) + `\n${key}: "${value}"` + content.slice(endFm)
}

/**
 * 프론트매터 키가 있으면 해당 줄 전체를 삭제합니다.
 */
function removeFm(content, key) {
  return content.replace(new RegExp(`^${key}:\\s*"[^"\\r\\n]*"\\r?\\n`, "m"), "")
}

// ─── 파일 읽기 ──────────────────────────────────────────────────────────────
let variantContent = fs.readFileSync(variantPath, "utf8")
let repContent     = fs.readFileSync(repPath, "utf8")

const variantCaseName = getFm(variantContent, "caseName") || variantSlug
const repCaseName     = getFm(repContent, "caseName") || repSlug

// ─── caseGroupId 결정 ────────────────────────────────────────────────────────
// 우선순위: rep 기존 caseGroupId > variant 기존 caseGroupId > rep aliases 첫 토큰 > rep slug 첫 토큰
let caseGroupId =
  getFm(repContent, "caseGroupId") ||
  getFm(variantContent, "caseGroupId") ||
  (() => {
    const aliases = getFm(repContent, "aliases")
    if (aliases) return aliases.split(/[,\s]+/)[0].trim()
    // slug에서 한글/영문 첫 의미 토큰 추출
    const token = repSlug
      .split("-")
      .find(t => t.length >= 2 && !/^(사기|사칭|피해|사건|안내)$/.test(t))
    return token || repSlug.split("-")[0]
  })()

// ─── 기존 그룹 내 groupOrder 최대값 계산 ────────────────────────────────────
const allFiles = fs.readdirSync(casesDir).filter(f => f.endsWith(".mdx") && !f.startsWith("신규-"))
let maxGroupOrder = 1
for (const f of allFiles) {
  const c = fs.readFileSync(path.join(casesDir, f), "utf8")
  const gid = getFm(c, "caseGroupId")
  if (gid !== caseGroupId) continue
  const order = parseInt(getFm(c, "groupOrder") || "0", 10)
  if (order > maxGroupOrder) maxGroupOrder = order
}
const variantGroupOrder = String(maxGroupOrder + 1)

// ─── 기존 연동 상태 체크 ────────────────────────────────────────────────────
const prevRepSlug   = getFm(variantContent, "representativeSlug")
const prevGroupRole = getFm(variantContent, "groupRole")
const repGroupRole  = getFm(repContent, "groupRole")

if (prevRepSlug) {
  console.log(`⚠️  variant가 이미 다른 대표 사건에 연동되어 있습니다: ${prevRepSlug}`)
  console.log("   기존 연동을 새 대표 사건으로 교체합니다.\n")
}
if (repGroupRole === "variant") {
  console.log(`⚠️  representative로 지정한 파일이 현재 variant입니다: ${repSlug}`)
  console.log("   해당 파일을 representative로 승격합니다.\n")
}

// ─── variant 파일 업데이트 ───────────────────────────────────────────────────
// 기존 그룹 필드 제거 후 새로 삽입 (순서 보장)
variantContent = removeFm(variantContent, "caseGroupId")
variantContent = removeFm(variantContent, "groupRole")
variantContent = removeFm(variantContent, "groupOrder")
variantContent = removeFm(variantContent, "representativeSlug")

variantContent = setFm(variantContent, "caseGroupId",       caseGroupId)
variantContent = setFm(variantContent, "groupRole",         "variant")
variantContent = setFm(variantContent, "groupOrder",        variantGroupOrder)
variantContent = setFm(variantContent, "representativeSlug", repSlug)

// ─── representative 파일 업데이트 ───────────────────────────────────────────
// 대표 사건은 representativeSlug 필드 불필요 → 제거
repContent = removeFm(repContent, "caseGroupId")
repContent = removeFm(repContent, "groupRole")
repContent = removeFm(repContent, "groupOrder")
repContent = removeFm(repContent, "representativeSlug")

repContent = setFm(repContent, "caseGroupId", caseGroupId)
repContent = setFm(repContent, "groupRole",   "representative")
repContent = setFm(repContent, "groupOrder",  "1")

// ─── 파일 저장 ──────────────────────────────────────────────────────────────
fs.writeFileSync(variantPath, variantContent, "utf8")
fs.writeFileSync(repPath,     repContent,     "utf8")

// ─── 결과 출력 ──────────────────────────────────────────────────────────────
console.log(`\n✅ 대표 사건 연동 완료`)
console.log(`   caseGroupId : "${caseGroupId}"`)
console.log(``)
console.log(`   [대표 사건]  ${repSlug}`)
console.log(`               caseName: "${repCaseName}"`)
console.log(`               groupRole: "representative" / groupOrder: "1"`)
console.log(``)
console.log(`   [연동 사건]  ${variantSlug}`)
console.log(`               caseName: "${variantCaseName}"`)
console.log(`               groupRole: "variant" / groupOrder: "${variantGroupOrder}"`)
console.log(`               representativeSlug: "${repSlug}"`)
console.log(``)
console.log(`   → /cases/${variantSlug} 페이지 하단에 "관련 대표 사건 안내" 섹션이 표시됩니다.`)
