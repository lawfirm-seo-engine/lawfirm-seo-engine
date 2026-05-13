import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import TypingHeading from "@/app/components/TypingHeading"

// 정적 생성(generateStaticParams)으로 함수 번들 크기 초과 문제 해결.
// force-dynamic → ISR 캐시 태그에 한국어 slug가 포함되면 헤더 오류 발생하는 버그가 있었으나
// 순수 정적 생성(revalidate 없음)에는 캐시 태그가 적용되지 않으므로 안전함.
// dynamicParams = false: generateStaticParams에 없는 slug는 404 반환 (동적 함수 크기 초과 방지).
export const dynamicParams = false

export async function generateStaticParams() {
  if (!fs.existsSync(casesDir)) return []
  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => ({ slug: file.replace(/\.mdx$/, "") }))
}

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const organizationName = "대온 법률사무소"
const representativeName = "신동우"
const phoneNumber = "+82-2-6952-3695"
const imageVersion = "20260430"

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const fallbackCaseImagePath = "/images/templates/case-template.png"

type CaseSummary = {
  slug: string
  title: string
  caseName: string
  searchKeyword: string
  representativeSlug: string
  caseGroupId: string
  groupRole: string
  groupOrder: number
  createdAt: string
  text: string
  birthtime: number
  mtime: number
}

let caseSummariesCache: CaseSummary[] | null = null

const scamTopicKeywords = [
  "팀미션 사기",
  "주식 어플 사기",
  "주식리딩방 사기",
  "어플 사기",
  "투자사기",
  "코인 사기",
  "리딩방 사기",
  "플랫폼 사칭 사기",
  "쇼핑몰 사칭 사기",
  "부업 사기",
  "해외선물 사기",
  "체험단 사기",
  "여행사 사칭 사기",
  "라이브방송 사기",
  "증권사 사칭 사기",
  "금 투자 사기",
]

const aliasGroups = [
  ["bellaxb", "벨라비"],
  ["deepellie", "디프엘리"],
  ["daishin", "대신증권"],
  ["allspring", "allspringmin", "\uace8\ub4dc\ub4dc\ub9bc", "goldeudeulim"],
]

const domainPattern = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/i

const genericEnglishTokens = new Set([
  "app",
  "bar",
  "bit",
  "biz",
  "co",
  "coin",
  "com",
  "company",
  "corp",
  "crypto",
  "exchange",
  "finance",
  "financial",
  "georaeso",
  "gongmoju",
  "global",
  "gold",
  "group",
  "inc",
  "investment",
  "invest",
  "io",
  "koin",
  "kr",
  "korea",
  "ltd",
  "mall",
  "market",
  "me",
  "net",
  "org",
  "pihae",
  "pihaehoebog",
  "pihaehoebok",
  "saching",
  "sagi",
  "salye",
  "sarye",
  "securities",
  "shop",
  "site",
  "stock",
  "store",
  "syopingmol",
  "top",
  "trade",
  "trading",
  "tuja",
  "tujasagi",
  "vip",
  "wallet",
  "xyz",
  // 로마자 변환된 한글 일반 업종·범주어 (식별 토큰으로 사용 불가)
  "yeohangsa",   // 여행사
  "yeohang",     // 여행
  "hangongsa",   // 항공사
  "hangong",     // 항공
  "jeungwonsa",  // 증권사
  "boheomsa",    // 보험사
  "eunhaeng",    // 은행
  "ridingbang",  // 리딩방 (영문 표기)
  "syoping",     // 쇼핑
  "syopingmall", // 쇼핑몰
])

function stripFrontmatter(source: string) {
  return source.replace(/^---[\s\S]*?---\s*/, "")
}

