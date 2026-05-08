/**
 * 케이스 페이지의 승인 댓글을 번호로 수정합니다.
 *
 * 사용법:
 *   npm run case-comment-edit "slug"                          ← 댓글 목록만 표시
 *   npm run case-comment-edit "slug" 2 "수정할 내용"           ← 2번 내용만 수정 (작성자 유지)
 *   npm run case-comment-edit "slug" 2 "새작성자" "수정할 내용" ← 2번 작성자+내용 수정
 *
 * 예시:
 *   npm run case-comment-edit "luckykr-사기-거래소-사칭"
 *   npm run case-comment-edit "luckykr-사기-거래소-사칭" 2 "내용을 수정합니다."
 *   npm run case-comment-edit "luckykr-사기-거래소-사칭" 2 "피해자 B씨" "내용을 수정합니다."
 */

import fs from "fs"
import path from "path"

const [, , slug, targetStr, ...rest] = process.argv

if (!slug) {
  console.log('❌ 사용법: npm run case-comment-edit "slug" 번호 "수정 내용"')
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

// 번호 없으면 목록만 출력
if (!targetStr) {
  console.log(`\n📋 ${slug} 댓글 목록 (${lines.length}건):`)
  lines.forEach((line, i) => console.log(`   ${i + 1}. ${line}`))
  console.log(`\n수정하려면: npm run case-comment-edit "${slug}" 번호 "수정 내용"`)
  process.exit(0)
}

const targetIndex = parseInt(targetStr, 10) - 1
if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= lines.length) {
  console.error(`❌ 유효하지 않은 번호입니다. 1 ~ ${lines.length} 사이 숫자를 입력하세요.`)
  process.exit(1)
}

if (rest.length === 0) {
  console.error('❌ 수정할 내용을 입력하세요.')
  console.log(`   예시: npm run case-comment-edit "${slug}" ${targetStr} "수정할 내용"`)
  process.exit(1)
}

// 기존 줄에서 작성자 추출
const existingLine = lines[targetIndex]
const existingMatch = existingLine.match(/^\[(\d{4}-\d{2}-\d{2})\]\[([^\]]+)\]\s+(.+)$/)
const existingAuthor = existingMatch ? existingMatch[2] : "익명"
const existingDate = existingMatch ? existingMatch[1] : new Date().toISOString().slice(0, 10)

// 새 작성자/내용 파싱
// rest가 2개 이상이면: 첫 번째 = 새 작성자, 나머지 = 새 내용
// rest가 1개이면: 내용만 수정 (작성자 유지)
const newAuthor = rest.length >= 2 ? rest[0].trim() : existingAuthor
const newContent = rest.length >= 2 ? rest.slice(1).join(" ").trim() : rest[0].trim()

if (!newContent) {
  console.error("❌ 수정할 내용이 비어있습니다.")
  process.exit(1)
}

// 날짜는 기존 날짜 유지
const newLine = `[${existingDate}][${newAuthor}] ${newContent}`
const before = lines[targetIndex]
lines[targetIndex] = newLine

fs.writeFileSync(commentsFile, lines.join("\n") + "\n", "utf8")

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

console.log(`\n✅ 댓글 수정 완료`)
console.log(`   수정 전: ${before}`)
console.log(`   수정 후: ${newLine}`)
console.log(`   modifiedAt 갱신: ${today}`)
console.log(`\n   전체 댓글 (${lines.length}건):`)
lines.forEach((line, i) => console.log(`   ${i + 1}. ${line}`))
