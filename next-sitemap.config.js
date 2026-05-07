const fs = require("fs")
const path = require("path")

// MDX frontmatter에서 publishedAt 파싱 (Vercel 배포 시 mtime 초기화 방지)
function getPublishedAt(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const m = raw.match(/^publishedAt:\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})"?/m)
    if (m) return new Date(m[1]).toISOString()
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

    const casePaths = files.map((file) => {
      const filePath = path.join(casesPath, file)
      const stat = fs.statSync(filePath)
      const slug = file.replace(/\.mdx$/, "")
      // publishedAt 우선 → Vercel 재배포 시 mtime 초기화 방지
      const lastmod = getPublishedAt(filePath) || stat.mtime.toISOString()

      return {
        loc: `/cases/${encodeURIComponent(slug)}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod,
      }
    })

    // /cases 목록 페이지를 sitemap에 명시적으로 포함
    casePaths.unshift({
      loc: "/cases",
      changefreq: "daily",
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })

    casePaths.unshift(
      {
        loc: "/cases/teammission",
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/cases/stock-room",
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/cases/crypto-room",
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      },
      {
        loc: "/cases/broadcast-exchange",
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      }
    )

    return casePaths
  },
}
