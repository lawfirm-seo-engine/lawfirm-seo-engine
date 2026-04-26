import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  verification: {
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
  "@type": "LegalService",
  "@id": `${siteUrl}/#organization`,
  name: "법무법인 대온 핀테크센터",
  alternateName: "대온 핀테크센터",
  url: siteUrl,
  logo: `${siteUrl}/images/logo.png`,
  image: `${siteUrl}/images/logo.png`,
  description:
    "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
  areaServed: {
    "@type": "Country",
    name: "KR",
  },
  inLanguage: "ko-KR",
  sameAs: ["https://cafe.naver.com/daeonlawfintech"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "대온 핀테크센터",
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

        {children}
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}