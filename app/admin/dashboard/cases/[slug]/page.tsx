"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type CaseData = {
  slug:        string
  frontmatter: string
  body:        string
  memos:       string
  comments:    string
}

// ─── 간이 마크다운 → HTML 변환 (미리보기용) ──────────────────────────────────

function simpleMarkdown(md: string): string {
  const lines  = md.split("\n")
  const output: string[] = []
  let inPara = false

  const flush = () => { if (inPara) { output.push("</p>"); inPara = false } }
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/`(.+?)`/g,       "<code class='bg-slate-800 px-1 rounded text-emerald-300 font-mono text-xs'>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' class='text-emerald-400 underline' target='_blank'>$1</a>")

  for (const raw of lines) {
    const line = raw.trimEnd()

    // JSX 컴포넌트 (<Component .../> 또는 <Component>...</Component>) 는 회색 박스로 표시
    if (/^<[A-Z][A-Za-z]*[\s/>]/.test(line.trim())) {
      flush()
      output.push(`<div class='my-2 rounded border border-slate-700 bg-slate-800/50 px-3 py-1.5 font-mono text-xs text-slate-500'>${line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>`)
      continue
    }

    if (line === "") { flush(); continue }

    const h6 = line.match(/^######\s+(.+)/)
    const h5 = line.match(/^#####\s+(.+)/)
    const h4 = line.match(/^####\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    const li = line.match(/^[-*]\s+(.+)/)
    const hr = line.match(/^---+$/)

    if (h6) { flush(); output.push(`<h6 class='mt-3 mb-1 text-xs font-bold text-slate-400'>${inline(h6[1])}</h6>`); continue }
    if (h5) { flush(); output.push(`<h5 class='mt-3 mb-1 text-sm font-bold text-slate-300'>${inline(h5[1])}</h5>`); continue }
    if (h4) { flush(); output.push(`<h4 class='mt-4 mb-1 text-base font-bold text-slate-200'>${inline(h4[1])}</h4>`); continue }
    if (h3) { flush(); output.push(`<h3 class='mt-5 mb-2 text-lg font-bold text-slate-100'>${inline(h3[1])}</h3>`); continue }
    if (h2) { flush(); output.push(`<h2 class='mt-6 mb-2 border-b border-slate-700 pb-1 text-xl font-black text-white'>${inline(h2[1])}</h2>`); continue }
    if (h1) { flush(); output.push(`<h1 class='mt-6 mb-3 text-2xl font-black text-white'>${inline(h1[1])}</h1>`); continue }
    if (li) { flush(); output.push(`<div class='flex gap-2 my-0.5 text-sm text-slate-300'><span class='mt-0.5 text-slate-500'>•</span><span>${inline(li[1])}</span></div>`); continue }
    if (hr) { flush(); output.push(`<hr class='my-4 border-slate-700' />`); continue }

    if (!inPara) { output.push("<p class='my-2 text-sm leading-relaxed text-slate-300'>"); inPara = true }
    output.push(inline(line) + " ")
  }
  flush()
  return output.join("")
}

// ─── 메모 섹션 ────────────────────────────────────────────────────────────────

function MemoSection({ slug, initialMemos }: { slug: string; initialMemos: string }) {
  const [memos,  setMemos]  = useState(initialMemos)
  const [input,  setInput]  = useState("")
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState("")

  const lines = memos.trim().split("\n").filter(Boolean).reverse()

  async function addMemo() {
    if (!input.trim()) return
    setSaving(true); setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(slug)}/memo`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (res.ok) { setMemos(data.memos); setInput(""); setMsg("✓ 메모 저장됨") }
      else          setMsg("✗ " + data.error)
    } finally { setSaving(false) }
  }

  return (
    <section className="rounded-2xl border border-blue-900/40 bg-slate-900 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-blue-400">
        📝 운영자 메모
        <span className="rounded bg-blue-900/40 px-2 py-0.5 text-xs font-normal text-blue-300">{lines.length}개</span>
      </h3>
      {lines.length > 0 ? (
        <ul className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
          {lines.map((line, i) => (
            <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">{line}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-slate-600">아직 메모가 없습니다.</p>
      )}
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addMemo()}
          placeholder="메모 내용 입력 후 Enter 또는 추가 버튼"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button onClick={addMemo} disabled={saving || !input.trim()}
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-40">
          {saving ? "..." : "추가"}
        </button>
      </div>
      {msg && <p className={`mt-2 text-xs ${msg.startsWith("✓") ? "text-blue-400" : "text-red-400"}`}>{msg}</p>}
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
    setSaving(true); setMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(slug)}/comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ author: author.trim() || "익명", content: content.trim() }),
      })
      const data = await res.json()
      if (res.ok) { setComments(data.comments); setContent(""); setMsg("✓ 댓글 저장됨") }
      else          setMsg("✗ " + data.error)
    } finally { setSaving(false) }
  }

  return (
    <section className="rounded-2xl border border-purple-900/40 bg-slate-900 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-purple-400">
        💬 관리자 댓글
        <span className="rounded bg-purple-900/40 px-2 py-0.5 text-xs font-normal text-purple-300">{lines.length}개</span>
      </h3>
      {lines.length > 0 ? (
        <ul className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
          {lines.map((line, i) => (
            <li key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">{line}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-slate-600">아직 댓글이 없습니다.</p>
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
    </section>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function EditCasePage(props: { params: Promise<{ slug: string }> }) {
  const { slug }     = use(props.params)
  const decodedSlug  = decodeURIComponent(slug)
  const router       = useRouter()

  const [data,        setData]        = useState<CaseData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [frontmatter, setFrontmatter] = useState("")
  const [body,        setBody]        = useState("")
  const [saving,      setSaving]      = useState(false)
  const [saveMsg,     setSaveMsg]     = useState("")
  const [dirty,       setDirty]       = useState(false)
  const [bodyTab,     setBodyTab]     = useState<"edit" | "preview">("edit")
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cases/${encodeURIComponent(decodedSlug)}`)
      if (!res.ok) { setData(null); return }
      const d: CaseData = await res.json()
      setData(d); setFrontmatter(d.frontmatter); setBody(d.body); setDirty(false)
    } finally { setLoading(false) }
  }, [decodedSlug])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true); setSaveMsg("")
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(decodedSlug)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ frontmatter, body }),
      })
      const d = await res.json()
      if (res.ok) { setSaveMsg("✓ 저장 완료"); setDirty(false) }
      else          setSaveMsg("✗ " + d.error)
    } finally { setSaving(false) }
  }

  async function deleteCase() {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/admin/cases/${encodeURIComponent(decodedSlug)}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        router.push("/admin/dashboard/cases")
      } else {
        alert("삭제 실패: " + data.error)
        setConfirmDel(false)
      }
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="py-24 text-center text-slate-500">불러오는 중...</div>

  if (!data) return (
    <div className="py-24 text-center">
      <p className="text-red-400">파일을 찾을 수 없습니다: {decodedSlug}</p>
      <Link href="/admin/dashboard/cases" className="mt-4 inline-block text-sm text-slate-400 hover:text-white">← 목록으로</Link>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl">

      {/* 삭제 확인 모달 */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-lg font-black text-red-400">케이스 삭제</h2>
            <p className="mb-1 text-sm text-slate-300">
              <strong className="text-white">{decodedSlug}</strong> 를 삭제합니다.
            </p>
            <p className="mb-5 text-xs text-slate-500">MDX, 메모, 댓글 파일이 모두 GitHub에서 삭제됩니다. 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(false)} disabled={deleting}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-300 hover:text-white disabled:opacity-40">
                취소
              </button>
              <button onClick={deleteCase} disabled={deleting}
                className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-40">
                {deleting ? "삭제 중..." : "삭제 확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/cases"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
            ← 목록
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{decodedSlug}</h1>
            <a href={`/cases/${encodeURIComponent(decodedSlug)}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-emerald-500 hover:underline">
              ↗ 페이지 보기
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{saveMsg}</span>
          )}
          {dirty && <span className="text-xs text-amber-400">• 미저장 변경사항</span>}
          <button onClick={() => setConfirmDel(true)}
            className="rounded-xl border border-red-800 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-950">
            🗑 삭제
          </button>
          <button onClick={save} disabled={saving || !dirty}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-40">
            {saving ? "저장 중..." : "💾 저장"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Frontmatter 편집 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">
            Frontmatter
            <span className="ml-2 text-xs font-normal text-slate-500">(--- 구분자 사이의 YAML)</span>
          </h2>
          <textarea value={frontmatter} onChange={(e) => { setFrontmatter(e.target.value); setDirty(true) }}
            rows={12} spellCheck={false}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </section>

        {/* 본문 편집 + 미리보기 */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            {/* 탭 */}
            <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1">
              <button onClick={() => setBodyTab("edit")}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${bodyTab === "edit" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                ✏️ 편집
              </button>
              <button onClick={() => setBodyTab("preview")}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${bodyTab === "preview" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                👁 미리보기
              </button>
            </div>
            <span className="text-xs text-slate-500">{body.length.toLocaleString()} chars</span>
          </div>

          {bodyTab === "edit" ? (
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setDirty(true) }}
              rows={32} spellCheck={false}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          ) : (
            <div
              className="min-h-[400px] w-full overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-6"
              dangerouslySetInnerHTML={{ __html: simpleMarkdown(body) }}
            />
          )}
        </section>

        {/* 저장 버튼 (하단) */}
        <div className="flex justify-end gap-3 pb-4">
          {saveMsg && (
            <span className={`self-center text-sm ${saveMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{saveMsg}</span>
          )}
          <button onClick={save} disabled={saving || !dirty}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-40">
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
