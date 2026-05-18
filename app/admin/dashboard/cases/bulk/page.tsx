"use client"

import { useState } from "react"
import Link from "next/link"

const GROUP_OPTIONS = [
  { id: "",                   label: "— 그룹 없음 —" },
  { id: "teammission",        label: "팀미션 사기" },
  { id: "stock-room",         label: "주식리딩방 사기" },
  { id: "broadcast-exchange", label: "방송환전 사기" },
  { id: "crypto-room",        label: "코인리딩방 사기" },
]

type BulkResult = {
  caseName: string
  slug:     string
  ok:       boolean
  error?:   string
}

export default function BulkCreatePage() {
  const [text,      setText]      = useState("")
  const [groupId,   setGroupId]   = useState("")
  const [loading,   setLoading]   = useState(false)
  const [response,  setResponse]  = useState<{
    ok: boolean; total: number; succeeded: number; failed: number
    results: BulkResult[]; message: string; error?: string
  } | null>(null)

  // 입력된 사건명 파싱 (빈 줄 제거)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

  async function handleBulkCreate() {
    if (lines.length === 0) return
    setLoading(true)
    setResponse(null)
    try {
      const res  = await fetch("/api/admin/cases/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          cases: lines.map((caseName) => ({
            caseName,
            groupId: groupId || undefined,
          })),
        }),
      })
      const data = await res.json()
      setResponse(data)
    } catch {
      setResponse({ ok: false, total: lines.length, succeeded: 0, failed: lines.length, results: [], message: "", error: "서버 연결 오류" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/dashboard/cases"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
          ← 목록
        </Link>
        <h1 className="text-2xl font-black text-white">대량 사건 만들기</h1>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        {/* 그룹 ID */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-300">
            공통 그룹 ID <span className="text-slate-500 font-normal">(전체 적용, 선택)</span>
          </label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none">
            {GROUP_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>{id ? `${id}  —  ${label}` : label}</option>
            ))}
          </select>
        </div>

        {/* 사건명 목록 */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-300">
            사건명 목록
            <span className="ml-2 text-xs font-normal text-slate-500">한 줄에 하나씩 입력 (최대 50개)</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            placeholder={"코인리딩방 A 사칭 사기\n코인리딩방 B 사칭 사기\n주식리딩방 C 사칭 사기\n..."}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
          {lines.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              {lines.length}개 입력됨
              {lines.length > 50 && <span className="ml-2 text-red-400">최대 50개 초과 — 처음 50개만 생성됩니다</span>}
            </p>
          )}
        </div>

        {/* 미리보기 */}
        {lines.length > 0 && !response && (
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="mb-2 text-xs font-bold text-slate-400">슬러그 미리보기</p>
            <ul className="space-y-1 font-mono text-xs text-slate-500 max-h-40 overflow-y-auto">
              {lines.slice(0, 50).map((name, i) => {
                const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "")
                return (
                  <li key={i} className="flex gap-2">
                    <span className="text-slate-600 w-5 text-right shrink-0">{i + 1}.</span>
                    <span>{slug}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* 결과 */}
        {response && (
          <div className={`rounded-xl p-4 text-sm ${response.ok ? "bg-emerald-950 border border-emerald-900" : "bg-red-950 border border-red-900"}`}>
            {response.error ? (
              <p className="font-bold text-red-400">✗ {response.error}</p>
            ) : (
              <>
                <p className="font-bold text-emerald-300 mb-3">
                  {response.succeeded}/{response.total}건 생성 완료
                  {response.failed > 0 && <span className="ml-2 text-amber-400">({response.failed}건 실패)</span>}
                </p>
                <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                  {response.results.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className={r.ok ? "text-emerald-400" : "text-red-400"}>{r.ok ? "✓" : "✗"}</span>
                      <span className={r.ok ? "text-slate-300" : "text-slate-500"}>
                        {r.caseName}
                        {r.ok && <span className="ml-2 font-mono text-slate-500">{r.slug}</span>}
                        {!r.ok && r.error && <span className="ml-2 text-red-500">{r.error}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-400">{response.message}</p>
              </>
            )}
          </div>
        )}

        <button onClick={handleBulkCreate} disabled={loading || lines.length === 0}
          className="w-full rounded-xl bg-emerald-600 py-3.5 font-black text-white transition hover:bg-emerald-500 disabled:opacity-40">
          {loading
            ? `⏳ 생성 중... (${lines.length}건)`
            : `✏️ ${Math.min(lines.length, 50)}건 일괄 생성`}
        </button>

        <p className="text-center text-xs text-slate-500">
          전체 파일을 단일 GitHub 커밋으로 처리합니다 — Vercel 배포 1회만 발생합니다.
        </p>
      </div>
    </div>
  )
}
