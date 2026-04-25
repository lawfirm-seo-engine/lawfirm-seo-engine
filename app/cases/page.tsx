import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { getCurrentSite } from "@/lib/site"
import CasesClient from "./CasesClient"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite()

  const pageUrl = `${site.baseUrl}/cases`
  const imageUrl = `${site.baseUrl}/images/og-default.png`

  return {
    title: `진행 사건 목록 | ${site.siteName}`,
    description:
      "금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요 진행 사건을 확인할 수 있는 사건 목록 페이지입니다.",
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
      title: `진행 사건 목록`,
      description:
        "금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요 진행 사건 안내",
      url: pageUrl,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "진행 사건 목록 페이지",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `진행 사건 목록`,
      description:
        "금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요 진행 사건 안내",
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
    .map((filename) => filename.replace(/\.mdx$/, ""))
    .sort((a, b) => a.localeCompare(b))

  const pageUrl = `${site.baseUrl}/cases`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "진행 사건 목록",
    url: pageUrl,
    description:
      "금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요 진행 사건 목록 페이지",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CasesClient siteName={site.siteName} cases={cases} />
    </>
  )
}