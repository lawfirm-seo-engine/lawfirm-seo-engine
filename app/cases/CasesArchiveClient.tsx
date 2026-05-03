"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

const CASES_PER_GROUP = 50

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
  shortTitle: string
  href: string
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

  const categoryBuckets = categories.map((category) => {
    const categoryCases = filteredCases.filter(
      (item) => item.categoryId === category.id
    )

    return {
      ...category,
      totalCases: categoryCases.length,
      cases: categoryCases.slice(0, CASES_PER_GROUP),
    }
  })

  const visibleBuckets = normalizedKeyword
    ? categoryBuckets.filter((category) => category.totalCases > 0)
    : categoryBuckets

  function handleReset() {
    setKeyword("")
  }

  return (
    <>
      <div className="mb-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="text-left">
          <p className="mb-3 text-sm font-bold text-emerald-700">
            DAEON FINTECH CENTER
          </p>

          <h1 className="break-keep text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            금융사기 피해 사례 유형별 목록
          </h1>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <label
              htmlFor="case-search"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              사건 검색
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="case-search"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="업체명, 도메인, 리딩방명, 사건 유형으로 검색"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              <button
                type="button"
                onClick={handleReset}
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                초기화
              </button>

              <p className="shrink-0 text-sm font-bold text-slate-500">
                {normalizedKeyword
                  ? `검색 결과 ${filteredCases.length}건`
                  : `전체 ${cases.length}건`}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-left lg:pt-3">
          <p className="max-w-3xl break-keep text-base leading-8 text-slate-600 md:text-lg">
            팀미션, 주식리딩방, 코인리딩방, 방송환전 등 주요 피해 유형을
            나누어 실제 사칭 사건을 확인할 수 있습니다.
          </p>

          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-xl font-black text-slate-950 md:text-2xl">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="break-keep hover:text-emerald-700"
              >
                [{category.title}]
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            총 {cases.length}건의 사건이 등록되어 있습니다.
          </p>
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
        <div className="space-y-10">
          {visibleBuckets.map((category, index) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-white">
                <div className="grid lg:grid-cols-[minmax(260px,0.34fr)_1fr]">
                  <div className="bg-emerald-700 px-6 py-6 text-white md:px-8">
                    <p className="text-sm font-black text-emerald-100">
                      GROUP {index + 1}
                    </p>
                    <h2 className="mt-2 break-keep text-3xl font-black">
                      {category.title}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
                    <p className="max-w-4xl break-keep text-base font-semibold leading-7 text-slate-700">
                      {category.description}
                    </p>

                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                        {category.cases.length}/{category.totalCases}건 표시
                      </span>
                      <a
                        href="#top"
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
                      >
                        상단으로
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-6 md:px-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {category.cases.map((item) => (
                    <CaseCard
                      key={item.slug}
                      item={item}
                    />
                  ))}
                </div>

                {category.totalCases > CASES_PER_GROUP && (
                  <p className="mt-5 text-center text-sm font-bold text-slate-500">
                    이 그룹은 최신 {CASES_PER_GROUP}건만 표시됩니다. 특정 사건은
                    상단 검색을 이용해 확인할 수 있습니다.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
