import fs from "fs"
import path from "path"
import CasesClient from "./cases/CasesClient"
import MainHeroSlider from "./components/MainHeroSlider"

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
      .filter((file) => !file.startsWith("_"))
      .map((file) => {
        const fullPath = path.join(casesDir, file)

        return {
          name: file.replace(/\.mdx$/, ""),
          time: fs.statSync(fullPath).mtime.getTime(),
        }
      })
      .sort((a, b) => b.time - a.time)
      .map((item) => item.name)
  }

  return (
    <>
      <MainHeroSlider />

      <CasesClient
        siteName="대온 법률사무소 핀테크센터"
        cases={cases}
      />
    </>
  )
}