import fs from "fs"
import path from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { getCurrentSite } from "@/lib/site"
import BreadcrumbJsonLd from "@/app/components/BreadcrumbJsonLd"

function readFrontmatterValue(source: string, key: string) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return match?.[1]?.trim() || ""
}

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
      const slug = filename.replace(/\.mdx$/, "")
      const source = fs.readFileSync(filePath, "utf8")
      const caseName = readFrontmatterValue(source, "caseName") || slug.replace(/-/g, " ")

      return {
        slug,
        caseName,
        mtime: stat.mtime.getTime(),
        imagePath: `/images/cases/${slug}.png`,
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
        name: `${item.caseName} 피해 사례`,
        url: `${site.baseUrl}/cases/${encodeURIComponent(item.slug)}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-5 py-12">
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
          ))}
        </div>
      </section>
    </main>
  )
}
