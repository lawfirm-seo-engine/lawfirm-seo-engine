import type { Metadata } from "next"
import Link from "next/link"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 법률사무소 핀테크센터"
const organizationName = "대온 법률사무소"
const representativeName = "신동우"
const phoneNumber = "+82-2-6952-3695"
const pageUrl = `${siteUrl}/attorney`

export const metadata: Metadata = {
  title: `대표변호사 소개 | ${siteName}`,
  description:
    "대온 법률사무소 대표변호사 신동우의 프로필과 금융사기 피해 대응 전문 분야를 안내합니다. 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기 피해 법률 상담.",
  alternates: {
    canonical: pageUrl,
    languages: { "ko-KR": pageUrl },
  },
  openGraph: {
    title: `대표변호사 소개 | ${siteName}`,
    description:
      "대온 법률사무소 대표변호사 신동우 — 금융사기 피해 대응 전문 법률 서비스",
    url: pageUrl,
    siteName,
    locale: "ko_KR",
    type: "profile",
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} 대표변호사 소개`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#representative`,
      name: representativeName,
      jobTitle: "대표변호사",
      description:
        "금융사기 피해 대응, 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기 등 핀테크 분야 법률 분쟁을 전문으로 다룹니다.",
      url: pageUrl,
      telephone: phoneNumber,
      worksFor: {
        "@type": "LegalService",
        "@id": `${siteUrl}/#legalservice`,
        name: siteName,
        legalName: organizationName,
        url: siteUrl,
      },
      knowsAbout: [
        "금융사기 피해 대응",
        "투자사기 민형사 대응",
        "리딩방 사기 피해 회복",
        "코인 사기 계좌 추적",
        "쇼핑몰 사칭 사기",
        "증권사 사칭 사기",
        "가압류 신청",
        "손해배상 소송",
      ],
      sameAs: [siteUrl, "https://cafe.naver.com/daeonlawfintech"],
    },
    {
      "@type": "LegalService",
      "@id": `${siteUrl}/#legalservice`,
      name: siteName,
      legalName: organizationName,
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      telephone: phoneNumber,
      address: {
        "@type": "PostalAddress",
        streetAddress: "서울 서초구 서초대로 250 스타갤러리브릿지빌딩 802호",
        addressLocality: "서초구",
        addressRegion: "서울특별시",
        postalCode: "06647",
        addressCountry: "KR",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "대표변호사 소개",
          item: pageUrl,
        },
      ],
    },
  ],
}

