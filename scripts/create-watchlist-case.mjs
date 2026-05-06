/**
 * 신규 사기 의심 업체 일괄 감시 목록 MDX 생성기
 *
 * 사용법:
 *   npm run case-watchlist "리스트명" "한글명,도메인,영문명,사기유형" "한글명2,도메인2,영문명2,사기유형2" ...
 *
 * 예시:
 *   npm run case-watchlist "신규 사기 의심 업체 리스트-5월6일" \
 *     "퍼스트몰,fistmall.com,fistmal,쇼핑몰 사칭" \
 *     "루너마켓,runemarkets.shop,runemarkets,쇼핑몰 사칭" \
 *     "전l9,jeanl9.com,jeanl9,쇼핑몰 사칭"
 *
 * 생성 파일:
 *   content/daeonlawfintech/cases/{slug}.mdx     (케이스 본문)
 *   content/daeonlawfintech/cases/{slug}.keywords (키워드 목록)
 *
 * 특징:
 *   - caseGroupId / representativeSlug 없음 (그룹핑 없음)
 *   - 여러 업체를 1개 MDX에 통합 → 키워드 밀도 확보
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const casesDir = path.join(__dirname, "..", "content", "daeonlawfintech", "cases")

// ── 인수 파싱 ────────────────────────────────────────────────────────────────
const [listName, ...itemArgs] = process.argv.slice(2)

if (!listName || itemArgs.length === 0) {
  console.error(`
사용법:
  npm run case-watchlist "리스트명" "한글명,도메인,영문명,사기유형" ...

항목 형식 (쉼표 구분):
  한글명  : 업체 한글 상호명     (필수)
  도메인  : 사이트 주소          (필수)
  영문명  : 영문 상호명 또는 슬러그 (선택)
  사기유형: 쇼핑몰 사칭 / 코인 투자 / 가짜 거래소 등 (선택, 기본값: 사칭 사기)

예시:
  npm run case-watchlist "신규 사기 의심 업체 리스트-5월6일" \\
    "퍼스트몰,fistmall.com,fistmal,쇼핑몰 사칭" \\
    "루너마켓,runemarkets.shop,runemarkets,쇼핑몰 사칭"
`)
  process.exit(1)
}

// ── 항목 파싱 ────────────────────────────────────────────────────────────────
const items = itemArgs.map((arg, i) => {
  const parts = arg.split(",").map((s) => s.trim())
  return {
    korName: parts[0] || `업체${i + 1}`,
    domain: parts[1] || "",
    engName: parts[2] || "",
    type: parts[3] || "사칭 사기",
  }
})

// ── 슬러그 생성 ───────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

const slug = listName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const mdxPath = path.join(casesDir, `${slug}.mdx`)
const keywordsPath = path.join(casesDir, `${slug}.keywords`)

if (fs.existsSync(mdxPath)) {
  console.error(`❌ 이미 존재하는 파일: ${mdxPath}`)
  console.error("   다른 리스트명을 사용하거나 기존 파일을 삭제 후 재실행하세요.")
  process.exit(1)
}

// ── 키워드 목록 생성 ─────────────────────────────────────────────────────────
const keywords = []
items.forEach(({ korName, domain, engName, type }) => {
  keywords.push(korName)
  if (engName) keywords.push(engName)
  if (domain) {
    keywords.push(domain)
    // 도메인에서 루트만 추출 (예: fistmall.com → fistmall)
    const root = domain.split(".")[0]
    if (root && root !== engName) keywords.push(root)
  }
  keywords.push(`${korName} 사기`)
  keywords.push(`${korName} 사칭`)
  if (engName) keywords.push(`${engName} 사기`)
  keywords.push(`${type}`)
})

// ── MDX 본문 생성 ─────────────────────────────────────────────────────────────
const seoTitle = `${listName} | 사기 의심 업체 경보`
const caseName = listName

const itemSections = items
  .map(
    ({ korName, domain, engName, type }, i) => {
      const num = i + 1
      const domainUrl = domain ? `https://${domain}` : ""
      const engLabel = engName ? ` / ${engName}` : ""
      const domainLabel = domain ? ` / ${domain}` : ""

      return `
## ${num}. ${korName}${engLabel} — ${type}

${korName}${engLabel}${domainLabel}은 피해 상담을 통해 신규로 접수된 **${type}** 의심 업체입니다.

| 항목 | 내용 |
|------|------|
| 한글 상호명 | ${korName} |${engName ? `\n| 영문 상호명 | ${engName} |` : ""}
| 사이트 주소 | ${domainUrl || "미확인"} |
| 사기 유형 | ${type} |

**피해 특징:**
- 정상 플랫폼을 사칭하거나 실제로 존재하지 않는 수익 구조를 내세워 입금을 유도합니다.
- 출금 요청 시 세금·보증금·수수료 등을 명목으로 추가 입금을 요구합니다.
- ${korName}${engLabel} 명칭으로 접근을 받았다면 추가 입금 전에 반드시 피해 여부를 확인하세요.
`
    }
  )
  .join("\n---\n")

const korNames = items.map((i) => i.korName).join(", ")
const domainList = items
  .filter((i) => i.domain)
  .map((i) => i.domain)
  .join(", ")

const mdxContent = `---
title: "${seoTitle}"
caseName: "${caseName}"
description: "${korNames} 등 신규 사기 의심 업체 경보 및 피해 대응 안내"
slug: "${slug}"
publishedAt: "${today}"
---

## ${listName} — 신규 사기 의심 업체 경보

대온 법률사무소 핀테크센터에서 ${today} 기준으로 접수된 신규 피해 상담을 바탕으로,
주의가 필요한 의심 업체 목록을 안내드립니다.

아래 업체명 또는 사이트 주소로 접근을 받으셨다면 **추가 입금 전에 반드시 상담**을 받으시기 바랍니다.

> **주의 업체:** ${korNames}
>
> **주의 도메인:** ${domainList || "목록 참고"}

---
${itemSections}

---

## 공통 피해 대응 요령

위 업체들로부터 피해를 입으셨거나 현재 진행 중이라면 아래 순서로 즉시 대응하세요.

1. **추가 입금 즉시 중단** — 어떤 명목으로든 추가 요구에 응하지 마세요.
2. **증거 확보** — 대화 내역, 입금 내역, 사이트 주소, 담당자 연락처를 캡처해 보관하세요.
3. **전문가 상담** — 초기 대응 속도가 피해 회복률에 직접적인 영향을 미칩니다.

상담은 24시간 접수 가능하며, 초기 상담은 무료입니다.

👉 대온 법률사무소 핀테크센터: https://daeonlawfintech.com
👉 네이버 카페 (피해 사례 공유): https://cafe.naver.com/daeonlawfintech
`

// ── 파일 저장 ────────────────────────────────────────────────────────────────
if (!fs.existsSync(casesDir)) {
  fs.mkdirSync(casesDir, { recursive: true })
}

fs.writeFileSync(mdxPath, mdxContent, "utf-8")
fs.writeFileSync(keywordsPath, [...new Set(keywords)].join("\n"), "utf-8")

console.log(`
✅ 감시 목록 케이스 생성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 MDX  : ${mdxPath}
🔑 키워드: ${keywordsPath}
🔗 URL  : https://daeonlawfintech.com/cases/${encodeURIComponent(slug)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 등록 업체 (${items.length}개):
${items.map((it, i) => `  ${i + 1}. ${it.korName}${it.engName ? ` / ${it.engName}` : ""}  [${it.domain || "도메인 미입력"}]  — ${it.type}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  그룹핑 없음 (caseGroupId / representativeSlug 미설정)
`)
