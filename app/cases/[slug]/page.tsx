import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import TypingHeading from "@/app/components/TypingHeading"

// Vercel/Next cache tags can include decoded Korean slugs for ISR pages.
// That can produce an invalid x-next-cache-tags header on production.
export const dynamic = "force-dynamic"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const organizationName = "대온 법률사무소"
const representativeName = "신동우"
const phoneNumber = "+82-2-6952-3695"
const imageVersion = "20260430"

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const publicDir = path.join(process.cwd(), "public")
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
])

function stripFrontmatter(source: string) {
  return source.replace(/^---[\s\S]*?---\s*/, "")
}

function stripLeakedMetaLines(source: string) {
  return source
    .replace(/^\s*(title|caseName|description|slug|representativeSlug|createdAt|caseGroupId|groupRole|groupOrder|primaryKeyword|aliases|caseType|publishedAt)\s*:\s*["']?.*?["']?\s*$/gim, "")
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

function buildSeoTitle(caseName: string) {
  return `${buildCaseDisplayName(caseName)} 피해회복`
}

function buildSeoDescription(caseName: string) {
  return `${withKeyword(caseName, "사기")} 피해 사례 및 대응 전략 안내`
}

function getCaseFilePath(slug: string) {
  return path.join(casesDir, `${slug}.mdx`)
}

function publicImageExists(src: string) {
  const cleanSrc = src.split("?")[0].replace(/^\//, "")

  return fs.existsSync(path.join(publicDir, cleanSrc))
}

function getVersionedImageUrl(src: string) {
  return `${siteUrl}${src}?v=${imageVersion}`
}

function getCaseImageSrc(slug: string, extension: "png" | "avif") {
  const candidate = `/images/cases/${slug}.${extension}`

  return publicImageExists(candidate) ? candidate : fallbackCaseImagePath
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
  const seoTitle = buildSeoTitle(caseName)

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

  // frontmatter publishedAt이 있으면 고정 날짜 사용 (Vercel 배포 시 birthtime 재설정 방지)
  const publishedAt = frontmatter.publishedAt || null

  return {
    filePath,
    rawSource,
    mdxSource,
    caseName,
    searchKeyword,
    seoTitle,
    seoDescription,
    publishedAt,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const decodedSlug = decodeURIComponent(slug)
  const { searchKeyword, seoTitle, seoDescription } = getCaseMeta(decodedSlug)

  // canonical은 항상 percent-encoded 형태로 통일 (Google·Naver 중복 URL 방지)
  const encodedSlug = encodeURIComponent(decodedSlug)
  const pageUrl = `${siteUrl}/cases/${encodedSlug}`
  const imageAvifSrc = getCaseImageSrc(decodedSlug, "avif")
  const imagePngSrc = getCaseImageSrc(decodedSlug, "png")
  const imageAvif = getVersionedImageUrl(imageAvifSrc)
  const imagePng = getVersionedImageUrl(imagePngSrc)
  const imageAlt = `${searchKeyword} 피해 회복을 위한 법률 정보 이미지`

  const openGraphImages = [
    {
      url: imagePng,
      secureUrl: imagePng,
      type: "image/png",
      width: 1200,
      height: 630,
      alt: imageAlt,
    },
    ...(imageAvifSrc.endsWith(".avif")
      ? [
          {
            url: imageAvif,
            secureUrl: imageAvif,
            type: "image/avif",
            width: 1200,
            height: 630,
            alt: imageAlt,
          },
        ]
      : []),
  ]

  return {
    title: seoTitle,
    description: seoDescription,

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    alternates: {
      canonical: pageUrl,
      languages: {
        "ko-KR": pageUrl,
      },
    },

    other: {
      "og:image": imagePng,
      "og:image:secure_url": imagePng,
      "og:image:type": "image/png",
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": imageAlt,
    },

    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: pageUrl,
      siteName,
      locale: "ko_KR",
      type: "article",
      images: openGraphImages,
    },

    twitter: {
      card: "summary_large_image",
      title: seoTitle,
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

function getSameTypeCases(currentSlug: string, caseName: string) {
  const currentType = detectCaseType(`${currentSlug} ${caseName}`).label

  return getCaseSummaries()
    .filter((item) => item.slug !== currentSlug)
    .map((item) => ({
      ...item,
      type: detectCaseType(`${item.slug} ${item.caseName}`).label,
    }))
    .filter((item) => item.type === currentType)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 6)
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
  return romanizeHangul(text)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/\.(com|shop|vip|kr|net|org|co|io|site|store|xyz|cc|app|me|biz)/g, "")
    .replace(/사기|사칭|피해|사례|대응|피해회복|투자|금투자|골드바|비상장|공모주|쇼핑몰|리딩방|거래소|증권사|부업|체험단|쿠팡체험단|fx마진|해외선물/g, "")
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

function getRepresentativePriority(item: CaseSummary) {
  let score = 0

  if (hasDomainKeyword(item.caseName)) {
    score += 300
  } else if (hasLatinKeyword(item.caseName)) {
    score += 200
  } else {
    score += 100
  }

  score += getImportantCaseTokens(`${item.slug} ${item.caseName}`).length * 10

  return score
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

function normalizeImageSrc(src: string) {
  const cleanSrc = src.split("?")[0]

  if (!cleanSrc.includes("/images/cases/")) {
    return src
  }

  const imageSrc = publicImageExists(cleanSrc) ? cleanSrc : fallbackCaseImagePath

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
  } = getCaseMeta(decodedSlug)

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  let source = normalizeMdxImagePaths(mdxSource)
  source = normalizeHtmlImagePaths(source)

  const stat = fs.statSync(filePath)

  const encodedSlug = encodeURIComponent(decodedSlug)
  const pageUrl = `${siteUrl}/cases/${encodedSlug}`
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
          const src =
            typeof props.src === "string" && props.src.includes("/images/cases/")
              ? normalizeImageSrc(props.src)
              : props.src

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
          <TypingHeading text={String(children)} level="h3" />
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

  const recentCases = getRecentCases(decodedSlug)
  const representativeCase = getRepresentativeCase(decodedSlug)

  // datePublished: frontmatter publishedAt 고정값 우선
  // → Vercel 배포 시 파일 birthtime이 재설정되는 버그 방지
  const datePublished = publishedAt
    ? new Date(publishedAt).toISOString()
    : stat.mtime.toISOString()
  const dateModified = stat.mtime.toISOString()

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
          { "@type": "Question", name: "피해금 회복이 가능한가요?", acceptedAnswer: { "@type": "Answer", text: "사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수 있으며 초기 대응 속도가 중요합니다." } },
          { "@type": "Question", name: "경찰 신고만으로 해결되나요?", acceptedAnswer: { "@type": "Answer", text: "경찰 신고는 중요하지만 실제 피해금 회복을 위해서는 민사 대응과 계좌 관련 절차가 함께 검토되어야 합니다." } },
          { "@type": "Question", name: "대응은 언제 시작해야 하나요?", acceptedAnswer: { "@type": "Answer", text: "사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 대응을 시작하는 것이 중요합니다." } },
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
        {content}
      </article>

      <section className="case-faq-box">
        <h2 className="case-faq-title">
          {searchKeyword} 피해 관련 자주 묻는 질문
        </h2>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">1</span>
            <span>피해금 회복이 가능한가요?</span>
          </summary>
          <div className="case-faq-answer">
            사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수
            있으며 초기 대응 속도가 중요합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">2</span>
            <span>경찰 신고만으로 해결되나요?</span>
          </summary>
          <div className="case-faq-answer">
            경찰 신고는 중요하지만 실제 피해금 회복을 위해서는 민사 대응과 계좌
            관련 절차가 함께 검토되어야 합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">3</span>
            <span>대응과 상담은 언제 시작해야 하나요?</span>
          </summary>
          <div className="case-faq-answer">
            사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 바로 상담과
            대응을 시작하는 것이 중요합니다.
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
                /cases/{representativeCase.slug}
              </Link>
            </li>
          </ul>
        </section>
      )}

      {recentCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">
            유사한 사기 유형 피해 사례 더 보기
          </h2>

          <ul className="related-cases-list">
            {recentCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link href={`/cases/${encodeURIComponent(item.slug)}`} className="related-cases-link">
                  {item.title.replace(/-/g, " ").replace(/사기$/, "")} 사기 피해 사례
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
