import fs from "fs"
import path from "path"
import { getCaseCategoryForText } from "@/lib/caseCategories"

export type CaseItem = {
  slug: string
  caseName: string
  mtime: number
  publishedAt: string
  imagePath: string
  categoryId: string
}

export function readFrontmatterValue(source: string, key: string) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return match?.[1]?.trim() || ""
}

export function readCaseItems(contentKey = "daeonlawfintech"): CaseItem[] {
  const casesDirectory = path.join(process.cwd(), "content", contentKey, "cases")

  const filenames = fs.existsSync(casesDirectory)
    ? fs.readdirSync(casesDirectory)
    : []

  return filenames
    .filter((filename) => filename.endsWith(".mdx"))
    .filter((filename) => filename !== "_template.mdx")
    .filter((filename) => !filename.startsWith("_"))
    .map((filename) => {
      const filePath = path.join(casesDirectory, filename)
      const stat = fs.statSync(filePath)
      const slug = filename.replace(/\.mdx$/, "")
      const source = fs.readFileSync(filePath, "utf8")
      const caseName =
        readFrontmatterValue(source, "caseName") || slug.replace(/-/g, " ")

      // frontmatter에 categoryId가 명시된 경우 자동 판정을 덮어씀
      const forcedCategoryId = readFrontmatterValue(source, "categoryId")
      const categoryId = forcedCategoryId || getCaseCategoryForText(`${slug} ${caseName}`).id

      const publishedAt = readFrontmatterValue(source, "publishedAt") || ""

      return {
        slug,
        caseName,
        mtime: stat.mtime.getTime(),
        publishedAt,
        imagePath: `/images/cases/${slug}.png`,
        categoryId,
      }
    })
    // publishedAt 내림차순 (최신 생성순) — stat.mtime은 Vercel에서 git 커밋 시점으로 초기화되어 신뢰 불가
    .sort((a, b) => {
      if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt)
      if (a.publishedAt) return -1
      if (b.publishedAt) return 1
      return b.mtime - a.mtime
    })
}

export function groupCasesByCategory(cases: CaseItem[]) {
  return cases.reduce<Record<string, CaseItem[]>>((acc, item) => {
    acc[item.categoryId] ||= []
    acc[item.categoryId].push(item)
    return acc
  }, {})
}

// ─── 그룹 현황용 확장 타입 ───────────────────────────────────────────────────

export type GroupedCaseItem = {
  slug: string
  caseName: string
  categoryId: string
  caseGroupId: string
  groupRole: string   // "representative" | "variant" | ""
  groupOrder: number
  representativeSlug: string
  publishedAt: string
}

export function readGroupedCaseItems(contentKey = "daeonlawfintech"): GroupedCaseItem[] {
  const casesDirectory = path.join(process.cwd(), "content", contentKey, "cases")

  const filenames = fs.existsSync(casesDirectory)
    ? fs.readdirSync(casesDirectory)
    : []

  return filenames
    .filter((f) => f.endsWith(".mdx") && f !== "_template.mdx" && !f.startsWith("_"))
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "")
      const source = fs.readFileSync(path.join(casesDirectory, filename), "utf8")
      const caseName = readFrontmatterValue(source, "caseName") || slug.replace(/-/g, " ")
      const category = getCaseCategoryForText(`${slug} ${caseName}`)

      return {
        slug,
        caseName,
        categoryId: category.id,
        caseGroupId:        readFrontmatterValue(source, "caseGroupId"),
        groupRole:          readFrontmatterValue(source, "groupRole"),
        groupOrder:         parseInt(readFrontmatterValue(source, "groupOrder") || "0") || 0,
        representativeSlug: readFrontmatterValue(source, "representativeSlug"),
        publishedAt:        readFrontmatterValue(source, "publishedAt") || "",
      }
    })
}
