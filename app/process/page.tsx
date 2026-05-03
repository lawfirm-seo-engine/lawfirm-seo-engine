import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://daeonlawfintech.com";
const pageUrl = `${siteUrl}/process`;

export const metadata: Metadata = {
  title: "대응절차 | 금융사기 피해 단계별 대응",
  description:
    "금융사기 피해 발생 후 상담 접수, 자료 검토, 계좌·지갑 추적, 가압류, 형사 고소까지 — 대온 법률사무소 대표변호사 신동우의 단계별 대응 절차를 안내합니다.",
  alternates: {
    canonical: pageUrl,
    languages: { "ko-KR": pageUrl },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "대응절차 | 대온 핀테크센터",
    description:
      "금융사기 피해 발생 후 상담 접수부터 가압류와 민형사 대응까지 단계별 절차를 안내합니다.",
    url: pageUrl,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${siteUrl}/images/logo.png`, width: 1200, height: 630, alt: "대온 핀테크센터 대응절차" }],
  },
};

const processSteps = [
  {
    step: "01",
    title: "피해 상담 접수",
    desc: "사건명, 사이트 주소, 입금 내역, 대화방 자료를 기준으로 피해 구조를 1차 확인합니다.",
    point: "피해 인지 직후 빠르게 상담을 시작할수록 계좌 동결 가능성이 높아집니다.",
  },
  {
    step: "02",
    title: "자료 정리 및 사건 분석",
    desc: "입금 계좌, 가상자산 지갑, 접속 URL, 담당자 대화 내용을 정리해 법적 대응 가능성을 검토합니다.",
    point: "삭제된 대화방이나 사이트라도 캡처나 이체 내역이 남아 있으면 검토 가능합니다.",
  },
  {
    step: "03",
    title: "계좌·지갑 추적 방향 검토",
    desc: "자금 이동 흐름과 입금 경로를 확인하고 계좌 동결, 지갑 동결, 가압류 가능성을 검토합니다.",
    point: "가상자산 지갑주소가 있으면 블록체인 거래 내역을 통한 추적이 가능할 수 있습니다.",
  },
  {
    step: "04",
    title: "가압류 및 민사 대응",
    desc: "확보 가능한 계좌와 관련자를 기준으로 가압류, 손해배상 청구 등 피해 회복 절차를 진행합니다.",
    point: "가압류는 민사 절차로 형사 수사와 별개로 빠르게 신청할 수 있습니다.",
  },
  {
    step: "05",
    title: "형사 고소 및 수사 대응",
    desc: "사칭 사이트, 대화방 운영자, 모집책, 입금 계좌 관련 자료를 바탕으로 형사 절차를 병행합니다.",
    point: "형사 고소와 민사 가압류를 병행하면 상대방에 대한 압박 효과가 커집니다.",
  },
  {
    step: "06",
    title: "회수 가능성 점검",
    desc: "사건 진행 상황에 따라 추가 자료를 보완하고 실제 피해 회복 가능성을 지속적으로 점검합니다.",
    point: "모든 사건이 동일한 결과를 보장하지는 않으며, 사건별 상황에 따라 전략을 조정합니다.",
  },
];

const faqItems = [
  {
    q: "피해 직후 가장 먼저 해야 할 일은 무엇인가요?",
    a: "추가 입금을 즉시 중단하고, 입금 계좌·거래내역·대화방·사이트 주소를 캡처해 보존하는 것이 가장 중요합니다. 자료 보존 후 신속하게 법률 상담을 받으세요.",
  },
  {
    q: "민사와 형사 중 어떤 절차를 먼저 진행해야 하나요?",
    a: "두 절차는 독립적으로 진행됩니다. 실질적 피해 회복을 위해서는 민사 가압류를 빠르게 신청하고, 형사 고소를 병행하는 방식이 일반적입니다.",
  },
  {
    q: "해외로 자금이 이전된 경우에도 대응이 가능한가요?",
    a: "국내 계좌를 거쳐 해외로 이전된 경우 국내 계좌에 대한 조치는 가능합니다. 가상자산의 경우 블록체인 추적 후 거래소 협조 요청 경로를 검토합니다.",
  },
];

const processJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: "금융사기 피해 대응 절차",
      description:
        "금융사기 피해 발생 후 상담 접수, 자료 검토, 계좌·지갑 추적, 가압류, 형사 고소까지의 단계별 절차",
      totalTime: "P7D",
      step: processSteps.map((item) => ({
        "@type": "HowToStep",
        position: parseInt(item.step),
        name: item.title,
        text: item.desc,
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
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "대응절차", item: pageUrl },
      ],
    },
  ],
};

export default function ProcessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(processJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <main className="daeon-wrap">
        <section className="daeon-section">
          <p className="daeon-eyebrow">LEGAL RESPONSE PROCESS</p>

          <h1 className="daeon-title">금융사기 피해 대응절차</h1>

          <p className="daeon-desc">
            금융사기 피해는 시간이 지날수록 입금 계좌, 가상자산 지갑, 대화방,
            사칭 사이트가 사라질 가능성이 높습니다. 대온 법률사무소 대표변호사
            신동우는 초기 자료 확보부터 가압류, 지갑 동결, 민형사 대응까지
            단계별 절차를 기준으로 사건을 검토합니다.
          </p>

          <div className="process-grid">
            {processSteps.map((item) => (
              <div className="process-card" key={item.step}>
                <div className="process-step">{item.step}</div>
                <h2 className="process-title">{item.title}</h2>
                <p className="process-desc">{item.desc}</p>
                <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#059669", fontWeight: 700, lineHeight: 1.6 }}>
                  ✔ {item.point}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ 섹션 */}
        <section style={{ maxWidth: "720px", margin: "64px auto 0", padding: "0 20px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 900, color: "#111827", marginBottom: "24px", borderBottom: "3px solid #111827", paddingBottom: "14px" }}>
            대응 절차 관련 자주 묻는 질문
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
          <p style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 900 }}>대표변호사 신동우</p>
          <p style={{ margin: "0 0 4px", fontSize: "15px", color: "#d1d5db" }}>서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호</p>
          <p style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700, color: "#d1d5db" }}>02-6952-3695 · 평일 09:00 – 18:00</p>
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
