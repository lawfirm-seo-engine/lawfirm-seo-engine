const fs = require("fs")
const path = require("path")

module.exports = {
  siteUrl: "https://daeonlawfintech.com",
  generateRobotsTxt: true,

  additionalPaths: async (config) => {
    const casesPath = path.join(
      process.cwd(),
      "content",
      "daeonlawfintech",
      "cases"
    )

    if (!fs.existsSync(casesPath)) return []

    const files = fs.readdirSync(casesPath)

    return files.map((file) => ({
      loc: `/cases/${file.replace(".mdx", "")}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: new Date().toISOString(),
    }))
  },
}