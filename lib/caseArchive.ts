import fs from "fs"
import path from "path"
import { getCaseCategoryForText } from "@/lib/caseCategories"

export type CaseItem = {
  slug: string
  caseName: string
  mtime: number
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
      const category = getCaseCategoryForText(`${slug} ${caseName}`)

      return {
        slug,
        caseName,
        mtime: stat.mtime.getTime(),
        imagePath: `/images/cases/${slug}.png`,
        categoryId: category.id,
      }
    })
    .sort((a, b) => b.mtime - a.mtime)
}

export function groupCasesByCategory(cases: CaseItem[]) {
  return cases.reduce<Record<string, CaseItem[]>>((acc, item) => {
    acc[item.categoryId] ||= []
    acc[item.categoryId].push(item)
    return acc
  }, {})
}
