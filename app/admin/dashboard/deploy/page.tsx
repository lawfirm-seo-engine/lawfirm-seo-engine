"use client"

import { useEffect, useState, useCallback } from "react"

type Commit = {
  sha:     string
  message: string
  date:    string
  author:  string
}

type Deployment = {
  uid:       string
  state:     string
  createdAt: number
  url:       string
}

const STATE_LABEL: Record<string, { label: string; color: string }> = {
  READY:     { label: "배포 완료", color: "text-emerald-400" },
  BUILDING:  { label: "빌드 중",   color: "text-amber-400" },
  DEPLOYING: { label: "배포 중",   color: "text-amber-400" },
  ERROR:     { label: "오류",       color: "text-red-400" },
  QUEUED:    { label: "대기 중",   color: "text-slate-400" },
  CANCELED:  { label: "취소됨",    color: "text-slate-500" },
}

export default function DeployPage() {
  const [commits,     setCommits]     = useState<Commit[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [hooking,     setHooking]     = useState(false)
  const [hookMsg,     setHookMsg]     = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/deploy")
      const data = await res.json()
      setCommits(data.commits     ?? [])
      setDeployments(data.deployments ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function forceRedeploy() {
    setHooking(true)
    setHookMsg("")
    try {
      const res  = await fetch("/api/admin/deploy", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setHookMsg("✓ " + data.message)
        setTimeout(load, 3000)
      } else {
        setHookMsg("✗ " + data.error)
      }
    } finally {
      setHooking(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">배포 현황</h1>
          <p className="mt-1 text-sm text-slate-400">
            관리자에서 저장할 때마다 GitHub에 자동 커밋됩니다. Vercel이 자동으로 재빌드합니다.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
        >
          🔄 새로고침
        </button>
      </div>

      {/* 안내 배너 */}
      <div className="mb-6 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-sm text-emerald-300">
        <p className="font-bold">✅ 자동 배포 방식</p>
        <p className="mt-1 text-xs text-emerald-400">
          케이스 생성/저장/메모/댓글 → GitHub 커밋 → Vercel 자동 재빌드 (2~5분 소요)
        </p>
      </div>

      {/* Vercel 배포 상태 */}
      {deployments.length > 0 && (
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-black text-slate-300">최근 Vercel 배포</h2>
          <div className="space-y-2">
            {deployments.map((d) => {
              const s = STATE_LABEL[d.state] ?? { label: d.state, color: "text-slate-400" }
              return (
                <div key={d.uid} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <div>
                    <span className={`text-sm font-bold ${s.color}`}>{s.label}</span>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {new Date(d.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <a
                    href={`https://${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:underline"
                  >
                    ↗ 보기
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 강제 재배포 (Deploy Hook) */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-2 text-sm font-black text-slate-300">강제 재배포</h2>
        <p className="mb-4 text-xs text-slate-500">
          VERCEL_DEPLOY_HOOK_URL 환경변수가 설정된 경우에만 동작합니다.
        </p>
        <button
          onClick={forceRedeploy}
          disabled={hooking}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white hover:bg-amber-500 disabled:opacity-40"
        >
          {hooking ? "⏳ 트리거 중..." : "🔁 강제 재배포"}
        </button>
        {hookMsg && (
          <p className={`mt-3 text-sm ${hookMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
            {hookMsg}
          </p>
        )}
      </section>

      {/* 최근 커밋 이력 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-black text-slate-300">최근 커밋 이력 (cases 폴더)</h2>
        {loading ? (
          <p className="text-xs text-slate-500">불러오는 중...</p>
        ) : commits.length === 0 ? (
          <p className="text-xs text-slate-500">커밋 이력이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {commits.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-200">{c.message}</p>
                  <span className="shrink-0 font-mono text-xs text-slate-500">{c.sha}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.author} · {new Date(c.date).toLocaleString("ko-KR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
