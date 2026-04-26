import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
}

export default withMDX(nextConfig)