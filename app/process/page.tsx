import type { Metadata } from "next";

const siteUrl = "https://daeonlawfintech.com";

export const metadata: Metadata = {
  title: "대응절차",
  description:
    "대온 핀테크센터의 금융사기 피해 대응 절차 안내입니다. 상담 접수, 자료 검토, 계좌 추적, 가압류, 민형사 절차까지 단계별 대응 방향을 확인할 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/process`,
  },
  openGraph: {
    title: "대응절차 | 대온 핀테크센터",
    description:
      "금융사기 피해 발생 후 상담 접수부터 가압류와 민형사 대응까지 단계별 절차를 안내합니다.",
    url: `${siteUrl}/process`,
    siteName: "대온 핀테크센터",
    locale: "ko_KR",
    type: "website",
  },
};

const processSteps = [
  {
    step: "01",
    title: "피해 상담 접수",
    desc: "사건명, 사이트 주소, 입금 내역, 대화방 자료를 기준으로 피해 구조를 1차 확인합니다.",
  },
  {
    step: "02",
    title: "자료 정리 및 사건 분석",
    desc: "입금 계좌, 가상자산 지갑, 접속 URL, 담당자 대화 내용을 정리해 법적 대응 가능성을 검토합니다.",
  },
  {
    step: "03",
    title: "계좌·지갑 추적 방향 검토",
    desc: "자금 이동 흐름과 입금 경로를 확인하고 계좌 동결, 지갑 동결, 가압류 가능성을 검토합니다.",
  },
  {
    step: "04",
    title: "가압류 및 민사 대응",
    desc: "확보 가능한 계좌와 관련자를 기준으로 가압류, 손해배상 청구 등 피해 회복 절차를 진행합니다.",
  },
  {
    step: "05",
    title: "형사 고소 및 수사 대응",
    desc: "사칭 사이트, 대화방 운영자, 모집책, 입금 계좌 관련 자료를 바탕으로 형사 절차를 병행합니다.",
  },
  {
    step: "06",
    title: "회수 가능성 점검",
    desc: "사건 진행 상황에 따라 추가 자료를 보완하고 실제 피해 회복 가능성을 지속적으로 점검합니다.",
  },
];

const processJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": `${siteUrl}/process#howto`,
  name: "금융사기 피해 대응 절차",
  description:
    "금융사기 피해 발생 후 상담 접수, 자료 검토, 계좌 추적, 가압류, 민형사 대응까지의 단계별 절차입니다.",
  step: processSteps.map((item) => ({
    "@type": "HowToStep",
    name: item.title,
    text: item.desc,
  })),
};

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
      name: "대응절차",
      item: `${siteUrl}/process`,
    },
  ],
};

export default function ProcessPage() {
  return (
    <>
      <script
        id="process-howto-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(processJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        id="process-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <main className="daeon-wrap">
        <section className="daeon-section">
          <p className="daeon-eyebrow">LEGAL RESPONSE PROCESS</p>

          <h1 className="daeon-title">금융사기 피해 대응절차</h1>

          <p className="daeon-desc">
            금융사기 피해는 시간이 지날수록 입금 계좌, 가상자산 지갑, 대화방,
            사칭 사이트가 사라질 가능성이 높습니다. 대온 핀테크센터는 초기
            자료 확보부터 가압류, 지갑 동결, 민형사 대응까지 단계별 절차를
            기준으로 사건을 검토합니다.
          </p>

          <div className="process-grid">
            {processSteps.map((item) => (
              <div className="process-card" key={item.step}>
                <div className="process-step">{item.step}</div>
                <h2 className="process-title">{item.title}</h2>
                <p className="process-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}