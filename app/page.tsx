import Link from "next/link"
import type { Metadata } from "next"
import MainHeroSlider from "./components/MainHeroSlider"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const description =
  "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 법률사무소 핀테크센터입니다."
const ogImage = `${siteUrl}/images/og-default.png`

const caseCategories = [
  {
    title: "팀미션·부업 사기",
    description: "쇼핑몰, 여행사, 체험단, 리뷰·주문대행 구조를 확인합니다.",
    href: "/cases#teammission",
    keywords: ["쇼핑몰", "여행사", "체험단", "주문대행"],
  },
  {
    title: "주식리딩방·투자 사기",
    description: "공모주·비상장, 전문가·증권사 사칭, 해외선물 피해를 분류합니다.",
    href: "/cases#stock-room",
    keywords: ["공모주", "비상장", "증권사 사칭", "해외선물"],
  },
  {
    title: "코인리딩방·가상자산 사기",
    description: "코인, 월렛, 거래소 사칭, 스테이킹 유도 사례를 살펴봅니다.",
    href: "/cases#crypto-room",
    keywords: ["코인", "월렛", "거래소 사칭", "스테이킹"],
  },
  {
    title: "방송환전·포인트 사기",
    description: "라이브 방송, 포인트 환전, 채팅·만남 유도 흐름을 정리합니다.",
    href: "/cases#broadcast-exchange",
    keywords: ["라이브 방송", "포인트 환전", "채팅", "만남 유도"],
  },
]

const responseSteps = [
  {
    title: "입금·대화 자료 확보",
    body: "계좌, 지갑주소, 거래소 화면, 카카오톡·텔레그램 대화 내역을 먼저 보존합니다.",
  },
  {
    title: "사칭 구조와 피해 경로 분석",
    body: "업체명, 도메인, 앱, 리딩방, 환전 요구 흐름을 나누어 사건의 핵심 쟁점을 정리합니다.",
  },
  {
    title: "법적 조치 방향 설계",
    body: "지급정지, 형사 고소, 민사 보전, 플랫폼 신고 등 가능한 대응 순서를 검토합니다.",
  },
]

const trustPoints = [
  "금융·투자사기 유형별 사건 정리",
  "도메인·상호·리딩방명 기반 피해 사례 분석",
  "상담 전 자료 준비와 초기 대응 안내",
]

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
    hasPart: caseCategories.map((category) => ({
      "@type": "CollectionPage",
      name: category.title,
      url: `${siteUrl}${category.href}`,
      description: category.description,
    })),
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
      "증권사 사칭 사기",
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

      <main className="bg-[#f6f7fb]">
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-emerald-700">
                FINANCIAL FRAUD RESPONSE
              </p>
              <h1 className="mt-4 break-keep text-3xl font-black leading-tight text-slate-950 md:text-5xl">
                금융사기 피해 대응은 사건 유형을 정확히 나누는 것에서 시작됩니다.
              </h1>
              <p className="mt-6 max-w-3xl break-keep text-base leading-8 text-slate-600 md:text-lg">
                대온 법률사무소 핀테크센터는 업체명, 도메인, 리딩방명, 앱과
                입금 경로를 기준으로 피해 구조를 정리하고 초기 대응 방향을
                안내합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-500">상담 전 핵심 확인</p>
              <ul className="mt-4 space-y-3">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 break-keep text-sm font-semibold leading-7 text-slate-700"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/consulting"
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  상담 안내
                </Link>
                <Link
                  href="/cases"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700"
                >
                  사건 목록 보기
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-700">CASE TYPES</p>
                <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-3xl">
                  주요 사건 유형
                </h2>
              </div>
              <Link
                href="/cases"
                className="text-sm font-black text-emerald-700 hover:text-emerald-800"
              >
                전체 사건 아카이브
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {caseCategories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 transition hover:-translate-y-1 hover:border-emerald-500 hover:bg-white hover:shadow-lg"
                >
                  <h3 className="break-keep text-xl font-black text-slate-950">
                    {category.title}
                  </h3>
                  <p className="mt-3 break-keep text-sm leading-7 text-slate-600">
                    {category.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {category.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-bold text-emerald-700">RESPONSE FLOW</p>
              <h2 className="mt-3 break-keep text-2xl font-black text-slate-950 md:text-3xl">
                자료 보존부터 조치 방향까지 순서가 중요합니다.
              </h2>
              <p className="mt-5 break-keep text-base leading-8 text-slate-600">
                사기 조직은 사이트, 앱, 계좌, 대화방을 빠르게 바꾸기 때문에
                초기에 남아 있는 증거를 기준으로 대응 순서를 정리해야 합니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {responseSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 break-keep text-lg font-black text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 break-keep text-sm leading-7 text-slate-600">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
