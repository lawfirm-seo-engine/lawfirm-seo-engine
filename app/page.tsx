import fs from "fs"
import path from "path"
import CasesClient from "./cases/CasesClient"

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

  return <CasesClient siteName="법무법인 대온 핀테크센터" cases={cases} />
}