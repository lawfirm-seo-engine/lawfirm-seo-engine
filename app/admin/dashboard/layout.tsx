"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

const NAV = [
  { href: "/admin/dashboard/cases",  label: "📋 케이스 목록" },
  { href: "/admin/dashboard/cases/new", label: "✏️ 새 사건 만들기" },
  { href: "/admin/dashboard/deploy", label: "🚀 배포" },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" })
    router.push("/admin")
  }

  return (
    <nav className="flex h-full flex-col bg-slate-950 px-4 py-6">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest text-emerald-400">DAEON ADMIN</p>
        <p className="mt-0.5 text-lg font-black text-white">관리자</p>
      </div>

      <ul className="flex-1 space-y-1">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href))
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <button
        onClick={logout}
        className="mt-4 rounded-xl border border-slate-800 px-4 py-3 text-left text-sm font-bold text-slate-500 transition hover:border-red-900 hover:text-red-400"
      >
        🚪 로그아웃
      </button>

      <a
        href="/"
        target="_blank"
        className="mt-2 rounded-xl px-4 py-2 text-xs text-slate-600 hover:text-slate-400"
      >
        ↗ 사이트 보기
      </a>
    </nav>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* 모바일 오버레이 사이드바 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-56 shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* 메인 */}
      <main className="flex-1 overflow-x-hidden">
        {/* 모바일 상단 바 */}
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
            aria-label="메뉴 열기"
          >
            ☰
          </button>
          <span className="text-sm font-bold text-white">대온 관리자</span>
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
