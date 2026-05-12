/**
 * MDX 파일을 대표 사건 그룹으로 연동합니다.
 *
 * ─── 사용법 ──────────────────────────────────────────────────────────────────
 *
 *   # 단일 variant
 *   npm run case-link "variant-slug" "representative-slug"
 *
 *   # 다중 variant (마지막 인수가 representative)
 *   npm run case-link "variant1" "variant2" "variant3" "representative-slug"
 *
 * ─── 예시 ───────────────────────────────────────────────────────────────────
 *
 *   npm run case-link "커넥트라-사기-connectra-쇼핑몰-사칭" "connectra-사기"
 *
 *   npm run case-link \
 *     "zeriumx-사기-코인-환불" \
 *     "zeriumx-사기-스테이킹-사칭" \
 *     "zeriumx-사기-출금불가" \
 *     "zeriumx-사기-제리움엑스-코인환불-사칭"
 *
 * ─── 동작 ───────────────────────────────────────────────────────────────────
 *
 *   1. variant 파일(들): caseGroupId, groupRole=variant, groupOrder, representativeSlug 설정
 *   2. representative 파일: caseGroupId, groupRole=representative, groupOrder=1 설정
 *   3. 이미 그룹이 있는 경우 기존 caseGroupId 재사용
 *   4. groupOrder 자동 계산 (기존 그룹 내 최대값 + 1씩 증가)
 */

import fs   from "fs"
import path from "path"

// ─── CLI 인수 파싱 ───────────────────────────────────────────────────────────
// 마지막 인수 = representative, 나머지 = variant(들)
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error("❌ 사용법: npm run case-link \"variant\" \"representative\"")
  console.error("           npm run case-link \"variant1\" \"variant2\" \"variant3\" \"representative\"")
  process.exit(1)
}

const repSlug      = args[args.length - 1]
const variantSlugs = args.slice(0, -1)

// 중복 slug 체크
const dupSlug = variantSlugs.find(s => s === repSlug)
if (dupSlug) {
  console.error(`❌ variant와 representative가 동일합니다: "${dupSlug}"`)
  process.exit(1)
}
const uniqueVariants = [...new Set(variantSlugs)]
if (uniqueVariants.length !== variantSlugs.length) {
  console.warn("⚠️  중복된 variant slug가 있어 제거했습니다.")
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const repPath  = path.join(casesDir, `${repSlug}.mdx`)

if (!fs.existsSync(repPath)) {
  console.error(`❌ representative 파일 없음: ${repPath}`)
  process.exit(1)
}
for (const vs of uniqueVariants) {
  const vp = path.join(casesDir, `${vs}.mdx`)
  if (!fs.existsSync(vp)) {
    console.error(`❌ variant 파일 없음: ${vp}`)
    process.exit(1)
  }
}

// ─── 프론트매터 유틸 ────────────────────────────────────────────────────────
function getFm(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*"([^"\\r\\n]*)"`, "m"))
  return m ? m[1].trim() : null
}

function setFm(content, key, value) {
  const pattern = new RegExp(`^(${key}:\\s*")([^"\\r\\n]*)(")(\\r?)$`, "m")
  if (pattern.test(content)) {
    return content.replace(pattern, `$1${value}$3$4`)
  }
  const firstDash = content.indexOf("---")
  const endFm     = content.indexOf("\n---", firstDash + 3)
  if (endFm === -1) return content
  return content.slice(0, endFm) + `\n${key}: "${value}"` + content.slice(endFm)
}

function removeFm(content, key) {
  return content.replace(new RegExp(`^${key}:\\s*"[^"\\r\\n]*"\\r?\\n`, "m"), "")
}

// ─── representative 파일 읽기 ────────────────────────────────────────────────
let repContent = fs.readFileSync(repPath, "utf8")
const repCaseName  = getFm(repContent, "caseName") || repSlug
const repGroupRole = getFm(repContent, "groupRole")

if (repGroupRole === "variant") {
  console.log(`⚠️  representative로 지정한 파일이 현재 variant입니다: "${repSlug}"`)
  console.log("   해당 파일을 representative로 승격합니다.\n")
}

