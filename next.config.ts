import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  output: "export",

  basePath: "/lawfirm-seo-engine",
  assetPrefix: "/lawfirm-seo-engine",

  trailingSlash: true,

  images: {
    unoptimized: true,
  },
}

export default withMDX(nextConfig)