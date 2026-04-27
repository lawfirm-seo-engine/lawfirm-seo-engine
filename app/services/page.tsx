import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "../components/BreadcrumbJsonLd";

const siteUrl = "https://daeonlawfintech.com";

export const metadata: Metadata = {
  title: "주력분야",
  description:
    "대온 핀테크센터의 금융사기, 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기, 부업 사기, 증권사 사칭 사기 대응 분야 안내입니다.",
  alternates: {
    canonical: `${siteUrl}/services`,
  },
  openGraph: {
    title: "주력분야 | 대온 핀테크센터",
    description:
      "금융사기 유형별 피해 대응 분야와 사건 진행 방향을 확인할 수 있습니다.",
    url: `${siteUrl}/services`,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
  },
};

const services = [
  {
    title: "투자사기 대응",
    desc: "가짜 투자 플랫폼, 수익 보장, 추가 입금 유도 피해 대응",
  },
  {
    title: "리딩방 사기 대응",
    desc: "전문가 사칭, 주식·코인 리딩방, 단체방 유도 피해 대응",
  },
  {
    title: "코인 사기 대응",
    desc: "가상자산 거래소 사칭, 코인 환급·스테이킹 피해 대응",
  },
  {
    title: "증권사 사칭 사기 대응",
    desc: "HTS·MTS·투자 앱 사칭, 비상장주식·공모주 유도 피해 대응",
  },
  {
    title: "해외선물 사기 대응",
    desc: "나스닥·항셍·금 ETF 등 해외선물 플랫폼 사칭 피해 대응",
  },
  {
    title: "쇼핑몰 사칭 사기 대응",
    desc: "구매대행, 리뷰알바, 팀미션, 정산금 출금 제한 피해 대응",
  },
  {
    title: "부업 사기 대응",
    desc: "영상 시청, 미션 수행, 간단 알바 수익금 출금 제한 피해 대응",
  },
  {
    title: "어플 사기 대응",
    desc: "가짜 앱 설치, 개인 화면 조작, 수익금 표시형 피해 대응",
  },
];

const serviceCollectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${siteUrl}/services#collection`,
  url: `${siteUrl}/services`,
  name: "대온 핀테크센터 주력분야",
  description:
    "대온 핀테크센터의 금융사기, 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기, 부업 사기, 증권사 사칭 사기 대응 분야 안내입니다.",
  inLanguage: "ko-KR",
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
  about: services.map((service) => ({
    "@type": "Service",
    name: service.title,
    description: service.desc,
    provider: {
      "@id": `${siteUrl}/#legalservice`,
    },
    areaServed: {
      "@type": "Country",
      name: "대한민국",
    },
  })),
};

export default function ServicesPage() {
  return (
    <>
      {/* Breadcrumb Schema 자동 적용 */}
      <BreadcrumbJsonLd
        items={[
          {
            name: "홈",
            url: siteUrl,
          },
          {
            name: "주력분야",
            url: `${siteUrl}/services`,
          },
        ]}
      />

      {/* CollectionPage Schema 유지 */}
      <script
        id="services-collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceCollectionJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <main className="daeon-wrap">
        <section className="daeon-section">
          <p className="daeon-eyebrow">FINTECH LEGAL RESPONSE CENTER</p>

          <h1 className="daeon-title">금융사기 유형별 주력분야</h1>

          <p className="daeon-desc">
            대온 핀테크센터는 투자사기, 리딩방 사기, 코인 사기,
            증권사 사칭 사기, 쇼핑몰 사칭 사기, 부업 사기 등 다양한
            금융사기 유형에 대해 사건별 대응 방향을 정리하고 피해 회복
            가능성을 검토합니다.
          </p>

          <div className="services-grid">
            {services.map((service) => (
              <Link href="/cases" className="daeon-card" key={service.title}>
                <div className="daeon-card-head">
                  <div className="daeon-card-title">{service.title}</div>
                </div>

                <div className="daeon-card-body">
                  <p className="daeon-warning">{service.desc}</p>

                  <div className="daeon-cta-wrap">
                    <div className="daeon-type">
                      <span className="daeon-type-text">사건 확인하기</span>
                      <span className="daeon-type-icon">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}