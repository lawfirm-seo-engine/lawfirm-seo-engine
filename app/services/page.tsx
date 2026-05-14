import type { Metadata } from "next"
import Link from "next/link"
import BreadcrumbJsonLd from "../components/BreadcrumbJsonLd"
import { caseCategories } from "@/lib/caseCategories"
import { readGroupedCaseItems, type GroupedCaseItem } from "@/lib/caseArchive"

const siteUrl = "https://daeonlawfintech.com"
const pageUrl = `${siteUrl}/services`

export const metadata: Metadata = {
  title: "유형별 그룹 현황 | 대온 핀테크센터",
  robots: { index: false, follow: false },
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: "피해금 회복이 가능한가요?",
    a: "사건 유형, 입금 시점, 계좌나 지갑주소 확보 여부에 따라 달라집니다. 계좌 추적, 지급정지, 가압류 등 가능한 절차를 먼저 검토합니다.",
  },
  {
    q: "후불제로 사건 진행을 하고 싶은데 가능한가요?",
    a: "사건의 자료, 상대방 특정 가능성, 회수 가능성 등을 검토한 뒤 진행 방식과 비용 구조를 안내합니다. 상담 단계에서 현재 보유 자료를 기준으로 확인합니다.",
  },
  {
    q: "경찰 신고만으로 해결되나요?",
    a: "경찰 신고는 필요하지만 피해금 회복까지 자동으로 이어지지는 않습니다. 민사 보전, 계좌 추적, 플랫폼 신고 등 별도 조치가 함께 검토되어야 합니다.",
  },
  {
    q: "대응과 상담은 언제 시작해야 하나요?",
    a: "사이트, 대화방, 계좌, 앱 화면은 빠르게 사라질 수 있으므로 입금 직후나 추가 입금 요구를 받은 시점에 바로 자료를 보존하고 상담을 시작하는 것이 좋습니다.",
  },
  {
    q: "단체 소송으로 진행하는게 좋은가요?",
    a: "피해 구조가 같고 입금 경로가 유사한 경우 단체 대응이 도움이 될 수 있습니다. 다만 개인별 입금 내역과 증거가 달라 개별 검토가 필요합니다.",
  },
]

// ─── 그룹 빌더 ───────────────────────────────────────────────────────────────

type CaseGroup = {
  groupId: string
  representative: GroupedCaseItem | null
  variants: GroupedCaseItem[]
}

function buildGroups(items: GroupedCaseItem[]): {
  grouped: CaseGroup[]
  standalone: GroupedCaseItem[]
} {
  const byGroupId = new Map<string, GroupedCaseItem[]>()
  const standalone: GroupedCaseItem[] = []

  for (const item of items) {
    if (!item.caseGroupId) {
      standalone.push(item)
      continue
    }
    const list = byGroupId.get(item.caseGroupId) ?? []
    list.push(item)
    byGroupId.set(item.caseGroupId, list)
  }

  const grouped: CaseGroup[] = []
  for (const [groupId, members] of byGroupId.entries()) {
    const representative =
      members.find((m) => m.groupRole === "representative") ??
      members.find((m) => !m.representativeSlug) ??
      members[0] ??
      null

    const variants = members
      .filter((m) => m !== representative)
      .sort((a, b) => (a.groupOrder || 999) - (b.groupOrder || 999))

    grouped.push({ groupId, representative, variants })
  }

  grouped.sort((a, b) =>
    (a.representative?.caseName ?? a.groupId).localeCompare(
      b.representative?.caseName ?? b.groupId,
      "ko"
    )
  )
  standalone.sort((a, b) => a.caseName.localeCompare(b.caseName, "ko"))

  return { grouped, standalone }
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

function CaseLink({ slug, caseName }: { slug: string; caseName: string }) {
  return (
    <Link
      href={`/cases/${encodeURIComponent(slug)}`}
      className="hover:text-emerald-700 hover:underline"
    >
      {caseName}
    </Link>
  )
}

function GroupBlock({ group }: { group: CaseGroup }) {
  const { groupId, representative, variants } = group
  const total = 1 + variants.length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
          {groupId}
        </span>
        <span className="text-xs text-slate-400">{total}개</span>
      </div>

      {representative && (
        <div className="flex items-start gap-2 text-sm font-bold text-slate-900">
          <span className="mt-0.5 shrink-0 text-emerald-600">★</span>
          <CaseLink slug={representative.slug} caseName={representative.caseName} />
        </div>
      )}

      {variants.map((v) => (
        <div key={v.slug} className="ml-4 mt-1.5 flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-0.5 shrink-0 text-slate-400">└ #{v.groupOrder || "?"}</span>
          <CaseLink slug={v.slug} caseName={v.caseName} />
        </div>
      ))}
    </div>
  )
}