function stripLeakedMetaLines(source: string) {
  return source
    .replace(/^\s*(title|caseName|description|slug|representativeSlug|createdAt|caseGroupId|groupRole|groupOrder|primaryKeyword|aliases|caseType|publishedAt|modifiedAt)\s*:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function stripBrokenRelatedGuide(source: string) {
  return source
    .replace(
      /(^|\r?\n)#{1,6}\s*관련\s*대표\s*사건\s*안내[\s\S]*?(?=\r?\n#{1,6}\s|\r?\n<img|\r?\n!\[|\r?\n\d+\.\s|$)/g,
      "\n"
    )
    .replace(
      /(^|\r?\n)\s*관련\s*대표\s*사건\s*안내\s*\r?\n[\s\S]*?(?=\r?\n#{1,6}\s|\r?\n<img|\r?\n!\[|\r?\n\d+\.\s|$)/g,
      "\n"
    )
    .replace(/^\s*해당 사건은 아래 대표 사건과 동일 유형입니다\.\s*$/gim, "")
    .replace(/^\s*👉\s*\/cases\/[^\n]+$/gim, "")
    .replace(/^\s*\/cases\/[^\n]+$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function stripOnlyLeadingAutoHeadings(source: string) {
  let result = source.trimStart()

  result = result.replace(/^#\s+.*(?:\r?\n)+/, "")
  result = result.replace(/^##\s+.*(?:\r?\n)+/, "")

  return result.replace(/\n{3,}/g, "\n\n").trim()
}

function parseFrontmatter(source: string) {
  const match = source.match(/^---\s*([\s\S]*?)\s*---/)
  const data: Record<string, string> = {}

  if (!match) return data

  const lines = match[1].split(/\r?\n/)

  lines.forEach((line) => {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) return

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    value = value.replace(/^["']|["']$/g, "")

    if (key) {
      data[key] = value
    }
  })

  return data
}

function normalizeSlugTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeImpersonationText(text: string) {
  return text
    .replace(/\s*\(사칭\)\s*/g, " ")
    .replace(/사칭\s+사칭/g, "사칭")
    .replace(/사칭\s*\(사칭\)/g, "사칭")
    .replace(/\s+/g, " ")
    .trim()
}

function buildCaseDisplayName(caseName: string) {
  return caseName.includes("사칭") ? caseName : `${caseName} (사칭)`
}

function isBadCaseName(value?: string) {
  if (!value) return true

  const text = value.trim()

  return (
    text.length < 2 ||
    text.includes("관련 대표 사건 안내") ||
    text.includes("해당 사건은 아래 대표 사건") ||
    text.includes("/cases/") ||
    text.startsWith("👉")
  )
}

function withKeyword(text: string, keyword: string) {
  return text.includes(keyword) ? text : `${text} ${keyword}`
}

function buildSearchKeyword(caseName: string) {
  return withKeyword(withKeyword(caseName, "사기"), "사칭")
}

// ── SEO 키워드 추출 ──────────────────────────────────────────────────────────
// "사기" 앞: 전체 유지 / "사기" 뒤: 불필요 수식어 제거하고 핵심 식별자만 추출
// 예) "NGAJPM 사기 JP모건 사칭 허위 어플" → "NGAJPM 사기 JP모건"
// 예) "드림게임 사칭 사기 복권 예측 피해" → "드림게임 사칭 사기 복권 예측"

const AFTER_HARD_STOP = new Set([
  "피해", "허위", "사례", "어플", "앱", "안내", "복구", "신고", "방법", "경고", "주의",
])
// 첫 토큰이면 유지 후 중단 / 두 번째 이후면 중단 (브랜드 등장 후 장식어 차단)
const AFTER_BRAND_STOP = new Set([
  "사칭", "리딩방", "해외선물", "지수거래", "자동매매", "투자", "코인", "비트코인", "국내주식",
])

function extractSeoKeyword(caseName: string): string {
  const match = caseName.match(/^(.*?)\s+사기(?:\s+(.*))?$/)
  if (!match) return caseName
  const beforePart = (match[1] ?? "").trim()
  const afterPart  = (match[2] ?? "").trim()
  if (!afterPart) return `${beforePart} 사기`

  const beforeTokens = beforePart.split(/\s+/).filter(Boolean)
  const hasSachingBefore = beforeTokens.includes("사칭")
  const taken: string[] = []

  for (const token of afterPart.split(/\s+/).filter(Boolean)) {
    if (token === "사칭" && hasSachingBefore) break   // 사칭 중복 차단
    if (AFTER_HARD_STOP.has(token)) break             // 즉시 중단
    if (AFTER_BRAND_STOP.has(token)) {
      if (taken.length === 0) taken.push(token)       // 첫 토큰만 허용
      break
    }
    if (/[A-Za-z]/.test(token)) { taken.push(token); break } // 영문: 유지 후 중단
    taken.push(token)                                 // 일반 한국어: 유지 후 계속
  }

  const afterStr = taken.join(" ")
  return afterStr ? `${beforePart} 사기 ${afterStr}` : `${beforePart} 사기`
}

// caseType별 title / H1 suffix 맵
// detectCaseType() 반환 label 기준
const CASE_TYPE_SUFFIX: Record<string, { typeWord: string; title: string; h1: string }> = {
  "증권사 사칭 사기":     { typeWord: "리딩방",   title: "리딩방 피해 사례",   h1: "리딩방 피해 신고와 구제 방안"   },
  "쇼핑몰 사칭 사기":    { typeWord: "쇼핑몰",   title: "쇼핑몰 피해 사례",   h1: "쇼핑몰 피해 신고와 구제 방안"   },
  "코인 거래소 사칭 사기": { typeWord: "코인",   title: "코인 피해 사례",     h1: "코인 피해 신고와 구제 방안"     },
  "해외선물 사칭 사기":   { typeWord: "해외선물", title: "해외선물 피해 사례", h1: "해외선물 피해 신고와 구제 방안" },
  "방송 환전 사칭 사기":  { typeWord: "방송",    title: "방송 피해 사례",     h1: "방송 피해 신고와 구제 방안"     },
  "플랫폼 사칭 사기":    { typeWord: "사칭",    title: "사칭 피해 사례",     h1: "사칭 피해 신고와 구제 방안"     },
}

function buildTypedTitle(caseName: string, kind: "meta" | "h1"): string {
  const extracted = extractSeoKeyword(caseName)
  const label     = detectCaseType(caseName).label
  const map       = CASE_TYPE_SUFFIX[label] ?? CASE_TYPE_SUFFIX["플랫폼 사칭 사기"]
  const lastToken = extracted.split(" ").pop() ?? ""
  const noTypeWord = lastToken === map.typeWord  // 추출 결과 끝이 typeWord와 같으면 중복 생략
  const suffix    = noTypeWord
    ? (kind === "meta" ? "피해 사례" : "피해 신고와 구제 방안")
    : (kind === "meta" ? map.title   : map.h1)
  return `${extracted} ${suffix}`
}

function buildMetaTitle(caseName: string): string {
  return buildTypedTitle(caseName, "meta")
}

function buildSeoTitle(caseName: string) {
  return buildTypedTitle(caseName, "h1")
}

// FAQ 질문용 브랜드명 추출: "사기" 앞 텍스트만 사용해 키워드 밀도 과적재 방지
function extractBrandKeyword(caseName: string): string {
  const idx = caseName.indexOf("사기")
  const brand = idx > 0 ? caseName.slice(0, idx).trim() : caseName.split(" ")[0]
  return brand || caseName
}

function buildSeoDescription(caseName: string) {
  return `${withKeyword(caseName, "사기")} 피해 사례 및 대응 전략 안내`
}

function getCaseFilePath(slug: string) {
  return path.join(casesDir, `${slug}.mdx`)
}

function getVersionedImageUrl(src: string) {
  return `${siteUrl}${src}?v=${imageVersion}`
}

function getCaseImageSrc(slug: string, extension: "png" | "avif") {
  return `/images/cases/${slug}.${extension}`
}

function getCaseMeta(decodedSlug: string) {
  const filePath = getCaseFilePath(decodedSlug)

  if (!fs.existsSync(filePath)) {
    const fallbackCaseName = normalizeImpersonationText(normalizeSlugTitle(decodedSlug))

    return {
      filePath,
      rawSource: "",
      mdxSource: "",
      caseName: fallbackCaseName,
      searchKeyword: buildSearchKeyword(fallbackCaseName),
      seoTitle: buildSeoTitle(fallbackCaseName),
      metaTitle: buildMetaTitle(fallbackCaseName),
      seoDescription: buildSeoDescription(fallbackCaseName),
    }
  }

  const rawSource = fs.readFileSync(filePath, "utf-8")
  const frontmatter = parseFrontmatter(rawSource)

  const safeFrontmatterCaseName = !isBadCaseName(frontmatter.caseName)
    ? frontmatter.caseName
    : ""

  const caseName = normalizeImpersonationText(
    safeFrontmatterCaseName || normalizeSlugTitle(decodedSlug)
  )
  const caseDisplayName = buildCaseDisplayName(caseName)

  const searchKeyword = buildSearchKeyword(caseName)
  const seoTitle  = buildSeoTitle(caseName)   // H1 / JSON-LD headline / breadcrumb
  const metaTitle = buildMetaTitle(caseName)  // <title> / og:title / twitter:title

  const seoDescription =
    frontmatter.description && !frontmatter.description.includes("관련 대표 사건 안내")
      ? frontmatter.description
      : buildSeoDescription(caseName)

  let mdxSource = stripFrontmatter(rawSource)
  mdxSource = stripLeakedMetaLines(mdxSource)
  mdxSource = stripBrokenRelatedGuide(mdxSource)
  mdxSource = stripOnlyLeadingAutoHeadings(mdxSource)

  if (caseName.includes("사칭")) {
    mdxSource = mdxSource
      .replaceAll("{{CASE_NAME}} (사칭)", "{{CASE_NAME}}")
      .replaceAll("{{CASE_NAME}}(사칭)", "{{CASE_NAME}}")
      .replaceAll(`${caseName} (사칭)`, caseName)
      .replaceAll(`${caseName}(사칭)`, caseName)
      .replaceAll("사칭 사기 공모주 사칭", "사칭 사기 공모주")
      .replaceAll("사칭 사기 사칭", "사칭 사기")
      .replaceAll("사칭 사칭", "사칭")
  }

  mdxSource = mdxSource
    .replaceAll("{{CASE_NAME}}", caseName)
    .replaceAll("{{CASE_DISPLAY_NAME}}", caseDisplayName)
    .replaceAll("{{SEARCH_KEYWORD}}", searchKeyword)

  mdxSource = stripLeakedMetaLines(mdxSource)
  mdxSource = stripBrokenRelatedGuide(mdxSource)

  // frontmatter publishedAt / modifiedAt 고정값 사용
  // stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프(2018년 등)로 초기화되므로 절대 사용하지 않음
  const publishedAt = frontmatter.publishedAt || null
  const modifiedAt = frontmatter.modifiedAt || null

  return {
    filePath,
    rawSource,
    mdxSource,
    caseName,
    searchKeyword,
    seoTitle,
    metaTitle,
    seoDescription,
    publishedAt,
    modifiedAt,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const decodedSlug = decodeURIComponent(slug)
  const { searchKeyword, seoTitle, metaTitle, seoDescription, publishedAt, modifiedAt } = getCaseMeta(decodedSlug)

  // variant 페이지는 대표 페이지로 canonical 집중 (링크 주스 분산 방지)
  // representative 페이지는 자기 자신을 canonical로 유지
  const rawSource = fs.existsSync(getCaseFilePath(decodedSlug))
    ? fs.readFileSync(getCaseFilePath(decodedSlug), "utf-8")
    : ""
  const fm = parseFrontmatter(rawSource)
  const isVariant = fm.groupRole === "variant" && typeof fm.representativeSlug === "string" && fm.representativeSlug.trim() !== "" && fm.representativeSlug.trim() !== decodedSlug
  const canonicalSlug = isVariant ? fm.representativeSlug.trim() : decodedSlug
  // case-noindex 명령으로 수동 지정된 noindex 페이지
  const isManualNoindex = fm.noindex === "true"

  // canonical은 항상 percent-encoded 형태로 통일 (Google·Naver 중복 URL 방지)
  const encodedSlug = encodeURIComponent(decodedSlug)
  const pageUrl = `${siteUrl}/cases/${encodedSlug}`
  const canonicalUrl = `${siteUrl}/cases/${encodeURIComponent(canonicalSlug)}`

  // PNG만 OG 이미지로 사용 (AVIF는 Naver Yeti 미지원 → 중복 og:image 시 썸네일 오작동)
  const imagePngSrc = getCaseImageSrc(decodedSlug, "png")
  const imagePng = getVersionedImageUrl(imagePngSrc)
  const imageAlt = `${searchKeyword} 피해 회복을 위한 법률 정보 이미지`

  // 발행일/수정일: frontmatter 고정값만 사용
  // stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프(2018년 등)로 초기화되어 신뢰 불가 → 절대 사용 금지
  const datePublished = publishedAt
    ? new Date(publishedAt).toISOString()
    : new Date().toISOString()
  // dateModified: case-keyword/case-memo 실행 시 갱신되는 modifiedAt 우선, fallback publishedAt
  const dateModified = modifiedAt
    ? new Date(modifiedAt).toISOString()
    : datePublished

  return {
    title: metaTitle,
    description: seoDescription,

    robots: {
      // variant 페이지: canonical이 대표 페이지로 집중되므로 색인 제외
      //   → 중복 콘텐츠 패널티 방지 + 대표 페이지로 PageRank 집중
      // case-noindex 명령으로 수동 지정된 페이지도 색인 제외
      index: !isManualNoindex && !isVariant,
      follow: true,
      googleBot: {
        index: !isManualNoindex && !isVariant,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    alternates: {
      canonical: canonicalUrl,
      languages: {
        "ko-KR": canonicalUrl,
      },
    },

    // Naver 전용 메타 힌트
    // - thumbnail: Naver 썸네일 명시
    // - date / DC.date.issued: 발행일 보조 신호 (article:published_time 미지원 크롤러 대비)
    other: {
      thumbnail: imagePng,
      date: datePublished.slice(0, 10),
      "DC.date.issued": datePublished.slice(0, 10),
    },

    openGraph: {
      title: metaTitle,
      description: seoDescription,
      url: pageUrl,
      siteName,
      locale: "ko_KR",
      type: "article",
      // Next.js App Router: publishedTime은 openGraph 최상위에 위치해야
      // <meta property="article:published_time"> 태그가 출력됨
      // (article: { publishedTime } 중첩 구조는 Next.js가 인식하지 않음)
      publishedTime: datePublished,
      modifiedTime: dateModified,
      authors: [`${siteUrl}/attorney`],
      section: "금융사기 피해 사례",
      tags: [searchKeyword, "금융사기", "피해회복", "대온 법률사무소"],
      images: [
        {
          url: imagePng,
          secureUrl: imagePng,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: seoDescription,
      images: [imagePng],
    },
  }
}

function getRecentCases(currentSlug: string) {
  if (!fs.existsSync(casesDir)) return []

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .filter((file) => file !== `${currentSlug}.mdx`)
    .map((file) => {
      const filePath = path.join(casesDir, file)
      const stat = fs.statSync(filePath)
      const slug = file.replace(/\.mdx$/, "")

      return {
        slug,
        title: slug,
        mtime: stat.mtime.getTime(),
        birthtime: stat.birthtime.getTime(),
      }
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 6)
}

// 프론트매터만 읽기 위해 파일 앞부분(2KB)만 읽음 → 전체 파일 읽기 대비 I/O 절감
function readFrontmatterOnly(filePath: string): string {
  const fd = fs.openSync(filePath, "r")
  const buf = Buffer.alloc(2048)
  const bytesRead = fs.readSync(fd, buf, 0, 2048, 0)
  fs.closeSync(fd)
  return buf.subarray(0, bytesRead).toString("utf-8")
}

function getCaseSummaries() {
  if (caseSummariesCache) return caseSummariesCache
  if (!fs.existsSync(casesDir)) return []

  caseSummariesCache = fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      const filePath = path.join(casesDir, file)
      // 프론트매터 파싱에는 전체 파일 내용이 불필요 → 앞 2KB만 읽음
      const rawSource = readFrontmatterOnly(filePath)
      const frontmatter = parseFrontmatter(rawSource)
      const safeFrontmatterCaseName = !isBadCaseName(frontmatter.caseName)
        ? frontmatter.caseName
        : ""
      const caseName = normalizeImpersonationText(
        safeFrontmatterCaseName || normalizeSlugTitle(slug)
      )
      const searchKeyword = buildSearchKeyword(caseName)
      const representativeSlug =
        typeof frontmatter.representativeSlug === "string"
          ? frontmatter.representativeSlug
          : ""
      const caseGroupId =
        typeof frontmatter.caseGroupId === "string" ? frontmatter.caseGroupId : ""
      const groupRole =
        typeof frontmatter.groupRole === "string" ? frontmatter.groupRole : ""
      const groupOrder = Number(frontmatter.groupOrder) || 0
      const createdAt =
        typeof frontmatter.createdAt === "string" ? frontmatter.createdAt : ""
      const stat = fs.statSync(filePath)
      const text = `${slug} ${caseName} ${searchKeyword}`
      const createdTime = createdAt
        ? Date.parse(createdAt) || stat.birthtime.getTime()
        : stat.birthtime.getTime()

      return {
        slug,
        title: caseName,
        caseName,
        searchKeyword,
        representativeSlug,
        caseGroupId,
        groupRole,
        groupOrder,
        createdAt,
        text,
        birthtime: createdTime,
        mtime: stat.mtime.getTime(),
      }
    })

  return caseSummariesCache
}

function detectCaseType(text: string) {
  const value = text.toLowerCase()

  if (
    /대신증권|증권|증권사|securities|stock|주식|공모주|비상장|hts|mts|리딩방|애널리스트|투자|fwrd6|daishin|allspring|\uace8\ub4dc\ub4dc\ub9bc|\uc804\ubb38\uac00|\uc138\ub825\ud2b8\ub808\uc774\ub529/.test(
      value
    )
  ) {
    return {
      label: "증권사 사칭 사기",
    }
  }

  if (/쇼핑몰|마켓|mall|market|shop|store|구매대행|팀미션|리뷰|부업/.test(value)) {
    return {
      label: "쇼핑몰 사칭 사기",
    }
  }

  if (/코인|거래소|wallet|지갑|스테이킹|crypto|coin|bit/.test(value)) {
    return {
      label: "코인 거래소 사칭 사기",
    }
  }

  if (/해외선물|fx|마진|나스닥|선물/.test(value)) {
    return {
      label: "해외선물 사칭 사기",
    }
  }

  if (/방송|라이브|환전|채팅|만남/.test(value)) {
    return {
      label: "방송 환전 사칭 사기",
    }
  }

  return {
    label: "플랫폼 사칭 사기",
  }
}

// 같은 사기 유형 관련 사례 6개 반환
//
// 구성:
//   Slot A (3개) — 같은 유형 최신 파일
//     → 신선도 신호 + 현재 활성 사기 유형 클러스터링
//   Slot B (3개) — 같은 유형 + 현재 페이지와 다른 publishedAt 날짜
//     → 오래된 페이지로 PageRank 분산, 배치 생성 시 링크 편중 방지
//
// publishedAt 비교는 createdAt 앞 10자(YYYY-MM-DD)를 proxy로 사용
function getSameTypeCases(
  currentSlug: string,
  caseName: string,
  currentPublishedAt: string | null
) {
  const currentType = detectCaseType(`${currentSlug} ${caseName}`).label
  const currentDate = currentPublishedAt ? currentPublishedAt.slice(0, 10) : ""

  const sameType = getCaseSummaries()
    .filter((item) => item.slug !== currentSlug)
    .filter(
      (item) =>
        detectCaseType(`${item.slug} ${item.caseName}`).label === currentType
    )
    .sort((a, b) => b.mtime - a.mtime)

  // Slot A: 최신 3개
  const slotA = sameType.slice(0, 3)
  const slotASlugs = new Set(slotA.map((i) => i.slug))

  // Slot B: 나머지 중 publishedAt이 다른 날짜인 파일 3개
  // 같은 날 배치 생성 파일이 모든 슬롯을 점유하는 현상 방지
  const remaining = sameType.filter((item) => !slotASlugs.has(item.slug))
  const slotB = currentDate
    ? remaining
        .filter((item) => item.createdAt.slice(0, 10) !== currentDate)
        .slice(0, 3)
    : remaining.slice(0, 3)

  // Slot B가 부족하면 날짜 조건 없이 채움 (전체 파일 수가 적은 유형 대응)
  const slotBSlugs = new Set(slotB.map((i) => i.slug))
  const slotBFilled =
    slotB.length < 3
      ? [
          ...slotB,
          ...remaining
            .filter((item) => !slotBSlugs.has(item.slug))
            .slice(0, 3 - slotB.length),
        ]
      : slotB

  return [...slotA, ...slotBFilled]
}

function romanizeHangul(input: string) {
  const choseong = [
    "g",
    "kk",
    "n",
    "d",
    "tt",
    "r",
    "m",
    "b",
    "pp",
    "s",
    "ss",
    "",
    "j",
    "jj",
    "ch",
    "k",
    "t",
    "p",
    "h",
  ]

  const jungseong = [
    "a",
    "ae",
    "ya",
    "yae",
    "eo",
    "e",
    "yeo",
    "ye",
    "o",
    "wa",
    "wae",
    "oe",
    "yo",
    "u",
    "wo",
    "we",
    "wi",
    "yu",
    "eu",
    "ui",
    "i",
  ]

  const jongseong = [
    "",
    "g",
    "kk",
    "gs",
    "n",
    "nj",
    "nh",
    "d",
    "l",
    "lg",
    "lm",
    "lb",
    "ls",
    "lt",
    "lp",
    "lh",
    "m",
    "b",
    "bs",
    "s",
    "ss",
    "ng",
    "j",
    "ch",
    "k",
    "t",
    "p",
    "h",
  ]

  return input
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)

      if (code < 0xac00 || code > 0xd7a3) {
        return char
      }

      const syllableIndex = code - 0xac00
      const cho = Math.floor(syllableIndex / 588)
      const jung = Math.floor((syllableIndex % 588) / 28)
      const jong = syllableIndex % 28

      return `${choseong[cho]}${jungseong[jung]}${jongseong[jong]}`
    })
    .join("")
}

function normalizeClusterText(text: string) {
  // 한글 일반 업종·범주어를 로마자 변환 전에 먼저 제거
  // (로마자 변환 후 한글 패턴을 적용하면 이미 변환된 상태라 매칭되지 않음)
  const preStripped = text.replace(
    /사기|사칭|피해|사례|대응|피해회복|투자|금투자|골드바|비상장|공모주|쇼핑몰|리딩방|거래소|증권사|부업|체험단|쿠팡체험단|fx마진|해외선물|여행사|여행|항공사|항공|보험사|보험|은행|숙박/g,
    ""
  )

  return romanizeHangul(preStripped)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/\.(com|shop|vip|kr|net|org|co|io|site|store|xyz|cc|app|me|biz)/g, "")
    .replace(/market|mall|shop|store|company|investment|invest|global|securities|finance|financial|gold|bar|coin|bit|crypto|exchange|trade|trading|stock|group|corp|ltd|inc|co|kr|korea/g, "")
    .replace(/[0-9]/g, "")
    .replace(/[^a-z가-힣]/g, "")
    .trim()
}

function getClusterTokens(text: string) {
  const raw = text
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .split(/[\s\-_.:/|()[\]{}]+/g)
    .map((token) => normalizeClusterText(token))
    .filter((token) => token.length >= 3)

  const compact = normalizeClusterText(text)

  return Array.from(new Set([...raw, compact].filter((token) => token.length >= 3)))
}

function getDiceSimilarity(a: string, b: string) {
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.92
  if (a.length < 3 || b.length < 3) return 0

  const grams = (value: string) => {
    const result: string[] = []

    for (let i = 0; i < value.length - 1; i += 1) {
      result.push(value.slice(i, i + 2))
    }

    return result
  }

  const aGrams = grams(a)
  const bGrams = grams(b)
  const bSet = new Set(bGrams)

  let matches = 0

  aGrams.forEach((gram) => {
    if (bSet.has(gram)) matches += 1
  })

  return (2 * matches) / (aGrams.length + bGrams.length)
}

function getImportantCaseTokens(text: string) {
  const lower = text.toLowerCase()
  const tokens = new Set<string>()

  const directTokens = [
    "fwrd6",
    "daishin",
    "대신증권",
    "증권사",
    "증권",
    "securities",
  ]

  directTokens.forEach((token) => {
    if (lower.includes(token.toLowerCase())) {
      tokens.add(token.toLowerCase())
    }
  })

  getClusterTokens(text).forEach((token) => {
    if (token.length >= 4) {
      tokens.add(token)
    }
  })

  aliasGroups.forEach((group) => {
    if (group.some((alias) => lower.includes(alias.toLowerCase()))) {
      group.forEach((alias) => tokens.add(alias.toLowerCase()))
    }
  })

  return Array.from(tokens)
}

function getIdentityTokens(text: string) {
  const rawLower = text.toLowerCase()
  const lower = romanizeHangul(text)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
  const tokens = new Set<string>()
  const domains = lower.match(new RegExp(domainPattern, "g")) || []

  domains.forEach((domain) => {
    const compact = domain.replace(/[^a-z0-9]/g, "")
    const rootToken = domain.split(".")[0]

    if (compact.length >= 4) tokens.add(compact)
    if (rootToken.length >= 4 && !genericEnglishTokens.has(rootToken)) {
      tokens.add(rootToken)
    }
  })

  lower
    .split(/[\s\-_.:/|()[\]{}]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (/^[a-z0-9]+$/.test(token)) {
        if (token.length >= 4 && !genericEnglishTokens.has(token)) {
          tokens.add(token)
        }
      }
    })

  aliasGroups.forEach((group) => {
    if (group.some((alias) => lower.includes(alias.toLowerCase()) || rawLower.includes(alias.toLowerCase()))) {
      group.forEach((alias) => tokens.add(alias.toLowerCase()))
    }
  })

  return Array.from(tokens)
}

function sharesIdentity(a: string, b: string) {
  const aTokens = getIdentityTokens(a)
  const bTokens = getIdentityTokens(b)

  return aTokens.some((token) =>
    bTokens.some(
      (target) =>
        token === target ||
        (token.length >= 5 && target.length >= 5 && (token.includes(target) || target.includes(token)))
    )
  )
}

function isSameCaseGroup(currentText: string, targetText: string) {
  const currentType = detectCaseType(currentText).label
  const targetType = detectCaseType(targetText).label

  if (currentType !== targetType) return false

  if (!sharesIdentity(currentText, targetText)) return false

  const currentLower = currentText.toLowerCase()
  const targetLower = targetText.toLowerCase()

  const blockedCrossTypes = [
    "쇼핑몰",
    "마켓",
    "mall",
    "market",
    "shop",
    "store",
    "구매대행",
    "팀미션",
    "리뷰",
    "부업",
  ]

  if (
    currentType === "증권사 사칭 사기" &&
    blockedCrossTypes.some((word) => targetLower.includes(word))
  ) {
    return false
  }

  const currentImportant = getImportantCaseTokens(currentText)
  const targetImportant = getImportantCaseTokens(targetText)

  const hasStrongToken = currentImportant.some((token) => {
    if (token.length < 4 && !["fwrd6"].includes(token)) return false

    return targetImportant.some(
      (target) =>
        token === target ||
        token.includes(target) ||
        target.includes(token)
    )
  })

  if (hasStrongToken) return true

  const currentMain = normalizeClusterText(currentText)
  const targetMain = normalizeClusterText(targetText)

  return getDiceSimilarity(currentMain, targetMain) >= 0.72
}

function getClusterCases(currentSlug: string) {
  const currentMeta = getCaseMeta(currentSlug)
  const currentSummary = getCaseSummaries().find((item) => item.slug === currentSlug)
  const currentText = `${currentSlug} ${currentMeta.caseName} ${currentMeta.searchKeyword}`

  return getCaseSummaries()
    .filter((item) => item.slug !== currentSlug)
    .map((item) => {
      const sameExplicitGroup =
        Boolean(currentSummary?.caseGroupId) &&
        currentSummary?.caseGroupId === item.caseGroupId
      const sameGroup = sameExplicitGroup || isSameCaseGroup(currentText, item.text)

      const similarity = sameGroup
        ? Math.max(
            sameExplicitGroup ? 1 : 0,
            getDiceSimilarity(normalizeClusterText(currentText), normalizeClusterText(item.text)),
            ...getImportantCaseTokens(currentText).flatMap((token) =>
              getImportantCaseTokens(item.text).map((target) =>
                getDiceSimilarity(token, target)
              )
            )
          )
        : 0

      return {
        slug: item.slug,
        title: item.title,
        score: sameGroup ? Math.max(similarity, 0.9) : 0,
        birthtime: item.birthtime,
        mtime: item.mtime,
      }
    })
    .filter((item) => item.score >= 0.72)
    .sort((a, b) => b.score - a.score || a.birthtime - b.birthtime)
    .slice(0, 6)
}

function hasDomainKeyword(text: string) {
  return /[a-z0-9-]+(?:\.[a-z0-9-]+)+/i.test(text)
}

function hasLatinKeyword(text: string) {
  return /[a-z]/i.test(text)
}

function hasDomainUrl(text: string) {
  return /https?:\/\//i.test(text)
}

function getRepresentativePriority(item: CaseSummary) {
  let score = 0
  const name = item.caseName

  if (hasDomainUrl(name)) {
    // 5순위: 도메인 주소 전체 (https://example.com)
    score += 100
  } else if (hasDomainKeyword(name)) {
    // 4순위: 도메인명 (example.com)
    score += 200
  } else if (/리딩방/.test(name)) {
    // 3순위: 리딩방 명칭
    score += 300
  } else if (hasLatinKeyword(name)) {
    // 1순위: 영문 상호명 (도메인·URL 아닌 순수 영문)
    score += 500
  } else {
    // 2순위: 한글 상호명
    score += 400
  }

  score += getImportantCaseTokens(`${item.slug} ${item.caseName}`).length * 10

  return score
}

// 현재 페이지를 대표로 가리키는 variant 목록 반환
// 대표 페이지에서 variant들을 내부링크로 노출 → 내부링크 망 강화
function getVariantCases(currentSlug: string): CaseSummary[] {
  return getCaseSummaries()
    .filter((item) => {
      if (item.slug === currentSlug) return false
      // representativeSlug가 현재 페이지를 가리키는 경우
      if (item.representativeSlug === currentSlug) return true
      // caseGroupId가 같고 현재 페이지가 그룹 내 representative인 경우
      const current = getCaseSummaries().find((s) => s.slug === currentSlug)
      if (current?.caseGroupId && item.caseGroupId === current.caseGroupId && current.groupRole === "representative") return true
      return false
    })
    .sort((a, b) => (a.groupOrder || 999) - (b.groupOrder || 999))
    .slice(0, 20) // 최대 20개
}

function getRepresentativeCase(currentSlug: string) {
  const current = getCaseSummaries().find((item) => item.slug === currentSlug)
  const currentMeta = current || getCaseMeta(currentSlug)
  const currentText = current ? current.text : `${currentSlug} ${currentMeta.caseName} ${currentMeta.searchKeyword}`
  const summaries = getCaseSummaries()

  if (current?.representativeSlug && current.representativeSlug !== currentSlug) {
    const explicitRepresentative = summaries.find(
      (item) => item.slug === current.representativeSlug
    )

    const sameExplicitGroup =
      Boolean(current.caseGroupId) &&
      current.caseGroupId === explicitRepresentative?.caseGroupId

    if (
      explicitRepresentative &&
      (sameExplicitGroup || isSameCaseGroup(current.text, explicitRepresentative.text))
    ) {
      return explicitRepresentative
    }
  }

  if (current?.caseGroupId) {
    const explicitGroup = summaries
      .filter((item) => item.caseGroupId === current.caseGroupId)
      .sort(
        (a, b) =>
          (a.groupRole === "representative" ? -1 : 0) -
            (b.groupRole === "representative" ? -1 : 0) ||
          (a.groupOrder || 999999) - (b.groupOrder || 999999) ||
          a.birthtime - b.birthtime
      )

    if (explicitGroup.length < 2) return null

    return explicitGroup[0]
  }

  const group = summaries
    .filter((item) => isSameCaseGroup(currentText, item.text))
    .sort(
      (a, b) =>
        a.birthtime - b.birthtime ||
        getRepresentativePriority(b) - getRepresentativePriority(a)
    )

  if (group.length < 2) return null

  const representative = group[0]

  if (representative.slug === currentSlug && group.length === 1) {
    return null
  }

  return representative
}

// ─── .keywords 파일 읽기 ────────────────────────────────────────────────────
// 형식: 줄 당 키워드 1개 (content/daeonlawfintech/cases/{slug}.keywords)
function readCaseKeywords(slug: string): string[] {
  const filePath = path.join(casesDir, `${slug}.keywords`)
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, "utf8")
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean)
}

// ─── .memo 파일 읽기 ─────────────────────────────────────────────────────────
// 형식: [YYYY-MM-DD] 내용 (content/daeonlawfintech/cases/{slug}.memo)
function readCaseMemos(slug: string): { date: string; text: string }[] {
  const filePath = path.join(casesDir, `${slug}.memo`)
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2})\]\s+(.+)$/)
      return match ? { date: match[1], text: match[2].trim() } : null
    })
    .filter((item): item is { date: string; text: string } => item !== null)
}

