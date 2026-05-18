"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewCasePage() {
  const router = useRouter()

  const [caseName,           setCaseName]           = useState("")
  const [groupId,            setGroupId]            = useState("")
  const [groupIdCustom,      setGroupIdCustom]      = useState("")
  const [representativeSlug, setRepresentativeSlug] = useState("")
  const [loading,            setLoading]            = useState(false)
  const [result,             setResult]             = useState<{
    ok: boolean; slug?: string; error?: string; detail?: string; imageCommitted?: boolean
  } | null>(null)
  const [existingGroupIds,   setExistingGroupIds]   = useState<string[]>([])

  // 기존 케이스에서 groupId 목록 로드
  useEffect(() => {
    fetch("/api/admin/cases")
      .then((r) => r.json())
      .then((data) => {
        const ids = [
          ...new Set(
            (data.cases ?? [])
              .map((c: { groupId?: string }) => c.groupId)
              .filter((id: string | undefined): id is string => Boolean(id))
          ),
        ] as string[]
        setExistingGroupIds(ids.sort())
      })
      .catch(() => {})
  }, [])

  // 실제로 사용할 groupId 값
  const resolvedGroupId = groupId === "__custom__" ? groupIdCustom : groupId

  // 슬러그 미리보기
  const previewSlug = caseName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")

  async function handleCreate() {
    if (!caseName.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch("/api/admin/cases", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          caseName:           caseName.trim(),
          groupId:            resolvedGroupId.trim() || undefined,
          representativeSlug: representativeSlug.trim() || undefined,
        }),
      })
      const data = await res.json()
      setResult(data)
      if (res.ok && data.slug) {
        setTimeout(() => {
          router.push(`/admin/dashboard/cases/${encodeURIComponent(data.slug)}`)
        }, 2000)
      }
    } catch {
      setResult({ ok: false, error: "서버 연결 오류" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/dashboard/cases"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          ← 목록
        </Link>
        <h1 className="text-2xl font-black text-white">새 사건 만들기</h1>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-5">
          {/* 사건명 */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-300">
              사건명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="예: 코인리딩방 B 사칭 사기"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {previewSlug && (
              <p className="mt-1.5 font-mono text-xs text-slate-500">슬러그: {previewSlug}</p>
            )}
          </div>

          {/* 그룹 ID — 기존 목록에서 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-300">
              그룹 ID <span className="text-slate-500 font-normal">(선택)</span>
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">— 그룹 없음 —</option>
              {existingGroupIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
              <option value="__custom__">✏️ 직접 입력...</option>
            </select>

            {groupId === "__custom__" && (
              <input
                type="text"
                value={groupIdCustom}
                onChange={(e) => setGroupIdCustom(e.target.value)}
                placeholder="새 그룹 ID 입력 (예: coinleading-b)"
                className="mt-2 w-full rounded-xl border border-emerald-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            )}
          </div>

          {/* 대표 슬러그 (선택) */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-300">
              대표 케이스 슬러그 <span className="text-slate-500 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={representativeSlug}
              onChange={(e) => setRepresentativeSlug(e.target.value)}
              placeholder="예: 코인리딩방-b-사칭-사기"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 결과 메시지 */}
        {result && (
          <div className={`mt-5 rounded-xl p-4 text-sm ${result.ok ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-400"}`}>
            {result.ok ? (
              <>
                <p className="font-bold">✓ 생성 완료: {result.slug}</p>
                <p className="mt-1 text-xs opacity-75">
                  {result.imageCommitted ? "📸 이미지 포함 GitHub 커밋 완료." : "⚠️ MDX만 커밋됨 (이미지 생성 실패)."}
                  {" "}Vercel이 자동 재배포를 시작합니다. 편집 페이지로 이동 중...
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">✗ {result.error}</p>
                {result.detail && (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-black/30 p-3 font-mono text-xs">
                    {result.detail}
                  </pre>
                )}
              </>
            )}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !caseName.trim()}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 font-black text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {loading ? "⏳ 생성 중... (최대 30초)" : "✏️ MDX 생성 & GitHub 커밋"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          MDX 생성 + 이미지 생성 후 GitHub에 단일 커밋합니다. Vercel이 자동으로 재배포됩니다.
        </p>
      </div>
    </div>
  )
}
