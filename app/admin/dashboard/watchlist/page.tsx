"use client"

import { useState } from "react"

type WatchlistItem = {
  korName:    string
  engName:    string
  siteName:   string
  type:       string
  siteUrl:    string
  ridingbang: string
}

const EMPTY_ITEM = (): WatchlistItem => ({
  korName: "", engName: "", siteName: "",
  type: "사칭 사기", siteUrl: "", ridingbang: "",
})

const SCAM_TYPES = [
  "사칭 사기", "쇼핑몰 사칭", "리딩방 사기", "코인 사기",
  "해외선물 사기", "방송 환전 사기", "로맨스스캠", "공모주 사기",
]

export default function WatchlistPage() {
  const [listName, setListName] = useState("")
  const [items,    setItems]    = useState<WatchlistItem[]>([EMPTY_ITEM()])
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<{
    ok: boolean; slug?: string; imageCommitted?: boolean; error?: string
  } | null>(null)

  function updateItem(i: number, field: keyof WatchlistItem, value: string) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
  }

  function addItem() {
    setItems((prev) => [...prev, EMPTY_ITEM()])
  }

  function removeItem(i: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const previewSlug = listName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!listName.trim()) return

    setLoading(true); setResult(null)
    try {
      const res  = await fetch("/api/admin/watchlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listName: listName.trim(), items }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ ok: false, error: "서버 연결 오류" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">👁️ 감시 목록 MDX 생성</h1>
        <p className="mt-1 text-sm text-slate-400">
          신규 사기 의심 업체 목록을 입력하면 MDX·키워드·OG 이미지를 자동 생성해 GitHub에 커밋합니다.
        </p>
      </div>

      {result && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
          result.ok
            ? "border-emerald-700 bg-emerald-900/40 text-emerald-300"
            : "border-red-700 bg-red-900/40 text-red-300"
        }`}>
          {result.ok ? (
            <>
              ✅ 생성 완료!{" "}
              <a
                href={`/cases/${result.slug}`}
                target="_blank"
                className="underline hover:text-white"
              >
                /cases/{result.slug}
              </a>
              {!result.imageCommitted && (
                <span className="ml-2 text-yellow-400">⚠ 이미지 생성 실패 (MDX는 정상 커밋됨)</span>
              )}
            </>
          ) : (
            `❌ ${result.error}`
          )}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        {/* 리스트명 */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
          <label className="mb-1.5 block text-sm font-bold text-slate-300">
            감시 목록 이름 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="신규 사기 의심 업체 리스트-5월15일"
            required
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          {previewSlug && (
            <p className="mt-1.5 text-xs text-slate-500">
              슬러그: <code className="text-emerald-500">/cases/{previewSlug}</code>
            </p>
          )}
        </div>

        {/* 업체 항목 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              업체 목록 ({items.length}개)
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              + 업체 추가
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">업체 {i + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs text-slate-600 hover:text-red-400"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">한글 상호명</label>
                  <input
                    type="text"
                    value={item.korName}
                    onChange={(e) => updateItem(i, "korName", e.target.value)}
                    placeholder="예: 대온마켓"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">영문 상호명</label>
                  <input
                    type="text"
                    value={item.engName}
                    onChange={(e) => updateItem(i, "engName", e.target.value)}
                    placeholder="예: DaeonMarket"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">사이트명</label>
                  <input
                    type="text"
                    value={item.siteName}
                    onChange={(e) => updateItem(i, "siteName", e.target.value)}
                    placeholder="예: daeonmarket"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">사기 유형</label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(i, "type", e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {SCAM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">사이트 주소 (도메인)</label>
                  <input
                    type="text"
                    value={item.siteUrl}
                    onChange={(e) => updateItem(i, "siteUrl", e.target.value)}
                    placeholder="예: daeonmarket.com"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">리딩방 명칭</label>
                  <input
                    type="text"
                    value={item.ridingbang}
                    onChange={(e) => updateItem(i, "ridingbang", e.target.value)}
                    placeholder="예: 대온 전문가방"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !listName.trim()}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "생성 중..." : `👁️ 감시 목록 MDX 생성 (${items.length}개 업체)`}
        </button>
      </form>
    </div>
  )
}
