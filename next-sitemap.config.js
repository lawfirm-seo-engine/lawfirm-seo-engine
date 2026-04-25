const fs = require("fs")
const path = require("path")

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
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    additionalSitemaps: [
      "https://daeonlawfintech.com/sitemap.xml",
      "https://daeonlawfintech.com/rss.xml",
    ],
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

    return files.map((file) => {
      const slug = file.replace(/\.mdx$/, "")

      return {
        loc: `/cases/${slug}`,
        changefreq: "daily",
        priority: 0.7,
        lastmod: new Date().toISOString(),
      }
    })
  },
}