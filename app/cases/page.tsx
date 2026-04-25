import fs from "fs"
import path from "path"
import Link from "next/link"
import { getCurrentSite } from "@/lib/site"

export default async function CasesPage() {
  const site = await getCurrentSite()

  const casesDirectory = path.join(
    process.cwd(),
    "content",
    site.contentKey,
    "cases"
  )

  const filenames = fs.existsSync(casesDirectory)
    ? fs.readdirSync(casesDirectory)
    : []

  const cases = filenames
    .filter((filename) => filename.endsWith(".mdx"))
    .map((filename) => filename.replace(".mdx", ""))

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 20px" }}>
      <h1>{site.siteName} 사건 목록</h1>

      <ul>
        {cases.map((slug) => (
          <li key={slug}>
            <Link href={`/cases/${slug}`}>
              {slug.toUpperCase()} 사기 피해 대응 방법
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}