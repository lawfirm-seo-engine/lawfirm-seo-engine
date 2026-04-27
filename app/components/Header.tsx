"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-center px-4">
        <Link
          href="/"
          className="max-w-[70%] truncate text-center text-base font-extrabold tracking-tight text-gray-900 sm:text-lg"
          onClick={() => setMenuOpen(false)}
        >
          법무법인 대온 핀테크센터
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-800 lg:absolute lg:right-4 lg:flex">
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
          className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white lg:hidden"
          aria-label="모바일 메뉴 열기"
          aria-expanded={menuOpen}
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-gray-900 transition ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 bg-gray-900 transition ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 bg-gray-900 transition ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-1.5 lg:hidden">
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-1 text-center text-[13px] font-semibold text-gray-900">
            <Link
              href="/services"
              className="rounded-md px-2 py-1.5 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              주력분야
            </Link>
            <Link
              href="/cases"
              className="rounded-md px-2 py-1.5 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              진행사건
            </Link>
            <Link
              href="/process"
              className="rounded-md px-2 py-1.5 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              대응절차
            </Link>
            <Link
              href="/consulting"
              className="rounded-md px-2 py-1.5 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              상담안내
            </Link>
            <a
              href="https://cafe.naver.com/daeonlawfintech"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
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