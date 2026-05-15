#!/usr/bin/env node
/**
 * set-category.js
 * MDX 파일의 카테고리를 강제 지정합니다.
 *
 * 사용법:
 *   node scripts/set-category.js <slug-or-filename> <category-id>
 *
 * category-id 목록:
 *   teammission       팀미션 사기
 *   stock-room        주식리딩방 사기
 *   broadcast-exchange 방송환전 사기
 *   crypto-room       코인리딩방 사기
 *
 * 예시:
 *   node scripts/set-category.js troymarket-사기-mt5-주식-리딩 stock-room
 *   node scripts/set-category.js troymarket-사기-mt5-주식-리딩.mdx stock-room
 *
 * 카테고리 해제 (자동 판정으로 복원):
 *   node scripts/set-category.js troymarket-사기-mt5-주식-리딩 --reset
 */

const fs   = require("fs")
const path = require("path")

const VALID_CATEGORIES = new Set([
  "teammission",
  "stock-room",
  "broadcast-exchange",
  "crypto-room",
])

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

// ─── 인수 파싱 ────────────────────────────────────────────────────────────────

const [,, rawSlug, rawCategory] = process.argv

if (!rawSlug || !rawCategory) {
  console.error("사용법: node scripts/set-category.js <slug-or-filename> <category-id|--reset>")
  console.error("category-id: teammission | stock-room | broadcast-exchange | crypto-room")
  process.exit(1)
}

const isReset = rawCategory === "--reset"

if (!isReset && !VALID_CATEGORIES.has(rawCategory)) {
  console.error(`❌ 알 수 없는 category-id: "${rawCategory}"`)
  console.error("   유효한 값: teammission | stock-room | broadcast-exchange | crypto-room")
  process.exit(1)
}

// slug → 파일명 정규화
const filename = rawSlug.endsWith(".mdx") ? rawSlug : `${rawSlug}.mdx`
const filePath  = path.join(casesDir, filename)

if (!fs.existsSync(filePath)) {
  console.error(`❌ 파일 없음: ${filename}`)
  process.exit(1)
}

// ─── frontmatter 파서 / 빌더 ─────────────────────────────────────────────────

const FIELD_ORDER = [
  "title","caseName","description","slug","categoryId","noindex",
  "publishedAt","createdAt","modifiedAt",
  "caseGroupId","groupRole","groupOrder","representativeSlug",
  "primaryKeyword","aliases","caseType",
]

function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n")
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return { fields: {}, rest: text, hasCRLF: raw.includes("\r\n") }
  const fields = {}
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim()
  }
  return { fields, rest: text.slice(m[0].length), hasCRLF: raw.includes("\r\n") }
}

function buildFrontmatter(fields, rest, hasCRLF) {
  const lines = []
  const seen  = new Set()
  for (const key of FIELD_ORDER) {
    if (!(key in fields)) continue
    const v = String(fields[key])
    lines.push(v === "true" || v === "false" || /^\d+$/.test(v)
      ? `${key}: ${v}`
      : `${key}: "${v}"`)
    seen.add(key)
  }
  for (const [k, v] of Object.entries(fields)) {
    if (seen.has(k)) continue
    const vs = String(v)
    lines.push(vs === "true" || vs === "false" || /^\d+$/.test(vs)
      ? `${k}: ${vs}`
      : `${k}: "${vs}"`)
  }
  const result = `---\n${lines.join("\n")}\n---${rest}`
  return hasCRLF ? result.replace(/\n/g, "\r\n") : result
}

// ─── 수정 ─────────────────────────────────────────────────────────────────────

const raw = fs.readFileSync(filePath, "utf8")
const { fields, rest, hasCRLF } = parseFrontmatter(raw)

const prevCategory = fields.categoryId || "(자동 판정)"

if (isReset) {
  delete fields.categoryId
  fs.writeFileSync(filePath, buildFrontmatter(fields, rest, hasCRLF), "utf8")
  console.log(`✓ ${filename}`)
  console.log(`  categoryId: "${prevCategory}" → 제거 (자동 판정 복원)`)
} else {
  if (fields.categoryId === rawCategory) {
    console.log(`ℹ 이미 "${rawCategory}"로 지정되어 있습니다: ${filename}`)
    process.exit(0)
  }
  fields.categoryId = rawCategory
  fs.writeFileSync(filePath, buildFrontmatter(fields, rest, hasCRLF), "utf8")
  console.log(`✓ ${filename}`)
  console.log(`  categoryId: "${prevCategory}" → "${rawCategory}"`)
}
