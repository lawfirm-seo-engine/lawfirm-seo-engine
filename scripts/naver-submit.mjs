import fs from "fs"
import path from "path"

const SITE_URL = "https://daeonlawfintech.com"

const NAVER_TOKEN = process.env.NAVER_SEARCHADVISOR_TOKEN

const CASES_DIR = path.join(
  process.cwd(),
  "content",
  "daeonlawfintech",
  "cases"
)

function getCaseUrls() {
  if (!fs.existsSync(CASES_DIR)) {
    console.log("cases directory not found")
    return []
  }

  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      return {
        url: `${SITE_URL}/cases/${encodeURIComponent(slug)}`,
        type: "update",
      }
    })
}

async function submitNaver() {
  if (!NAVER_TOKEN) {
    console.error("NAVER_SEARCHADVISOR_TOKEN 환경변수가 없습니다.")
    process.exit(1)
  }

  const payload = {
    urls: [
      { url: SITE_URL, type: "update" },
      { url: `${SITE_URL}/sitemap.xml`, type: "update" },
      { url: `${SITE_URL}/rss.xml`, type: "update" },
      ...getCaseUrls(),
    ],
  }

  const response = await fetch(
    "https://apis.naver.com/searchadvisor/crawl-request/submit.json",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NAVER_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  )

  const text = await response.text()

  console.log("Naver status:", response.status)
  console.log("Submitted URLs:", payload.urls.length)
  console.log(text)
}

submitNaver().catch((error) => {
  console.error("Naver submit failed")
  console.error(error)
  process.exit(1)
})