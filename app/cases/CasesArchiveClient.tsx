"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

type CaseItem = {
  slug: string
  caseName: string
  mtime: number
  imagePath: string
  categoryId: string
}

type CaseCategory = {
  id: string
  title: string
  description: string
  keywords: string[]
}

type CasesArchiveClientProps = {
  cases: CaseItem[]
  categories: CaseCategory[]
}

function CaseCard({ item }: { item: CaseItem }) {
  return (
    <Link
      href={`/cases/${encodeURIComponent(item.slug)}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
    >
      <div className="absolute left-0 top-0 z-20 h-1 w-full bg-emerald-600 opacity-0 transition group-hover:opacity-100" />

      <div
        className="relative flex min-h-[210px] items-center justify-center overflow-hidden rounded-t-2xl bg-slate-900 bg-cover bg-center px-5 py-10 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.48), rgba(15, 23, 42, 0.48)), url("${item.imagePath}")`,
        }}
      >
        <h2 className="break-keep text-2xl font-black leading-snug text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)] group-hover:text-emerald-100">
          {item.caseName}
        </h2>
      </div>

      <div className="p-5">
        <p className="text-center text-base font-black leading-7 text-red-500">
          본 사건은 업체명을
          <br />
          사칭한 사기입니다
        </p>

        <div className="mt-7 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-white transition group-hover:bg-emerald-700">
          <span className="text-base font-black">상세보기</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl font-black">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function CasesArchiveClient({
  cases,
  categories,
}: CasesArchiveClientProps) {
  const [keyword, setKeyword] = useState("")

  const normalizedKeyword = keyword.trim().toLowerCase()

  const filteredCases = useMemo(() => {
    if (!normalizedKeyword) return cases

    return cases.filter((item) => {
      const category = categories.find(
        (candidate) => candidate.id === item.categoryId
      )
      const searchTarget = [
        item.slug,
        item.caseName,
        category?.title,
        category?.description,
        ...(category?.keywords || []),
      ]
        .join(" ")
        .toLowerCase()

      return searchTarget.includes(normalizedKeyword)
    })
  }, [cases, categories, normalizedKeyword])

  const categoryBuckets = categories.map((category) => ({
    ...category,
    cases: filteredCases.filter((item) => item.categoryId === category.id),
  }))

  const visibleBuckets = normalizedKeyword
    ? categoryBuckets.filter((category) => category.cases.length > 0)
    : categoryBuckets

  function handleReset() {
    setKeyword("")
  }

  return (
    <>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <label
              htmlFor="case-search"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              사건 검색
            </label>
            <input
              id="case-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="업체명, 도메인, 리딩방명, 사건 유형으로 검색"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:pt-7">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
            >
              초기화
            </button>
            <p className="text-sm font-bold text-slate-500">
              {normalizedKeyword
                ? `검색 결과 ${filteredCases.length}건`
                : `전체 ${cases.length}건`}
            </p>
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-black text-slate-800">
            검색 결과가 없습니다.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            업체명, 도메인, 리딩방명 일부만 입력해 다시 검색해보세요.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryBuckets.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="break-keep text-xl font-black text-slate-950">
                    {category.title}
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                    {category.cases.length}
                  </span>
                </div>
                <p className="mt-3 break-keep text-sm leading-7 text-slate-600">
                  {category.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {category.keywords.map((keywordItem) => (
                    <span
                      key={keywordItem}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                    >
                      {keywordItem}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>

          <div className="space-y-16">
            {visibleBuckets.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="scroll-mt-24"
              >
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-700">
                      {category.cases.length} CASES
                    </p>
                    <h2 className="mt-2 break-keep text-3xl font-black text-slate-950">
                      {category.title}
                    </h2>
                    <p className="mt-3 break-keep text-base leading-7 text-slate-600">
                      {category.description}
                    </p>
                  </div>
                  <a
                    href="#top"
                    className="text-sm font-black text-slate-500 transition hover:text-emerald-700"
                  >
                    상단으로
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {category.cases.map((item) => (
                    <CaseCard
                      key={item.slug}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  )
}
