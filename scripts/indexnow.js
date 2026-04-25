const fs = require("fs")
const path = require("path")

const SITE_URL = "https://daeonlawfintech.com"
const INDEXNOW_KEY = "daeonlawfintech-indexnow-2026"
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`

const casesPath = path.join(
  process.cwd(),
  "content",
  "daeonlawfintech",
  "cases"
)

async function submitIndexNow() {
  if (!fs.existsSync(casesPath)) {
    console.error("cases 폴더를 찾을 수 없습니다.")
    process.exit(1)
  }

  const urlList = fs
    .readdirSync(casesPath)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => !file.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "")
      return `${SITE_URL}/cases/${slug}`
    })

  if (urlList.length === 0) {
    console.log("제출할 URL이 없습니다.")
    return
  }

  const payload = {
    host: "daeonlawfintech.com",
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  })

  console.log("IndexNow 응답 상태:", response.status)

  if (!response.ok) {
    const text = await response.text()
    console.error("IndexNow 제출 실패:", text)
    process.exit(1)
  }

  console.log(`IndexNow 제출 완료: ${urlList.length}개 URL`)
}

submitIndexNow().catch((error) => {
  console.error("IndexNow 실행 오류:", error)
  process.exit(1)
})