// ─── .comments 파일 읽기 ──────────────────────────────────────────────────────
// 형식: [YYYY-MM-DD][작성자명] 내용 (content/daeonlawfintech/cases/{slug}.comments)
// 관리자가 직접 작성하거나 승인한 댓글만 저장 (case-comment 스크립트로 추가)
function readCaseComments(slug: string): { date: string; author: string; text: string }[] {
  const filePath = path.join(casesDir, `${slug}.comments`)
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2})\]\[([^\]]+)\]\s+(.+)$/)
      return match ? { date: match[1], author: match[2].trim(), text: match[3].trim() } : null
    })
    .filter((item): item is { date: string; author: string; text: string } => item !== null)
}

// H2~H4 헤딩 재구성 (H1은 첫 키워드 등장이므로 유지)
//
// 번호 헤딩 처리:
//   #1·#2 → caseName을 brandKeyword로 교체 (SEO 신호 유지, 밀도 절감)
//     "## 1. ZERIUMX 사기 코인 환불 보상 스테이킹 사칭 피해 개요"
//     → "## 1. ZERIUMX 피해 개요"
//
//   #3~#7 → caseName 제거 + 짧은 suffix를 설명적 문구로 확장 (타이핑 효과 길이 확보)
//     "## 3. ... 피해 사례"         → "## 3. 실제 피해 유형별 사례 정리"
//     "## 5. ... 대응 절차"         → "## 5. 단계별 법적 대응 절차 안내"
//     "## 7. ... 상담 및 피해 신고" → "## 7. 법률 상담 방법과 피해 신고 절차"
//
//   #8 이상 → caseName만 제거, 이미 충분히 긴 원문 유지
//
// 번호 없는 헤딩 → caseName만 제거
function processHeadings(source: string, caseName: string): string {
  if (!caseName) return source
  const brandKeyword = extractBrandKeyword(caseName)
  const escaped = caseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // 섹션 suffix → 확장 문구 매핑
  const expansionMap: Record<string, string> = {
    // #1·#2: brandKeyword 유지
    "피해 개요":           `${brandKeyword} 피해 개요`,
    "접근 방식":           `${brandKeyword} 접근 방식`,
    // #3~#7: 설명적 확장 (brandKeyword 없음)
    "피해 사례":           "실제 피해 유형별 사례 정리",
    "피해 즉시 확인 사항": "피해 직후 즉시 확인해야 할 사항",
    "대응 절차":           "단계별 법적 대응 절차 안내",
    "2차 피해 주의":       "2차 피해 예방과 주의 사항",
    "상담 및 피해 신고":   "법률 상담 방법과 피해 신고 절차",
  }

  // 번호 있는 패턴: "## N. {caseName} {suffix}" → expansion 적용 or caseName만 제거
  source = source.replace(
    new RegExp(`^(#{2,4}\\s+\\d+\\.\\s*)${escaped}\\s+(.+)$`, "gm"),
    (_match, prefix, rest) => {
      const trimmed = rest.trim()
      const expanded = expansionMap[trimmed]
      return expanded ? `${prefix}${expanded}` : `${prefix}${trimmed}`
    }
  )

  // 번호 없는 패턴: "## {caseName} rest" → caseName만 제거
  source = source.replace(
    new RegExp(`^(#{2,4}\\s+)${escaped}\\s+`, "gm"),
    "$1"
  )

  return source
}

