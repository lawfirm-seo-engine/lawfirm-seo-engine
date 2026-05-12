import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingContact from "./components/FloatingContact";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://daeonlawfintech.com";
const googleAnalyticsId = "G-RDQJT1FLNT";
// Naver Analytics 계정 ID — analytics.naver.com 에서 발급 (예: "s_xxxxxxxxxx")
// 발급 후 아래 값을 교체하면 자동 활성화됩니다.
const naverAnalyticsId = "567e1b004e9fac";

const siteName = "대온 법률사무소 핀테크센터";
const organizationName = "대온 법률사무소";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  icons: {
    // rel="shortcut icon" + type="image/x-icon" → Naver Yeti 파비콘 인식 표준 형식
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },

  verification: {
    google: "zY1U8LMHWWtmETEB1JpDKFEBDYPJcPuhBeYv6six-QE",
    other: {
      "naver-site-verification":
        "bd3e64eb58fefb8b0ddce38226625e283a662dc9",
    },
  },

  // Naver 사이트명 표시 핵심 태그
  // application-name → Naver가 도메인 대신 사이트명을 표시할 때 최우선 참조
  // og:site_name·JSON-LD name 단독으로는 부족 → 세 가지 신호를 일치시켜야 함
  other: {
    "application-name": organizationName,
    "msapplication-TileColor": "#111827",
    "theme-color": "#111827",
    // Naver Yeti 크롤러 이미지 수집 및 콘텐츠 색인 허용 명시
    "NaverBot": "All",
    "Yeti": "All",
  },

  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },

  description:
    "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기, 가상자산 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",

  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [
        {
          url: `${siteUrl}/rss.xml`,
          title: `${siteName} 사건 업데이트 RSS`,
        },
      ],
    },
  },

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName,
    title: siteName,
    description:
      "대온 법률사무소 핀테크센터는 금융사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} 로고`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description:
      "대온 법률사무소 핀테크센터는 금융사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
    images: [`${siteUrl}/images/logo.png`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: organizationName,
      legalName: organizationName,
      alternateName: [
        siteName,
        "대온 핀테크센터",
        "대온 금융사기 대응센터",
      ],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,
      sameAs: ["https://cafe.naver.com/daeonlawfintech"],
      founder: {
        "@type": "Person",
        name: "신동우",
      },
    },

    {
      "@type": "LegalService",
      "@id": `${siteUrl}/#legalservice`,
      name: siteName,
      legalName: organizationName,

      url: siteUrl,

      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,

      telephone: "+82-2-6952-3695",

      address: {
        "@type": "PostalAddress",
        streetAddress:
          "서초대로 250 스타갤러리브릿지빌딩 802호",
        addressLocality: "서초구",
        addressRegion: "서울",
        postalCode: "06647",
        addressCountry: "KR",
      },

      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },

      priceRange: "$$$",

      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+82-2-6952-3695",
        areaServed: "KR",
        availableLanguage: ["ko-KR"],
      },

      sameAs: ["https://cafe.naver.com/daeonlawfintech"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",

  "@type": "WebSite",

  "@id": `${siteUrl}/#website`,

  url: siteUrl,

  name: siteName,
  // alternateName에 단축 사이트명 명시 → Naver가 사이트명 후보로 참조
  alternateName: [organizationName, "대온 핀테크센터"],

  publisher: {
    "@id": `${siteUrl}/#organization`,
  },

  potentialAction: {
    "@type": "SearchAction",

    target: `${siteUrl}/search?q={search_term_string}`,

    "query-input": "required name=search_term_string",
  },

  inLanguage: "ko-KR",
};

const homepageJsonLd = {
  "@context": "https://schema.org",

  "@type": "WebPage",

  "@id": `${siteUrl}/#homepage`,

  url: siteUrl,

  name: siteName,

  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },

  about: {
    "@id": `${siteUrl}/#legalservice`,
  },

  speakable: {
    "@type": "SpeakableSpecification",

    cssSelector: [
      "h1",
      "h2",
      ".case-summary",
      ".faq-section",
    ],
  },

  inLanguage: "ko-KR",
};

const navigationJsonLd = {
  "@context": "https://schema.org",

  "@type": "SiteNavigationElement",

  "@id": `${siteUrl}/#navigation`,

  name: [
    "홈",
    "주력분야",
    "진행사건",
    "대응절차",
    "상담안내",
    "네이버카페",
  ],

  url: [
    siteUrl,
    `${siteUrl}/services`,
    `${siteUrl}/cases`,
    `${siteUrl}/process`,
    `${siteUrl}/consulting`,
    "https://cafe.naver.com/daeonlawfintech",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');
`}
        </Script>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              organizationJsonLd
            ).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              websiteJsonLd
            ).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              homepageJsonLd
            ).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              navigationJsonLd
            ).replace(/</g, "\\u003c"),
          }}
        />

        <Header />

        {children}

        <Footer />

        <FloatingContact />

        {/* Naver Analytics — Naver 행동 신호 수집 → 검색 랭킹 직접 영향 */}
        {naverAnalyticsId && (
          <>
            <Script
              src="//wcs.naver.net/wcslog.js"
              strategy="afterInteractive"
            />
            <Script id="naver-analytics" strategy="afterInteractive">
              {`
if(!wcs_add) var wcs_add = {};
wcs_add["wa"] = "${naverAnalyticsId}";
if(window.wcs) wcs_do();
`}
            </Script>
          </>
        )}

        <Script
          src="https://logs.ai.kr/logs_init.php?sid=h5y08t"
          strategy="afterInteractive"
        />

      </body>
    </html>
  );
}