"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

const CASES_PER_PAGE = 35

type CasesClientProps = {
  siteName: string
  cases: string[]
}

export default function CasesClient({ siteName, cases }: CasesClientProps) {
  const [keyword, setKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredCases = useMemo(() => {
    const value = keyword.trim().toLowerCase()
    if (!value) return cases
    return cases.filter((name) => name.toLowerCase().includes(value))
  }, [cases, keyword])

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / CASES_PER_PAGE))

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
    <main className="daeon-wrap">
      <section className="daeon-section">
        <p className="daeon-eyebrow">MAIN PRACTICE</p>

        <h1 className="daeon-title">{siteName} 진행 사건</h1>

        <p className="daeon-desc">
          금융투자사기, 부업사기, 가상자산 사기, 플랫폼 사칭 사건 등 주요 사건을 확인할 수 있습니다.
        </p>

        <div className="daeon-search-wrap">
          <div className="daeon-search-box">
            <input
              type="text"
              className="daeon-search-input"
              placeholder="사건명 검색 (예: faisuro, 토스증권, 다우트래블)"
              value={keyword}
              onChange={(event) => handleSearch(event.target.value)}
            />
            <span className="daeon-search-icon">⌕</span>
          </div>

          <button type="button" className="daeon-reset-btn" onClick={handleReset}>
            초기화
          </button>

          <div className="daeon-search-meta">
            {keyword.trim()
              ? `검색 결과 ${filteredCases.length}건`
              : `전체 ${cases.length}건`}
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="daeon-empty">검색 결과가 없습니다.</div>
        ) : (
          <>
            <div className="daeon-grid">
              {currentCases.map((name) => (
                <Link key={name} href={`/cases/${name}`} className="daeon-card">
                  <span className="daeon-status">접수진행중</span>

                  <div className="daeon-card-head">
                    <div className="daeon-card-title">
                      <span className="daeon-card-title-main">{name}</span>
                      <span className="daeon-card-title-sub">(사칭)</span>
                    </div>
                  </div>

                  <div className="daeon-card-body">
                    <p className="daeon-warning">
                      해당 사건은 정상 업체명을
                      <br />
                      사칭한 사기 사건입니다
                    </p>

                    <div className="daeon-cta-wrap">
                      <span className="daeon-type">
                        <span className="daeon-type-text">사건 상세보기</span>
                        <span className="daeon-type-icon">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="daeon-page-meta">
              현재 {currentPage} / {totalPages} 페이지 · 페이지당 {CASES_PER_PAGE}건
            </div>

            {totalPages > 1 && (
              <div className="daeon-pagination">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1

                  return (
                    <button
                      key={page}
                      type="button"
                      className={`daeon-page ${page === currentPage ? "active" : ""}`}
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