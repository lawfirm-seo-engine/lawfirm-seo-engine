"use client"

import { useEffect, useState, useCallback, use } from "react"
import Link from "next/link"

type CaseData = {
  slug:        string
  frontmatter: string
  body:        string
  memos:       string
  comments:    string
}

// ─── 메모 섹션 ────────────────────────────────────────────────────────────────

function MemoSection({ slug, initialMemos }: { slug: string; initialMemos: string }) {
  const [memos,   setMemos]   = useState(initialMemos)
  const [input,   setInput]   = useState("")
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState("")

  const lines = memos.trim().split("\n").filter(Boolean).reverse()

  async function addMemo() {
    if (!input.trim()) return
    setSaving(true)
    setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(slug)}/memo`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMemos(data.memos)
        setInput("")
        setMsg("✓ 메모 저장됨")
      } else {
        setMsg("✗ " + data.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-blue-900/40 bg-slate-900 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-blue-400">
        📝 운영자 메모
        <span className="rounded bg-blue-900/40 px-2 py-0.5 text-xs font-normal text-blue-300">
          {lines.length}개
        </span>
      </h3>

      {/* 기존 메모 */}
      {lines.length > 0 ? (
        <ul className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
          {lines.map((line, i) => (
            <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-slate-600">아직 메모가 없습니다.</p>
      )}

      {/* 새 메모 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addMemo()}
          placeholder="메모 내용 입력 후 Enter 또는 추가 버튼"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={addMemo}
          disabled={saving || !input.trim()}
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-40"
        >
          {saving ? "..." : "추가"}
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-xs ${msg.startsWith("✓") ? "text-blue-400" : "text-red-400"}`}>
          {msg}
        </p>
      )}
    </section>
  )
}

// ─── 댓글 섹션 ────────────────────────────────────────────────────────────────

function CommentSection({ slug, initialComments }: { slug: string; initialComments: string }) {
  const [comments, setComments] = useState(initialComments)
  const [author,   setAuthor]   = useState("")
  const [content,  setContent]  = useState("")
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState("")

  const lines = comments.trim().split("\n").filter(Boolean).reverse()

  async function addComment() {
    if (!content.trim()) return
    setSaving(true)
    setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(slug)}/comment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ author: author.trim() || "익명", content: content.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments)
        setContent("")
        setMsg("✓ 댓글 저장됨")
      } else {
        setMsg("✗ " + data.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-purple-900/40 bg-slate-900 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-purple-400">
        💬 관리자 댓글
        <span className="rounded bg-purple-900/40 px-2 py-0.5 text-xs font-normal text-purple-300">
          {lines.length}개
        </span>
      </h3>

      {/* 기존 댓글 */}
      {lines.length > 0 ? (
        <ul className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
          {lines.map((line, i) => (
            <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-slate-600">아직 댓글이 없습니다.</p>
      )}

      {/* 새 댓글 */}
      <div className="space-y-2">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="작성자명 (비워두면 '익명')"
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addComment()}
            placeholder="댓글 내용"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={addComment}
            disabled={saving || !content.trim()}
            className="rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-600 disabled:opacity-40"
          >
            {saving ? "..." : "추가"}
          </button>
        </div>
      </div>
      {msg && (
        <p className={`mt-2 text-xs ${msg.startsWith("✓") ? "text-purple-400" : "text-red-400"}`}>
          {msg}
        </p>
      )}
    </section>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function EditCasePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params)
  const decodedSlug = decodeURIComponent(slug)

  const [data,        setData]        = useState<CaseData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [frontmatter, setFrontmatter] = useState("")
  const [body,        setBody]        = useState("")
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState("")
  const [dirty,       setDirty]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${encodeURIComponent(decodedSlug)}`)
      if (!res.ok) { setData(null); return }
      const d: CaseData = await res.json()
      setData(d)
      setFrontmatter(d.frontmatter)
      setBody(d.body)
      setDirty(false)
    } finally {
      setLoading(false)
    }
  }, [decodedSlug])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    setSaveMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(decodedSlug)}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ frontmatter, body }),
      })
      const d = await res.json()
      if (res.ok) {
        setSaveMsg("✓ 저장 완료")
        setDirty(false)
      } else {
        setSaveMsg("✗ " + d.error)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">불러오는 중...</div>
    )
  }

  if (!data) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-400">파일을 찾을 수 없습니다: {decodedSlug}</p>
        <Link href="/admin/dashboard/cases" className="mt-4 inline-block text-sm text-slate-400 hover:text-white">
          ← 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/cases"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            ← 목록
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{decodedSlug}</h1>
            <a
              href={`/cases/${encodeURIComponent(decodedSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-500 hover:underline"
            >
              ↗ 페이지 보기
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
              {saveMsg}
            </span>
          )}
          {dirty && (
            <span className="text-xs text-amber-400">• 미저장 변경사항</span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {saving ? "저장 중..." : "💾 저장"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Frontmatter 편집 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-300">
              Frontmatter
              <span className="ml-2 font-normal text-slate-500 text-xs">
                (--- 구분자 사이의 YAML)
              </span>
            </h2>
          </div>
          <textarea
            value={frontmatter}
            onChange={(e) => { setFrontmatter(e.target.value); setDirty(true) }}
            rows={12}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </section>

        {/* 본문 편집 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-300">
              본문 (MDX)
            </h2>
            <span className="text-xs text-slate-500">
              {body.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); setDirty(true) }}
            rows={28}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </section>

        {/* 저장 버튼 (하단 고정) */}
        <div className="flex justify-end gap-3 pb-4">
          {saveMsg && (
            <span className={`self-center text-sm ${saveMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {saving ? "저장 중..." : "💾 저장"}
          </button>
        </div>

        {/* 메모 섹션 */}
        <MemoSection slug={decodedSlug} initialMemos={data.memos} />

        {/* 댓글 섹션 */}
        <CommentSection slug={decodedSlug} initialComments={data.comments} />
      </div>
    </div>
  )
}
