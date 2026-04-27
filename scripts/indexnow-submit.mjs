import fs from "fs"
import path from "path"
import crypto from "crypto"

const SITE_URL = "https://daeonlawfintech.com"
const HOST = "daeonlawfintech.com"
const MAX_URLS_PER_REQUEST = 10000

const CASES_DIR = path.join(
  process.cwd(),
  "content",
  "daeonlawfintech",
  "cases"
)

const PUBLIC_DIR = path.join(process.cwd(), "public")
const KEY_PATH = path.join(PUBLIC_DIR, "indexnow-key.txt")

function ensureIndexNowKey() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  if (!fs.existsSync(KEY_PATH)) {
    const key = crypto.randomBytes(16).toString("hex")
    fs.writeFileSync(KEY_PATH, key, "utf-8")
    console.log(`IndexNow key created: ${KEY_PATH}`)
    return key
  }

  return fs.readFileSync(KEY_PATH, "utf-8").trim()
}

function getCaseUrls() {
  if (!fs.existsSync(CASES_DIR)) {
    console.log("cases directory not found")
    return []
  }

  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      return `${SITE_URL}/cases/${encodeURIComponent(slug)}`
    })
}

function getUrlList() {
  const urls = [
    SITE_URL,
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/rss.xml`,
    ...getCaseUrls(),
  ]

  return Array.from(new Set(urls)).slice(0, MAX_URLS_PER_REQUEST)
}

async function submitIndexNow() {
  const key = ensureIndexNowKey()
  const urlList = getUrlList()

  if (urlList.length === 0) {
    console.log("No URLs to submit")
    return
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
    urlList,
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()

  console.log("IndexNow status:", response.status)
  console.log("Submitted URLs:", urlList.length)
  console.log(text || "IndexNow submitted successfully")

  if (!response.ok) {
    throw new Error(`IndexNow submit failed with status ${response.status}`)
  }
}

submitIndexNow().catch((error) => {
  console.error("IndexNow submit failed")
  console.error(error)
  process.exit(1)
})