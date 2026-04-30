import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import TypingHeading from "@/app/components/TypingHeading"

export const dynamic = "force-static"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const organizationName = "대온 법률사무소"
const representativeName = "신동우"
const phoneNumber = "+82-2-6952-3695"
const imageVersion = "20260430"

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
const publicCasesDir = path.join(process.cwd(), "public", "images", "cases")

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

function stripFrontmatter(source: string) {
  return source.replace(/^---[\s\S]*?---\s*/, "")
}

function stripLeakedMetaLines(source: string) {
  return source
    .replace(/^\s*(title|caseName|description|slug)\s*:\s*["']?.*?["']?\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function stripBrokenRelatedGuide(source: string) {
  return source
    .replace(
      /(^|\n)#{1,6}\s*관련\s*대표\s*사건\s*안내[\s\S]*?(?=\n#{1,6}\s|\n---|\n$)/g,
      "\n"
    )
    .replace(/^\s*해당 사건은 아래 대표 사건과 동일 유형입니다\.\s*$/gim, "")
    .replace(/^\s*👉\s*\/cases\/[^\n]+$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function stripTopAutoHeadings(source: string) {
  return source
    .replace(/^\s*#\s+.*$/gm, "")
    .replace(/^\s*##\s+.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
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

function withKeyword(text: string, keyword: string) {
  return text.includes(keyword) ? text : `${text} ${keyword}`
}

function buildSearchKeyword(caseName: string) {
  return withKeyword(withKeyword(caseName, "사기"), "사칭")
}

function buildSeoTitle(caseName: string) {
  return `${buildSearchKeyword(caseName)} 피해회복`
}

function buildSeoDescription(caseName: string) {
  return `${withKeyword(caseName, "사기")} 피해 사례 및 대응 전략 안내`
}

function getCaseFilePath(slug: string) {
  return path.join(casesDir, `${slug}.mdx`)
}

function getCaseMeta(decodedSlug: string) {
  const filePath = getCaseFilePath(decodedSlug)

  if (!fs.existsSync(filePath)) {
    const fallbackCaseName = normalizeSlugTitle(decodedSlug)
    const normalizedFallbackCaseName = normalizeImpersonationText(fallbackCaseName)

    return {
      filePath,
      rawSource: "",
      mdxSource: "",
      caseName: normalizedFallbackCaseName,
      searchKeyword: buildSearchKeyword(normalizedFallbackCaseName),
      seoTitle: buildSeoTitle(normalizedFallbackCaseName),
      seoDescription: buildSeoDescription(normalizedFallbackCaseName),
    }
  }

  const rawSource = fs.readFileSync(filePath, "utf-8")
  const frontmatter = parseFrontmatter(rawSource)

  const caseName = normalizeImpersonationText(
    frontmatter.caseName ||
      frontmatter.title?.replace(/\s*피해회복\s*$/g, "") ||
      normalizeSlugTitle(decodedSlug)
  )

  const searchKeyword = buildSearchKeyword(caseName)

  const seoTitle = frontmatter.title || buildSeoTitle(caseName)
  const seoDescription = frontmatter.description || buildSeoDescription(caseName)

  let mdxSource = stripFrontmatter(rawSource)
  mdxSource = stripLeakedMetaLines(mdxSource)
  mdxSource = stripBrokenRelatedGuide(mdxSource)
  mdxSource = stripTopAutoHeadings(mdxSource)

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
    .replaceAll("{{SEARCH_KEYWORD}}", searchKeyword)

  mdxSource = stripLeakedMetaLines(mdxSource)

  return {
    filePath,
    rawSource,
    mdxSource,
    caseName,
    searchKeyword,
    seoTitle,
    seoDescription,
  }
}

export async function generateStaticParams() {
  if (!fs.existsSync(casesDir)) return []

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
    }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const decodedSlug = decodeURIComponent(slug)
  const { searchKeyword, seoTitle, seoDescription } = getCaseMeta(decodedSlug)

  const pageUrl = `${siteUrl}/cases/${decodedSlug}`
  const imageAvif = `${siteUrl}/images/cases/${decodedSlug}.avif?v=${imageVersion}`
  const imagePng = `${siteUrl}/images/cases/${decodedSlug}.png?v=${imageVersion}`
  const imageAlt = `${searchKeyword} 피해 회복을 위한 법률 정보 이미지`

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
      images: [
        {
          url: imagePng,
          secureUrl: imagePng,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
        {
          url: imageAvif,
          secureUrl: imageAvif,
          type: "image/avif",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
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
      }
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 6)
}

function detectCaseType(text: string) {
  const value = text.toLowerCase()

  if (
    /대신증권|증권|securities|stock|주식|공모주|비상장|hts|mts|리딩방|애널리스트|투자/.test(
      value
    )
  ) {
    return {
      label: "증권사 사칭 사기",
      representativeSlug: "증권사-사칭-사기",
    }
  }

  if (/쇼핑몰|마켓|mall|market|shop|store|구매대행|팀미션|리뷰|부업/.test(value)) {
    return {
      label: "쇼핑몰 사칭 사기",
      representativeSlug: "쇼핑몰-사칭-사기",
    }
  }

  if (/코인|거래소|wallet|지갑|스테이킹|crypto|coin|bit/.test(value)) {
    return {
      label: "코인 거래소 사칭 사기",
      representativeSlug: "코인-거래소-사칭-사기",
    }
  }

  if (/해외선물|fx|마진|나스닥|선물/.test(value)) {
    return {
      label: "해외선물 사칭 사기",
      representativeSlug: "해외선물-사칭-사기",
    }
  }

  if (/방송|라이브|환전|채팅|만남/.test(value)) {
    return {
      label: "방송 환전 사칭 사기",
      representativeSlug: "방송-환전-사칭-사기",
    }
  }

  return {
    label: "플랫폼 사칭 사기",
    representativeSlug: "플랫폼-사칭-사기",
  }
}

function getRepresentativeCase(currentSlug: string, caseName: string) {
  const detected = detectCaseType(`${currentSlug} ${caseName}`)

  return {
    label: detected.label,
    slug: detected.representativeSlug,
    exists: fs.existsSync(getCaseFilePath(detected.representativeSlug)),
  }
}

function getSameTypeCases(currentSlug: string, caseName: string) {
  if (!fs.existsSync(casesDir)) return []

  const currentType = detectCaseType(`${currentSlug} ${caseName}`).label

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .filter((file) => file !== `${currentSlug}.mdx`)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      const meta = getCaseMeta(slug)
      const stat = fs.statSync(path.join(casesDir, file))

      return {
        slug,
        title: meta.caseName,
        type: detectCaseType(`${slug} ${meta.caseName}`).label,
        mtime: stat.mtime.getTime(),
      }
    })
    .filter((item) => item.type === currentType)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 6)
}

function resolveImageSrc(src: string, decodedSlug: string) {
  if (!src.includes("/images/cases/")) return src

  const cleanSrc = src.split("?")[0]
  const fileName = path.basename(cleanSrc)
  const parsed = path.parse(fileName)

  const directCandidates = [
    `${parsed.name}.png`,
    `${parsed.name}.jpg`,
    `${parsed.name}.jpeg`,
    `${parsed.name}.webp`,
    `${parsed.name}.avif`,
    `${parsed.name}.gif`,
  ]

  for (const candidate of directCandidates) {
    if (fs.existsSync(path.join(publicCasesDir, candidate))) {
      return `/images/cases/${candidate}?v=${imageVersion}`
    }
  }

  const numberedMatch = parsed.name.match(/-(\d{2})$/)

  if (numberedMatch) {
    const number = numberedMatch[1]
    const numberedCandidates = [
      `${decodedSlug}-${number}.png`,
      `${decodedSlug}-${number}.jpg`,
      `${decodedSlug}-${number}.jpeg`,
      `${decodedSlug}-${number}.webp`,
      `${decodedSlug}-${number}.avif`,
      `${decodedSlug}-${number}.gif`,
      `template-${number}.png`,
      `template-${number}.jpg`,
      `template-${number}.jpeg`,
      `template-${number}.webp`,
      `template-${number}.avif`,
      `template-${number}.gif`,
    ]

    for (const candidate of numberedCandidates) {
      if (fs.existsSync(path.join(publicCasesDir, candidate))) {
        return `/images/cases/${candidate}?v=${imageVersion}`
      }
    }
  }

  return `${cleanSrc}?v=${imageVersion}`
}

function normalizeMdxImagePaths(source: string, decodedSlug: string) {
  return source.replace(
    /!\[([^\]]*)\]\((\/images\/cases\/[^)]+)\)/g,
    (_match, alt, src) => `![${alt}](${resolveImageSrc(src, decodedSlug)})`
  )
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

function getClusterCases(currentSlug: string) {
  if (!fs.existsSync(casesDir)) return []

  const currentMeta = getCaseMeta(currentSlug)
  const currentText = `${currentSlug} ${currentMeta.caseName} ${currentMeta.searchKeyword}`
  const currentTokens = getClusterTokens(currentText)
  const currentMain = normalizeClusterText(currentText)
  const currentType = detectCaseType(currentText).label

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .filter((file) => file !== `${currentSlug}.mdx`)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      const meta = getCaseMeta(slug)
      const text = `${slug} ${meta.caseName} ${meta.searchKeyword}`
      const tokens = getClusterTokens(text)
      const main = normalizeClusterText(text)
      const type = detectCaseType(text).label

      const directMatch =
        currentType === type &&
        currentTokens.some((token) =>
          tokens.some(
            (target) =>
              token === target ||
              token.includes(target) ||
              target.includes(token)
          )
        )

      const similarity = Math.max(
        getDiceSimilarity(currentMain, main),
        ...currentTokens.flatMap((token) =>
          tokens.map((target) => getDiceSimilarity(token, target))
        )
      )

      return {
        slug,
        title: meta.caseName,
        score: directMatch ? 1 : currentType === type ? similarity : 0,
      }
    })
    .filter((item) => item.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
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
  } = getCaseMeta(decodedSlug)

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const source = normalizeMdxImagePaths(mdxSource, decodedSlug)

  const stat = fs.statSync(filePath)

  const pageUrl = `${siteUrl}/cases/${decodedSlug}`
  const imageUrl = `${siteUrl}/images/cases/${decodedSlug}.png?v=${imageVersion}`
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

  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
    },
    components: {
      img: (props) => {
        const src =
          typeof props.src === "string" && props.src.includes("/images/cases/")
            ? resolveImageSrc(props.src, decodedSlug)
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

  const recentCases = getRecentCases(decodedSlug)
  const clusterCases = getClusterCases(decodedSlug)
  const sameTypeCases = getSameTypeCases(decodedSlug, caseName)
  const representativeCase = getRepresentativeCase(decodedSlug, caseName)

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: organizationName,
    legalName: organizationName,
    alternateName: [
      siteName,
      "대온 핀테크센터",
      "대온 금융사기 대응센터",
      "대온 법률사무소 금융사기 대응센터",
    ],
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
    founder: {
      "@type": "Person",
      "@id": `${siteUrl}/#representative`,
      name: representativeName,
      jobTitle: "대표변호사",
      url: siteUrl,
      worksFor: {
        "@id": `${siteUrl}/#organization`,
      },
    },
    sameAs: ["https://cafe.naver.com/daeonlawfintech", siteUrl],
  }

  const legalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${siteUrl}/#legalservice`,
    name: siteName,
    legalName: organizationName,
    alternateName: [
      "대온 핀테크센터",
      "대온 금융사기 대응센터",
      "대온 법률사무소 금융사기 대응센터",
    ],
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/logo.png`,
    telephone: phoneNumber,
    priceRange: "$$$",
    description:
      "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호",
      addressLocality: "서초구",
      addressRegion: "서울특별시",
      postalCode: "06647",
      addressCountry: "KR",
    },
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
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
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    alternateName: ["대온 핀테크센터", "대온 법률사무소"],
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    inLanguage: "ko-KR",
  }

  const authorJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#author`,
        name: organizationName,
        legalName: organizationName,
        alternateName: [siteName, "대온 핀테크센터"],
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        sameAs: ["https://cafe.naver.com/daeonlawfintech", siteUrl],
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#representative`,
        name: representativeName,
        jobTitle: "대표변호사",
        url: siteUrl,
        worksFor: {
          "@id": `${siteUrl}/#organization`,
        },
        affiliation: {
          "@id": `${siteUrl}/#organization`,
        },
        sameAs: [siteUrl],
      },
    ],
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    headline: seoTitle,
    description: seoDescription,
    keywords: articleKeywords.join(", "),
    about: articleAbout,
    mentions: articleAbout,
    image: {
      "@type": "ImageObject",
      "@id": `${imageUrl}#image`,
      url: imageUrl,
      contentUrl: imageUrl,
      width: 1200,
      height: 630,
      caption: imageCaption,
      description: imageDescription,
      inLanguage: "ko-KR",
    },
    author: [
      {
        "@id": `${siteUrl}/#author`,
      },
      {
        "@id": `${siteUrl}/#representative`,
      },
    ],
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: organizationName,
      legalName: organizationName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: ["https://cafe.naver.com/daeonlawfintech", siteUrl],
    },
    datePublished: stat.birthtime.toISOString(),
    dateModified: stat.mtime.toISOString(),
    inLanguage: "ko-KR",
  }

  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "SpeakableSpecification",
    cssSelector: [
      ".case-content h1",
      ".case-content h2",
      ".case-content p",
      ".case-faq-title",
    ],
  }

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: `${searchKeyword} 피해 대응 방법`,
    description: `${searchKeyword} 피해 발생 후 증거 보존, 계좌 확인, 상담 및 민형사 대응을 준비하는 절차입니다.`,
    image: imageUrl,
    totalTime: "PT30M",
    supply: [
      {
        "@type": "HowToSupply",
        name: "입금 내역",
      },
      {
        "@type": "HowToSupply",
        name: "대화 내역",
      },
      {
        "@type": "HowToSupply",
        name: "사이트 주소 및 화면 캡처",
      },
      {
        "@type": "HowToSupply",
        name: "가상자산 지갑주소 또는 계좌정보",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "증거자료 보존",
        text: "사기 사이트 주소, 대화방, 입금 내역, 계좌번호, 지갑주소, 담당자 프로필 등을 삭제하지 말고 캡처해 보관합니다.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "추가 입금 중단",
        text: "세금, 보증금, 인증비, 출금 수수료 등 추가 입금을 요구받더라도 더 이상 송금하지 않습니다.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "자금 흐름 확인",
        text: "입금 계좌, 가상자산 지갑주소, 송금 시각, 거래소 이용 내역을 정리해 피해금 이동 경로를 확인합니다.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "법률 상담 진행",
        text: "피해 자료를 바탕으로 가압류, 계좌 동결, 민사 손해배상, 형사 고소 등 가능한 대응 방향을 검토합니다.",
      },
    ],
  }

  const imageJsonLd = {
    "@context": "https://schema.org",
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
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "진행 사건",
        item: `${siteUrl}/cases`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: seoTitle,
        item: pageUrl,
      },
    ],
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "피해금 회복이 가능한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수 있으며 초기 대응 속도가 중요합니다.",
        },
      },
      {
        "@type": "Question",
        name: "경찰 신고만으로 해결되나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "경찰 신고는 중요하지만 실제 피해금 회복을 위해서는 민사 대응과 계좌 관련 절차가 함께 검토되어야 합니다.",
        },
      },
      {
        "@type": "Question",
        name: "대응은 언제 시작해야 하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 대응을 시작하는 것이 중요합니다.",
        },
      },
      {
        "@type": "Question",
        name: "후불제로 사건 진행을 하고 싶은데 가능한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "변호사 선임에서 후불은 불법이기에 후불이 가능하다는 곳은 변호사를 사칭하는 곳이며, 변호사가 아닌 사람의 법률 서비스 제공 또한 불법이기에 각종 전문가를 자칭하는 곳도 2차 사기 위험이 있으니 주의해야 합니다.",
        },
      },
      {
        "@type": "Question",
        name: "단체 소송으로 진행하는게 좋은가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "단체 소송은 대표자 선정 과정과 같은 사건의 피해자를 모집하는 기간이 길어져 의뢰인의 실익이 없기에 대온은 진행하지 않습니다.",
        },
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(legalServiceJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imageJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <article className="case-content">
        <h1>{seoTitle}</h1>
        <TypingHeading text={`${searchKeyword} 피해 사례와 대응 방법`} level="h2" />
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

      <section className="related-cases related-cases-box">
        <h2 className="related-cases-title">관련 대표 사건 안내</h2>

        <ul className="related-cases-list">
          <li className="related-cases-item">
            {representativeCase.exists ? (
              <Link href={`/cases/${representativeCase.slug}`} className="related-cases-link">
                {representativeCase.label} 대표 사례 바로가기
              </Link>
            ) : (
              <span className="related-cases-link">
                {representativeCase.label} 대표 사례
              </span>
            )}
          </li>
        </ul>
      </section>

      {sameTypeCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">같은 유형의 피해 사례 더 보기</h2>

          <ul className="related-cases-list">
            {sameTypeCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link href={`/cases/${item.slug}`} className="related-cases-link">
                  {item.title.replace(/-/g, " ").replace(/사기$/, "")} 사기 피해 사례
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {clusterCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">관련 사건 안내</h2>

          <ul className="related-cases-list">
            {clusterCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link href={`/cases/${item.slug}`} className="related-cases-link">
                  {item.title.replace(/-/g, " ").replace(/사기$/, "")} 사기 피해 사례
                </Link>
              </li>
            ))}
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
                <Link href={`/cases/${item.slug}`} className="related-cases-link">
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