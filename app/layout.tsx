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

const siteName = "대온 법률사무소 핀테크센터";
const organizationName = "대온 법률사무소";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  verification: {
    google: "zY1U8LMHWWtmETEB1JpDKFEBDYPJcPuhBeYv6six-QE",
    other: {
      "naver-site-verification":
        "bd3e64eb58fefb8b0ddce38226625e283a662dc9",
    },
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
      "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기, 가상자산 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
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
      "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기, 가상자산 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
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
        "대온 법률사무소 금융사기 대응센터",
      ],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,
      sameAs: ["https://cafe.naver.com/daeonlawfintech"],
    },

    {
      "@type": "LegalService",
      "@id": `${siteUrl}/#legalservice`,
      name: siteName,
      legalName: organizationName,
      alternateName: [
        "대온 핀테크센터",
        "대온 금융사기 대응센터",
        "대온 법률사무소 금융사기 대응센터",
      ],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,
      description:
        "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기, 가상자산 사기, 쇼핑몰 사칭 사기, 부업 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",

      address: {
        "@type": "PostalAddress",
        streetAddress: "서초대로 250 스타갤러리브릿지빌딩 802호",
        addressLocality: "서초구",
        addressRegion: "서울",
        postalCode: "06647",
        addressCountry: "KR",
      },

      telephone: "+82-2-6952-3695",
      priceRange: "$$$",

      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },

      knowsAbout: [
        "투자사기",
        "리딩방 사기",
        "주식리딩방 사기",
        "증권사 사칭 사기",
        "코인 사기",
        "가상자산 사기",
        "해외선물 사기",
        "금 투자 사기",
        "주식 어플 사기",
        "어플 사기",
        "팀미션 사기",
        "쇼핑몰 사칭 사기",
        "부업 사기",
        "플랫폼 사칭 사기",
        "여행사 사칭 사기",
        "가압류",
        "계좌 동결",
        "민사 손해배상",
        "형사 고소",
      ],

      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "KR",
        availableLanguage: ["ko-KR"],
        telephone: "+82-2-3476-0915",
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
  alternateName: ["대온 핀테크센터", "대온 법률사무소"],
  description:
    "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
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
  description:
    "대온 법률사무소 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
  about: {
    "@id": `${siteUrl}/#legalservice`,
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
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homepageJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(navigationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <Header />

        {children}

        <Footer />
        <FloatingContact />

        <Script
          src="https://logs.ai.kr/logs_init.php?sid=h5y08t"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}