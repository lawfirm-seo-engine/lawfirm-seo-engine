const fs = require("fs")
const path = require("path")

const INDEXNOW_KEY = "70d025abd8f7442e967885397baf1fa4"
const SITE_URL = "https://daeonlawfintech.com"

async function main() {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  const urls = [SITE_URL]

  if (fs.existsSync(casesDir)) {
    const caseUrls = fs
      .readdirSync(casesDir)
      .filter((file) => file.endsWith(".mdx"))
      .filter((file) => file !== "_template.mdx")
      .filter((file) => !file.startsWith("_"))
      .map((file) => file.replace(/\.mdx$/, ""))
      .map((slug) => `${SITE_URL}/cases/${encodeURIComponent(slug)}`)

    urls.push(...caseUrls)
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      host: "daeonlawfintech.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  })

  if (!response.ok) {
    console.error("IndexNow submit failed:", response.status)
    process.exit(1)
  }

  console.log(`IndexNow submitted ${urls.length} URLs`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})