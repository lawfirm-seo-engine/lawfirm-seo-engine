/**
 * 잘못 연결된 MDX 그룹 연동을 해제합니다.
 *
 * ─── 사용법 ──────────────────────────────────────────────────────────────────
 *
 *   # 1. 단일 해제 — 지정한 파일에서만 그룹 필드 제거
 *   npm run case-unlink "slug"
 *
 *   # 2. 그룹 전체 해제 — 동일 caseGroupId를 가진 모든 파일에서 그룹 필드 제거
 *   npm run case-unlink "slug" --all
 *
 * ─── 예시 ───────────────────────────────────────────────────────────────────
 *
 *   npm run case-unlink "휴나인마켓-사기-팀미션-부업-쇼핑몰-사칭"
 *   npm run case-unlink "hovonaa-사기-호보나-부업-팀미션" --all
 *
 * ─── 동작 ───────────────────────────────────────────────────────────────────
 *
 *   단일 해제:
 *     1. 지정 파일에서 caseGroupId / groupRole / groupOrder / representativeSlug 제거
 *     2. 같은 그룹 내 나머지 파일의 groupOrder 재정렬 (1부터 순번 재부여)
 *     3. 그룹에 파일이 representative 1개만 남으면 해당 파일도 그룹 필드 전부 제거
 *     4. 해제 대상이 representative였으면 남은 variant들에게 경고 출력
 *
 *   전체 해제 (--all):
 *     1. 같은 caseGroupId를 가진 모든 파일에서 그룹 필드 전부 제거
 *     2. 모든 파일이 독립 페이지(그룹 없음) 상태로 변경
 */

import fs   from "fs"
import path from "path"

// ─── CLI 인수 파싱 ───────────────────────────────────────────────────────────
const args        = process.argv.slice(2)
const targetSlug  = args.find(a => !a.startsWith("--"))
const dissolveAll = args.includes("--all")

if (!targetSlug) {
  console.error("❌ 사용법: npm run case-unlink \"slug\" [--all]")
  console.error("   예시:   npm run case-unlink \"휴나인마켓-사기-팀미션-부업-쇼핑몰-사칭\"")
  console.error("           npm run case-unlink \"hovonaa-사기-호보나-부업-팀미션\" --all")
  process.exit(1)
}

const casesDir   = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const targetPath = path.join(casesDir, `${targetSlug}.mdx`)

