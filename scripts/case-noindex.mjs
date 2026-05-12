/**
 * case-noindex.mjs
 *
 * 특정 케이스 페이지를 검색 색인에서 제외하거나 복원합니다.
 *
 * 사용법:
 *   npm run case-noindex "sktbast-사기"           # noindex 추가 + 대표사건 문구 제거
 *   npm run case-noindex -- --remove "sktbast-사기" # noindex 제거 (색인 복원)
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const casesDir = path.join(__dirname, "..", "content", "daeonlawfintech", "cases")

const args = process.argv.slice(2)
const removeMode = args[0] === "--remove"
const slug = removeMode ? args[1] : args[0]

if (!slug) {
  console.error("사용법:")
  console.error('  npm run case-noindex "slug-name"           # noindex 추가')
  console.error('  npm run case-noindex -- --remove "slug-name" # noindex 제거')
  process.exit(1)
}

const filePath = path.join(casesDir, `${slug}.mdx`)

if (!fs.existsSync(filePath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${slug}.mdx`)
  process.exit(1)
}

let content = fs.readFileSync(filePath, "utf8")

// frontmatter / body 분리
const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/)
if (!fmMatch) {
  console.error("❌ frontmatter를 찾을 수 없습니다.")
  process.exit(1)
}

let [, fmBlock, body] = fmMatch
// frontmatter 내부 텍스트 (--- 제거)
let fm = fmBlock.replace(/^---\n/, "").replace(/\n---\n$/, "")

// ── noindex 제거 모드 ──────────────────────────────────────────
if (removeMode) {
  if (!/^noindex:\s*true/m.test(fm)) {
    console.log(`ℹ️  noindex 설정이 없습니다: ${slug}`)
    process.exit(0)
  }
  fm = fm.replace(/^noindex:\s*true[ \t]*\n?/m, "")
  const newContent = `---\n${fm}\n---\n${body}`
  fs.writeFileSync(filePath, newContent, "utf8")
  console.log(`✅ noindex 제거 완료 (색인 복원): ${slug}`)
  process.exit(0)
}

// ── noindex 추가 모드 ──────────────────────────────────────────
if (/^noindex:\s*true/m.test(fm)) {
  console.log(`ℹ️  이미 noindex 설정이 있습니다: ${slug}`)
  process.exit(0)
}

// frontmatter 마지막 줄에 noindex: true 추가
fm = fm.trimEnd() + "\nnoindex: true"

// body에서 "관련 대표 사건 안내" 섹션 제거
// 패턴: ## 관련 대표 사건 안내 로 시작해서 다음 # 헤딩 직전까지
const beforeBody = body
body = body.replace(
  /\n?## 관련 대표 사건 안내\n[\s\S]*?(?=\n(?:#{1,3} ))/,
  "\n"
)

if (body === beforeBody) {
  // 헤딩 없이 끝까지인 경우 (섹션이 파일 끝에 있을 때)
  body = body.replace(/\n?## 관련 대표 사건 안내\n[\s\S]*$/, "")
}

const newContent = `---\n${fm}\n---\n${body}`
fs.writeFileSync(filePath, newContent, "utf8")

console.log(`✅ noindex 추가 완료: ${slug}`)
console.log(`✅ 대표사건 안내 문구 제거 완료`)
console.log(``)
console.log(`  배포 후 네이버가 재크롤하면 1~3주 내 색인에서 제외됩니다.`)
console.log(`  색인 복원: npm run case-noindex -- --remove "${slug}"`)