// ─── caseGroupId 결정 ────────────────────────────────────────────────────────
// 우선순위: rep 기존 > variant 기존 > rep aliases 첫 토큰 > rep slug 첫 토큰
let caseGroupId = getFm(repContent, "caseGroupId")

if (!caseGroupId) {
  for (const vs of uniqueVariants) {
    const vc = fs.readFileSync(path.join(casesDir, `${vs}.mdx`), "utf8")
    const gid = getFm(vc, "caseGroupId")
    if (gid) { caseGroupId = gid; break }
  }
}

if (!caseGroupId) {
  const aliases = getFm(repContent, "aliases")
  if (aliases) {
    caseGroupId = aliases.split(/[,\s]+/)[0].trim()
  } else {
    const token = repSlug
      .split("-")
      .find(t => t.length >= 2 && !/^(사기|사칭|피해|사건|안내)$/.test(t))
    caseGroupId = token || repSlug.split("-")[0]
  }
}

// ─── 기존 그룹 내 groupOrder 최대값 계산 ────────────────────────────────────
const allFiles = fs.readdirSync(casesDir).filter(f => f.endsWith(".mdx") && !f.startsWith("_"))
let maxGroupOrder = 1
for (const f of allFiles) {
  const c     = fs.readFileSync(path.join(casesDir, f), "utf8")
  const gid   = getFm(c, "caseGroupId")
  if (gid !== caseGroupId) continue
  const order = parseInt(getFm(c, "groupOrder") || "0", 10)
  if (order > maxGroupOrder) maxGroupOrder = order
}

// ─── representative 파일 업데이트 ───────────────────────────────────────────
repContent = removeFm(repContent, "caseGroupId")
repContent = removeFm(repContent, "groupRole")
repContent = removeFm(repContent, "groupOrder")
repContent = removeFm(repContent, "representativeSlug")

repContent = setFm(repContent, "caseGroupId", caseGroupId)
repContent = setFm(repContent, "groupRole",   "representative")
repContent = setFm(repContent, "groupOrder",  "1")

fs.writeFileSync(repPath, repContent, "utf8")

// ─── variant 파일(들) 업데이트 ──────────────────────────────────────────────
console.log(`\n✅ 대표 사건 연동 완료`)
console.log(`   caseGroupId : "${caseGroupId}"`)
console.log(``)
console.log(`   [대표 사건]  ${repSlug}`)
console.log(`               caseName: "${repCaseName}"`)
console.log(`               groupRole: "representative" / groupOrder: "1"`)
console.log(``)

for (let i = 0; i < uniqueVariants.length; i++) {
  const vs          = uniqueVariants[i]
  const vp          = path.join(casesDir, `${vs}.mdx`)
  let   vc          = fs.readFileSync(vp, "utf8")
  const vCaseName   = getFm(vc, "caseName") || vs
  const prevRepSlug = getFm(vc, "representativeSlug")
  const newOrder    = String(maxGroupOrder + 1 + i)

  if (prevRepSlug && prevRepSlug !== repSlug) {
    console.log(`   ⚠️  "${vs}" 가 이미 다른 대표에 연동되어 있었습니다: ${prevRepSlug}`)
    console.log(`      → 새 대표 사건으로 교체합니다.`)
  }

  vc = removeFm(vc, "caseGroupId")
  vc = removeFm(vc, "groupRole")
  vc = removeFm(vc, "groupOrder")
  vc = removeFm(vc, "representativeSlug")

  vc = setFm(vc, "caseGroupId",        caseGroupId)
  vc = setFm(vc, "groupRole",          "variant")
  vc = setFm(vc, "groupOrder",         newOrder)
  vc = setFm(vc, "representativeSlug", repSlug)

  fs.writeFileSync(vp, vc, "utf8")

  console.log(`   [연동 ${String(i + 1).padStart(2)}]     ${vs}`)
  console.log(`               caseName: "${vCaseName}"`)
  console.log(`               groupRole: "variant" / groupOrder: "${newOrder}"`)
  console.log(`               representativeSlug: "${repSlug}"`)
  console.log(``)
}

console.log(`   → variant 페이지 하단에 "관련 대표 사건 안내" 섹션이 표시됩니다.`)
console.log(`   → 대표 페이지에 "동일 유형 관련 사건 목록" 내부링크가 표시됩니다.`)
