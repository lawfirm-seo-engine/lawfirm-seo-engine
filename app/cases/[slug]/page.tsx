import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"

export const dynamic = "force-static"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 핀테크센터"

export async function generateStaticParams() {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  if (!fs.existsSync(casesDir)) {
    return []
  }

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
    }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const keyword = decodedSlug.toUpperCase()

  const pageUrl = `${siteUrl}/cases/${decodedSlug}`
  const imageUrl = `${siteUrl}/images/cases/${decodedSlug} 사기.png`

  return {
    title: `${keyword} 사기 사칭 피해회복 | ${siteName}`,
    description: `${keyword} 사기 사칭 피해 사례, 발생 경위, 대응 전략, 회수 절차를 정리한 법률 정보 페이지입니다.`,
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
      siteName,
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
    .filter((file) => !file.startsWith("_"))
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
    .slice(0, 6)
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const keyword = decodedSlug.toUpperCase()

  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  const filePath = path.join(casesDir, `${decodedSlug}.mdx`)

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const source = fs.readFileSync(filePath, "utf-8")
  const stat = fs.statSync(filePath)

  const pageUrl = `${siteUrl}/cases/${decodedSlug}`
  const imageUrl = `${siteUrl}/images/cases/${decodedSlug} 사기.png`
  const imageAlt = `${keyword} 사기 사칭 피해 회복을 위한 법률 정보 이미지`

  const { content } = await compileMDX({
    source,
    components: {
      img: (props) => (
        <img
          {...props}
          alt={
            typeof props.alt === "string" && props.alt.trim().length > 0
              ? props.alt
              : imageAlt
          }
        />
      ),
    },
  })

  const recentCases = getRecentCases(casesDir, decodedSlug)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    headline: `${keyword} 사기 사칭 피해회복`,
    description: `${keyword} 사기 사칭 피해 사례, 발생 경위, 대응 전략, 회수 절차를 정리한 법률 정보 페이지입니다.`,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo.png`,
      },
    },
    datePublished: stat.birthtime.toISOString(),
    dateModified: stat.mtime.toISOString(),
    inLanguage: "ko-KR",
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "진행 사건",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${keyword} 사기 사칭 피해회복`,
        item: pageUrl,
      },
    ],
  }

  return (
    <main className="case-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="case-content">{content}</article>

      {recentCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">
            함께 확인해야 할 대표적인 최근 유사 사례
          </h2>

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