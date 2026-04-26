import fs from "fs"
import path from "path"

export const dynamic = "force-static"
export const revalidate = false

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const baseUrl = "https://daeonlawfintech.com"

  const casesPath = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  let items = ""

  if (fs.existsSync(casesPath)) {
    const files = fs
      .readdirSync(casesPath)
      .filter((file) => file.endsWith(".mdx"))
      .filter((file) => file !== "_template.mdx")
      .filter((file) => !file.startsWith("_"))
      .map((file) => {
        const filePath = path.join(casesPath, file)
        const stat = fs.statSync(filePath)
        const slug = file.replace(/\.mdx$/, "")

        return {
          slug,
          mtime: stat.mtime,
        }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 50)

    items = files
      .map(({ slug, mtime }) => {
        const keyword = slug.toUpperCase()
        const url = `${baseUrl}/cases/${slug}`
        const title = `${keyword} 사기 피해 대응 정보`
        const description = `${keyword} 사기 피해 사례와 대응 방법을 정리한 법률 정보입니다.`

        return `
        <item>
          <title>${escapeXml(title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${mtime.toUTCString()}</pubDate>
        </item>`
      })
      .join("")
  }

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>${escapeXml("대온 핀테크센터 사건 업데이트")}</title>
<link>${escapeXml(baseUrl)}</link>
<description>${escapeXml("금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 사건 업데이트 RSS")}</description>
<language>ko-KR</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}