export default function AttorneyPage() {
  return (
    <main className="attorney-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .attorney-page {
              width: 100%;
              max-width: 960px;
              margin: 0 auto;
              padding: 80px 20px 120px;
            }

            .attorney-hero {
              margin-bottom: 48px;
              padding: 48px 40px;
              border-radius: 24px;
              background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
              color: #ffffff;
            }

            .attorney-eyebrow {
              margin: 0 0 12px;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 0.1em;
              color: #a7f3d0;
              text-transform: uppercase;
            }

            .attorney-name {
              margin: 0 0 6px;
              font-size: 48px;
              font-weight: 900;
              letter-spacing: -0.04em;
              line-height: 1.1;
            }

            .attorney-title {
              margin: 0 0 20px;
              font-size: 20px;
              font-weight: 600;
              color: #9ca3af;
            }

            .attorney-desc {
              margin: 0;
              max-width: 680px;
              font-size: 17px;
              line-height: 1.8;
              color: #d1d5db;
            }

            .attorney-section {
              margin-bottom: 48px;
            }

            .attorney-section-title {
              margin: 0 0 24px;
              padding-bottom: 14px;
              border-bottom: 3px solid #111827;
              font-size: 26px;
              font-weight: 900;
              color: #111827;
            }

            .attorney-card-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }

            .attorney-card {
              padding: 24px 22px;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              background: #ffffff;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
            }

            .attorney-card-label {
              margin: 0 0 8px;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.06em;
              color: #6b7280;
              text-transform: uppercase;
            }

            .attorney-card-value {
              margin: 0;
              font-size: 17px;
              font-weight: 800;
              color: #111827;
              line-height: 1.5;
            }

            .attorney-list {
              margin: 0;
              padding: 0;
              list-style: none;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .attorney-list-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 18px 20px;
              border: 1px solid #e5e7eb;
              border-radius: 14px;
              background: #ffffff;
              font-size: 16px;
              line-height: 1.6;
              color: #374151;
            }

            .attorney-list-icon {
              flex-shrink: 0;
              font-size: 18px;
              margin-top: 1px;
            }

            .attorney-disclaimer {
              padding: 24px 28px;
              border: 1px solid #fbbf24;
              border-radius: 16px;
              background: #fffbeb;
              font-size: 15px;
              line-height: 1.8;
              color: #92400e;
            }

            .attorney-disclaimer strong {
              display: block;
              margin-bottom: 8px;
              font-size: 16px;
              font-weight: 800;
              color: #78350f;
            }

            .attorney-contact-box {
              display: flex;
              gap: 16px;
              flex-wrap: wrap;
            }

            .attorney-contact-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              height: 52px;
              padding: 0 28px;
              border-radius: 14px;
              font-size: 16px;
              font-weight: 800;
              text-decoration: none;
              transition: opacity 0.15s;
            }

            .attorney-contact-btn:hover {
              opacity: 0.85;
            }

            .attorney-contact-btn.primary {
              background: #111827;
              color: #ffffff;
            }

            .attorney-contact-btn.secondary {
              border: 2px solid #111827;
              color: #111827;
              background: #ffffff;
            }

            @media (max-width: 768px) {
              .attorney-page {
                padding: 52px 16px 80px;
              }

              .attorney-hero {
                padding: 32px 22px;
              }

              .attorney-name {
                font-size: 36px;
              }

              .attorney-card-grid {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="attorney-hero">
        <p className="attorney-eyebrow">DAEON FINTECH CENTER</p>
        <h1 className="attorney-name">{representativeName} 변호사</h1>
        <p className="attorney-title">대온 법률사무소 대표변호사</p>
        <p className="attorney-desc">
          금융사기, 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기 등
          핀테크 분야 피해 대응을 전문으로 합니다. 계좌 추적, 가압류, 민형사
          대응을 통해 피해금 회복 가능성을 검토합니다.
        </p>
      </section>

      <section className="attorney-section">
        <h2 className="attorney-section-title">사무소 기본 정보</h2>
        <div className="attorney-card-grid">
          <div className="attorney-card">
            <p className="attorney-card-label">법인명</p>
            <p className="attorney-card-value">{organizationName}</p>
          </div>
          <div className="attorney-card">
            <p className="attorney-card-label">대표변호사</p>
            <p className="attorney-card-value">{representativeName}</p>
          </div>
          <div className="attorney-card">
            <p className="attorney-card-label">주소</p>
            <p className="attorney-card-value">
              서울 서초구 서초대로 250<br />스타갤러리브릿지빌딩 802호
            </p>
          </div>
          <div className="attorney-card">
            <p className="attorney-card-label">상담 전화</p>
            <p className="attorney-card-value">02-6952-3695</p>
          </div>
          <div className="attorney-card">
            <p className="attorney-card-label">상담 가능 시간</p>
            <p className="attorney-card-value">평일 09:00 – 18:00</p>
          </div>
          <div className="attorney-card">
            <p className="attorney-card-label">전문 분야</p>
            <p className="attorney-card-value">금융사기 피해 대응·민형사 소송</p>
          </div>
        </div>
      </section>

      <section className="attorney-section">
        <h2 className="attorney-section-title">전문 대응 분야</h2>
        <ul className="attorney-list">
          {[
            {
              icon: "📈",
              text: "투자사기 — 가짜 투자 플랫폼, 수익 보장 사기, 추가 입금 유도 피해 대응",
            },
            {
              icon: "💬",
              text: "리딩방 사기 — 주식·선물 리딩방 사칭, 증권사 전문가 사칭 피해 대응",
            },
            {
              icon: "🪙",
              text: "코인 사기 — 가상자산 거래소 사칭, 스테이킹 사기, 지갑 해킹 피해 대응",
            },
            {
              icon: "🛒",
              text: "쇼핑몰 사칭 사기 — 정상 쇼핑몰 사칭 결제 사기, 팀미션·체험단 사기 대응",
            },
            {
              icon: "💼",
              text: "부업·재택 사기 — 재택부업, 라이브 커머스, 고수익 아르바이트 사기 대응",
            },
            {
              icon: "⚖️",
              text: "민형사 대응 — 계좌 추적, 가압류 신청, 손해배상 소송, 형사 고소 진행",
            },
          ].map((item) => (
            <li key={item.text} className="attorney-list-item">
              <span className="attorney-list-icon">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="attorney-section">
        <h2 className="attorney-section-title">법률 정보 작성 기준</h2>
        <ul className="attorney-list">
          {[
            "본 사이트의 사건 정보는 대온 법률사무소 변호사가 실제 접수·처리된 사건 유형을 바탕으로 작성합니다.",
            "사기 수법, 피해 경위, 대응 방향은 수집된 피해 사례를 참고하여 일반 법률 정보로 정리됩니다.",
            "특정 사건의 법적 판단이나 승소 보장은 제공하지 않으며, 구체적 사건은 반드시 개별 상담이 필요합니다.",
            "콘텐츠는 사건 발생 추이에 따라 주기적으로 검토·업데이트됩니다.",
          ].map((text) => (
            <li key={text} className="attorney-list-item">
              <span className="attorney-list-icon">✔</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="attorney-section">
        <h2 className="attorney-section-title">면책 고지</h2>
        <div className="attorney-disclaimer">
          <strong>본 사이트는 일반 법률 정보 제공을 목적으로 합니다.</strong>
          이 페이지의 내용은 특정 사건에 대한 법률 조언이나 소송 결과를
          보장하지 않습니다. 개별 사건의 구체적인 법적 판단은 담당 변호사와의
          직접 상담을 통해 이루어져야 합니다. 또한 후불제 수임을 내세우는
          법률 서비스는 변호사법상 허용되지 않으므로 주의하시기 바랍니다.
        </div>
      </section>

      <section className="attorney-section">
        <h2 className="attorney-section-title">상담 문의</h2>
        <div className="attorney-contact-box">
          <Link href="tel:0269523695" className="attorney-contact-btn primary">
            📞 02-6952-3695 전화 상담
          </Link>
          <Link
            href="http://pf.kakao.com/_xcypmn/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="attorney-contact-btn secondary"
          >
            💬 카카오톡 상담
          </Link>
        </div>
        <p style={{ marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
          상담 가능 시간: 평일 09:00 – 18:00 / 주말·공휴일 제외
        </p>
      </section>

      <nav style={{ marginTop: "48px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "#6b7280", fontSize: "14px" }}>← 홈으로</Link>
        <Link href="/cases" style={{ color: "#6b7280", fontSize: "14px" }}>진행 사건 목록</Link>
        <Link href="/services" style={{ color: "#6b7280", fontSize: "14px" }}>주력분야</Link>
      </nav>
    </main>
  )
}
