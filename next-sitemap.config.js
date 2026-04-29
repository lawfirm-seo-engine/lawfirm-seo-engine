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
    "/api/*",
    "/admin/*",
    "/private/*",
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
      const filePath = path.join(casesPath, file)
      const stat = fs.statSync(filePath)
      const slug = file.replace(/\.mdx$/, "")

      return {
        loc: `/cases/${slug}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod: stat.mtime.toISOString(),
      }
    })
  },
}