import Link from "next/link"
import fs from "fs"
import path from "path"

export default function HomePage() {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  let cases: string[] = []

  if (fs.existsSync(casesDir)) {
    cases = fs
      .readdirSync(casesDir)
      .filter((file) => file.endsWith(".mdx"))
      .filter((file) => file !== "_template.mdx")
      .map((file) => file.replace(".mdx", ""))
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>법무법인 대온 핀테크센터 사건 목록</h1>

      <ul>
        {cases.map((slug) => (
          <li key={slug}>
            <Link href={`/cases/${slug}`}>
              {slug} 사기 사칭 피해 대응
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}