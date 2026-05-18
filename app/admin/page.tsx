"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router   = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)

  // 이미 로그인된 경우 대시보드로
  useEffect(() => {
    fetch("/api/admin/auth/login", { method: "HEAD" }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "로그인 실패")
      } else {
        router.push("/admin/dashboard/cases")
      }
    } catch {
      setError("서버 연결 오류")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold tracking-widest text-emerald-400">
            DAEON FINTECH CENTER
          </p>
          <h1 className="mt-2 text-2xl font-black text-white">관리자 로그인</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400" htmlFor="username">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="아이디 입력"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="비밀번호 입력"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  )
}
