"use client"

import { useEffect, useState, useCallback } from "react"

type CaseRow = { slug: string; caseName: string }

// frontmatter 문자열에서 특정 키 읽기
function readFmKey(fm: string, key: string): string {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return m?.[1]?.trim() ?? ""
}

// frontmatter 문자열에서 특정 키 값 교체 (없으면 맨 끝에 추가)
function setFmKey(fm: string, key: string, value: string): string {
  const quoted = `"${value.replace(/"/g, '\\"')}"`
  const pattern = new RegExp(`^(${key}:\\s*).*$`, "m")
  if (pattern.test(fm)) {
    return fm.replace(pattern, `$1${quoted}`)
  }
  return fm.trimEnd() + `\n${key}: ${quoted}`
}

export default function KeywordsPage() {
  const [cases,     setCases]     = useState<CaseRow[]>([])
  const [selected,  setSelected]  = useState("")
  const [fm,        setFm]        = useState("")          // 원본 frontmatter
  const [primary,   setPrimary]   = useState("")
  const [aliases,   setAliases]   = useState("")
  const [titleVal,  setTitleVal]  = useState("")
  const [descVal,   setDescVal]   = useState("")
  const [loading,   setLoading]   = useState(true)
  const [loadingFm, setLoadingFm] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState("")
  const [query,     setQuery]     = useState("")
  const [dirty,     setDirty]     = useState(false)

  const loadCases = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/cases")
      const data = await res.json()
      setCases(data.cases ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCases() }, [loadCases])

  // 케이스 선택 시 frontmatter 로드
  useEffect(() => {
    if (!selected) { setFm(""); setPrimary(""); setAliases(""); setTitleVal(""); setDescVal(""); return }
    setLoadingFm(true); setMsg("")
    fetch(`/api/admin/cases/${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => {
        const rawFm = d.frontmatter ?? ""
        setFm(rawFm)
        setPrimary(readFmKey(rawFm, "primaryKeyword"))
        setAliases(readFmKey(rawFm, "aliases"))
        setTitleVal(readFmKey(rawFm, "title"))
        setDescVal(readFmKey(rawFm, "description"))
        setDirty(false)
      })
      .catch(() => {})
      .finally(() => setLoadingFm(false))
  }, [selected])

  async function save() {
    if (!selected || !fm) return
    setSaving(true); setMsg("")
    try {
      // frontmatter 키 업데이트
      let newFm = fm
      if (primary.trim())  newFm = setFmKey(newFm, "primaryKeyword", primary.trim())
      if (aliases.trim())  newFm = setFmKey(newFm, "aliases",        aliases.trim())
      if (titleVal.trim()) newFm = setFmKey(newFm, "title",          titleVal.trim())
      if (descVal.trim())  newFm = setFmKey(newFm, "description",    descVal.trim())

      // body 가져오기 (저장에 필요)
      const res0 = await fetch(`/api/admin/cases/${encodeURIComponent(selected)}`)
      const cur  = await res0.json()

      const res = await fetch(`/api/admin/cases/${encodeURIComponent(selected)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ frontmatter: newFm, body: cur.body }),
      })
      const data = await res.json()
      if (res.ok) { setFm(newFm); setDirty(false); setMsg("✓ 키워드 저장 완료") }
      else          setMsg("✗ " + data.error)
    } finally { setSaving(false) }
  }

  const filtered = cases.filter((c) =>
    !query || c.caseName.toLowerCase().includes(query.toLowerCase()) || c.slug.includes(query)
  )

  function mark() { setDirty(true); setMsg("") }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">🔑 키워드 관리</h1>
        <p className="mt-1 text-sm text-slate-400">케이스의 SEO 키워드를 조회하고 수정합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 케이스 선택 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-black text-slate-300">케이스 선택</h2>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="사건명 검색..."
            className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
          />
          {loading ? <p className="text-xs text-slate-500">로딩 중...</p> : (
            <ul className="max-h-[520px] overflow-y-auto space-y-1">
              {filtered.map((c) => (
                <li key={c.slug}>
                  <button onClick={() => setSelected(c.slug)}
                    className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${
                      selected === c.slug ? "bg-yellow-700 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}>
                    {c.caseName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 키워드 편집 */}
        <div className="rounded-2xl border border-yellow-900/40 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-black text-yellow-400">
            {selected ? `키워드 — ${selected}` : "케이스를 선택하세요"}
          </h2>

          {selected && (
            <>
              {loadingFm ? (
                <p className="text-xs text-slate-500">불러오는 중...</p>
              ) : (
                <div className="space-y-4">
                  {/* primaryKeyword */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-400">
                      primaryKeyword <span className="font-normal text-slate-500">(대표 SEO 키워드)</span>
                    </label>
                    <input type="text" value={primary} onChange={(e) => { setPrimary(e.target.value); mark() }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  {/* aliases */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-400">
                      aliases <span className="font-normal text-slate-500">(쉼표로 구분)</span>
                    </label>
                    <input type="text" value={aliases} onChange={(e) => { setAliases(e.target.value); mark() }}
                      placeholder="키워드1, 키워드2, 키워드3"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  {/* title */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-400">
                      title <span className="font-normal text-slate-500">(페이지 타이틀)</span>
                    </label>
                    <input type="text" value={titleVal} onChange={(e) => { setTitleVal(e.target.value); mark() }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-600">{titleVal.length}/60자</p>
                  </div>

                  {/* description */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-400">
                      description <span className="font-normal text-slate-500">(메타 설명)</span>
                    </label>
                    <textarea value={descVal} onChange={(e) => { setDescVal(e.target.value); mark() }}
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                    <p className={`mt-1 text-xs ${descVal.length > 160 ? "text-red-400" : "text-slate-600"}`}>
                      {descVal.length}/160자
                    </p>
                  </div>

                  {/* 현재 원본 frontmatter 미리보기 */}
                  <details className="rounded-xl border border-slate-800">
                    <summary className="cursor-pointer px-3 py-2 text-xs text-slate-500 hover:text-slate-300">
                      전체 Frontmatter 보기
                    </summary>
                    <pre className="overflow-x-auto whitespace-pre-wrap p-3 font-mono text-xs text-slate-400">
                      {fm}
                    </pre>
                  </details>

                  <div className="flex items-center gap-3 pt-1">
                    {dirty && <span className="text-xs text-amber-400">• 미저장 변경사항</span>}
                    {msg && <span className={`text-xs ${msg.startsWith("✓") ? "text-yellow-400" : "text-red-400"}`}>{msg}</span>}
                    <button onClick={save} disabled={saving || !dirty}
                      className="ml-auto rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-black text-white hover:bg-yellow-500 disabled:opacity-40">
                      {saving ? "저장 중..." : "💾 저장"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
