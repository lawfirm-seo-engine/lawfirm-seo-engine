const INDEXNOW_KEY = "70d025abd8f7442e967885397baf1fa4"
const SITE_URL = "https://daeonlawfintech.com"
const HOST = "daeonlawfintech.com"

export async function submitIndexNow(urlList: string[]) {
  try {
    if (!urlList.length) return

    const endpoint = "https://api.indexnow.org/indexnow"

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    })

    if (!response.ok) {
      throw new Error(`IndexNow submit failed: ${response.status}`)
    }

    return response
  } catch (error) {
    console.error("IndexNow submit failed:", error)
  }
}