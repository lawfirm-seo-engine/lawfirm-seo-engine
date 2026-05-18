"use client"

import { useEffect, useState, useCallback } from "react"

type CaseRow = { slug: string; caseName: string; hasComments: boolean }

export default function CommentsPage() {
  const [cases,         setCases]         = useState<CaseRow[]>([])
  const [selected,      setSelected]      = useState("")
  const [comments,      setComments]      = useState("")
  const [author,        setAuthor]        = useState("")
  const [content,       setContent]       = useState("")
  const [loadingList,   setLoadingList]   = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [msg,           setMsg]           = useState("")
  const [query,         setQuery]         = useState("")

  const loadCases = useCallback(async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadCases() }, [loadCases])

  useEffect(() => {
    if (!selected) { setComments(""); return }
    setLoadingComments(true)
    fetch(`/api/admin/cases/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? ""))
      .catch(() => setComments(""))
      .finally(() => setLoadingComments(false))
  }, [selected])

  async function addComment() {
    if (!content.trim() || !selected) return
    setSaving(true); setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(selected)}/comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ author: author.trim() || "익명", content: content.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments)
        setContent("")
        setMsg("✓ 댓글 저장됨")
        setCases((prev) => prev.map((c) => c.slug === selected ? { ...c, hasComments: true } : c))
      } else {
        setMsg("✗ " + data.error)
      }
    } finally { setSaving(false) }
  }

  const commentLines  = comments.trim().split("\n").filter(Boolean).reverse()
  const filteredCases = cases.filter((c) =>
    !query || c.caseName.toLowerCase().includes(query.toLowerCase()) || c.slug.includes(query)
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">💬 댓글 관리</h1>
        <p className="mt-1 text-sm text-slate-400">케이스를 선택해 댓글을 조회하거나 추가합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 케이스 선택 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">케이스 선택</h2>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="사건명 검색..."
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
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
                        ? "bg-purple-700 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}>
                    <span className="font-bold">{c.caseName}</span>
                    {c.hasComments && <span className="ml-2 rounded bg-purple-900/50 px-1.5 py-0.5 text-xs text-purple-300">댓글있음</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 댓글 입력 + 목록 */}
        <div className="rounded-2xl border border-purple-900/40 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-black text-purple-400">
            {selected ? `댓글 — ${selected}` : "케이스를 선택하세요"}
          </h2>

          {selected && (
            <>
              {loadingComments ? (
                <p className="text-xs text-slate-500">불러오는 중...</p>
              ) : commentLines.length > 0 ? (
                <ul className="mb-4 max-h-52 overflow-y-auto space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
                  {commentLines.map((line, i) => (
                    <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-xs text-slate-600">댓글이 없습니다.</p>
              )}

              <div className="space-y-2">
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                  placeholder="작성자명 (비워두면 '익명')"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input type="text" value={content} onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addComment()}
                    placeholder="댓글 내용"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button onClick={addComment} disabled={saving || !content.trim()}
                    className="rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-600 disabled:opacity-40">
                    {saving ? "..." : "추가"}
                  </button>
                </div>
              </div>
              {msg && <p className={`mt-2 text-xs ${msg.startsWith("✓") ? "text-purple-400" : "text-red-400"}`}>{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
