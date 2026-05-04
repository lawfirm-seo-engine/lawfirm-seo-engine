"use client"

import { useState } from "react"
import Link from "next/link"

const caseHubLinks = [
  { href: "/cases", label: "전체 사건 목록" },
  { href: "/cases/teammission", label: "팀미션 사기" },
  { href: "/cases/stock-room", label: "주식리딩방 사기" },
  { href: "/cases/crypto-room", label: "코인리딩방 사기" },
  { href: "/cases/broadcast-exchange", label: "방송환전 사기" },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8 max-md:h-14 max-md:px-4">
        <Link
          href="/"
          className="truncate text-2xl font-extrabold text-gray-900 max-md:max-w-[230px] max-md:text-sm"
          onClick={() => setMenuOpen(false)}
          aria-label="대온 법률사무소 핀테크센터 홈으로 이동"
        >
          대온 법률사무소 핀테크센터
        </Link>

        <nav
          className="hidden items-center gap-10 text-base font-extrabold text-gray-900 md:flex"
          aria-label="주요 메뉴"
        >
          <Link href="/services">주력분야</Link>

          <div className="group relative">
            <Link href="/cases" className="inline-flex items-center">
              진행사건
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
              {caseHubLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/process">대응절차</Link>
          <Link href="/consulting">상담안내</Link>
          <a
            href="https://cafe.naver.com/daeonlawfintech"
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버카페
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white md:hidden"
          aria-label={menuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-[2px] w-5 bg-black transition ${
                menuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-[2px] w-5 bg-black transition ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[12px] h-[2px] w-5 bg-black transition ${
                menuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t bg-white md:hidden">
          <nav
            className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 py-1.5 text-[12px] font-semibold text-gray-800"
            aria-label="모바일 주요 메뉴"
          >
            <button
              type="button"
              onClick={() => setServicesOpen(!servicesOpen)}
              className="inline-flex items-center gap-0.5"
            >
              주력분야
              <span className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            <Link href="/cases" onClick={() => setMenuOpen(false)}>
              진행사건
            </Link>

            {servicesOpen && (
              <>
                <div className="basis-full" />
                <div className="flex flex-col items-start gap-1 border-l-2 border-slate-200 pl-3 text-left">
                  {caseHubLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                    >
                      • {item.label}
                    </Link>
                  ))}
                </div>
                <div className="basis-full" />
              </>
            )}

            <Link href="/process" onClick={() => setMenuOpen(false)}>
              대응절차
            </Link>
            <Link href="/consulting" onClick={() => setMenuOpen(false)}>
              상담안내
            </Link>
            <a
              href="https://cafe.naver.com/daeonlawfintech"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              네이버카페
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
