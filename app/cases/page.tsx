import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { getCurrentSite } from "@/lib/site"
import BreadcrumbJsonLd from "@/app/components/BreadcrumbJsonLd"
import CasesArchiveClient from "./CasesArchiveClient"

type CaseItem = {
  slug: string
  caseName: string
  mtime: number
  imagePath: string
  categoryId?: string
}

type CaseCategory = {
  id: string
  title: string
  description: string
  keywords: string[]
  match: RegExp
}

const caseCategories: CaseCategory[] = [
  {
    id: "teammission",
    title: "팀미션 사기",
    description: "쇼핑몰, 여행사, 체험단, 리뷰·주문대행 방식의 부업 사칭 사건입니다.",
    keywords: ["쇼핑몰", "여행사", "체험단", "리뷰·주문대행"],
    match:
      /팀미션|부업|쇼핑몰|마켓|스토어|몰|체험단|리뷰|주문|구매대행|예약|여행|여행사|항공|숙박|영화|예매|배급사|브릭|mall|market|shop|store|mission|review|travel|trip|tour/i,
  },
  {
    id: "stock-room",
    title: "주식리딩방 사기",
    description:
      "공모주·비상장, 전문가·증권사 사칭, 해외선물과 투자 플랫폼 사칭 사건입니다.",
    keywords: ["공모주·비상장", "전문가·증권사 사칭", "해외선물", "HTS"],
    match:
      /주식|리딩방|투자|전문가|증권|증권사|공모주|비상장|해외선물|선물|fx|마진|hts|mts|etf|cfd|asset|stock|futures|investment|invest|trading|trader|trade|securities|골드드림|세력트레이딩|allspring|daishin|fwrd6|sample-traders/i,
  },
  {
    id: "crypto-room",
    title: "코인리딩방 사기",
    description: "코인, 월렛, 거래소 사칭, 스테이킹 유도형 가상자산 사건입니다.",
    keywords: ["코인", "월렛", "거래소 사칭", "스테이킹"],
    match:
      /코인|가상자산|암호화폐|거래소|월렛|지갑|스테이킹|토큰|선물거래|coin|crypto|wallet|exchange|staking|token|phantom|polygon|webull|bit|nexo|doge|axs|pundiai|vobitex|luckykr/i,
  },
  {
    id: "broadcast-exchange",
    title: "방송환전 사기",
    description: "라이브 방송, 포인트 환전, 채팅·만남 유도 방식의 사칭 사건입니다.",
    keywords: ["라이브 방송", "포인트 환전", "채팅", "만남 유도"],
    match:
      /방송|라이브|환전|포인트|채팅|만남|미팅|소개팅|티켓|스타티켓|live|point|chat|ticket|exchange/i,
  },
]

function readFrontmatterValue(source: string, key: string) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return match?.[1]?.trim() || ""
}

function getCategoryForCase(item: CaseItem) {
  const target = `${item.slug} ${item.caseName}`
  return (
    caseCategories.find((category) => category.match.test(target)) ||
    caseCategories[1]
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite()

  const pageUrl = `${site.baseUrl}/cases`
  const imageUrl = `${site.baseUrl}/images/og-default.png`

  return {
    title: `금융사기 피해 사례 유형별 목록 | ${site.siteName}`,
    description:
      "팀미션 사기, 주식리딩방 사기, 코인리딩방 사기, 방송환전 사기 등 실제 피해 사례를 유형별로 정리한 사건 목록 페이지입니다.",
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        "ko-KR": pageUrl,
      },
    },
    openGraph: {
      title: "금융사기 피해 사례 유형별 목록",
      description:
        "팀미션, 주식리딩방, 코인리딩방, 방송환전 등 주요 금융사기 피해 사례를 유형별로 확인합니다.",
      url: pageUrl,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "금융사기 피해 사례 유형별 목록 페이지",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "금융사기 피해 사례 유형별 목록",
      description:
        "팀미션, 주식리딩방, 코인리딩방, 방송환전 등 주요 금융사기 피해 사례를 유형별로 확인합니다.",
      images: [imageUrl],
    },
  }
}

export default async function CasesPage() {
  const site = await getCurrentSite()

  const casesDirectory = path.join(
    process.cwd(),
    "content",
    site.contentKey,
    "cases"
  )

  const filenames = fs.existsSync(casesDirectory)
    ? fs.readdirSync(casesDirectory)
    : []

  const cases = filenames
    .filter((filename) => filename.endsWith(".mdx"))
    .filter((filename) => filename !== "_template.mdx")
    .filter((filename) => !filename.startsWith("_"))
    .map((filename) => {
      const filePath = path.join(casesDirectory, filename)
      const stat = fs.statSync(filePath)
      const slug = filename.replace(/\.mdx$/, "")
      const source = fs.readFileSync(filePath, "utf8")
      const caseName = readFrontmatterValue(source, "caseName") || slug.replace(/-/g, " ")

      const item = {
        slug,
        caseName,
        mtime: stat.mtime.getTime(),
        imagePath: `/images/cases/${slug}.png`,
      }

      return {
        ...item,
        categoryId: getCategoryForCase(item).id,
      }
    })
    .sort((a, b) => b.mtime - a.mtime)

  const categoryBuckets = caseCategories.map((category) => ({
    ...category,
    cases: cases.filter((item) => item.categoryId === category.id),
  }))

  const pageUrl = `${site.baseUrl}/cases`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "금융사기 피해 사례 유형별 목록",
    url: pageUrl,
    description:
      "팀미션 사기, 주식리딩방 사기, 코인리딩방 사기, 방송환전 사기 등 실제 피해 사례를 유형별로 정리한 사건 목록 페이지입니다.",
    hasPart: categoryBuckets.map((category) => ({
      "@type": "CollectionPage",
      name: category.title,
      url: `${pageUrl}#${category.id}`,
      description: category.description,
    })),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cases.slice(0, 50).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${item.caseName} 피해 사례`,
        url: `${site.baseUrl}/cases/${encodeURIComponent(item.slug)}`,
      })),
    },
  }

  return (
    <main
      id="top"
      className="min-h-screen bg-[#f6f7fb] px-5 py-12"
    >
      <BreadcrumbJsonLd
        items={[
          {
            name: "홈",
            url: site.baseUrl,
          },
          {
            name: "진행사건",
            url: `${site.baseUrl}/cases`,
          },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto max-w-[1500px]">
        <CasesArchiveClient
          cases={cases}
          categories={caseCategories.map(({ id, title, description, keywords }) => ({
            id,
            title,
            description,
            keywords,
          }))}
        />
      </section>
    </main>
  )
}
