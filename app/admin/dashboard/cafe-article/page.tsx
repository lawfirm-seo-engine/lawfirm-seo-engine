"use client"

import { useEffect, useState, useCallback } from "react"
import { generateCafeArticle } from "@/lib/admin/cafeArticle"

type CaseRow = { slug: string; caseName: string; categoryId: string }

export default function CafeArticlePage() {
  const [cases,      setCases]      = useState<CaseRow[]>([])
  const [selected,   setSelected]   = useState("")
  const [article,    setArticle]    = useState("")
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [query,      setQuery]      = useState("")

  const loadCases = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCases() }, [loadCases])

  async function generate() {
    if (!selected) return
    setGenerating(true); setArticle("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(selected)}`)
      const data = await res.json()
      if (res.ok) {
        const text = generateCafeArticle({ slug: selected, frontmatter: data.frontmatter, body: data.body })
        setArticle(text)
      }
    } finally { setGenerating(false) }
  }

  function download() {
    if (!article) return
    const blob = new Blob([article], { type: "text/plain;charset=utf-8" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `카페원고_${selected}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filtered = cases.filter((c) =>
    !query || c.caseName.toLowerCase().includes(query.toLowerCase()) || c.slug.includes(query)
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">✍️ 카페 원고 생성</h1>
        <p className="mt-1 text-sm text-slate-400">케이스를 선택해 네이버 카페용 원고를 생성하고 TXT로 다운로드합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 케이스 선택 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">케이스 선택</h2>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="사건명 검색..."
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          {loading ? <p className="text-xs text-slate-500">로딩 중...</p> : (
            <ul className="max-h-[520px] overflow-y-auto space-y-1">
              {filtered.map((c) => (
                <li key={c.slug}>
                  <button onClick={() => { setSelected(c.slug); setArticle("") }}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      selected === c.slug ? "bg-teal-700 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}>
                    {c.caseName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 원고 미리보기 + 다운로드 */}
        <div className="flex flex-col rounded-2xl border border-teal-900/40 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-teal-400">
              {selected ? `원고 — ${selected}` : "케이스를 선택하세요"}
            </h2>
            {article && (
              <button onClick={download}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-500">
                ⬇ TXT 다운로드
              </button>
            )}
          </div>

          {selected && !article && (
            <button onClick={generate} disabled={generating}
              className="mb-4 rounded-xl bg-teal-700 py-3 text-sm font-black text-white hover:bg-teal-600 disabled:opacity-40">
              {generating ? "⏳ 생성 중..." : "✍️ 원고 생성"}
            </button>
          )}

          {article && (
            <>
              <pre className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-300" style={{ maxHeight: 480 }}>
                {article}
              </pre>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setArticle(""); generate() }}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs text-slate-400 hover:text-white">
                  🔄 재생성
                </button>
                <button onClick={download}
                  className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-black text-white hover:bg-teal-500">
                  ⬇ TXT 다운로드
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
