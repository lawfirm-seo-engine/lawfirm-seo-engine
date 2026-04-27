import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
    default: "대온 핀테크센터",
    template: "%s | 대온 핀테크센터",
  },

  description:
    "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 핀테크센터입니다.",

  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [
        {
          url: `${siteUrl}/rss.xml`,
          title: "대온 핀테크센터 사건 업데이트 RSS",
        },
      ],
    },
  },

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "대온 핀테크센터",
    title: "대온 핀테크센터",
    description:
      "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 핀테크센터입니다.",
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
      name: "법무법인 대온",
      legalName: "법무법인 대온",
      alternateName: [
        "대온 핀테크센터",
        "법무법인 대온 핀테크센터",
        "대온 금융사기 대응센터",
      ],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,
      sameAs: ["https://cafe.naver.com/daeonlawfintech"],
    },
    {
      "@type": "LegalService",
      "@id": `${siteUrl}/#legalservice`,
      name: "대온 핀테크센터",
      legalName: "법무법인 대온",
      alternateName: [
        "법무법인 대온 핀테크센터",
        "대온 금융사기 대응센터",
      ],
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      image: `${siteUrl}/images/logo.png`,
      description:
        "대온 핀테크센터는 금융사기, 투자사기, 리딩방 사기, 코인 사기, 가상자산 사기, 쇼핑몰 사칭 사기, 부업 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },
      serviceType: [
        "투자사기 피해 대응",
        "가상자산 사기 대응",
        "코인 사기 피해 대응",
        "리딩방 사기 피해 대응",
        "주식리딩방 사기 피해 대응",
        "주식 어플 사기 피해 대응",
        "어플 사기 피해 대응",
        "팀미션 사기 피해 대응",
        "해외선물 사기 피해 대응",
        "쇼핑몰 사칭 사기 피해 대응",
        "부업 사기 피해 대응",
        "플랫폼 사칭 사기 피해 대응",
        "민사 손해배상 대응",
        "형사 고소 대응",
        "가압류 대응",
        "계좌 동결 대응",
      ],
      knowsAbout: [
        "투자사기",
        "리딩방 사기",
        "주식리딩방 사기",
        "코인 사기",
        "가상자산 사기",
        "해외선물 사기",
        "주식 어플 사기",
        "어플 사기",
        "팀미션 사기",
        "쇼핑몰 사칭 사기",
        "부업 사기",
        "플랫폼 사칭 사기",
        "가압류",
        "계좌 동결",
        "민사 손해배상",
        "형사 고소",
      ],
      provider: {
        "@id": `${siteUrl}/#organization`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "KR",
        availableLanguage: ["ko-KR"],
      },
      inLanguage: "ko-KR",
      sameAs: ["https://cafe.naver.com/daeonlawfintech"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "대온 핀테크센터",
  description:
    "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 핀테크센터입니다.",
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
  inLanguage: "ko-KR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        {children}

        <Footer />
        <FloatingContact />

        {/* LogScan */}
        <Script
          src="https://logs.ai.kr/logs_init.php?sid=h5y08t"
          strategy="afterInteractive"
        />
        {/* End LogScan Code */}
      </body>
    </html>
  );
}