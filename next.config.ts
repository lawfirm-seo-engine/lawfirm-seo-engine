import createMDX from "@next/mdx"

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default withMDX(nextConfig)