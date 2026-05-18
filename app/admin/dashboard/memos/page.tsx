"use client"

import { useEffect, useState, useCallback } from "react"

type CaseRow = { slug: string; caseName: string; hasMemo: boolean }

export default function MemosPage() {
  const [cases,      setCases]      = useState<CaseRow[]>([])
  const [selected,   setSelected]   = useState("")
  const [memos,      setMemos]      = useState("")
  const [input,      setInput]      = useState("")
  const [loadingList,setLoadingList] = useState(true)
  const [loadingMemo,setLoadingMemo] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState("")
  const [query,      setQuery]      = useState("")

  // 케이스 목록 로드
  const loadCases = useCallback(async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadCases() }, [loadCases])

  // 케이스 선택 시 메모 로드
  useEffect(() => {
    if (!selected) { setMemos(""); return }
    setLoadingMemo(true)
    fetch(`/api/admin/cases/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => setMemos(d.memos ?? ""))
      .catch(() => setMemos(""))
      .finally(() => setLoadingMemo(false))
  }, [selected])

  async function addMemo() {
    if (!input.trim() || !selected) return
    setSaving(true); setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(selected)}/memo`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMemos(data.memos)
        setInput("")
        setMsg("✓ 메모 저장됨")
        setCases((prev) => prev.map((c) => c.slug === selected ? { ...c, hasMemo: true } : c))
      } else {
        setMsg("✗ " + data.error)
      }
    } finally { setSaving(false) }
  }

  const memoLines  = memos.trim().split("\n").filter(Boolean).reverse()
  const filteredCases = cases.filter((c) =>
    !query || c.caseName.toLowerCase().includes(query.toLowerCase()) || c.slug.includes(query)
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">📝 메모 관리</h1>
        <p className="mt-1 text-sm text-slate-400">케이스를 선택해 메모를 조회하거나 추가합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 케이스 선택 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">케이스 선택</h2>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="사건명 검색..."
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          {loadingList ? (
            <p className="text-xs text-slate-500">로딩 중...</p>
          ) : (
            <ul className="max-h-[480px] overflow-y-auto space-y-1">
              {filteredCases.map((c) => (
                <li key={c.slug}>
                  <button onClick={() => setSelected(c.slug)}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      selected === c.slug
                        ? "bg-blue-700 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}>
                    <span className="font-bold">{c.caseName}</span>
                    {c.hasMemo && <span className="ml-2 rounded bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-300">메모있음</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 메모 입력 + 목록 */}
        <div className="rounded-2xl border border-blue-900/40 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-black text-blue-400">
            {selected ? `메모 — ${selected}` : "케이스를 선택하세요"}
          </h2>

          {selected && (
            <>
              {loadingMemo ? (
                <p className="text-xs text-slate-500">불러오는 중...</p>
              ) : memoLines.length > 0 ? (
                <ul className="mb-4 max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
                  {memoLines.map((line, i) => (
                    <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-xs text-slate-600">메모가 없습니다.</p>
              )}

              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addMemo()}
                  placeholder="메모 내용 입력 후 Enter"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button onClick={addMemo} disabled={saving || !input.trim()}
                  className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-40">
                  {saving ? "..." : "추가"}
                </button>
              </div>
              {msg && <p className={`mt-2 text-xs ${msg.startsWith("✓") ? "text-blue-400" : "text-red-400"}`}>{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
