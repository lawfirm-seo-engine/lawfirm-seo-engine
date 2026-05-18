"use client"

import { useEffect, useState, useCallback } from "react"

type RedirectRule = { source: string; destination: string }

export default function RedirectsPage() {
  const [rules,   setRules]   = useState<RedirectRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const [source,      setSource]      = useState("")
  const [destination, setDestination] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/redirects")
      const data = await res.json()
      setRules(data.redirects ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function addRedirect(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      const res = await fetch("/api/admin/redirects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ source: source.trim(), destination: destination.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "저장 실패" })
        return
      }
      setRules(data.redirects)
      setSource("")
      setDestination("")
      setMsg({ type: "ok", text: "추가 완료. 다음 배포 시 적용됩니다." })
    } catch (err) {
      setMsg({ type: "err", text: String(err) })
    } finally {
      setSaving(false)
    }
  }

  async function deleteRedirect(source: string) {
    if (!confirm(`삭제하시겠습니까?\n${source}`)) return
    setDeleting(source); setMsg(null)
    try {
      const res = await fetch("/api/admin/redirects", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ source }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: data.error ?? "삭제 실패" })
        return
      }
      setRules(data.redirects)
      setMsg({ type: "ok", text: "삭제 완료. 다음 배포 시 적용됩니다." })
    } catch (err) {
      setMsg({ type: "err", text: String(err) })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">🔀 301 리다이렉션 관리</h1>
        <p className="mt-1 text-sm text-slate-400">
          변경 사항은 GitHub에 커밋되며, <span className="text-emerald-400 font-semibold">다음 배포 후</span> 적용됩니다.
          저장 후 배포 페이지에서 재배포를 실행하세요.
        </p>
      </div>

      {/* 알림 */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold ${
          msg.type === "ok"
            ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
            : "bg-red-900/40 text-red-300 border border-red-700"
        }`}>
          {msg.text}
        </div>
      )}

      {/* 추가 폼 */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-300 uppercase tracking-widest">새 리다이렉션 추가</h2>
        <form onSubmit={addRedirect} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400">
                FROM (source)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="/old-path"
                required
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400">
                TO (destination)
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="/new-path 또는 https://..."
                required
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "➕ 추가"}
          </button>
        </form>
      </section>

      {/* 목록 */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-300 uppercase tracking-widest">
          등록된 리다이렉션 {!loading && <span className="text-emerald-400">({rules.length}개)</span>}
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">로딩 중...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 리다이렉션이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.source}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <code className="rounded bg-slate-800 px-2 py-0.5 text-red-400 font-mono text-xs">
                      {r.source}
                    </code>
                    <span className="text-slate-500">→</span>
                    <code className="rounded bg-slate-800 px-2 py-0.5 text-emerald-400 font-mono text-xs">
                      {r.destination}
                    </code>
                    <span className="rounded bg-blue-900/40 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800">
                      301
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteRedirect(r.source)}
                  disabled={deleting === r.source}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-red-900/40 hover:text-red-400 disabled:opacity-40"
                >
                  {deleting === r.source ? "..." : "삭제"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 고정 리다이렉션 안내 */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5">
        <h2 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
          코드 고정 리다이렉션 (next.config.ts)
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <code className="rounded bg-slate-800 px-2 py-0.5 text-red-400/70 font-mono text-xs">
            /cases/여행사-사칭
          </code>
          <span className="text-slate-600">→</span>
          <code className="rounded bg-slate-800 px-2 py-0.5 text-emerald-400/70 font-mono text-xs">
            /cases/여행사-사칭-사기
          </code>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">301</span>
        </div>
        <p className="mt-2 text-xs text-slate-600">위 리다이렉션은 코드에 직접 정의되어 있습니다.</p>
      </section>
    </div>
  )
}
