"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

type CaseRow = {
  slug:        string
  caseName:    string
  publishedAt: string
  modifiedAt:  string
  categoryId:  string
  noindex:     boolean
  hasMemo:     boolean
  hasComments: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  "teammission":        "팀미션",
  "stock-room":         "주식리딩방",
  "broadcast-exchange": "방송환전",
  "crypto-room":        "코인리딩방",
}

export default function CasesListPage() {
  const [cases,   setCases]   = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState("")
  const [cat,     setCat]     = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = cases.filter((c) => {
    const matchQ = !query ||
      c.caseName.toLowerCase().includes(query.toLowerCase()) ||
      c.slug.toLowerCase().includes(query.toLowerCase())
    const matchC = !cat || c.categoryId === cat
    return matchQ && matchC
  })

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">케이스 목록</h1>
          <p className="mt-1 text-sm text-slate-400">
            전체 {cases.length}개
            {filtered.length !== cases.length && ` · 필터 ${filtered.length}개`}
          </p>
        </div>
        <Link
          href="/admin/dashboard/cases/new"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-500"
        >
          + 새 사건 만들기
        </Link>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="사건명 또는 슬러그 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-72 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">전체 유형</option>
          {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
        >
          🔄 새로고침
        </button>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          {query || cat ? "검색 결과가 없습니다." : "케이스가 없습니다."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="px-4 py-3 text-left font-bold text-slate-400">사건명</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">유형</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">발행일</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">수정일</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">상태</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">URL</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {filtered.map((c) => (
                <tr key={c.slug} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/dashboard/cases/${encodeURIComponent(c.slug)}`}
                      className="font-bold text-white hover:text-emerald-400"
                    >
                      {c.caseName}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {CATEGORY_LABEL[c.categoryId] ?? c.categoryId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.publishedAt || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.modifiedAt || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.noindex && (
                        <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] text-red-400">
                          noindex
                        </span>
                      )}
                      {c.hasMemo && (
                        <span className="rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] text-blue-400">
                          메모
                        </span>
                      )}
                      {c.hasComments && (
                        <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[10px] text-purple-400">
                          댓글
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/cases/${encodeURIComponent(c.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-500 hover:underline"
                    >
                      ↗ 페이지
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/dashboard/cases/${encodeURIComponent(c.slug)}`}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-emerald-600 hover:text-emerald-400"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
