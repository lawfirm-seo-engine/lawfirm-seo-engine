import fs from "fs"
import path from "path"
import Link from "next/link"
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
  const decodedSlug = decodeURIComponent(slug)
  const keyword = decodedSlug.toUpperCase()

  const pageUrl = `${site.baseUrl}/cases/${decodedSlug}`
  const imageUrl = `${site.baseUrl}/images/cases/${decodedSlug} 사기.png`

  return {
    title: `${keyword} 사기 사칭 피해회복 | ${site.siteName}`,

    description:
      `${keyword} 사기 사칭 피해 사례, 발생 경위, 대응 전략, 회수 절차를 정리한 법률 정보 페이지입니다.`,

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: pageUrl,
      languages: {
        "ko-KR": pageUrl,
      },
    },

    openGraph: {
      title: `${keyword} 사기 사칭 피해회복`,
      description: `${keyword} 사기 사칭 피해 대응 전략 안내`,
      url: pageUrl,
      siteName: site.siteName,
      locale: "ko_KR",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${keyword} 사기 사칭 피해 회복을 위한 법률 정보 이미지`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${keyword} 사기 사칭 피해회복`,
      description: `${keyword} 사기 사칭 피해 대응 전략 안내`,
      images: [imageUrl],
    },
  }
}

function getRecentCases(casesDir: string, currentSlug: string) {
  if (!fs.existsSync(casesDir)) return []

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => file !== `${currentSlug}.mdx`)
    .map((file) => {
      const filePath = path.join(casesDir, file)
      const stat = fs.statSync(filePath)
      const slug = file.replace(/\.mdx$/, "")

      return {
        slug,
        title: slug,
        mtime: stat.mtime.getTime(),
      }
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 3)
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const site = await getCurrentSite()
  const decodedSlug = decodeURIComponent(slug)
  const keyword = decodedSlug.toUpperCase()

  const casesDir = path.join(
    process.cwd(),
    "content",
    site.contentKey,
    "cases"
  )

  const filePath = path.join(casesDir, `${decodedSlug}.mdx`)

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const source = fs.readFileSync(filePath, "utf-8")

  const { content } = await compileMDX({
    source,
  })

  const recentCases = getRecentCases(casesDir, decodedSlug)

  const pageUrl = `${site.baseUrl}/cases/${decodedSlug}`
  const imageUrl = `${site.baseUrl}/images/cases/${decodedSlug} 사기.png`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: `${keyword} 사기 사칭 피해회복`,
        description:
          `${keyword} 사기 사칭 피해 사례, 발생 경위, 대응 전략, 회수 절차를 정리한 법률 정보 페이지입니다.`,
        inLanguage: "ko-KR",
        url: pageUrl,
        image: {
          "@type": "ImageObject",
          url: imageUrl,
          width: 1200,
          height: 630,
        },
        author: {
          "@type": "Organization",
          name: site.siteName,
          url: site.baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: site.siteName,
          url: site.baseUrl,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: site.baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "사기 피해 사례",
            item: `${site.baseUrl}/cases`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${keyword} 사기 사칭 피해회복`,
            item: pageUrl,
          },
        ],
      },
    ],
  }

  return (
    <main className="case-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="case-content">{content}</article>

      {recentCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">
            함께 확인해야 할 대표적인 최근 유사 사례
          </h2>

          <p className="related-cases-desc">
            {decodedSlug} 사기 사칭 피해와 같은 시기 유사한 구조의 사례들은 다음과 같습니다.
          </p>

          <ul className="related-cases-list">
            {recentCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link
                  href={`/cases/${item.slug}`}
                  className="related-cases-link"
                >
                  {item.title} 사기 사칭 피해회복
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}