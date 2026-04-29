"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

const CASES_PER_PAGE = 35

type CasesClientProps = {
  siteName: string
  cases: string[]
}

function getDisplayName(name: string) {
  return name.includes("사칭") ? name : `${name} (사칭)`
}

export default function CasesClient({ siteName, cases }: CasesClientProps) {
  const [keyword, setKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredCases = useMemo(() => {
    const value = keyword.trim().toLowerCase()

    if (!value) return cases

    return cases.filter((name) => name.toLowerCase().includes(value))
  }, [cases, keyword])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCases.length / CASES_PER_PAGE)
  )

  const currentCases = filteredCases.slice(
    (currentPage - 1) * CASES_PER_PAGE,
    currentPage * CASES_PER_PAGE
  )

  function handleSearch(value: string) {
    setKeyword(value)
    setCurrentPage(1)
  }

  function handleReset() {
    setKeyword("")
    setCurrentPage(1)
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-5 py-12">
      <section className="mx-auto max-w-[1500px]">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold tracking-[0.25em] text-emerald-700">
            MAIN PRACTICE
          </p>

          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">
            {siteName} 진행 사건
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-600 md:text-lg">
            금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요
            사건을 확인할 수 있습니다.
          </p>
        </div>

        <div className="mx-auto mb-9 flex max-w-[860px] flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-12 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="사건명 검색 (예: faisuro, 토스증권, 다우트래블)"
              value={keyword}
              onChange={(event) => handleSearch(event.target.value)}
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-700">
              ⌕
            </span>
          </div>

          <button
            type="button"
            className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
            onClick={handleReset}
          >
            초기화
          </button>

          <div className="text-center text-sm font-bold text-slate-500 md:min-w-[120px]">
            {keyword.trim()
              ? `검색 결과 ${filteredCases.length}건`
              : `전체 ${cases.length}건`}
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-lg font-bold text-slate-500 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {currentCases.map((name) => {
                const displayName = getDisplayName(name)
                const imagePath = `/images/cases/${name}.png`

                return (
                  <Link
                    key={name}
                    href={`/cases/${encodeURIComponent(name)}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
                  >
                    <div className="absolute left-0 top-0 z-20 h-1 w-full bg-emerald-600 opacity-0 transition group-hover:opacity-100" />

                    <div
                      className="relative flex min-h-[210px] items-center justify-center overflow-hidden rounded-t-2xl bg-slate-900 bg-cover bg-center px-5 py-10 text-center"
                      style={{
                        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.42), rgba(15, 23, 42, 0.42)), url("${imagePath}")`,
                      }}
                    />
                    
                    <div
                      className="relative flex min-h-[210px] items-center justify-center overflow-hidden rounded-t-2xl bg-slate-100 bg-cover bg-center px-5 py-10 text-center"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.28)), url("${imagePath}")`,
                      }}
                    >
                      <h2 className="break-keep text-2xl font-black leading-snug text-black drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)] transition group-hover:text-emerald-600">
                        {displayName}
                      </h2>  
                    </div>

                    <div className="p-5">
                      <p className="text-center text-base font-black leading-7 text-red-500">
                        본 사건은 업체명을
                        <br />
                        사칭한 사기입니다
                      </p>

                      <div className="mt-7 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-white transition group-hover:bg-emerald-700">
                        <span className="text-base font-black">상세보기</span>

                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl font-black">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-9 text-center text-sm font-bold text-slate-500">
              현재 {currentPage} / {totalPages} 페이지 · 페이지당{" "}
              {CASES_PER_PAGE}건
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1

                  return (
                    <button
                      key={page}
                      type="button"
                      className={`h-10 min-w-10 rounded-xl px-4 text-sm font-black transition ${
                        page === currentPage
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}