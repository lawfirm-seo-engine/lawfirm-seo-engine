import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
      {
        userAgent: "Yeti",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
      },
    ],

    sitemap: "https://daeonlawfintech.com/sitemap.xml",
    host: "https://daeonlawfintech.com",

    // ⭐ 핵심 추가
    additionalSitemaps: [],

    // ⭐ Content-Signal 직접 삽입
    other: {
      "Content-Signal": "search=yes,ai-input=yes,ai-train=no",
    },
  }
}