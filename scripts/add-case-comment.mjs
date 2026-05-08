/**
 * 관리자 승인 댓글을 케이스 페이지에 추가합니다.
 * 실행 시 MDX frontmatter의 modifiedAt도 오늘 날짜로 갱신됩니다.
 *
 * 사용법:
 *   npm run case-comment "slug" "댓글 내용"                    ← 작성자 '익명'
 *   npm run case-comment "slug" "작성자명" "댓글 내용"          ← 작성자 지정
 *
 * 예시:
 *   npm run case-comment "luckykr-사기-거래소-사칭" "동일한 방식으로 접근받았습니다. 조심하세요."
 *   npm run case-comment "luckykr-사기-거래소-사칭" "피해자 A씨" "출금 요청 시 세금 명목으로 추가 입금을 요구했습니다."
 *
 * 파일 형식 (slug.comments):
 *   [YYYY-MM-DD][작성자명] 댓글 내용
 */

import fs from "fs"
import path from "path"

const [, , slug, ...rest] = process.argv

if (!slug || rest.length === 0) {
  console.log('❌ 사용법: npm run case-comment "slug" "댓글 내용"')
  console.log('         npm run case-comment "slug" "작성자명" "댓글 내용"')
  console.log('   예시:  npm run case-comment "luckykr-사기-거래소-사칭" "피해자 A씨" "동일 수법으로 접근받았습니다."')
  process.exit(1)
}

// 인자 파싱: 2개 이상이면 첫 번째 = 작성자, 나머지 = 내용 / 1개면 익명
const author = rest.length >= 2 ? rest[0].trim() : "익명"
const content = rest.length >= 2 ? rest.slice(1).join(" ").trim() : rest[0].trim()

if (!content) {
  console.error("❌ 댓글 내용이 비어있습니다.")
  process.exit(1)
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const mdxFile = path.join(casesDir, `${slug}.mdx`)
const commentsFile = path.join(casesDir, `${slug}.comments`)

// MDX 파일 존재 확인
if (!fs.existsSync(mdxFile)) {
  console.error(`❌ MDX 파일을 찾을 수 없습니다: ${mdxFile}`)
  console.log("   슬러그를 정확히 입력했는지 확인하세요.")
  process.exit(1)
}

// 오늘 날짜 (YYYY-MM-DD)
const today = new Date().toISOString().slice(0, 10)
const entry = `[${today}][${author}] ${content}\n`

// 댓글 파일에 추가
fs.appendFileSync(commentsFile, entry, "utf8")

// MDX modifiedAt 갱신 (네이버 재크롤링 및 dateModified 신선도 신호)
// stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프(2018년 등)로 초기화되므로 절대 사용하지 않음
function updateModifiedAt(mdxFilePath) {
  let fileContent = fs.readFileSync(mdxFilePath, "utf8")

  if (/^modifiedAt:/m.test(fileContent)) {
    fileContent = fileContent.replace(
      /^(modifiedAt:\s*)"?[0-9]{4}-[0-9]{2}-[0-9]{2}"?/m,
      `$1"${today}"`
    )
  } else {
    fileContent = fileContent.replace(
      /^(publishedAt:\s*"?[^"\n]*"?)/m,
      `$1\nmodifiedAt: "${today}"`
    )
  }

  fs.writeFileSync(mdxFilePath, fileContent, "utf8")
  return today
}

const modifiedDate = updateModifiedAt(mdxFile)

// 전체 댓글 목록 출력
const allComments = fs.readFileSync(commentsFile, "utf8").trim().split("\n").filter(Boolean)

console.log(`\n✅ 댓글 추가 완료`)
console.log(`   파일: ${commentsFile}`)
console.log(`   작성자: ${author}`)
console.log(`   내용: ${content}`)
console.log(`   modifiedAt 갱신: ${modifiedDate}`)
console.log(`\n   전체 댓글 (${allComments.length}건):`)
allComments.forEach((c, i) => console.log(`   ${i + 1}. ${c}`))
