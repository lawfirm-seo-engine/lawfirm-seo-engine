import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import BreadcrumbJsonLd from "@/app/components/BreadcrumbJsonLd"
import { readCaseItems } from "@/lib/caseArchive"
import { getCaseCategoryById } from "@/lib/caseCategories"
import { getCurrentSite } from "@/lib/site"

type CategoryHubPageProps = {
  categoryId: string
}

function CaseCard({
  item,
}: {
  item: {
    slug: string
    caseName: string
    imagePath: string
  }
}) {
  return (
    <Link
      href={`/cases/${encodeURIComponent(item.slug)}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
    >
      <div className="absolute left-0 top-0 z-20 h-1 w-full bg-emerald-600 opacity-0 transition group-hover:opacity-100" />

      <div
        className="relative flex min-h-[210px] items-center justify-center overflow-hidden rounded-t-2xl bg-slate-900 bg-cover bg-center px-5 py-10 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.48), rgba(15, 23, 42, 0.48)), url("${item.imagePath}")`,
        }}
      >
        <h2 className="break-keep text-2xl font-black leading-snug text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)] group-hover:text-emerald-100">
          {item.caseName}
        </h2>
      </div>

      <div className="p-5">
        <p className="text-center text-base font-black leading-7 text-red-500">
          본 사건은 업체명을
          <br />
          사칭한 사기입니다
        </p>

        <div className="mt-7 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-white transition group-hover:bg-emerald-700">
          <span className="text-base font-black">상세보기</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl font-black">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

export async function generateCategoryHubMetadata(
  categoryId: string
): Promise<Metadata> {
  const site = await getCurrentSite()
  const category = getCaseCategoryById(categoryId)

  if (!category) {
    return {}
  }

  const pageUrl = `${site.baseUrl}${category.href}`
  const title = `${category.title} 피해 사례 전문 허브 | ${site.siteName}`

  return {
    title,
    description: `${category.description} 관련 실제 사칭 사건과 대응 방향을 유형별로 정리했습니다.`,
    robots: {
      index: false,  // 허브 페이지가 브랜드 키워드 흡수 방지 — /cases 목록과 동일 처리
      follow: true,  // 내부 링크 → 개별 케이스 PageRank 흐름 유지
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        "ko-KR": pageUrl,
      },
    },
    openGraph: {
      title,
      description: `${category.title} 관련 실제 피해 사례와 대응 정보를 확인합니다.`,
      url: pageUrl,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: `${site.baseUrl}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${category.title} 피해 사례 전문 허브`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `${category.title} 관련 실제 피해 사례와 대응 정보를 확인합니다.`,
      images: [`${site.baseUrl}/images/og-default.png`],
    },
  }
}

export default async function CategoryHubPage({
  categoryId,
}: CategoryHubPageProps) {
  const site = await getCurrentSite()
  const category = getCaseCategoryById(categoryId)

  if (!category) {
    notFound()
  }

  const cases = readCaseItems(site.contentKey).filter(
    (item) => item.categoryId === category.id
  )
  const pageUrl = `${site.baseUrl}${category.href}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.title} 피해 사례 전문 허브`,
    url: pageUrl,
    description: category.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cases.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${item.caseName} 피해 사례`,
        url: `${site.baseUrl}/cases/${encodeURIComponent(item.slug)}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-5 py-12">
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: site.baseUrl },
          { name: "진행사건", url: `${site.baseUrl}/cases` },
          { name: category.title, url: pageUrl },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto max-w-[1500px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-bold text-emerald-700">
              DAEON FINTECH CENTER
            </p>
            <h1 className="break-keep text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              {category.title} 피해 사례
            </h1>
          </div>

          <div>
            <p className="break-keep text-base leading-8 text-slate-600 md:text-lg">
              {category.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {category.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              총 {cases.length}건의 사건이 등록되어 있습니다.
            </p>
          </div>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="break-keep text-2xl font-black text-slate-950">
            {category.title} 대응 핵심
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">사칭명 확인</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                업체명, 도메인, 리딩방명, 앱 이름을 함께 기록해 같은 조직의
                변형 사례를 확인합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">입금 흐름 보존</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                계좌, 지갑주소, 추가 입금 요구 화면과 대화 내역을 순서대로
                보존합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-black text-slate-900">초기 조치 검토</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                지급정지, 형사 고소, 민사 보전, 플랫폼 신고 가능성을 사건
                구조에 맞춰 검토합니다.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cases.map((item) => (
            <CaseCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
