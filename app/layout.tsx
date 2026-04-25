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

export const metadata: Metadata = {
  title: "대온 핀테크센터",
  description:
    "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 대온 핀테크센터입니다.",
  alternates: {
    types: {
      "application/rss+xml": [
        {
          url: "https://daeonlawfintech.com/rss.xml",
          title: "대온 핀테크센터 사건 업데이트 RSS",
        },
      ],
    },
  },
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
        {children}
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}