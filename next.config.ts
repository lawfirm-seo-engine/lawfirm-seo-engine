import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  trailingSlash: false,

  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    contentDispositionType: "inline",
    dangerouslyAllowSVG: false,
  },
}

export default withMDX(nextConfig)
