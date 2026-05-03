import type { Metadata } from "next"
import Link from "next/link"
import BreadcrumbJsonLd from "../components/BreadcrumbJsonLd"
import { getPublicCaseCategories } from "@/lib/caseCategories"

const siteUrl = "https://daeonlawfintech.com"
const pageUrl = `${siteUrl}/services`

const serviceCategories = [
  {
    ...getPublicCaseCategories()[0],
    serviceTitle: "팀미션·부업 사기 대응",
    serviceDescription: "쇼핑몰, 여행사, 체험단, 리뷰·주문대행 사칭 구조를 확인합니다.",
  },
  {
    ...getPublicCaseCategories()[1],
    serviceTitle: "주식리딩방·투자 사기 대응",
    serviceDescription: "공모주·비상장, 전문가·증권사 사칭, 해외선물 피해를 분류합니다.",
  },
  {
    ...getPublicCaseCategories()[2],
    serviceTitle: "코인리딩방·가상자산 사기 대응",
    serviceDescription: "코인, 월렛, 거래소 사칭, 스테이킹 유도 사례를 살펴봅니다.",
  },
  {
    ...getPublicCaseCategories()[3],
    serviceTitle: "방송환전·포인트 사기 대응",
    serviceDescription: "라이브 방송, 포인트 환전, 채팅·만남 유도 흐름을 정리합니다.",
  },
]

const faqItems = [
  {
    q: "피해금을 돌려받을 수 있나요?",
    a: "사건 유형과 입금 시점에 따라 다릅니다. 계좌 추적, 가압류, 지급정지 요청 등을 통해 회수 가능성을 검토합니다.",
  },
  {
    q: "경찰 신고만으로 충분한가요?",
    a: "형사 신고와 함께 민사 보전 조치를 병행해야 실질적인 피해 회복 가능성이 높아질 수 있습니다.",
  },
  {
    q: "증거가 부족해도 상담이 가능한가요?",
    a: "입금 내역이나 대화 캡처 중 하나라도 있으면 1차 검토가 가능합니다.",
  },
]

export const metadata: Metadata = {
  title: "주력분야 | 금융사기 유형별 법률 대응",
  description:
    "팀미션 사기, 주식리딩방 사기, 코인리딩방 사기, 방송환전 사기 등 대온 법률사무소 핀테크센터의 유형별 금융사기 대응 분야를 안내합니다.",
  alternates: {
    canonical: pageUrl,
    languages: { "ko-KR": pageUrl },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "주력분야 | 대온 핀테크센터",
    description:
      "팀미션, 주식리딩방, 코인리딩방, 방송환전 등 주요 금융사기 대응 분야를 확인할 수 있습니다.",
    url: pageUrl,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: "대온 핀테크센터 주력분야",
      },
    ],
  },
}

const serviceCollectionJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      url: pageUrl,
      name: "대온 핀테크센터 주력분야",
      description:
        "팀미션 사기, 주식리딩방 사기, 코인리딩방 사기, 방송환전 사기 대응 분야 안내",
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: serviceCategories.map((service) => ({
        "@type": "Service",
        name: service.serviceTitle,
        description: service.serviceDescription,
        url: `${siteUrl}${service.href}`,
        provider: { "@id": `${siteUrl}/#legalservice` },
        areaServed: { "@type": "Country", name: "대한민국" },
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
}

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: siteUrl },
          { name: "주력분야", url: pageUrl },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceCollectionJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <main className="min-h-screen bg-[#f6f7fb] px-5 py-12">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-emerald-700">
            FINTECH LEGAL RESPONSE CENTER
          </p>
          <h1 className="mt-3 break-keep text-4xl font-black text-slate-950 md:text-5xl">
            금융사기 유형별 주력분야
          </h1>
          <p className="mt-5 max-w-4xl break-keep text-base leading-8 text-slate-600 md:text-lg">
            대온 법률사무소 핀테크센터는 사건 구조를 4개 핵심 유형으로 나누어
            사칭 방식, 입금 흐름, 초기 대응 방향을 검토합니다.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {serviceCategories.map((service) => (
              <Link
                key={service.id}
                href={service.href}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="break-keep text-2xl font-black text-slate-950 group-hover:text-emerald-700">
                    {service.serviceTitle}
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">
                    사례 보기
                  </span>
                </div>
                <p className="mt-4 break-keep text-base font-semibold leading-8 text-slate-600">
                  {service.serviceDescription}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="border-b-4 border-slate-950 pb-4 text-2xl font-black text-slate-950">
            자주 묻는 질문
          </h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-lg font-black text-slate-950">Q. {item.q}</p>
                <p className="mt-2 break-keep text-sm leading-7 text-slate-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-3xl rounded-3xl bg-slate-950 px-7 py-8 text-center text-white">
          <p className="text-sm font-black text-emerald-300">
            DAEON FINTECH CENTER
          </p>
          <p className="mt-2 text-2xl font-black">대온 법률사무소 · 02-6952-3695</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="tel:0269523695"
              className="inline-flex h-12 items-center rounded-xl bg-white px-6 text-sm font-black text-slate-950"
            >
              전화 상담
            </Link>
            <Link
              href="http://pf.kakao.com/_xcypmn/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-xl border-2 border-white px-6 text-sm font-black text-white"
            >
              카카오톡 상담
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">평일 09:00 - 18:00</p>
        </section>
      </main>
    </>
  )
}
