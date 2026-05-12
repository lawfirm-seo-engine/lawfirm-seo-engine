import type { Metadata } from "next"
import { getCurrentSite } from "@/lib/site"
import BreadcrumbJsonLd from "@/app/components/BreadcrumbJsonLd"
import {
  caseCategories,
  getPublicCaseCategories,
} from "@/lib/caseCategories"
import { readCaseItems } from "@/lib/caseArchive"
import CasesArchiveClient from "./CasesArchiveClient"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite()

  const pageUrl = `${site.baseUrl}/cases`
  const imageUrl = `${site.baseUrl}/images/og-default.png`

  return {
    title: `금융사기 피해 사례 유형별 목록 | ${site.siteName}`,
    description:
      "팀미션 사기, 주식리딩방 사기, 코인리딩방 사기, 방송환전 사기 등 실제 피해 사례를 유형별로 정리한 사건 목록 페이지입니다.",
    robots: {
      // 개별 케이스 페이지가 사건명 키워드로 노출되어야 함.
      // /cases 목록 페이지가 662개 사건명을 모두 포함해 키워드 경쟁 발생 → noindex 처리.
      // follow 유지: /cases → 개별 페이지 링크의 권위 전달은 계속됨.
      index: false,
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

  const cases = readCaseItems(site.contentKey)

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
      // JSON-LD는 전체 323개 포함 (Google/Naver 구조화 데이터 파싱용)
      itemListElement: cases.map((item, index) => ({
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
          categories={getPublicCaseCategories()}
        />
      </section>

      {/*
        서버 사이드 전체 사건 색인 — 크롤러용
        - JS 실행 없이도 전체 323개 링크를 HTML에서 읽을 수 있도록 서버 렌더링
        - 네이버 Yeti·Googlebot의 내부 링크 발견율 개선
        - 시각적으로는 접혀 있지만 DOM에 존재 → 크롤러·스크린리더 접근 가능
      */}
      <nav
        aria-label="전체 금융사기 피해 사건 목록"
        className="mx-auto mt-16 max-w-[1500px]"
      >
        <details>
          <summary className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-700 shadow-sm hover:border-emerald-500 hover:text-emerald-700">
            전체 사건 목록 ({cases.length}건) — 유형별 전체 보기
          </summary>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {categoryBuckets.map((category) => (
              <section key={category.id} className="mb-8 last:mb-0">
                <h2 className="mb-3 text-base font-black text-emerald-800">
                  {category.title} ({category.cases.length}건)
                </h2>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {category.cases.map((item) => (
                    <li key={item.slug}>
                      <a
                        href={`/cases/${encodeURIComponent(item.slug)}`}
                        className="block truncate rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {item.caseName}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
      </nav>
    </main>
  )
}
