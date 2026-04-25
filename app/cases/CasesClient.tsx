"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

const CASES_PER_PAGE = 50

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

  const totalPages = Math.ceil(filteredCases.length / CASES_PER_PAGE)

  const currentCases = filteredCases.slice(
    (currentPage - 1) * CASES_PER_PAGE,
    currentPage * CASES_PER_PAGE
  )

  function handleSearch(value: string) {
    setKeyword(value)
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

            {totalPages > 1 && (
              <div className="daeon-pagination">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1

                  return (
                    <button
                      key={page}
                      type="button"
                      className={`daeon-page ${
                        page === currentPage ? "active" : ""
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

      <style jsx global>{`
        .daeon-wrap {
          width: 100%;
          color: #0f172a;
          font-family: Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif;
          background: #ffffff;
        }

        .daeon-wrap * {
          box-sizing: border-box;
        }

        .daeon-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .daeon-eyebrow {
          margin: 0;
          color: #10b981;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .daeon-title {
          margin: 6px 0 0;
          font-size: 42px;
          font-weight: 900;
          line-height: 1.2;
          color: #0f172a;
          letter-spacing: -0.04em;
        }

        .daeon-desc {
          max-width: 900px;
          margin: 18px 0 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.8;
        }

        .daeon-search-wrap {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 34px;
          flex-wrap: wrap;
        }

        .daeon-search-box {
          position: relative;
          width: 100%;
          max-width: 520px;
        }

        .daeon-search-input {
          width: 100%;
          height: 54px;
          padding: 0 52px 0 18px;
          border: 1px solid #dbe4ee;
          border-radius: 14px;
          background: #ffffff;
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .daeon-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .daeon-search-input::placeholder {
          color: #94a3b8;
          font-weight: 600;
        }

        .daeon-search-icon {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          color: #10b981;
          font-size: 20px;
          font-weight: 900;
          pointer-events: none;
        }

        .daeon-search-meta {
          color: #475569;
          font-size: 15px;
          font-weight: 800;
        }

        .daeon-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 22px;
          margin-top: 36px;
        }

        .daeon-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 340px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          text-decoration: none;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease;
        }

        .daeon-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 5px;
          background: #10b981;
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.25s ease;
          z-index: 2;
        }

        .daeon-card:hover {
          transform: translateY(-6px);
          border-color: #10b981;
          box-shadow: 0 18px 38px rgba(16, 185, 129, 0.18);
        }

        .daeon-card:hover::before {
          transform: scaleX(1);
        }

        .daeon-status {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 3;
          padding: 7px 13px;
          background: #10b981;
          border-radius: 999px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.18);
        }

        .daeon-card-head {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 190px;
          padding: 44px 18px 28px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
          transition: background 0.22s ease;
        }

        .daeon-card:hover .daeon-card-head {
          background: #ecfdf5;
        }

        .daeon-card-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          max-width: 95%;
          margin: 0 auto;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.28;
          letter-spacing: -0.02em;
          text-align: center;
          word-break: keep-all;
          overflow-wrap: anywhere;
          transition: color 0.22s ease;
        }

        .daeon-card:hover .daeon-card-title {
          color: #10b981;
        }

        .daeon-card-title-main,
        .daeon-card-title-sub {
          display: block;
          width: 100%;
        }

        .daeon-card-title-sub {
          font-size: 20px;
          font-weight: 900;
          line-height: 1.2;
        }

        .daeon-card-body {
          flex: 1;
          padding: 22px 22px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
        }

        .daeon-warning {
          margin: 0;
          color: #ef4444;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.7;
          word-break: keep-all;
        }

        .daeon-cta-wrap {
          margin-top: auto;
        }

        .daeon-type {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 56px;
          padding: 10px 10px 10px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.01em;
          box-shadow: 0 8px 18px rgba(16, 185, 129, 0.2);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            filter 0.22s ease;
        }

        .daeon-type-text {
          flex: 1;
          text-align: left;
        }

        .daeon-type-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.24);
          font-size: 18px;
          font-weight: 900;
          transition:
            transform 0.22s ease,
            background 0.22s ease;
        }

        .daeon-card:hover .daeon-type {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.28);
          filter: brightness(1.02);
        }

        .daeon-card:hover .daeon-type-icon {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.25);
        }

        .daeon-empty {
          margin-top: 28px;
          padding: 28px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          text-align: center;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
        }

        .daeon-pagination {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .daeon-page {
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .daeon-page:hover {
          transform: translateY(-2px);
          border-color: #10b981;
        }

        .daeon-page.active {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        @media (max-width: 1200px) {
          .daeon-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .daeon-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .daeon-card-title {
            font-size: 22px;
          }

          .daeon-card-title-sub {
            font-size: 18px;
          }
        }

        @media (max-width: 700px) {
          .daeon-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 500px) {
          .daeon-section {
            padding: 44px 18px;
          }

          .daeon-title {
            font-size: 30px;
          }

          .daeon-grid {
            grid-template-columns: 1fr;
          }

          .daeon-card {
            min-height: 320px;
          }

          .daeon-card-head {
            min-height: 170px;
            padding-top: 44px;
          }

          .daeon-card-title {
            font-size: 21px;
            max-width: 96%;
          }

          .daeon-card-title-sub {
            font-size: 17px;
          }

          .daeon-type {
            min-height: 58px;
            padding-left: 16px;
            font-size: 15px;
          }

          .daeon-type-icon {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          .daeon-search-input {
            height: 50px;
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  )
}