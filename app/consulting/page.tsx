import type { Metadata } from "next";

const siteUrl = "https://daeonlawfintech.com";

export const metadata: Metadata = {
  title: "상담안내",
  description:
    "대온 핀테크센터의 금융사기 피해 상담 안내입니다. 상담 전 준비 자료와 사건 검토 절차를 확인하실 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/consulting`,
  },
  openGraph: {
    title: "상담안내 | 대온 핀테크센터",
    description:
      "금융사기 피해 상담 전 준비 자료와 사건 검토 절차를 안내합니다.",
    url: `${siteUrl}/consulting`,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
  },
};

const consultingItems = [
  {
    title: "상담 전 준비 자료",
    desc: "입금 내역, 거래 내역, 사이트 주소, 대화방 캡처, 담당자 정보 등을 정리해 두시면 사건 검토가 빠르게 진행됩니다.",
  },
  {
    title: "피해 구조 확인",
    desc: "피해자가 어떤 경로로 유입되었는지, 어떤 사이트나 앱을 이용했는지, 추가 입금 요구가 있었는지 확인합니다.",
  },
  {
    title: "입금 계좌·지갑 정보 검토",
    desc: "입금 계좌, 예금주, 거래소 지갑 주소, 송금 내역 등을 기준으로 자금 흐름과 보전 가능성을 검토합니다.",
  },
  {
    title: "가압류 및 민사 대응 검토",
    desc: "확보된 자료를 바탕으로 가압류, 손해배상 청구 등 피해 회복을 위한 민사 절차 가능성을 확인합니다.",
  },
  {
    title: "형사 고소 자료 정리",
    desc: "사칭 사이트, 모집책, 대화방, 계좌 정보 등 형사 고소에 필요한 자료를 정리합니다.",
  },
  {
    title: "진행 방향 안내",
    desc: "사건 유형과 확보 자료에 따라 계좌 동결, 지갑 동결, 민형사 병행 대응 방향을 안내합니다.",
  },
];

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "홈",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "상담안내",
      item: `${siteUrl}/consulting`,
    },
  ],
};

const consultingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${siteUrl}/consulting#webpage`,
  url: `${siteUrl}/consulting`,
  name: "상담안내",
  description:
    "대온 핀테크센터의 금융사기 피해 상담 안내와 상담 전 준비 자료, 사건 검토 절차를 설명하는 페이지입니다.",
  inLanguage: "ko-KR",
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
  about: {
    "@id": `${siteUrl}/#legalservice`,
  },
};

export default function ConsultingPage() {
  return (
    <>
      <script
        id="consulting-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        id="consulting-webpage-jsonld"
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
            가능성을 함께 검토하는 과정입니다. 입금 내역, 대화 자료, 사이트
            주소, 담당자 정보 등을 기준으로 피해 회복 가능성과 대응 방향을
            확인합니다.
          </p>

          <div className="consulting-grid">
            {consultingItems.map((item) => (
              <div className="consulting-card" key={item.title}>
                <h2 className="consulting-title">{item.title}</h2>
                <p className="consulting-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}