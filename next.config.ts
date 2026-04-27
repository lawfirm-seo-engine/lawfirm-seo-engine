import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const isDev = process.env.NODE_ENV === "development"

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://www.googletagmanager.com https://www.google-analytics.com https://logs.ai.kr; ` +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://stats.g.doubleclick.net https://vitals.vercel-insights.com https://logs.ai.kr; " +
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'self'; " +
      "upgrade-insecure-requests;",
  },
]

const nextConfig: NextConfig = {
  trailingSlash: false,

  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    contentDispositionType: "inline",
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default withMDX(nextConfig)