// 섹션 1·2 본문 첫 줄의 caseName 등장 2회를 "이 사건"으로 치환
// (h2 #1·#2에 brandKeyword를 추가한 만큼 본문 밀도를 같은 수로 상쇄)
function reduceBodyCaseNameDensity(source: string, caseName: string, limit = 2): string {
  if (!caseName) return source
  const escaped = caseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  let count = 0
  return source.replace(
    new RegExp(`^${escaped}`, "gm"),
    (match) => {
      if (count < limit) {
        count++
        return "이 사건"
      }
      return match
    }
  )
}

// MDX 첫 번째 <figure> 블록 제거
// → page.tsx가 직접 hero <img>를 DOM 최상단에 렌더링하므로 중복 방지
// → Naver Yeti가 figure 밖 첫 번째 <img>를 썸네일로 인식하도록 구조 개선
function stripLeadingFigure(source: string): string {
  return source
    .trimStart()
    .replace(/^<figure[\s\S]*?<\/figure>\s*/i, "")
    .trimStart()
}

// 템플릿 이미지 → 사건명 기반 파일명으로 치환 (SEO 개선)
// next.config.ts의 rewrites가 실제 template 파일을 서빙함
const TEMPLATE_IMAGE_SUFFIX: Record<string, string> = {
  "template-02.jpg": "--02.jpg",
  "template-03.png": "--03.png",
  "template-04.jpg": "--04.jpg",
  "template-05.png": "--05.png",
  "template-06.jpg": "--06.jpg",
  "template-07.gif": "--07.gif",
  "template-08.png": "--08.png",
}

