/**
 * 기존 MDX 케이스에 운영자 업데이트 메모를 .memo 파일로 추가합니다.
 * 메모는 날짜 타임스탬프와 함께 누적 저장되며, MDX frontmatter의 modifiedAt도 갱신합니다.
 *
 * 사용법:
 *   npm run case-memo "slug" "메모 내용"
 *
 * 예시:
 *   npm run case-memo "luckykr-사기-거래소-사칭" "해당 사이트 접속 차단 확인. 추가 피해자 상담 접수 중."
 *   npm run case-memo "luckykr-사기-거래소-사칭" "동일 운영자가 luckykr24com 도메인으로 재개설한 정황 확인."
 */

import fs from "fs"
import path from "path"

/**
 * MDX frontmatter의 modifiedAt을 오늘 날짜로 갱신합니다.
 * - modifiedAt이 이미 있으면 날짜만 교체
 * - 없으면 publishedAt 바로 다음 줄에 추가
 * stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프로 초기화되므로 절대 사용하지 않습니다.
 */
function updateModifiedAt(mdxFilePath) {
  const today = new Date().toISOString().slice(0, 10)
  let content = fs.readFileSync(mdxFilePath, "utf8")

  if (/^modifiedAt:/m.test(content)) {
    content = content.replace(
      /^(modifiedAt:\s*)"?[0-9]{4}-[0-9]{2}-[0-9]{2}"?/m,
      `$1"${today}"`
    )
  } else {
    content = content.replace(
      /^(publishedAt:\s*"?[^"\n]*"?)/m,
      `$1\nmodifiedAt: "${today}"`
    )
  }

  fs.writeFileSync(mdxFilePath, content, "utf8")
  return today
}

const [, , slug, ...memoParts] = process.argv
const memo = memoParts.join(" ").trim()

if (!slug || !memo) {
  console.log("❌ 사용법: npm run case-memo \"slug\" \"메모 내용\"")
  console.log("   예시:   npm run case-memo \"luckykr-사기-거래소-사칭\" \"사이트 접속 차단 확인\"")
  process.exit(1)
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const mdxFile = path.join(casesDir, `${slug}.mdx`)
const memoFile = path.join(casesDir, `${slug}.memo`)

// MDX 파일 존재 확인
if (!fs.existsSync(mdxFile)) {
  console.error(`❌ MDX 파일을 찾을 수 없습니다: ${mdxFile}`)
  console.log("   슬러그를 정확히 입력했는지 확인하세요.")
  process.exit(1)
}

// 오늘 날짜 (YYYY-MM-DD)
const today = new Date().toISOString().slice(0, 10)
const entry = `[${today}] ${memo}\n`

// 기존 내용에 이어서 추가
fs.appendFileSync(memoFile, entry, "utf8")

// MDX modifiedAt 갱신 (네이버 재크롤링 및 dateModified 신선도 신호)
const modifiedDate = updateModifiedAt(mdxFile)

// 전체 메모 목록 출력
const allMemos = fs.readFileSync(memoFile, "utf8").trim().split("\n").filter(Boolean)

console.log(`\n✅ 메모 추가 완료`)
console.log(`   파일: ${memoFile}`)
console.log(`   추가된 내용: ${entry.trim()}`)
console.log(`   modifiedAt 갱신: ${modifiedDate}`)
console.log(`\n   전체 메모 (${allMemos.length}건):`)
allMemos.forEach((m, i) => console.log(`   ${i + 1}. ${m}`))
