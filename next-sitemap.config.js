const fs = require("fs")
const path = require("path")

// case-noindex 명령으로 noindex: true 설정된 페이지 → sitemap 제외
function isManualNoindex(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    return /^noindex:\s*true/m.test(raw)
  } catch {}
  return false
}

// MDX frontmatter에서 lastmod 파싱
// modifiedAt 우선 → publishedAt fallback (stat.mtime은 Vercel 빌드 시 2018년 등 git 타임스탬프로 초기화되므로 절대 사용 금지)
function getLastmod(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const modM = raw.match(/^modifiedAt:\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?/m)
    if (modM) return new Date(modM[1]).toISOString()
    const pubM = raw.match(/^publishedAt:\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?/m)
    if (pubM) return new Date(pubM[1]).toISOString()
  } catch {}
  return null
}

module.exports = {
  siteUrl: "https://daeonlawfintech.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: "daily",
  priority: 0.7,

  exclude: [
    "/cases/_template",
    "/cases",               // noindex — 개별 케이스와 키워드 경쟁 차단
    "/cases/teammission",   // noindex — 허브 페이지가 브랜드 키워드 흡수 방지
    "/cases/stock-room",    // noindex — 허브 페이지가 브랜드 키워드 흡수 방지
    "/cases/crypto-room",   // noindex — 허브 페이지가 브랜드 키워드 흡수 방지
    "/cases/broadcast-exchange", // noindex — 허브 페이지가 브랜드 키워드 흡수 방지
    "/server-sitemap.xml",
    "/api/*",
    "/admin/*",
    "/private/*",
    // 검색엔진 설정 파일·피드는 HTML 색인 대상이 아님
    "/robots.txt",
    "/rss.xml",
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/cases/_template",
          "/server-sitemap.xml",
        ],
      },
    ],
    transformRobotsTxt: async (_, robotsTxt) =>
      robotsTxt.replace(/\n# Host\nHost: https:\/\/daeonlawfintech\.com\n/g, ""),
  },

  additionalPaths: async () => {
    const casesPath = path.join(
      process.cwd(),
      "content",
      "daeonlawfintech",
      "cases"
    )

    if (!fs.existsSync(casesPath)) return []

    const files = fs
      .readdirSync(casesPath)
      .filter((file) => file.endsWith(".mdx"))
      .filter((file) => file !== "_template.mdx")
      .filter((file) => !file.startsWith("_"))
      .filter((file) => !isManualNoindex(path.join(casesPath, file)))

    const casePaths = files.map((file) => {
      const filePath = path.join(casesPath, file)
      const slug = file.replace(/\.mdx$/, "")
      // modifiedAt 우선 → publishedAt fallback → 빌드 시각 최후 fallback
      // stat.mtime은 Vercel 빌드 시 git 커밋 타임스탬프로 초기화되므로 절대 사용하지 않음
      const lastmod = getLastmod(filePath) ?? new Date().toISOString()

      return {
        loc: `/cases/${encodeURIComponent(slug)}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod,
      }
    })

    // /cases 목록 페이지: noindex 처리로 검색 노출 제외 → sitemap 제거
    // (개별 케이스 페이지가 사건명 키워드로 노출되도록 키워드 경쟁 차단)
    // casePaths.unshift({ loc: "/cases", ... }) — 의도적으로 제거

    // 허브 페이지 4개는 noindex 처리 → sitemap 제외
    // (허브 페이지가 브랜드 키워드를 흡수하여 개별 케이스 페이지와 키워드 경쟁 발생 방지)

    return casePaths
  },
}