function replaceTemplateImages(source: string, slug: string): string {
  return source.replace(
    /\/images\/cases\/(template-\d{2}\.\w+)/g,
    (_match, filename) => {
      const suffix = TEMPLATE_IMAGE_SUFFIX[filename]
      return suffix ? `/images/cases/${slug}${suffix}` : _match
    }
  )
}

function normalizeImageSrc(src: string) {
  const cleanSrc = src.split("?")[0]

  if (!cleanSrc.includes("/images/cases/")) {
    return src
  }

  const imageSrc = cleanSrc

  return `${imageSrc}?v=${imageVersion}`
}

function normalizeMdxImagePaths(source: string) {
  return source.replace(
    /!\[([^\]]*)\]\((\/images\/cases\/[^)]+)\)/g,
    (_match, alt, src) => `![${alt}](${normalizeImageSrc(src)})`
  )
}

function normalizeHtmlImagePaths(source: string) {
  return source.replace(
    /src=["'](\/images\/cases\/[^"']+)["']/g,
    (_match, src) => `src="${normalizeImageSrc(src)}"`
  )
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const decodedSlug = decodeURIComponent(slug)

  const {
    filePath,
    mdxSource,
    caseName,
    searchKeyword,
    seoTitle,
    seoDescription,
    publishedAt,
    modifiedAt,
  } = getCaseMeta(decodedSlug)

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  // MDX 첫 <figure>(hero 이미지 블록) 제거 → page.tsx에서 직접 렌더링
  let source = stripLeadingFigure(mdxSource)
  source = replaceTemplateImages(source, decodedSlug)
  source = normalizeMdxImagePaths(source)
  source = normalizeHtmlImagePaths(source)
  // H2 헤딩 재구성:
  //   #1·#2 → brandKeyword 교체 ("ZERIUMX 피해 개요")
  //   #3~#7 → caseName 제거 + 설명적 확장 ("실제 피해 유형별 사례 정리")
  //   #8 이상 → caseName만 제거, 원문 유지
  // caseName 밀도 ~11.5% → ~4%로 감소
  source = processHeadings(source, caseName)
  // 섹션 1·2 본문 첫 등장 caseName → "이 사건" 치환
  // (#1·#2 헤딩에 brandKeyword 추가분을 본문에서 2회 상쇄 → 밀도 순 변화 0)
  source = reduceBodyCaseNameDensity(source, caseName)

  const stat = fs.statSync(filePath)

  // .keywords / .memo / .comments 파일 로드
  const extraKeywords = readCaseKeywords(decodedSlug)
  const caseMemos = readCaseMemos(decodedSlug)
  const caseComments = readCaseComments(decodedSlug)

  const encodedSlug = encodeURIComponent(decodedSlug)
  const pageUrl = `${siteUrl}/cases/${encodedSlug}`
  const brandKeyword = extractBrandKeyword(caseName)
  const imageUrl = getVersionedImageUrl(getCaseImageSrc(decodedSlug, "png"))
  const imageAlt = `${searchKeyword} 피해 회복을 위한 법률 정보 이미지`
  const imageCaption = `${searchKeyword} 피해 사례 및 대응 방법 안내`
  const imageDescription = `${searchKeyword} 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`

  const articleKeywords = [
    `${searchKeyword}`,
    `${caseName}`,
    `${caseName} 피해회복`,
    `${caseName} 피해 사례`,
    `${caseName} 대응 방법`,
    // .keywords 파일의 추가 키워드 → JSON-LD 및 메타에 자동 반영
    ...extraKeywords,
    ...scamTopicKeywords,
  ]

  const articleAbout = articleKeywords.map((name) => ({
    "@type": "Thing",
    name,
  }))

  let content: React.ReactNode

  try {
    const compiled = await compileMDX({
      source,
      options: {
        parseFrontmatter: false,
      },
      components: {
        img: (props) => {
          const rawSrc = typeof props.src === "string" ? props.src : ""
          const src = rawSrc.includes("/images/cases/")
            ? normalizeImageSrc(rawSrc)
            : rawSrc

          return (
            <img
              {...props}
              src={src}
              alt={
                typeof props.alt === "string" && props.alt.trim().length > 0
                  ? props.alt
                  : imageAlt
              }
            />
          )
        },

        h2: ({ children }) => (
          <TypingHeading text={String(children)} level="h2" />
        ),

        h3: ({ children }) => (
          <h3>{children}</h3>
        ),
      },
    })
    content = compiled.content
  } catch (err) {
    console.error(`[compileMDX] 실패: ${decodedSlug}`, err)
    // MDX 파싱 실패 시 원본 텍스트를 단순 렌더링 (500 방지)
    content = (
      <div className="mdx-fallback">
        <p>
          콘텐츠를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  const relatedCases = getSameTypeCases(decodedSlug, caseName, publishedAt ?? null)
  const representativeCase = getRepresentativeCase(decodedSlug)
  // 대표 페이지인 경우 variant 목록 수집 (내부링크 노출용)
  const rawFm = parseFrontmatter(fs.readFileSync(filePath, "utf-8"))
  const isRepresentative = rawFm.groupRole === "representative"
  const variantCases = isRepresentative ? getVariantCases(decodedSlug) : []

  // datePublished / dateModified: frontmatter 고정값만 사용
  // stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프(2018년 등)로 초기화 → 절대 사용 금지
  const datePublished = publishedAt
    ? new Date(publishedAt).toISOString()
    : new Date().toISOString()
  // dateModified: case-keyword/case-memo 실행 시 갱신되는 modifiedAt 우선, fallback publishedAt
  const dateModified = modifiedAt
    ? new Date(modifiedAt).toISOString()
    : datePublished

  // 10개 개별 JSON-LD → 단일 @graph로 통합 (Google Search Console 파싱 효율 향상)
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: organizationName,
        legalName: organizationName,
        alternateName: [siteName, "대온 핀테크센터", "대온 금융사기 대응센터"],
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        image: `${siteUrl}/images/logo.png`,
        telephone: phoneNumber,
        address: {
          "@type": "PostalAddress",
          streetAddress: "서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호",
          addressLocality: "서초구",
          addressRegion: "서울특별시",
          postalCode: "06647",
          addressCountry: "KR",
        },
        sameAs: ["https://cafe.naver.com/daeonlawfintech", siteUrl],
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#representative`,
        name: representativeName,
        jobTitle: "대표변호사",
        url: `${siteUrl}/attorney`,
        worksFor: { "@id": `${siteUrl}/#organization` },
        sameAs: [siteUrl, `${siteUrl}/attorney`],
      },
      {
        "@type": "LegalService",
        "@id": `${siteUrl}/#legalservice`,
        name: siteName,
        legalName: organizationName,
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        telephone: phoneNumber,
        priceRange: "$$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: "서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호",
          addressLocality: "서초구",
          addressRegion: "서울특별시",
          postalCode: "06647",
          addressCountry: "KR",
        },
        areaServed: { "@type": "Country", name: "대한민국" },
        knowsAbout: [
          "금융사기 피해 대응",
          "투자사기 피해 회복",
          "리딩방 사기",
          "코인 사기",
          "플랫폼 사칭 사기",
          "계좌 추적",
          "가압류",
          "민형사 대응",
          ...scamTopicKeywords,
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          areaServed: "KR",
          availableLanguage: ["ko-KR"],
          telephone: phoneNumber,
        },
        sameAs: ["https://cafe.naver.com/daeonlawfintech", siteUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        alternateName: ["대온 핀테크센터", "대온 법률사무소"],
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "ko-KR",
      },
      {
        "@type": "ImageObject",
        "@id": `${imageUrl}#image`,
        url: imageUrl,
        contentUrl: imageUrl,
        width: 1200,
        height: 630,
        name: imageAlt,
        caption: imageCaption,
        description: imageDescription,
        representativeOfPage: true,
        inLanguage: "ko-KR",
      },
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        isPartOf: { "@id": `${siteUrl}/#website` },
        headline: seoTitle,
        description: seoDescription,
        keywords: articleKeywords.join(", "),
        about: articleAbout,
        mentions: articleAbout,
        image: { "@id": `${imageUrl}#image` },
        author: [
          { "@id": `${siteUrl}/#organization` },
          { "@id": `${siteUrl}/#representative` },
        ],
        publisher: { "@id": `${siteUrl}/#organization` },
        datePublished,
        dateModified,
        inLanguage: "ko-KR",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".case-content h1", ".case-content h2", ".case-content p", ".case-faq-title"],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "진행 사건", item: `${siteUrl}/cases` },
          { "@type": "ListItem", position: 3, name: seoTitle, item: pageUrl },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${pageUrl}#howto`,
        name: `${searchKeyword} 피해 대응 방법`,
        description: `${searchKeyword} 피해 발생 후 증거 보존, 계좌 확인, 상담 및 민형사 대응을 준비하는 절차입니다.`,
        image: imageUrl,
        totalTime: "PT30M",
        supply: [
          { "@type": "HowToSupply", name: "입금 내역" },
          { "@type": "HowToSupply", name: "대화 내역" },
          { "@type": "HowToSupply", name: "사이트 주소 및 화면 캡처" },
          { "@type": "HowToSupply", name: "가상자산 지갑주소 또는 계좌정보" },
        ],
        step: [
          { "@type": "HowToStep", position: 1, name: "증거자료 보존", text: "사기 사이트 주소, 대화방, 입금 내역, 계좌번호, 지갑주소, 담당자 프로필 등을 삭제하지 말고 캡처해 보관합니다." },
          { "@type": "HowToStep", position: 2, name: "추가 입금 중단", text: "세금, 보증금, 인증비, 출금 수수료 등 추가 입금을 요구받더라도 더 이상 송금하지 않습니다." },
          { "@type": "HowToStep", position: 3, name: "자금 흐름 확인", text: "입금 계좌, 가상자산 지갑주소, 송금 시각, 거래소 이용 내역을 정리해 피해금 이동 경로를 확인합니다." },
          { "@type": "HowToStep", position: 4, name: "법률 상담 진행", text: "피해 자료를 바탕으로 가압류, 계좌 동결, 민사 손해배상, 형사 고소 등 가능한 대응 방향을 검토합니다." },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: `${brandKeyword} 사기 피해금을 돌려받을 수 있나요?`, acceptedAnswer: { "@type": "Answer", text: `${brandKeyword} 사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수 있으며 초기 대응 속도가 중요합니다.` } },
          { "@type": "Question", name: `${brandKeyword} 피해, 경찰 신고만으로 해결되나요?`, acceptedAnswer: { "@type": "Answer", text: `${brandKeyword} 사기 피해는 경찰 신고와 함께 민사 가압류·계좌 동결을 병행해야 실질적인 피해금 회복이 가능합니다.` } },
          { "@type": "Question", name: `${brandKeyword} 사기 피해 대응은 언제 시작해야 하나요?`, acceptedAnswer: { "@type": "Answer", text: `${brandKeyword} 사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 즉시 대응을 시작하는 것이 중요합니다.` } },
          { "@type": "Question", name: "후불제로 사건 진행을 하고 싶은데 가능한가요?", acceptedAnswer: { "@type": "Answer", text: "변호사 선임에서 후불은 불법이기에 후불이 가능하다는 곳은 변호사를 사칭하는 곳이며, 변호사가 아닌 사람의 법률 서비스 제공 또한 불법이기에 각종 전문가를 자칭하는 곳도 2차 사기 위험이 있으니 주의해야 합니다." } },
          { "@type": "Question", name: "단체 소송으로 진행하는게 좋은가요?", acceptedAnswer: { "@type": "Answer", text: "단체 소송은 대표자 선정 과정과 같은 사건의 피해자를 모집하는 기간이 길어져 의뢰인의 실익이 없기에 대온은 진행하지 않습니다." } },
        ],
      },
    ],
  }

  return (
    <main className="case-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .case-faq-box {
              max-width: 960px;
              margin: 72px auto 44px;
              padding: 38px 34px;
              border: 1px solid #d1d5db;
              border-radius: 22px;
              background: #ffffff;
              box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
            }

            .case-faq-title {
              margin: 0 0 28px;
              padding-bottom: 18px;
              border-bottom: 3px solid #111827;
              font-size: 34px;
              font-weight: 900;
              line-height: 1.35;
              letter-spacing: -0.04em;
              color: #111827;
            }

            .case-faq-item {
              margin: 0 0 14px;
              border: 1px solid #e5e7eb;
              border-radius: 15px;
              background: #ffffff;
              overflow: hidden;
            }

            .case-faq-item:last-child {
              margin-bottom: 0;
            }

            .case-faq-item summary {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 20px 22px;
              cursor: pointer;
              list-style: none;
              font-size: 19px;
              font-weight: 800;
              line-height: 1.45;
              color: #111827;
            }

            .case-faq-item summary::-webkit-details-marker {
              display: none;
            }

            .case-faq-item summary::after {
              content: "⌄";
              margin-left: auto;
              font-size: 24px;
              font-weight: 900;
              color: #111827;
              transition: transform 0.2s ease;
            }

            .case-faq-item[open] summary::after {
              transform: rotate(180deg);
            }

            .case-faq-number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex: 0 0 30px;
              width: 30px;
              height: 30px;
              border-radius: 999px;
              background: #111827;
              color: #ffffff;
              font-size: 15px;
              font-weight: 900;
            }

            .case-faq-answer {
              margin: 0 20px 20px 64px;
              padding: 18px 20px;
              border: 1px solid #dbeafe;
              border-radius: 12px;
              background: #f8fbff;
              font-size: 16px;
              line-height: 1.85;
              color: #374151;
            }

            @media (max-width: 768px) {
              .case-faq-box {
                margin: 52px 16px 36px;
                padding: 26px 20px;
                border-radius: 18px;
              }

              .case-faq-title {
                font-size: 24px;
              }

              .case-faq-item summary {
                padding: 18px 16px;
                font-size: 17px;
              }

              .case-faq-answer {
                margin: 0 14px 16px;
                padding: 16px;
                font-size: 15px;
              }
            }
          `,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="case-content">
        <h1>{seoTitle}</h1>

        {/*
          케이스 대표 이미지 — page.tsx에서 직접 렌더링 (MDX figure 제거 후 이 위치가 DOM 첫 번째 <img>)
          - Naver Yeti: DOM에서 첫 번째 <img>를 썸네일로 우선 선택
          - width/height 명시 → 크롤러가 이미지 크기 사전 인식 (1200×630 = 대형 이미지 신호)
          - fetchPriority="high" → 브라우저/크롤러 최우선 로드
          - itemProp="image" → schema.org Article 이미지 속성 명시
        */}
        <figure style={{ margin: "0 0 2rem" }}>
          <img
            src={getVersionedImageUrl(getCaseImageSrc(decodedSlug, "png"))}
            alt={imageAlt}
            width={1200}
            height={630}
            fetchPriority="high"
            itemProp="image"
            style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block" }}
          />
          <figcaption className="seo-hidden">{imageCaption}</figcaption>
        </figure>

        {content}
      </article>

      <section className="case-faq-box">
        <h2 className="case-faq-title">
          {searchKeyword} 피해 관련 자주 묻는 질문
        </h2>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">1</span>
            <span>{brandKeyword} 사기 피해금을 돌려받을 수 있나요?</span>
          </summary>
          <div className="case-faq-answer">
            {brandKeyword} 사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을
            검토할 수 있으며 초기 대응 속도가 중요합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">2</span>
            <span>{brandKeyword} 피해, 경찰 신고만으로 해결되나요?</span>
          </summary>
          <div className="case-faq-answer">
            {brandKeyword} 사기 피해는 경찰 신고와 함께 민사 가압류·계좌 동결을
            병행해야 실질적인 피해금 회복이 가능합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">3</span>
            <span>{brandKeyword} 사기 피해 대응은 언제 시작해야 하나요?</span>
          </summary>
          <div className="case-faq-answer">
            {brandKeyword} 사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지
            직후 즉시 대응을 시작하는 것이 중요합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">4</span>
            <span>후불제로 사건 진행을 하고 싶은데 가능한가요?</span>
          </summary>
          <div className="case-faq-answer">
            변호사 선임에서 후불은 불법이기에 후불이 가능하다는 곳은 변호사를
            사칭하는 곳이며, 변호사가 아닌 사람의 법률 서비스 제공 또한 불법이기에
            각종 전문가를 자칭하는 곳도 2차 사기 위험이 있으니 주의하시기
            바랍니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">5</span>
            <span>단체 소송으로 진행하는게 좋은가요?</span>
          </summary>
          <div className="case-faq-answer">
            단체 소송은 대표자 선정 과정과 같은 사건의 피해자를 모집하는 기간이
            길어져 의뢰인의 실익이 없기에 대온은 진행하지 않습니다.
          </div>
        </details>
      </section>

      {representativeCase && representativeCase.slug !== decodedSlug && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">관련 대표 사건 안내</h2>
          <p className="related-cases-desc">
            해당 사건은 아래 대표 사건과 동일 유형입니다.
          </p>

          <ul className="related-cases-list">
            <li className="related-cases-item">
              <Link href={`/cases/${encodeURIComponent(representativeCase.slug)}`} className="related-cases-link">
                {representativeCase.caseName || representativeCase.slug}
              </Link>
            </li>
          </ul>
        </section>
      )}

      {/* 대표 페이지: 동일 유형 variant 목록 내부링크 (SEO 내부링크 망 강화) */}
      {variantCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">동일 유형 관련 사건 목록</h2>
          <p className="related-cases-desc">
            아래 사건들은 동일한 유형으로 신고·접수된 피해 사례입니다.
          </p>
          <ul className="related-cases-list">
            {variantCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link
                  href={`/cases/${encodeURIComponent(item.slug)}`}
                  className="related-cases-link"
                >
                  {item.caseName || item.slug}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">
            유사한 사기 유형 피해 사례 더 보기
          </h2>

          <ul className="related-cases-list">
            {relatedCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link href={`/cases/${encodeURIComponent(item.slug)}`} className="related-cases-link">
                  {item.caseName} 피해 사례
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* P3: 사기 유형별 고유 대응 정보 (케이스 페이지 콘텐츠 차별화) */}
      <CaseTypeInsight caseType={detectCaseType(`${decodedSlug} ${caseName}`).label} caseName={caseName} />

      {/* P4: 네이버 카페 커뮤니티 링크 — 양방향 링크 신호 + E-E-A-T 보강 */}
      <section
        style={{
          maxWidth: "960px",
          margin: "32px auto 0",
          padding: "28px 32px",
          border: "1px solid #d1fae5",
          borderRadius: "18px",
          background: "#f0fdf4",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800, color: "#065f46" }}>
            대온 법률사무소 네이버 카페
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#047857", lineHeight: 1.7 }}>
            {caseName} 관련 최신 피해 사례와 대응 정보를 카페에서도 확인하실 수 있습니다.
            동일 피해를 입은 다른 피해자들의 사례가 도움이 될 수 있습니다.
          </p>
        </div>
        <Link
          href="https://cafe.naver.com/daeonlawfintech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "44px",
            padding: "0 20px",
            borderRadius: "12px",
            background: "#03c75a",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 800,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          네이버 카페 바로가기 →
        </Link>
      </section>

      {/* 추가 키워드 섹션 — .keywords 파일이 있을 때만 렌더링 */}
      {extraKeywords.length > 0 && (
        <section
          style={{
            maxWidth: "960px",
            margin: "28px auto 0",
            padding: "26px 32px",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            background: "#f9fafb",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "16px",
              fontWeight: 900,
              color: "#374151",
            }}
          >
            관련 유사 업체명 및 검색어
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#6b7280", lineHeight: 1.7 }}>
            {caseName}와 동일하거나 유사한 수법으로 운영된 업체명·도메인·검색어입니다.
            아래 명칭으로 검색하셨다면 동일한 사기 피해일 가능성이 있습니다.
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {extraKeywords.map((kw) => (
              <li
                key={kw}
                style={{
                  padding: "5px 14px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                {kw}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 댓글 섹션 — .comments 파일이 있을 때만 렌더링 (관리자 승인 댓글) */}
      {caseComments.length > 0 && (
        <section
          style={{
            maxWidth: "960px",
            margin: "28px auto 0",
            padding: "26px 32px",
            border: "1px solid #d1fae5",
            borderRadius: "18px",
            background: "#f0fdf4",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              fontWeight: 900,
              color: "#065f46",
            }}
          >
            피해자 제보 ({caseComments.length})
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            {caseComments.map((comment, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1px solid #d1fae5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#065f46",
                    }}
                  >
                    {comment.author}
                  </span>
                  <time
                    dateTime={comment.date}
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {comment.date}
                  </time>
                </div>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.75, color: "#374151" }}>
                  {comment.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 운영자 업데이트 섹션 — .memo 파일이 있을 때만 렌더링 */}
      {caseMemos.length > 0 && (
        <section
          style={{
            maxWidth: "960px",
            margin: "28px auto 32px",
            padding: "26px 32px",
            border: "1px solid #e0e7ff",
            borderRadius: "18px",
            background: "#f5f3ff",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              fontWeight: 900,
              color: "#3730a3",
            }}
          >
            운영자 업데이트
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            {caseMemos.map((memo, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1px solid #e0e7ff",
                }}
              >
                <time
                  dateTime={memo.date}
                  style={{
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#6366f1",
                    paddingTop: "2px",
                    letterSpacing: "0.03em",
                  }}
                >
                  {memo.date}
                </time>
                <span style={{ fontSize: "14px", lineHeight: 1.75, color: "#374151" }}>
                  {memo.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 전화·카카오톡 CTA 카드 */}
      <section
        style={{
          maxWidth: "960px",
          margin: "48px auto 80px",
          padding: "32px 28px",
          background: "#111827",
          borderRadius: "20px",
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#a7f3d0",
            textTransform: "uppercase",
          }}
        >
          DAEON FINTECH CENTER
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 900 }}>
          대표변호사 신동우
        </p>
        <p style={{ margin: "0 0 4px", fontSize: "15px", color: "#d1d5db" }}>
          서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호
        </p>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#d1d5db",
          }}
        >
          02-6952-3695 · 24시간 긴급 상담 대응
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="tel:0269523695"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "48px",
              padding: "0 24px",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#111827",
              fontSize: "15px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            📞 전화 상담
          </a>
          <a
            href="http://pf.kakao.com/_xcypmn/chat"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "48px",
              padding: "0 24px",
              borderRadius: "12px",
              border: "2px solid #ffffff",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            💬 카카오톡 상담
          </a>
        </div>
      </section>
    </main>
  )
}

// P3: 사기 유형별 고유 인사이트 컴포넌트
function CaseTypeInsight({ caseType, caseName }: { caseType: string; caseName: string }) {
  type TimelineStep = { day: string; event: string; signal: string }
  type InsightData = {
    title: string
    points: string[]
    warning: string
    timeline: TimelineStep[]
  }
  const insights: Record<string, InsightData> = {
    "증권사 사칭 사기": {
      title: "증권사 사칭 사기 피해 특징 및 대응 포인트",
      points: [
        "실제 증권사(대신증권·유진투자증권 등)와 동일한 이름·로고를 사용하는 가짜 사이트·앱으로 접근합니다.",
        "HTS·MTS를 모방한 화면에서 수익이 쌓이는 것처럼 보이다가 출금 시 세금·보증금을 요구합니다.",
        "공모주·비상장주식 투자를 미끼로 추가 입금을 유도하는 패턴이 많습니다.",
        "계좌 추적 시 대포통장이 연결된 경우가 많아 초기 가압류 타이밍이 중요합니다.",
      ],
      warning: "증권사 사칭 피해는 입금 계좌와 담당자 대화 캡처를 즉시 보존하고 추가 입금을 중단하는 것이 최우선입니다.",
      timeline: [
        { day: "D+0", event: "SNS·리딩방 초대 — 전문가 행세로 접근, 수익 인증 자료 공유", signal: "경계 무너짐" },
        { day: "D+3", event: "가짜 HTS·MTS 가입 유도, 소액 체험 입금 후 수익 표시 연출", signal: "신뢰 형성" },
        { day: "D+7", event: "공모주·비상장주 추천으로 고액 입금 유도, 수익률 허위 표시", signal: "본격 편취" },
        { day: "D+14", event: "출금 요청 시 세금·보증금 명목 추가 입금 요구", signal: "2차 편취" },
        { day: "D+21", event: "연락 두절, 사이트 폐쇄, 계좌 이체 후 잠적", signal: "피해 확정" },
      ],
    },
    "쇼핑몰 사칭 사기": {
      title: "쇼핑몰·팀미션 사기 피해 특징 및 대응 포인트",
      points: [
        "쿠팡·마켓컬리 등 정상 플랫폼을 사칭해 구매대행·리뷰알바·팀미션 참여를 유도합니다.",
        "초반 소액 정산 후 점점 큰 금액의 상품 구매를 요구하다가 출금을 차단하는 구조입니다.",
        "정산 완료를 미끼로 세금·보증금·잔액 충전을 반복 요구하는 패턴이 전형적입니다.",
        "사이트 화면과 정산 내역 캡처, 담당자 연락처가 회수 가능성 검토의 핵심 자료입니다.",
      ],
      warning: "추가 입금 요구를 받는 단계라면 즉시 중단해야 합니다. 이미 입금한 금액에 대한 회수 가능성을 별도로 검토합니다.",
      timeline: [
        { day: "D+0", event: "카카오톡·문자로 '재택 구매대행·팀미션 알바' 제안, 고수익 강조", signal: "접근" },
        { day: "D+1", event: "소액 미션 후 즉시 정산 — 신뢰 형성을 위해 실제 입금", signal: "신뢰 구축" },
        { day: "D+3", event: "고액 상품 구매 미션 부여, '수수료 포함 전액 정산' 약속", signal: "본격 유도" },
        { day: "D+5", event: "출금 시 세금·잔액 부족·보증금 명목 추가 입금 요구 반복", signal: "편취 반복" },
        { day: "D+10", event: "정산 지연 후 연락 차단, 플랫폼 접속 불가", signal: "피해 확정" },
      ],
    },
    "코인 가상자산 사기": {
      title: "코인·가상자산 사기 피해 특징 및 대응 포인트",
      points: [
        "실제 거래소와 동일한 UI·도메인을 모방한 가짜 거래소 앱을 통해 입금을 유도합니다.",
        "스테이킹·에어드랍 명목으로 지갑 연결을 유도하거나 추가 코인 전송을 요구합니다.",
        "출금 신청 시 추가 세금·수수료·인증비를 요구하는 패턴이 전형적입니다.",
        "가상자산 지갑주소와 트랜잭션 해시가 있으면 블록체인 추적이 가능합니다.",
      ],
      warning: "코인 출금 제한 후 추가 코인 전송을 요구받은 경우 절대 응하지 마세요. 지갑주소와 거래 내역을 즉시 보존하세요.",
      timeline: [
        { day: "D+0", event: "텔레그램 코인 채널 초대 — 스테이킹 고수익 수익 인증 자료 공유", signal: "접근" },
        { day: "D+3", event: "가짜 거래소·지갑 앱 가입 유도, 소액 입금 후 수익 연출", signal: "신뢰 형성" },
        { day: "D+7", event: "추가 스테이킹 참여 권유, 고액 코인 전송 유도", signal: "본격 편취" },
        { day: "D+14", event: "출금 요청 시 지갑 잠금 해제·세금·수수료 명목 추가 전송 요구", signal: "2차 편취" },
        { day: "D+20", event: "텔레그램 방 삭제, 사이트 폐쇄, 담당자 연락 두절", signal: "피해 확정" },
      ],
    },
    "코인 거래소 사칭 사기": {
      title: "코인·가상자산 사기 피해 특징 및 대응 포인트",
      points: [
        "실제 거래소와 동일한 UI·도메인을 모방한 가짜 거래소 앱을 통해 입금을 유도합니다.",
        "스테이킹·에어드랍 명목으로 지갑 연결을 유도하거나 추가 코인 전송을 요구합니다.",
        "출금 신청 시 추가 세금·수수료·인증비를 요구하는 패턴이 전형적입니다.",
        "가상자산 지갑주소와 트랜잭션 해시가 있으면 블록체인 추적이 가능합니다.",
      ],
      warning: "코인 출금 제한 후 추가 코인 전송을 요구받은 경우 절대 응하지 마세요. 지갑주소와 거래 내역을 즉시 보존하세요.",
      timeline: [
        { day: "D+0", event: "텔레그램 코인 채널 초대 — 스테이킹 고수익 수익 인증 자료 공유", signal: "접근" },
        { day: "D+3", event: "가짜 거래소·지갑 앱 가입 유도, 소액 입금 후 수익 연출", signal: "신뢰 형성" },
        { day: "D+7", event: "추가 스테이킹 참여 권유, 고액 코인 전송 유도", signal: "본격 편취" },
        { day: "D+14", event: "출금 요청 시 지갑 잠금 해제·세금·수수료 명목 추가 전송 요구", signal: "2차 편취" },
        { day: "D+20", event: "텔레그램 방 삭제, 사이트 폐쇄, 담당자 연락 두절", signal: "피해 확정" },
      ],
    },
    "해외선물 사칭 사기": {
      title: "해외선물 사기 피해 특징 및 대응 포인트",
      points: [
        "나스닥·금·원유·항셍 등 해외선물 거래를 미끼로 가짜 플랫폼 가입을 유도합니다.",
        "MT5·전용 앱 화면에서 수익이 표시되다가 출금 요청 시 추가 증거금을 요구합니다.",
        "리딩방 전문가를 통해 접근하며 단기 수익 보장을 강조하는 방식이 많습니다.",
        "입금 계좌, 플랫폼 URL, 리딩방 초대 경로가 핵심 증거 자료입니다.",
      ],
      warning: "해외선물 거래 플랫폼은 금융위원회 등록 여부를 먼저 확인해야 합니다. 미등록 해외선물 플랫폼은 사기 가능성이 높습니다.",
      timeline: [
        { day: "D+0", event: "리딩방 초대 — '해외선물 단타 전문가' 행세로 수익 인증 공유", signal: "접근" },
        { day: "D+2", event: "가짜 MT5·전용 앱 가입 유도, 소액 체험 후 수익 화면 연출", signal: "신뢰 형성" },
        { day: "D+7", event: "나스닥·금 종목 추천으로 고액 증거금 입금 유도", signal: "본격 편취" },
        { day: "D+14", event: "손실 발생 연출 후 추가 증거금 요구 또는 출금 시 세금 요구", signal: "2차 편취" },
        { day: "D+21", event: "리딩방 폐쇄, 플랫폼 접속 불가, 연락 두절", signal: "피해 확정" },
      ],
    },
    "방송 환전 사칭 사기": {
      title: "방송·포인트 환전 사기 피해 특징 및 대응 포인트",
      points: [
        "라이브 방송 후원, 채팅 알바, 포인트 적립 명목으로 접근합니다.",
        "적립된 포인트·수익 환전을 위해 개인정보·계좌번호·추가 입금을 요구합니다.",
        "만남·채팅 유도 후 특정 플랫폼 가입과 결제를 강요하는 패턴도 있습니다.",
        "담당자와의 대화방 캡처와 플랫폼 URL이 중요한 증거입니다.",
      ],
      warning: "방송 플랫폼에서 외부 계좌 입금을 유도하거나 개인정보를 요구하면 즉시 중단하세요.",
      timeline: [
        { day: "D+0", event: "SNS·방송 채팅에서 '포인트 적립 알바·방송 후원 수익' 제안 접근", signal: "접근" },
        { day: "D+1", event: "소액 포인트 적립 확인 후 환전 조건으로 개인정보·계좌 요구", signal: "신뢰 구축" },
        { day: "D+3", event: "환전 수수료·인증비 명목 추가 입금 요구 시작", signal: "편취 시작" },
        { day: "D+5", event: "환전 지연을 이유로 반복 입금 요구, 금액 점진적 증가", signal: "편취 반복" },
        { day: "D+10", event: "연락 차단, 플랫폼 계정 정지, 대화방 삭제", signal: "피해 확정" },
      ],
    },
    "플랫폼 사칭 사기": {
      title: "플랫폼 사칭 사기 피해 특징 및 대응 포인트",
      points: [
        "정상 플랫폼의 이름·로고·UI를 모방한 사이트나 앱을 통해 입금을 유도합니다.",
        "정상적인 서비스처럼 포장하다가 출금 단계에서 각종 수수료·인증비를 요구합니다.",
        "사이트 도메인, 담당자 연락처, 입금 계좌번호를 즉시 보존해야 합니다.",
        "동일 사이트명을 사용하는 다른 피해자와 정보를 공유하면 대응에 도움이 됩니다.",
      ],
      warning: "추가 입금 요구 단계라면 즉시 중단하고 이미 입금한 내역을 기준으로 대응 방향을 검토해야 합니다.",
      timeline: [
        { day: "D+0", event: "SNS·문자·지인 소개를 통해 정상 플랫폼처럼 포장된 사이트 안내", signal: "접근" },
        { day: "D+2", event: "가입 후 소액 수익 또는 서비스 혜택 연출로 신뢰 형성", signal: "신뢰 구축" },
        { day: "D+5", event: "고액 서비스 결제·투자 유도, 실제 수익 발생처럼 화면 조작", signal: "본격 편취" },
        { day: "D+10", event: "출금·환불 요청 시 수수료·인증비 명목 추가 입금 요구", signal: "2차 편취" },
        { day: "D+15", event: "사이트 폐쇄, 담당자 연락 두절, 피해금 회수 불가 상태", signal: "피해 확정" },
      ],
    },
  }

  const insight = insights[caseType] ?? insights["플랫폼 사칭 사기"]

  const signalColors: Record<string, { bg: string; text: string; border: string }> = {
    "접근":     { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
    "신뢰 형성": { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd" },
    "신뢰 구축": { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd" },
    "본격 편취": { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" },
    "본격 유도": { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" },
    "편취 시작": { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" },
    "편취 반복": { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
    "2차 편취": { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
    "경계 무너짐": { bg: "#faf5ff", text: "#6b21a8", border: "#d8b4fe" },
    "피해 확정": { bg: "#1f2937", text: "#f9fafb", border: "#374151" },
  }

  return (
    <section
      style={{
        maxWidth: "960px",
        margin: "44px auto 0",
        padding: "32px 34px",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          paddingBottom: "14px",
          borderBottom: "3px solid #111827",
          fontSize: "22px",
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {insight.title}
      </h2>

      <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
        {insight.points.map((point, i) => (
          <li key={i} style={{ display: "flex", gap: "10px", fontSize: "15px", lineHeight: 1.75, color: "#374151" }}>
            <span style={{ flexShrink: 0, fontWeight: 900, color: "#111827" }}>✔</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* 피해 진행 타임라인 */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#374151" }}>
          📋 피해 진행 타임라인 — 어느 단계에 있나요?
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {insight.timeline.map((step, i) => {
            const color = signalColors[step.signal] ?? signalColors["피해 확정"]
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr auto",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 900, color: color.text, letterSpacing: "0.04em" }}>
                  {step.day}
                </span>
                <span style={{ fontSize: "14px", lineHeight: 1.65, color: "#1f2937" }}>
                  {step.event}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    background: color.border,
                    color: color.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.signal}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: "#fffbeb",
          border: "1px solid #fbbf24",
          fontSize: "14px",
          lineHeight: 1.8,
          color: "#92400e",
        }}
      >
        <strong style={{ display: "block", marginBottom: "4px", fontWeight: 800, color: "#78350f" }}>⚠ 주의</strong>
        {insight.warning}
      </div>
    </section>
  )
}
