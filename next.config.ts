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
  {
    key: "Access-Control-Allow-Origin",
    value: "https://daeonlawfintech.com",
  },
]

const nextConfig: NextConfig = {
  trailingSlash: false,

  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  // 관리자 API Lambda 번들에 포함할 파일 목록
  // - 목록 API: content/ MDX 파일을 fs로 읽음
  // - 생성/대량생성 API: Sharp Pango 텍스트 렌더러용 폰트 + 템플릿 이미지
  // 관리자 API Lambda 번들에 포함할 파일 목록
  // - 목록/생성 API: content/ MDX + Sharp Pango 렌더러용 폰트 + 템플릿 이미지
  // - 대량생성 API: 동일하게 폰트 + 템플릿 이미지 필요
  outputFileTracingIncludes: {
    "/api/admin/cases": [
      "./content/daeonlawfintech/cases/**",
      "./public/fonts/**",
      "./public/images/templates/**",
    ],
    "/api/admin/cases/bulk": [
      "./public/fonts/**",
      "./public/images/templates/**",
    ],
  },

  // cases/[slug]는 generateStaticParams + dynamicParams=false로 완전 정적 생성됨.
  // 서버리스 함수는 런타임에 절대 호출되지 않으므로
  // 이미지(public/images)·MDX 콘텐츠·MDX 컴파일러를 번들에서 제외 → function_size_exceeded 해결.
  outputFileTracingExcludes: {
    "/cases/[slug]": [
      "public/images/**",
      "content/**",
      "node_modules/@mdx-js/**",
      "node_modules/next-mdx-remote/**",
      "node_modules/unified/**",
      "node_modules/remark-*/**",
      "node_modules/rehype-*/**",
      "node_modules/micromark/**",
      "node_modules/micromark-*/**",
      "node_modules/mdast-*/**",
      "node_modules/hast-*/**",
      "node_modules/vfile/**",
      "node_modules/vfile-*/**",
      "node_modules/acorn/**",
      "node_modules/acorn-*/**",
      "node_modules/estree-*/**",
      "node_modules/periscopic/**",
      "node_modules/astring/**",
    ],
  },

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
      {
        // 케이스 이미지: 교체 가능한 template 파일은 1일 캐시 + stale-while-revalidate
        source: "/images/cases/template-:name",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600, must-revalidate",
          },
        ],
      },
      {
        // 그 외 정적 이미지: 7일 캐시
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ]
  },

  // 사건명 기반 템플릿 이미지 URL → 실제 template 파일로 rewrite (파일 복사 없이 SEO 개선)
  // 예: /images/cases/코인-사기--02.jpg → /images/cases/template-02.jpg
  async rewrites() {
    return [
      { source: "/images/cases/:slug--02.jpg", destination: "/images/cases/template-02.jpg" },
      { source: "/images/cases/:slug--03.png", destination: "/images/cases/template-03.png" },
      { source: "/images/cases/:slug--04.jpg", destination: "/images/cases/template-04.jpg" },
      { source: "/images/cases/:slug--05.png", destination: "/images/cases/template-05.png" },
      { source: "/images/cases/:slug--06.jpg", destination: "/images/cases/template-06.jpg" },
      { source: "/images/cases/:slug--07.gif", destination: "/images/cases/template-07.gif" },
      { source: "/images/cases/:slug--08.png", destination: "/images/cases/template-08.png" },
    ]
  },

  async redirects() {
    return [
      {
        source: "/cases/여행사-사칭",
        destination: "/cases/여행사-사칭-사기",
        permanent: true,
      },
    ]
  },
}

export default withMDX(nextConfig)
