import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import CasesClient from "./cases/CasesClient"
import MainHeroSlider from "./components/MainHeroSlider"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const description =
  "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 법률사무소 핀테크센터입니다."
const ogImage = `${siteUrl}/images/og-default.png`

export const metadata: Metadata = {
  title: `${siteName} | 금융사기 피해 대응`,
  description,
  alternates: {
    canonical: siteUrl,
    languages: {
      "ko-KR": siteUrl,
    },
  },
  openGraph: {
    title: `${siteName} | 금융사기 피해 대응`,
    description,
    url: siteUrl,
    siteName,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${siteName} 대표 이미지`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | 금융사기 피해 대응`,
    description,
    images: [ogImage],
  },
}

export default function HomePage() {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  let cases: string[] = []

  if (fs.existsSync(casesDir)) {
    cases = fs
      .readdirSync(casesDir)
      .filter((file) => file.endsWith(".mdx"))
      .filter((file) => file !== "_template.mdx")
      .filter((file) => !file.startsWith("_"))
      .map((file) => {
        const fullPath = path.join(casesDir, file)

        return {
          name: file.replace(/\.mdx$/, ""),
          time: fs.statSync(fullPath).mtime.getTime(),
        }
      })
      .sort((a, b) => b.time - a.time)
      .map((item) => item.name)
  }

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#homepage`,
    url: siteUrl,
    name: siteName,
    description,
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    about: {
      "@id": `${siteUrl}/#legalservice`,
    },
    inLanguage: "ko-KR",
  }

  const legalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${siteUrl}/#legalservice`,
    name: siteName,
    legalName: "대온 법률사무소",
    url: siteUrl,
    image: ogImage,
    telephone: "+82-2-6952-3695",
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
      "쇼핑몰 사칭 사기",
      "부업 사기",
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(legalServiceJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <MainHeroSlider />

      <CasesClient
        siteName={siteName}
        cases={cases}
      />
    </>
  )
}
