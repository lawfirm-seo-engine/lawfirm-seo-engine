"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8 max-md:h-14 max-md:px-4">
        {/* 로고 */}
        <Link
          href="/"
          className="truncate text-2xl font-extrabold tracking-tight text-gray-900 max-md:text-base"
          onClick={() => setMenuOpen(false)}
        >
          대온 핀테크센터
        </Link>

        {/* PC/태블릿 메뉴 */}
        <nav className="hidden items-center gap-10 text-base font-extrabold text-gray-900 md:flex">
          <Link href="/services">주력분야</Link>
          <Link href="/cases">진행사건</Link>
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

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white md:hidden"
          aria-label="모바일 메뉴"
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

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 py-1.5 text-[12px] font-semibold text-gray-800">
            <Link href="/services" onClick={() => setMenuOpen(false)}>
              주력분야
            </Link>

            <Link href="/cases" onClick={() => setMenuOpen(false)}>
              진행사건
            </Link>

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
          </div>
        </div>
      )}
    </header>
  )
}