import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "../components/BreadcrumbJsonLd";

const siteUrl = "https://daeonlawfintech.com";
const pageUrl = `${siteUrl}/services`;

export const metadata: Metadata = {
  title: "주력분야 | 금융사기 유형별 법률 대응",
  description:
    "투자사기, 리딩방 사기, 코인 사기, 증권사 사칭 사기, 쇼핑몰 사칭 사기, 부업 사기 — 대온 법률사무소 대표변호사 신동우가 유형별 피해 대응 방향을 검토합니다.",
  alternates: {
    canonical: pageUrl,
    languages: { "ko-KR": pageUrl },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "주력분야 | 대온 핀테크센터",
    description:
      "금융사기 유형별 피해 대응 분야와 사건 진행 방향을 확인할 수 있습니다.",
    url: pageUrl,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${siteUrl}/images/logo.png`, width: 1200, height: 630, alt: "대온 핀테크센터 주력분야" }],
  },
};

const services = [
  {
    title: "투자사기 대응",
    desc: "가짜 투자 플랫폼, 수익 보장, 추가 입금 유도 피해 대응",
    detail: "초기 소액 수익 이후 대규모 입금을 유도하는 구조가 전형적입니다. 계좌 추적과 가압류 신청 가능성을 검토합니다.",
  },
  {
    title: "리딩방 사기 대응",
    desc: "전문가 사칭, 주식·코인 리딩방, 단체방 유도 피해 대응",
    detail: "증권사·애널리스트를 사칭한 카카오톡·텔레그램 리딩방을 통한 수익 보장 사기입니다. 운영자 계좌 추적이 핵심입니다.",
  },
  {
    title: "코인 사기 대응",
    desc: "가상자산 거래소 사칭, 코인 환급·스테이킹 피해 대응",
    detail: "가짜 거래소 화면에서 수익이 쌓이는 것처럼 보이다가 출금 시 수수료·세금을 요구하는 패턴입니다.",
  },
  {
    title: "증권사 사칭 사기 대응",
    desc: "HTS·MTS·투자 앱 사칭, 비상장주식·공모주 유도 피해 대응",
    detail: "정상 증권사와 동일한 이름·로고를 사용한 사이트·앱을 통해 공모주·비상장주식 투자를 유도합니다.",
  },
  {
    title: "해외선물 사기 대응",
    desc: "나스닥·항셍·금 ETF 등 해외선물 플랫폼 사칭 피해 대응",
    detail: "MT5·전용 앱 등 해외선물 거래 플랫폼을 사칭하며 보증금·수수료 명목으로 추가 입금을 요구합니다.",
  },
  {
    title: "쇼핑몰 사칭 사기 대응",
    desc: "구매대행, 리뷰알바, 팀미션, 정산금 출금 제한 피해 대응",
    detail: "쿠팡·마켓컬리 등 정상 플랫폼을 사칭해 팀미션·리뷰알바를 명목으로 입금 후 출금을 제한합니다.",
  },
  {
    title: "부업 사기 대응",
    desc: "영상 시청, 미션 수행, 간단 알바 수익금 출금 제한 피해 대응",
    detail: "재택부업·라이브방송 후원 등을 미끼로 소액 수익 후 대규모 입금을 유도하는 구조입니다.",
  },
  {
    title: "어플 사기 대응",
    desc: "가짜 앱 설치, 개인 화면 조작, 수익금 표시형 피해 대응",
    detail: "전용 앱에서 잔고가 늘어나는 화면을 보여주다가 출금 요청 시 인증비·세금을 요구합니다.",
  },
];

const faqItems = [
  {
    q: "피해금을 돌려받을 수 있나요?",
    a: "사건 유형과 입금 시점에 따라 다릅니다. 계좌 추적, 가압류, 지급정지 신청 등을 통해 회수 가능성을 검토합니다. 초기 대응 속도가 중요합니다.",
  },
  {
    q: "경찰 신고만으로 충분한가요?",
    a: "형사 신고와 민사 대응(가압류·손해배상)을 병행해야 실질적인 피해 회복 가능성이 높아집니다. 신고와 민사 절차는 독립적으로 진행할 수 있습니다.",
  },
  {
    q: "증거가 부족해도 상담이 가능한가요?",
    a: "입금 내역이나 대화 캡처 중 하나라도 있으면 1차 검토가 가능합니다. 상담 전 최대한 자료를 보존해 두시기 바랍니다.",
  },
];

const serviceCollectionJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${pageUrl}#collection`,
      url: pageUrl,
      name: "대온 핀테크센터 주력분야",
      description:
        "투자사기, 리딩방 사기, 코인 사기, 증권사 사칭 사기, 쇼핑몰 사칭 사기, 부업 사기 대응 분야 안내",
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: services.map((s) => ({
        "@type": "Service",
        name: s.title,
        description: s.desc,
        provider: { "@id": `${siteUrl}/#legalservice` },
        areaServed: { "@type": "Country", name: "대한민국" },
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

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

      <main className="daeon-wrap">
        <section className="daeon-section">
          <p className="daeon-eyebrow">FINTECH LEGAL RESPONSE CENTER</p>

          <h1 className="daeon-title">금융사기 유형별 주력분야</h1>

          <p className="daeon-desc">
            대온 법률사무소 대표변호사 신동우는 투자사기, 리딩방 사기, 코인 사기,
            증권사 사칭 사기, 쇼핑몰 사칭 사기, 부업 사기 등 핀테크 분야
            금융사기 피해 대응을 전문으로 합니다. 유형별 사건 구조를 분석하고
            계좌 추적·가압류·민형사 대응 방향을 검토합니다.
          </p>

          <div className="services-grid">
            {services.map((service) => (
              <Link href="/cases" className="daeon-card" key={service.title}>
                <div className="daeon-card-head">
                  <div className="daeon-card-title">{service.title}</div>
                </div>
                <div className="daeon-card-body">
                  <p className="daeon-warning">{service.desc}</p>
                  <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, margin: "8px 0 0" }}>
                    {service.detail}
                  </p>
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

        {/* FAQ 섹션 */}
        <section style={{ maxWidth: "720px", margin: "64px auto 0", padding: "0 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 900, color: "#111827", marginBottom: "24px", borderBottom: "3px solid #111827", paddingBottom: "14px" }}>
            자주 묻는 질문
          </h2>
          {faqItems.map((f, i) => (
            <div key={i} style={{ marginBottom: "18px", padding: "20px 22px", border: "1px solid #e5e7eb", borderRadius: "14px", background: "#ffffff" }}>
              <p style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 800, color: "#111827" }}>Q. {f.q}</p>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.8, color: "#374151" }}>{f.a}</p>
            </div>
          ))}
        </section>

        {/* 상담 CTA */}
        <section style={{ maxWidth: "720px", margin: "48px auto 80px", padding: "32px 28px", background: "#111827", borderRadius: "20px", color: "#ffffff", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.08em", color: "#a7f3d0", textTransform: "uppercase" }}>DAEON FINTECH CENTER</p>
          <p style={{ margin: "0 0 20px", fontSize: "22px", fontWeight: 900, lineHeight: 1.4 }}>
            대표변호사 신동우 · 02-6952-3695
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="tel:0269523695" style={{ display: "inline-flex", alignItems: "center", height: "48px", padding: "0 24px", borderRadius: "12px", background: "#ffffff", color: "#111827", fontSize: "15px", fontWeight: 800, textDecoration: "none" }}>
              📞 전화 상담
            </Link>
            <Link href="http://pf.kakao.com/_xcypmn/chat" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", height: "48px", padding: "0 24px", borderRadius: "12px", border: "2px solid #ffffff", color: "#ffffff", fontSize: "15px", fontWeight: 800, textDecoration: "none" }}>
              💬 카카오톡 상담
            </Link>
          </div>
          <p style={{ margin: "16px 0 0", fontSize: "13px", color: "#9ca3af" }}>평일 09:00 – 18:00 / 주말·공휴일 제외</p>
        </section>
      </main>
    </>
  );
}
