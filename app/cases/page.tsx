import fs from "fs"
import path from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { getCurrentSite } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite()

  const pageUrl = `${site.baseUrl}/cases`
  const imageUrl = `${site.baseUrl}/images/og-default.png`

  return {
    title: `금융사기 피해 사례 전체 목록 | ${site.siteName}`,
    description:
      "투자사기, 리딩방 사기, 쇼핑몰 사기, 부업 사기, 가상자산 사기 등 실제 피해 사례와 대응 전략을 정리한 사건 목록 페이지입니다.",
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
      title: "금융사기 피해 사례 전체 목록",
      description:
        "투자사기, 리딩방 사기, 쇼핑몰 사기, 부업 사기, 가상자산 사기 등 주요 피해 사례 안내",
      url: pageUrl,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "금융사기 피해 사례 전체 목록 페이지",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "금융사기 피해 사례 전체 목록",
      description:
        "투자사기, 리딩방 사기, 쇼핑몰 사기, 부업 사기, 가상자산 사기 등 주요 피해 사례 안내",
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

      return {
        slug: filename.replace(/\.mdx$/, ""),
        mtime: stat.mtime.getTime(),
      }
    })
    .sort((a, b) => b.mtime - a.mtime)

  const pageUrl = `${site.baseUrl}/cases`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "금융사기 피해 사례 전체 목록",
    url: pageUrl,
    description:
      "투자사기, 리딩방 사기, 쇼핑몰 사기, 부업 사기, 가상자산 사기 등 주요 피해 사례와 대응 전략을 정리한 사건 목록 페이지입니다.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cases.slice(0, 50).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${item.slug} 사기 피해 사례`,
        url: `${site.baseUrl}/cases/${item.slug}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto max-w-[1500px]">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold tracking-[0.25em] text-emerald-700">
            DAEON FINTECH CENTER
          </p>

          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">
            금융사기 피해 사례 전체 목록
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            투자사기, 리딩방 사기, 쇼핑몰 사기, 부업 사기, 가상자산 사기 등
            주요 피해 사례와 대응 전략을 확인할 수 있습니다.
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-500">
            총 {cases.length}건의 사건이 등록되어 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cases.map((item) => (
            <Link
              key={item.slug}
              href={`/cases/${encodeURIComponent(item.slug)}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-emerald-600 opacity-0 transition group-hover:opacity-100" />

              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  사건 접수
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  접수진행중
                </span>
              </div>

              <h2 className="min-h-[64px] break-keep text-center text-xl font-black leading-snug text-slate-900 group-hover:text-emerald-700">
                {item.slug}
              </h2>

              <p className="mt-5 text-center text-sm font-semibold leading-6 text-slate-500">
                사기 피해 사례
                <br />
                피해사건 접수 및 상담 진행중
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}