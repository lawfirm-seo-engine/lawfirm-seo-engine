import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghPutMultipleFiles, casesFilePath } from "@/lib/admin/github"
import { generateCaseImage } from "@/lib/admin/imageGen"

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

export type WatchlistItem = {
  korName:    string   // 한글 상호명
  engName:    string   // 영문 상호명
  siteName:   string   // 사이트명
  type:       string   // 사기 유형
  siteUrl:    string   // 사이트 주소 (도메인)
  ridingbang: string   // 리딩방 명칭
}

function isValidDomain(s: string) {
  return /\.[a-zA-Z]{2,}$/.test(s)
}

// ─── MDX 본문 생성 (create-watchlist-case.mjs 로직 포팅) ─────────────────────

function buildWatchlistMdx(listName: string, items: WatchlistItem[], today: string): string {
  const slug = listName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")

  const itemSections = items
    .map(({ korName, engName, siteName, type, siteUrl, ridingbang }, i) => {
      const num       = i + 1
      const fullUrl   = siteUrl && isValidDomain(siteUrl) ? `https://${siteUrl}` : ""
      const titleName = korName || engName || siteName || `업체${num}`
      const subLabel  = engName && engName !== titleName ? ` / ${engName}` : ""

      return `
## ${num}. ${titleName}${subLabel} — ${type}

${titleName}${subLabel}은 피해 상담을 통해 신규로 접수된 **${type}** 의심 업체입니다.

<table className="case-scam-table case-watchlist-table">
  <colgroup>
    <col style={{ width: "110px" }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th>항목</th>
      <th>내용</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>한글 상호명</td>
      <td>${korName || "-"}</td>
    </tr>
    <tr>
      <td>영문 상호명</td>
      <td>${engName || "-"}</td>
    </tr>
    <tr>
      <td>사이트명</td>
      <td>${siteName || "-"}</td>
    </tr>
    <tr>
      <td>사이트 주소</td>
      <td>${fullUrl || "-"}</td>
    </tr>
    <tr>
      <td>리딩방 명칭</td>
      <td>${ridingbang || "-"}</td>
    </tr>
    <tr>
      <td>사기 유형</td>
      <td>${type}</td>
    </tr>
  </tbody>
</table>

**피해 특징:**
- 정상 플랫폼을 사칭하거나 실제로 존재하지 않는 수익 구조를 내세워 입금을 유도합니다.
- 출금 요청 시 세금·보증금·수수료 등을 명목으로 추가 입금을 요구합니다.
- ${titleName}${subLabel} 명칭으로 접근을 받았다면 추가 입금 전에 반드시 피해 여부를 확인하세요.
`
    })
    .join("\n---\n")

  const primaryNames = items
    .map((it) => it.korName || it.engName || it.siteName)
    .filter(Boolean)
    .join(", ")

  const validDomains = items
    .filter((it) => it.siteUrl && isValidDomain(it.siteUrl))
    .map((it) => it.siteUrl)
    .join(", ")

  return `---
title: "${listName} | 사기 의심 업체 경보"
caseName: "${listName}"
description: "${primaryNames} 등 신규 사기 의심 업체 경보 및 피해 대응 안내"
slug: "${slug}"
publishedAt: "${today}"
createdAt: "${new Date().toISOString()}"
---

## ${listName} — 신규 사기 의심 업체 경보

대온 법률사무소 핀테크센터에서 ${today} 기준으로 접수된 신규 피해 상담을 바탕으로,
주의가 필요한 의심 업체 목록을 안내드립니다.

아래 업체명 또는 사이트 주소로 접근을 받으셨다면 **추가 입금 전에 반드시 상담**을 받으시기 바랍니다.

> **주의 업체:** ${primaryNames}
>
> **주의 도메인:** ${validDomains || "목록 참고"}

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
}

// ─── POST: 감시 목록 MDX 생성 ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { listName?: string; items?: WatchlistItem[] }
  const listName = (body.listName ?? "").trim()
  const items    = body.items ?? []

  if (!listName) {
    return NextResponse.json({ error: "listName이 필요합니다." }, { status: 400 })
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "업체 항목이 하나 이상 필요합니다." }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const slug  = listName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")

  const mdxContent = buildWatchlistMdx(listName, items, today)

  // 키워드 파일 생성
  const keywords: string[] = []
  items.forEach(({ korName, engName, siteName, type, siteUrl, ridingbang }) => {
    if (korName)   keywords.push(korName)
    if (engName)   keywords.push(engName)
    if (siteName)  keywords.push(siteName)
    if (siteUrl && isValidDomain(siteUrl)) {
      keywords.push(siteUrl)
      const root = siteUrl.split(".")[0]
      if (root && root !== siteName && root !== engName && root !== korName) keywords.push(root)
    }
    const primaryName = korName || engName || siteName
    if (primaryName) {
      keywords.push(`${primaryName} 사기`)
      keywords.push(`${primaryName} 사칭`)
    }
    if (engName && engName !== (korName || engName || siteName)) keywords.push(`${engName} 사기`)
    if (ridingbang) keywords.push(ridingbang)
    keywords.push(type)
  })
  const keywordsContent = [...new Set(keywords)].join("\n")

  // 이미지 생성
  let imageCommitted = false
  const filesToCommit: Array<{ path: string; content: string | Buffer }> = [
    { path: casesFilePath(slug), content: mdxContent },
    { path: `${casesFilePath(slug, "keywords")}`, content: keywordsContent },
  ]

  try {
    const imgBuf = await generateCaseImage(listName)
    filesToCommit.push({ path: `public/images/cases/${slug}.png`, content: imgBuf })
    imageCommitted = true
  } catch {
    // 이미지 생성 실패는 무시 — MDX만 커밋
  }

  await ghPutMultipleFiles(
    filesToCommit,
    `watchlist: ${listName} (${items.length}개 업체)`,
  )

  return NextResponse.json({ ok: true, slug, imageCommitted })
}
