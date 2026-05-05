/**
 * 기존 MDX 케이스에 추가 키워드를 .keywords 파일로 등록합니다.
 *
 * 사용법:
 *   npm run case-keyword "slug" "키워드1" "키워드2" ...
 *
 * 예시:
 *   npm run case-keyword "luckykr-사기-거래소-사칭" "luckykr24" "luckykr24com" "럭키코리아 거래소"
 */

import fs from "fs"
import path from "path"

const [, , slug, ...keywords] = process.argv

if (!slug || keywords.length === 0) {
  console.log("❌ 사용법: npm run case-keyword \"slug\" \"키워드1\" \"키워드2\"")
  console.log("   예시:   npm run case-keyword \"luckykr-사기-거래소-사칭\" \"luckykr24\" \"럭키코리아\"")
  process.exit(1)
}

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const mdxFile = path.join(casesDir, `${slug}.mdx`)
const keywordsFile = path.join(casesDir, `${slug}.keywords`)

// MDX 파일 존재 확인
if (!fs.existsSync(mdxFile)) {
  console.error(`❌ MDX 파일을 찾을 수 없습니다: ${mdxFile}`)
  console.log("   슬러그를 정확히 입력했는지 확인하세요.")
  process.exit(1)
}

// 기존 키워드 로드
const existing = fs.existsSync(keywordsFile)
  ? fs.readFileSync(keywordsFile, "utf8").split("\n").map(k => k.trim()).filter(Boolean)
  : []

// 신규 키워드 추가 (중복 제거)
const newKeywords = keywords.map(k => k.trim()).filter(Boolean)
const merged = [...new Set([...existing, ...newKeywords])]
const added = merged.filter(k => !existing.includes(k))

fs.writeFileSync(keywordsFile, merged.join("\n") + "\n", "utf8")

console.log(`\n✅ 키워드 등록 완료`)
console.log(`   파일: ${keywordsFile}`)
console.log(`   추가된 키워드 (${added.length}개): ${added.join(", ") || "없음 (이미 등록됨)"}`)
console.log(`   전체 키워드 (${merged.length}개): ${merged.join(", ")}`)
