"use client"

import { useEffect, useState, useCallback } from "react"
import { generateCafeArticle } from "@/lib/admin/cafeArticle"

type CaseRow = { slug: string; caseName: string; categoryId: string }

const CATEGORY_LABEL: Record<string, string> = {
  teammission:        "팀미션",
  "stock-room":       "주식리딩방",
  "broadcast-exchange": "방송환전",
  "crypto-room":      "코인리딩방",
}

export default function BulkCafeArticlePage() {
  const [cases,      setCases]      = useState<CaseRow[]>([])
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [catFilter,  setCatFilter]  = useState("")
  const [query,      setQuery]      = useState("")
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [total,      setTotal]      = useState(0)
  const [done,       setDone]       = useState(false)

  const loadCases = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCases() }, [loadCases])

  const filtered = cases.filter((c) => {
    const matchQ = !query || c.caseName.toLowerCase().includes(query.toLowerCase()) || c.slug.includes(query)
    const matchC = !catFilter || c.categoryId === catFilter
    return matchQ && matchC
  })

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((c) => c.slug)))
    }
  }

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function generateAndDownload() {
    const slugs = [...selected]
    if (slugs.length === 0) return
    setGenerating(true); setProgress(0); setTotal(slugs.length); setDone(false)

    const articles: string[] = []

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      try {
        const res  = await fetch(`/api/admin/cases/${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (res.ok) {
          const text = generateCafeArticle({ slug, frontmatter: data.frontmatter, body: data.body })
          articles.push(text)
        }
      } catch {}
      setProgress(i + 1)
    }

    // 단일 TXT로 합치기 (구분선 포함)
    const divider = "\n\n" + "=".repeat(60) + "\n\n"
    const combined = articles.join(divider)

    const blob = new Blob([combined], { type: "text/plain;charset=utf-8" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `카페원고_대량_${new Date().toISOString().slice(0,10)}_${articles.length}건.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setGenerating(false); setDone(true)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">✍️ 대량 카페 원고 생성</h1>
        <p className="mt-1 text-sm text-slate-400">여러 케이스를 선택해 카페 원고를 일괄 생성하고 단일 TXT 파일로 다운로드합니다.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        {/* 필터 */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="사건명 검색..."
            className="w-64 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none">
            <option value="">전체 유형</option>
            {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <button onClick={toggleAll}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-white">
            {selected.size === filtered.length && filtered.length > 0 ? "전체 해제" : `전체 선택 (${filtered.length})`}
          </button>
        </div>

        {/* 선택 현황 */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            <span className="font-black text-teal-400">{selected.size}개</span> 선택됨
            {` / 전체 ${filtered.length}개`}
          </p>
          <button onClick={generateAndDownload}
            disabled={generating || selected.size === 0}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-black text-white hover:bg-teal-500 disabled:opacity-40">
            {generating
              ? `⏳ ${progress}/${total} 처리 중...`
              : `⬇ ${selected.size}건 원고 생성 및 다운로드`}
          </button>
        </div>

        {/* 진행 바 */}
        {generating && (
          <div className="mb-3 h-2 w-full rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-teal-500 transition-all"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </div>
        )}

        {done && (
          <div className="mb-3 rounded-xl bg-teal-950 px-4 py-3 text-sm text-teal-300">
            ✓ {progress}건 원고 생성 완료 — TXT 파일이 다운로드됐습니다.
          </div>
        )}

        {/* 케이스 체크리스트 */}
        {loading ? <p className="text-xs text-slate-500">로딩 중...</p> : (
          <ul className="max-h-[500px] overflow-y-auto divide-y divide-slate-800">
            {filtered.map((c) => (
              <li key={c.slug}>
                <label className="flex cursor-pointer items-center gap-3 px-2 py-2.5 hover:bg-slate-800/50">
                  <input type="checkbox" checked={selected.has(c.slug)} onChange={() => toggle(c.slug)}
                    className="h-4 w-4 rounded accent-teal-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{c.caseName}</p>
                    <p className="font-mono text-xs text-slate-500">{c.slug}</p>
                  </div>
                  {c.categoryId && (
                    <span className="ml-auto shrink-0 rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                      {CATEGORY_LABEL[c.categoryId] ?? c.categoryId}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
