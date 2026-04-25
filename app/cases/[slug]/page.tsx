import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import { getCurrentSite } from "@/lib/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const site = await getCurrentSite()
  const keyword = decodeURIComponent(slug).toUpperCase()

  return {
    title: `${keyword} 사기 피해 대응 방법 | ${site.siteName}`,
    description: `${keyword} 사기 피해 사례, 발생 경위, 대응 전략, 회수 절차를 정리한 법률 정보 페이지입니다.`,
    openGraph: {
      title: `${keyword} 사기 피해 대응 방법`,
      description: `${keyword} 사기 피해 대응 전략 안내`,
      url: `${site.baseUrl}/cases/${slug}`,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "article",
    },
  }
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const site = await getCurrentSite()
  const keyword = decodeURIComponent(slug).toUpperCase()

  const filePath = path.join(
    process.cwd(),
    "content",
    site.contentKey,
    "cases",
    `${slug}.mdx`
  )

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const source = fs.readFileSync(filePath, "utf-8")

  const { content } = await compileMDX({
    source,
  })

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 20px",
        lineHeight: "1.9",
        fontSize: "18px",
      }}
    >
      <section
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "40px",
        }}
      >
        <h2>대표이미지 SEO 설정</h2>

        <p><strong>이미지 alt</strong></p>
        <pre>{`${keyword} 사기 피해 회복을 위한 법률 정보 입니다.`}</pre>

        <p><strong>이미지 caption</strong></p>
        <pre>{`${keyword} 사기 피해 사례 및 대응 방법 안내`}</pre>

        <p><strong>이미지 description</strong></p>
        <pre>{`${keyword} 사기 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`}</pre>
      </section>

      <article>{content}</article>
    </main>
  )
}