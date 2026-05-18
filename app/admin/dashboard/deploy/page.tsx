"use client"

import { useEffect, useState, useCallback } from "react"

type Step = {
  step:   string
  stdout: string
  stderr: string
  ok:     boolean
}

export default function DeployPage() {
  const [gitStatus,  setGitStatus]  = useState("")
  const [gitLog,     setGitLog]     = useState("")
  const [statusLoading, setStatusLoading] = useState(true)
  const [message,    setMessage]    = useState("")
  const [deploying,  setDeploying]  = useState(false)
  const [steps,      setSteps]      = useState<Step[]>([])
  const [result,     setResult]     = useState<{ ok: boolean; skipped?: boolean } | null>(null)

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const res  = await fetch("/api/admin/deploy")
      const data = await res.json()
      setGitStatus(data.status || "(변경사항 없음)")
      setGitLog(data.log || "")
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // 기본 커밋 메시지
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    setMessage(`content: ${today} 케이스 업데이트`)
  }, [])

  async function deploy() {
    if (!message.trim()) return
    setDeploying(true)
    setSteps([])
    setResult(null)
    try {
      const res  = await fetch("/api/admin/deploy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()
      setSteps(data.steps ?? [])
      setResult({ ok: data.ok, skipped: data.skipped })
      if (data.ok) {
        await loadStatus()
      }
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">배포</h1>
        <p className="mt-1 text-sm text-slate-400">
          cases 폴더의 변경사항을 git commit → push → Vercel 자동 배포
        </p>
      </div>

      {/* Git 상태 */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-300">변경사항 (git status)</h2>
          <button
            onClick={loadStatus}
            disabled={statusLoading}
            className="text-xs text-slate-500 hover:text-white"
          >
            🔄 새로고침
          </button>
        </div>
        {statusLoading ? (
          <p className="text-xs text-slate-500">불러오는 중...</p>
        ) : (
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
            {gitStatus || "(변경사항 없음)"}
          </pre>
        )}
      </section>

      {/* 커밋 메시지 + 배포 */}
      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-black text-slate-300">커밋 & 배포</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-400">커밋 메시지</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={deploy}
            disabled={deploying || !message.trim()}
            className="w-full rounded-xl bg-emerald-600 py-3.5 font-black text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {deploying ? "⏳ 배포 중..." : "🚀 git add → commit → push"}
          </button>
          <p className="text-center text-xs text-slate-600">
            content/daeonlawfintech/cases/ 폴더만 add됩니다
          </p>
        </div>
      </section>

      {/* 배포 결과 */}
      {steps.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-black text-slate-300">실행 결과</h2>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 ${s.ok ? "border border-slate-800 bg-slate-950" : "border border-red-900/40 bg-red-950/20"}`}>
                <div className="flex items-center gap-2">
                  <span className={s.ok ? "text-emerald-400" : "text-red-400"}>
                    {s.ok ? "✓" : "✗"}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300">{s.step}</span>
                </div>
                {s.stdout && (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-slate-400">
                    {s.stdout}
                  </pre>
                )}
                {s.stderr && (
                  <pre className={`mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs ${s.ok ? "text-slate-500" : "text-red-400"}`}>
                    {s.stderr}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {result && (
            <div className={`mt-4 rounded-xl p-4 text-center font-black ${result.ok ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-400"}`}>
              {result.ok
                ? result.skipped
                  ? "ℹ️ 변경사항이 없어 커밋을 생략했습니다."
                  : "🎉 배포 완료! Vercel이 자동으로 빌드를 시작합니다."
                : "❌ 배포 실패. 위 오류를 확인하세요."}
            </div>
          )}
        </section>
      )}

      {/* 최근 커밋 이력 */}
      {gitLog && (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">최근 커밋 이력</h2>
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
            {gitLog}
          </pre>
        </section>
      )}
    </div>
  )
}
