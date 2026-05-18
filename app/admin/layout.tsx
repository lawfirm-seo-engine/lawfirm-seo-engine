import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "관리자 | 대온 핀테크센터",
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
