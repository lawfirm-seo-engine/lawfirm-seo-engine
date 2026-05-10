/**
 * patch-nft.mjs
 * cases/[slug] 라우트는 generateStaticParams + dynamicParams=false로 완전 정적 생성됨.
 * 서버리스 함수는 런타임에 절대 호출되지 않으나 Vercel patchBuild가 nft.json을 참조해
 * function_size_exceeded 오류를 냄. 불필요한 대용량 파일을 nft.json에서 제거.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

const TARGET_NFT = path.join(
  projectRoot,
  ".next",
  "server",
  "app",
  "cases",
  "[slug]",
  "page.js.nft.json"
)

const EXCLUDE_PATTERNS = [
  // public/images — 정적 파일로 서빙, 함수 번들 불필요
  /[\\/]public[\\/]images[\\/]/,
  // public/sitemap — 정적 파일
  /[\\/]public[\\/]sitemap/,
  // MDX 컴파일러 (next-mdx-remote, @mdx-js 등) — 빌드타임에만 사용
  /[\\/]node_modules[\\/]next-mdx-remote[\\/]/,
  /[\\/]node_modules[\\/]@mdx-js[\\/]/,
  /[\\/]node_modules[\\/]unified[\\/]/,
  /[\\/]node_modules[\\/]remark-?/,
  /[\\/]node_modules[\\/]rehype-?/,
  /[\\/]node_modules[\\/]micromark/,
  /[\\/]node_modules[\\/]mdast/,
  /[\\/]node_modules[\\/]hast/,
  /[\\/]node_modules[\\/]vfile/,
  /[\\/]node_modules[\\/]acorn/,
  /[\\/]node_modules[\\/]estree/,
  /[\\/]node_modules[\\/]periscopic[\\/]/,
  /[\\/]node_modules[\\/]astring[\\/]/,
  /[\\/]node_modules[\\/]character-entities/,
  /[\\/]node_modules[\\/]decode-named-character-reference[\\/]/,
  // MDX 콘텐츠 파일 — 빌드타임에만 읽음
  /[\\/]content[\\/]daeonlawfintech[\\/]cases[\\/].*\.mdx$/,
]

function shouldExclude(filePath) {
  const normalized = filePath.replace(/\\/g, "/")
  return EXCLUDE_PATTERNS.some((p) => p.test(normalized))
}

if (!fs.existsSync(TARGET_NFT)) {
  console.log("[patch-nft] nft.json not found, skipping:", TARGET_NFT)
  process.exit(0)
}

const raw = JSON.parse(fs.readFileSync(TARGET_NFT, "utf-8"))
const before = raw.files.length

raw.files = raw.files.filter((f) => !shouldExclude(f))

const after = raw.files.length
const removed = before - after

fs.writeFileSync(TARGET_NFT, JSON.stringify(raw), "utf-8")

// 패치 후 실제 번들 크기 계산
const nftDir = path.dirname(TARGET_NFT)
let totalBytes = 0
for (const f of raw.files) {
  try {
    totalBytes += fs.statSync(path.resolve(nftDir, f)).size
  } catch {}
}

console.log(
  `[patch-nft] cases/[slug] nft: ${before} → ${after} files (${removed} removed), ≈${(totalBytes / 1024 / 1024).toFixed(1)} MB`
)