if (!fs.existsSync(targetPath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${targetPath}`)
  process.exit(1)
}

// ─── 프론트매터 유틸 ────────────────────────────────────────────────────────
function getFm(content, key) {
  const m = content.match(new RegExp(`^${key}:\\s*["']?([^"'\\r\\n]*)["']?\\s*$`, "m"))
  return m ? m[1].trim() : null
}

/** 프론트매터 키-값 줄 1개 삭제 */
function removeFm(content, key) {
  return content.replace(
    new RegExp(`^${key}:\\s*["']?[^\\r\\n]*["']?\\r?\\n`, "m"),
    ""
  )
}

/** 프론트매터 키 존재 여부 */
function hasFm(content, key) {
  return new RegExp(`^${key}:`, "m").test(content)
}

/** 프론트매터 키가 있으면 값을 교체, 없으면 frontmatter 닫는 --- 직전에 삽입 */
function setFm(content, key, value) {
  const pattern = new RegExp(`^(${key}:\\s*["']?)([^"'\\r\\n]*)(['"]?)(\\r?)$`, "m")
  if (pattern.test(content)) {
    return content.replace(pattern, `$1${value}$3$4`)
  }
  const firstDash = content.indexOf("---")
  const endFm     = content.indexOf("\n---", firstDash + 3)
  if (endFm === -1) return content
  return content.slice(0, endFm) + `\n${key}: "${value}"` + content.slice(endFm)
}

/** 그룹 4개 필드 전부 제거 */
function clearGroupFields(content) {
  let c = content
  c = removeFm(c, "caseGroupId")
  c = removeFm(c, "groupRole")
  c = removeFm(c, "groupOrder")
  c = removeFm(c, "representativeSlug")
  return c
}

// ─── 대상 파일 읽기 ─────────────────────────────────────────────────────────
const targetContent  = fs.readFileSync(targetPath, "utf8")
const targetGroupId  = getFm(targetContent, "caseGroupId")
const targetRole     = getFm(targetContent, "groupRole")
const targetCaseName = getFm(targetContent, "caseName") || targetSlug

if (!targetGroupId && !targetRole) {
  console.log(`ℹ️  "${targetSlug}" 는 이미 그룹에 속해 있지 않습니다. 작업 없음.`)
  process.exit(0)
}

// ─── 그룹 전체 해제 모드 (--all) ────────────────────────────────────────────
if (dissolveAll) {
  const groupId = targetGroupId
  const allFiles = fs
    .readdirSync(casesDir)
    .filter(f => f.endsWith(".mdx") && !f.startsWith("_"))

  const groupFiles = allFiles.filter(f => {
    const c = fs.readFileSync(path.join(casesDir, f), "utf8")
    return getFm(c, "caseGroupId") === groupId
  })

  if (groupFiles.length === 0) {
    console.log(`ℹ️  caseGroupId "${groupId}" 를 가진 파일이 없습니다.`)
    process.exit(0)
  }

  console.log(`\n🗑️  그룹 전체 해제 — caseGroupId: "${groupId}"`)
  console.log(`   총 ${groupFiles.length}개 파일에서 그룹 필드를 제거합니다.\n`)

  for (const f of groupFiles) {
    const fp  = path.join(casesDir, f)
    const c   = fs.readFileSync(fp, "utf8")
    const cn  = getFm(c, "caseName") || f
    const cleaned = clearGroupFields(c)
    fs.writeFileSync(fp, cleaned, "utf8")
    console.log(`   ✅ ${f.replace(".mdx", "")}`)
    console.log(`      caseName: "${cn}"`)
  }

  console.log(`\n✅ 그룹 전체 해제 완료. 모든 파일이 독립 페이지 상태가 되었습니다.`)
  process.exit(0)
}

// ─── 단일 해제 모드 (기본) ──────────────────────────────────────────────────
console.log(`\n🔗 그룹 연결 해제: "${targetSlug}"`)
console.log(`   caseName  : "${targetCaseName}"`)
console.log(`   groupRole : "${targetRole || "(없음)"}"`)
console.log(`   caseGroupId: "${targetGroupId || "(없음)"}"`)
console.log("")

// 대상 파일에서 그룹 필드 제거
const cleaned = clearGroupFields(targetContent)
fs.writeFileSync(targetPath, cleaned, "utf8")
console.log(`   ✅ "${targetSlug}" — 그룹 필드 제거 완료`)

// ─── 같은 그룹 내 나머지 파일 처리 ─────────────────────────────────────────
if (!targetGroupId) {
  console.log(`\n✅ 해제 완료. (caseGroupId 없음 — 나머지 파일 처리 불필요)`)
  process.exit(0)
}

const allFiles = fs
  .readdirSync(casesDir)
  .filter(f => f.endsWith(".mdx") && !f.startsWith("_"))

// 같은 그룹의 나머지 파일 수집
const remainingGroup = allFiles
  .filter(f => {
    const slug = f.replace(".mdx", "")
    if (slug === targetSlug) return false
    const c = fs.readFileSync(path.join(casesDir, f), "utf8")
    return getFm(c, "caseGroupId") === targetGroupId
  })
  .map(f => {
    const fp      = path.join(casesDir, f)
    const c       = fs.readFileSync(fp, "utf8")
    return {
      file:      f,
      slug:      f.replace(".mdx", ""),
      filePath:  fp,
      content:   c,
      role:      getFm(c, "groupRole"),
      order:     parseInt(getFm(c, "groupOrder") || "999", 10),
      caseName:  getFm(c, "caseName") || f,
    }
  })
  .sort((a, b) => a.order - b.order)

// 대표 사건이 해제된 경우 경고
if (targetRole === "representative" && remainingGroup.length > 0) {
  const orphans = remainingGroup.filter(r => r.role === "variant")
  if (orphans.length > 0) {
    console.log("")
    console.log("   ⚠️  아래 variant 파일들이 이 페이지를 대표 사건으로 가리키고 있습니다.")
    console.log("      각 파일의 representativeSlug를 수동으로 재지정하거나,")
    console.log("      npm run case-unlink \"slug\" 로 개별 해제하세요:\n")
    orphans.forEach(o => {
      console.log(`      - ${o.slug}`)
      console.log(`        caseName: "${o.caseName}"`)
    })
  }
}

// 그룹에 representative만 1개 남은 경우 → 그 파일도 그룹 필드 제거
const repFiles = remainingGroup.filter(r => r.role === "representative")
const varFiles = remainingGroup.filter(r => r.role === "variant")

if (remainingGroup.length === 1 && repFiles.length === 1) {
  const lone = repFiles[0]
  const loneContent = clearGroupFields(lone.content)
  fs.writeFileSync(lone.filePath, loneContent, "utf8")
  console.log("")
  console.log(`   ℹ️  그룹에 대표 사건 1개만 남아 그룹 필드도 제거했습니다:`)
  console.log(`      "${lone.slug}"`)
} else if (varFiles.length > 0) {
  // 남은 variant의 groupOrder 재정렬 (1, 2, 3 …)
  // representative는 항상 order=1 유지
  let order = 2
  for (const item of remainingGroup) {
    if (item.role === "representative") continue
    let c = item.content
    c = removeFm(c, "groupOrder")
    c = setFm(c, "groupOrder", String(order))
    fs.writeFileSync(item.filePath, c, "utf8")
    order++
  }
  console.log("")
  console.log(`   ℹ️  남은 그룹(${remainingGroup.length}개) groupOrder 재정렬 완료`)
}

console.log(`\n✅ 해제 완료`)
console.log(`   "${targetSlug}" 는 이제 독립 페이지 (그룹 없음) 상태입니다.`)
if (remainingGroup.length > 1) {
  console.log(`   caseGroupId "${targetGroupId}" 그룹에는 ${remainingGroup.length}개 파일이 남아 있습니다.`)
}
