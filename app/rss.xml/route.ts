import fs from "fs"
import path from "path"

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

    items = files
      .map((file) => {
        const slug = file.replace(/\.mdx$/, "")

        return `
        <item>
          <title>${slug} 사기 피해 대응 정보</title>
          <link>${baseUrl}/cases/${slug}</link>
          <guid>${baseUrl}/cases/${slug}</guid>
          <pubDate>${new Date().toUTCString()}</pubDate>
        </item>`
      })
      .join("")
  }

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>대온 핀테크센터 사건 업데이트</title>
<link>${baseUrl}</link>
<description>금융사기 피해 대응 사건 업데이트 RSS</description>
${items}
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}