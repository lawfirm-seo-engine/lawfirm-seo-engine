/**
 * 케이스 페이지의 승인 댓글을 번호로 삭제합니다.
 *
 * 사용법:
 *   npm run case-comment-delete "slug"        ← 댓글 목록만 표시
 *   npm run case-comment-delete "slug" 2      ← 2번 댓글 삭제
 *   npm run case-comment-delete "slug" 1 3    ← 1번, 3번 동시 삭제
 *
 * 예시:
 *   npm run case-comment-delete "luckykr-사기-거래소-사칭"
 *   npm run case-comment-delete "luckykr-사기-거래소-사칭" 2
 */

import fs from "fs"
import path from "path"

const [, , slug, ...targets] = process.argv

if (!slug) {
  console.log('❌ 사용법: npm run case-comment-delete "slug"')
  console.log('         npm run case-comment-delete "slug" 번호')
  process.exit(1)
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const mdxFile = path.join(casesDir, `${slug}.mdx`)
const commentsFile = path.join(casesDir, `${slug}.comments`)

if (!fs.existsSync(mdxFile)) {
  console.error(`❌ MDX 파일을 찾을 수 없습니다: ${slug}.mdx`)
  process.exit(1)
}

if (!fs.existsSync(commentsFile)) {
  console.log("ℹ️  댓글 파일이 없습니다. 등록된 댓글이 없습니다.")
  process.exit(0)
}

const lines = fs.readFileSync(commentsFile, "utf8").split("\n").filter(Boolean)

if (lines.length === 0) {
  console.log("ℹ️  등록된 댓글이 없습니다.")
  process.exit(0)
}

// 삭제 번호 없으면 목록만 출력
if (targets.length === 0) {
  console.log(`\n📋 ${slug} 댓글 목록 (${lines.length}건):`)
  lines.forEach((line, i) => console.log(`   ${i + 1}. ${line}`))
  console.log(`\n삭제하려면: npm run case-comment-delete "${slug}" 번호`)
  process.exit(0)
}

// 삭제할 번호 파싱 (1-based → 0-based)
const deleteIndexes = targets
  .map((t) => parseInt(t, 10))
  .filter((n) => !isNaN(n) && n >= 1 && n <= lines.length)
  .map((n) => n - 1)

if (deleteIndexes.length === 0) {
  console.error(`❌ 유효한 번호가 없습니다. 1 ~ ${lines.length} 사이 숫자를 입력하세요.`)
  process.exit(1)
}

const deleted = deleteIndexes.map((i) => lines[i])
const remaining = lines.filter((_, i) => !deleteIndexes.includes(i))

// 파일 저장 (남은 댓글이 없으면 파일 삭제)
if (remaining.length === 0) {
  fs.unlinkSync(commentsFile)
  console.log(`\n✅ 모든 댓글 삭제 완료 → 파일 제거됨`)
} else {
  fs.writeFileSync(commentsFile, remaining.join("\n") + "\n", "utf8")
  console.log(`\n✅ 댓글 삭제 완료`)
}

deleted.forEach((d) => console.log(`   삭제: ${d}`))

// MDX modifiedAt 갱신
const today = new Date().toISOString().slice(0, 10)
let content = fs.readFileSync(mdxFile, "utf8")
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
fs.writeFileSync(mdxFile, content, "utf8")
console.log(`   modifiedAt 갱신: ${today}`)

if (remaining.length > 0) {
  console.log(`\n   남은 댓글 (${remaining.length}건):`)
  remaining.forEach((line, i) => console.log(`   ${i + 1}. ${line}`))
}
