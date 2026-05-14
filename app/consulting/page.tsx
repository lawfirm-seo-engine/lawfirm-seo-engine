import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

const siteUrl = "https://daeonlawfintech.com";
const pageUrl = `${siteUrl}/consulting`;

export const metadata: Metadata = {
  title: "상담안내 | 금융사기 피해 상담 절차",
  description:
    "대온 법률사무소 대표변호사 신동우의 금융사기 피해 상담 안내. 상담 전 준비 자료, 사건 검토 절차, 가압류·민형사 대응 방향을 확인할 수 있습니다.",
  alternates: {
    canonical: pageUrl,
    languages: { "ko-KR": pageUrl },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "상담안내 | 대온 핀테크센터",
    description:
      "금융사기 피해 상담 전 준비 자료와 사건 검토 절차를 안내합니다.",
    url: pageUrl,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${siteUrl}/images/logo.png`, width: 1200, height: 630, alt: "대온 핀테크센터 상담안내" }],
  },
};

const consultingItems = [
  {
    step: "01",
    title: "상담 전 준비 자료",
    desc: "입금 내역, 거래 내역, 사이트 주소, 대화방 캡처, 담당자 정보 등을 정리해 두시면 사건 검토가 빠르게 진행됩니다.",
    tip: "입금 계좌번호와 예금주 이름이 있으면 계좌 추적 방향 검토가 가능합니다.",
  },
  {
    step: "02",
    title: "피해 구조 확인",
    desc: "피해자가 어떤 경로로 유입되었는지, 어떤 사이트나 앱을 이용했는지, 추가 입금 요구가 있었는지 확인합니다.",
    tip: "리딩방·단체방 초대 경로와 담당자 계정 정보를 보존해 두세요.",
  },
  {
    step: "03",
    title: "입금 계좌·지갑 정보 검토",
    desc: "입금 계좌, 예금주, 거래소 지갑 주소, 송금 내역 등을 기준으로 자금 흐름과 보전 가능성을 검토합니다.",
    tip: "가상자산 지갑주소가 있으면 블록체인 추적 가능성도 확인합니다.",
  },
  {
    step: "04",
    title: "가압류 및 민사 대응 검토",
    desc: "확보된 자료를 바탕으로 가압류, 손해배상 청구 등 피해 회복을 위한 민사 절차 가능성을 확인합니다.",
    tip: "가압류는 빠를수록 효과적입니다. 피해 인지 후 지체 없이 상담하세요.",
  },
  {
    step: "05",
    title: "형사 고소 자료 정리",
    desc: "사칭 사이트, 모집책, 대화방, 계좌 정보 등 형사 고소에 필요한 자료를 정리합니다.",
    tip: "형사 고소와 민사 대응은 별도 절차로 동시 진행이 가능합니다.",
  },
  {
    step: "06",
    title: "진행 방향 안내",
    desc: "사건 유형과 확보 자료에 따라 계좌 동결, 지갑 동결, 민형사 병행 대응 방향을 안내합니다.",
    tip: "모든 사건이 같은 방향으로 진행되지 않습니다. 사건별 맞춤 검토가 중요합니다.",
  },
];

type FaqItem = { q: string; a: string; aNode?: ReactNode }

const faqItems: FaqItem[] = [
  {
    q: "상담은 유료인가요?",
    a: "초기 상담 내용과 비용 구조는 사건 유형에 따라 다릅니다. 후불제를 제시하는 법률 서비스는 변호사법상 허용되지 않으며, 이를 내세우는 경우 2차 피해에 주의해야 합니다.",
  },
  {
    q: "상담 가능 시간은 언제인가요?",
    a: "24시간 긴급 상담 대응이며, 전화(02-6952-3695) 또는 카카오톡 채널(대온 법률사무소)을 통해 상담하실 수 있습니다.",
    aNode: (
      <>
        24시간 긴급 상담 대응이며,{" "}
        <Link href="tel:0269523695" style={{ color: "#059669", fontWeight: 700, textDecoration: "underline" }}>
          전화(02-6952-3695)
        </Link>{" "}
        또는{" "}
        <Link
          href="http://pf.kakao.com/_xcypmn/chat"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#059669", fontWeight: 700, textDecoration: "underline" }}
        >
          카카오톡 채널(대온 법률사무소)
        </Link>
        을 통해 상담하실 수 있습니다.
      </>
    ),
  },
  {
    q: "피해 사실을 증명해야 상담이 가능한가요?",
    a: "입금 내역이나 사이트 주소 등 최소한의 자료만 있어도 1차 검토가 가능합니다. 상담 전 모든 자료를 삭제하지 마시고 보존해 두시기 바랍니다.",
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "상담안내", item: pageUrl },
  ],
};

const consultingJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "금융사기 피해 상담안내",
      description:
        "대온 핀테크센터 금융사기 피해 상담 안내. 상담 전 준비 자료, 사건 검토 절차, 대응 방향을 설명합니다.",
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#legalservice` },
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

export default function ConsultingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(consultingJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <main className="daeon-wrap">
        <section className="daeon-section">
          <p className="daeon-eyebrow">CONSULTING GUIDE</p>

          <h1 className="daeon-title">금융사기 피해 상담안내</h1>

          <p className="daeon-desc">
            금융사기 피해 상담은 단순 문의가 아니라 사건 구조와 자금 이동
            가능성을 함께 검토하는 과정입니다. 대온 법률사무소 대표변호사
            신동우는 입금 내역, 대화 자료, 사이트 주소, 담당자 정보를 기준으로
            피해 회복 가능성과 대응 방향을 단계별로 확인합니다.
          </p>

          <div className="consulting-grid">
            {consultingItems.map((item) => (
              <div className="consulting-card" key={item.title}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#6b7280", marginBottom: "6px", letterSpacing: "0.06em" }}>STEP {item.step}</div>
                <h2 className="consulting-title">{item.title}</h2>
                <p className="consulting-desc">{item.desc}</p>
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#059669", fontWeight: 700, lineHeight: 1.6 }}>
                  💡 {item.tip}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ 섹션 */}
        <section style={{ maxWidth: "720px", margin: "64px auto 0", padding: "0 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 900, color: "#111827", marginBottom: "24px", borderBottom: "3px solid #111827", paddingBottom: "14px" }}>
            상담 관련 자주 묻는 질문
          </h2>
          {faqItems.map((f, i) => (
            <div key={i} style={{ marginBottom: "18px", padding: "20px 22px", border: "1px solid #e5e7eb", borderRadius: "14px", background: "#ffffff" }}>
              <p style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 800, color: "#111827" }}>Q. {f.q}</p>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.8, color: "#374151" }}>{f.aNode ?? f.a}</p>
            </div>
          ))}
        </section>

        {/* 상담 CTA */}
        <section style={{ maxWidth: "720px", margin: "48px auto 80px", padding: "32px 28px", background: "#111827", borderRadius: "20px", color: "#ffffff", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.08em", color: "#a7f3d0", textTransform: "uppercase" }}>DAEON FINTECH CENTER</p>
          <p style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 900 }}>대표변호사 신동우</p>
          <p style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700, color: "#d1d5db" }}>02-6952-3695 · 24시간 긴급 상담 대응</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="tel:0269523695" style={{ display: "inline-flex", alignItems: "center", height: "48px", padding: "0 24px", borderRadius: "12px", background: "#ffffff", color: "#111827", fontSize: "15px", fontWeight: 800, textDecoration: "none" }}>
              📞 전화 상담
            </Link>
            <Link href="http://pf.kakao.com/_xcypmn/chat" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", height: "48px", padding: "0 24px", borderRadius: "12px", border: "2px solid #ffffff", color: "#ffffff", fontSize: "15px", fontWeight: 800, textDecoration: "none" }}>
              💬 카카오톡 상담
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
