"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">

        {/* 로고 */}
        <Link
          href="/"
          className="text-lg font-bold whitespace-nowrap"
        >
          대온 핀테크센터
        </Link>

        {/* 데스크탑 메뉴 */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/services">주력분야</Link>
          <Link href="/cases">진행사건</Link>
          <Link href="/process">대응절차</Link>
          <Link href="/consulting">상담안내</Link>
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1"
          aria-label="모바일 메뉴"
        >
          <span className="block w-6 h-[2px] bg-black"></span>
          <span className="block w-6 h-[2px] bg-black"></span>
          <span className="block w-6 h-[2px] bg-black"></span>
        </button>
      </div>

      {/* 모바일 메뉴 패널 */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white">

          <nav className="flex flex-col text-sm">

            <Link
              href="/services"
              className="px-4 py-3 border-b"
              onClick={() => setMenuOpen(false)}
            >
              주력분야
            </Link>

            <Link
              href="/cases"
              className="px-4 py-3 border-b"
              onClick={() => setMenuOpen(false)}
            >
              진행사건
            </Link>

            <Link
              href="/process"
              className="px-4 py-3 border-b"
              onClick={() => setMenuOpen(false)}
            >
              대응절차
            </Link>

            <Link
              href="/consulting"
              className="px-4 py-3"
              onClick={() => setMenuOpen(false)}
            >
              상담안내
            </Link>

          </nav>
        </div>
      )}
    </header>
  )
}