function StandaloneBlock({ items }: { items: GroupedCaseItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-bold text-slate-400">
        독립 케이스 ({items.length}개)
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.slug} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-0.5 shrink-0 text-slate-300">○</span>
            <CaseLink slug={item.slug} caseName={item.caseName} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CategorySection({
  categoryId,
  title,
  items,
}: {
  categoryId: string
  title: string
  items: GroupedCaseItem[]
}) {
  const { grouped, standalone } = buildGroups(items)
  const total = items.length
  const groupCount = grouped.length
  const standaloneCount = standalone.length

  return (
    <section id={categoryId} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">
          전체 {total}개 · 그룹 {groupCount}개 · 독립 {standaloneCount}개
        </span>
      </div>
      <div className="space-y-3">
        {grouped.map((group) => (
          <GroupBlock key={group.groupId} group={group} />
        ))}
        <StandaloneBlock items={standalone} />
      </div>
    </section>
  )
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const all = readGroupedCaseItems()

  const byCategory = caseCategories.reduce<Record<string, GroupedCaseItem[]>>(
    (acc, cat) => {
      acc[cat.id] = all.filter((item) => item.categoryId === cat.id)
      return acc
    },
    {}
  )

  const totalGroups = caseCategories.reduce((sum, cat) => {
    const items = byCategory[cat.id] ?? []
    const ids = new Set(items.filter((i) => i.caseGroupId).map((i) => i.caseGroupId))
    return sum + ids.size
  }, 0)

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: siteUrl },
          { name: "주력분야", url: pageUrl },
        ]}
      />

      <main className="min-h-screen bg-[#f6f7fb] px-5 py-10">
        <div className="mx-auto max-w-4xl">

          {/* 헤더 */}
          <div className="mb-8">
            <p className="text-xs font-bold tracking-widest text-emerald-700">
              FINTECH LEGAL RESPONSE CENTER
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              유형별 그룹 현황
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              전체 {all.length}개 케이스 · 그룹 {totalGroups}개
            </p>

            {/* 카테고리 앵커 탭 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {caseCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                >
                  {cat.shortTitle} ({byCategory[cat.id]?.length ?? 0})
                </a>
              ))}
            </div>
          </div>

          {/* 유형별 그룹 현황 */}
          <div className="space-y-12">
            {caseCategories.map((cat) => (
              <CategorySection
                key={cat.id}
                categoryId={cat.id}
                title={cat.title}
                items={byCategory[cat.id] ?? []}
              />
            ))}
          </div>

          {/* FAQ */}
          <section className="mt-16">
            <h2 className="border-b-4 border-slate-950 pb-4 text-2xl font-black text-slate-950">
              자주 묻는 질문
            </h2>
            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-lg font-black text-slate-950">Q. {item.q}</p>
                  <p className="mt-2 break-keep text-sm leading-7 text-slate-600">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 하단 연락처 */}
          <section className="mt-12 rounded-3xl bg-emerald-700 px-7 py-8 text-center text-white">
            <p className="text-sm font-black text-emerald-100">DAEON FINTECH CENTER</p>
            <p className="mt-2 text-2xl font-black">대온 법률사무소 · 02-6952-3695</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="tel:0269523695"
                className="inline-flex h-12 items-center rounded-xl bg-white px-6 text-sm font-black text-emerald-800"
              >
                전화 상담
              </Link>
              <Link
                href="http://pf.kakao.com/_xcypmn/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-xl border-2 border-white px-6 text-sm font-black text-white"
              >
                카카오톡 상담
              </Link>
            </div>
            <p className="mt-4 text-sm text-emerald-100">24시간 긴급 상담 대응</p>
          </section>

        </div>
      </main>
    </>
  )
}
