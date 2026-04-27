"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">

        <Link
          href="/"
          className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight text-gray-900 sm:text-lg lg:flex-none lg:text-xl"
          onClick={() => setMenuOpen(false)}
        >
          법무법인 대온 핀테크센터
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-800 lg:flex">
          <Link href="/services" className="hover:text-emerald-700">
            주력분야
          </Link>
          <Link href="/cases" className="hover:text-emerald-700">
            진행사건
          </Link>
          <Link href="/process" className="hover:text-emerald-700">
            대응절차
          </Link>
          <Link href="/consulting" className="hover:text-emerald-700">
            상담안내
          </Link>
          <a
            href="https://cafe.naver.com/daeonlawfintech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-700"
          >
            네이버카페
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white lg:hidden"
          aria-label="모바일 메뉴 열기"
          aria-expanded={menuOpen}
        >
          <span className="relative block h-5 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 bg-gray-900 transition ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2 h-0.5 w-6 bg-gray-900 transition ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-4 h-0.5 w-6 bg-gray-900 transition ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1 text-sm font-semibold text-gray-900">
            <Link
              href="/services"
              className="rounded-lg px-3 py-3 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              주력분야
            </Link>
            <Link
              href="/cases"
              className="rounded-lg px-3 py-3 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              진행사건
            </Link>
            <Link
              href="/process"
              className="rounded-lg px-3 py-3 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              대응절차
            </Link>
            <Link
              href="/consulting"
              className="rounded-lg px-3 py-3 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              상담안내
            </Link>
            <a
              href="https://cafe.naver.com/daeonlawfintech"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-3 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              네이버카페
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}