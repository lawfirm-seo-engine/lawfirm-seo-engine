import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import TypingHeading from "@/app/components/TypingHeading"

export const dynamic = "force-static"

const siteUrl = "https://daeonlawfintech.com"
const siteName = "대온 핀테크센터"
const authorName = "변호사명"

const scamTopicKeywords = [
  "팀미션 사기",
  "주식 어플 사기",
  "주식리딩방 사기",
  "어플 사기",
  "투자사기",
  "코인 사기",
  "리딩방 사기",
  "플랫폼 사칭 사기",
  "쇼핑몰 사칭 사기",
  "부업 사기",
  "해외선물 사기",
  "체험단 사기",
  "여행사 사칭 사기",
  "라이브방송 사기",
  "증권사 사칭 사기",
  "금 투자 사기",
]

export async function generateStaticParams() {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  )

  if (!fs.existsSync(casesDir)) return []

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
  const imageAvif = `${siteUrl}/images/cases/${decodedSlug}-사기.avif`
  const imagePng = `${siteUrl}/images/cases/${decodedSlug}-사기.png`
  const imageAlt = `${keyword} 사기 사칭 피해 회복을 위한 법률 정보 이미지`

  return {
    title: `${keyword} 사기 사칭 피해회복 | ${siteName}`,
    description: `${keyword} 사기 피해 사례 및 대응 전략 안내`,

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
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
          url: imageAvif,
          secureUrl: imageAvif,
          type: "image/avif",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
        {
          url: imagePng,
          secureUrl: imagePng,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${keyword} 사기 사칭 피해회복`,
      description: `${keyword} 사기 사칭 피해 대응 전략 안내`,
      images: [imagePng],
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
  const imageUrl = `${siteUrl}/images/cases/${decodedSlug}-사기.avif`
  const imageAlt = `${keyword} 사기 사칭 피해 회복을 위한 법률 정보 이미지`
  const imageCaption = `${keyword} 사기 사칭 피해 사례 및 대응 방법 안내`
  const imageDescription = `${keyword} 사기 사칭 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`

  const articleKeywords = [
    `${keyword} 사기`,
    `${keyword} 사칭`,
    `${keyword} 피해회복`,
    `${keyword} 피해 사례`,
    `${keyword} 대응 방법`,
    ...scamTopicKeywords,
  ]

  const articleAbout = articleKeywords.map((name) => ({
    "@type": "Thing",
    name,
  }))

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

      h2: ({ children }) => (
        <TypingHeading text={String(children)} level="h2" />
      ),

      h3: ({ children }) => (
        <TypingHeading text={String(children)} level="h3" />
      ),
    },
  })

  const recentCases = getRecentCases(casesDir, decodedSlug)

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": `${siteUrl}/#legalservice`,
    name: "대온 핀테크센터",
    legalName: "법무법인 대온",
    alternateName: [
      "법무법인 대온 핀테크센터",
      "대온 금융사기 대응센터"
    ],
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: `${siteUrl}/images/logo.png`,

    telephone: "+82-2-6952-3695",

    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressLocality: "서울",
    },

    priceRange: "$$$",

    description:
      "금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 대응 정보를 제공하는 법률 정보 사이트입니다.",
    areaServed: {
      "@type": "Country",
      name: "KR",
    },
    knowsAbout: [
      "금융사기 피해 대응",
      "투자사기 피해 회복",
      "리딩방 사기",
      "코인 사기",
      "플랫폼 사칭 사기",
      "계좌 추적",
      "가압류",
      "민형사 대응",
      ...scamTopicKeywords,
    ],
    sameAs: ["https://cafe.naver.com/daeonlawfintech"],
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "법무법인 대온 핀테크센터",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    inLanguage: "ko-KR",
  }

  const authorJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#author`,
    name: "법무법인 대온 핀테크센터",
    url: siteUrl,
    sameAs: ["https://cafe.naver.com/daeonlawfintech"],
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    headline: `${keyword} 사기 사칭 피해회복`,
    description: `${keyword} 사기 피해 사례 및 대응 전략 안내`,
    keywords: articleKeywords.join(", "),
    about: articleAbout,
    mentions: articleAbout,
    image: {
      "@type": "ImageObject",
      "@id": `${imageUrl}#image`,
      url: imageUrl,
      contentUrl: imageUrl,
      width: 1200,
      height: 630,
      caption: imageCaption,
      description: imageDescription,
      inLanguage: "ko-KR",
    },
    author: {
      "@id": `${siteUrl}/#author`,
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    datePublished: stat.birthtime.toISOString(),
    dateModified: stat.mtime.toISOString(),
    inLanguage: "ko-KR",
  }

  const imageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${imageUrl}#image`,
    url: imageUrl,
    contentUrl: imageUrl,
    width: 1200,
    height: 630,
    name: imageAlt,
    caption: imageCaption,
    description: imageDescription,
    representativeOfPage: true,
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "피해금 회복이 가능한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수 있으며 초기 대응 속도가 중요합니다.",
        },
      },
      {
        "@type": "Question",
        name: "경찰 신고만으로 해결되나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "경찰 신고는 중요하지만 실제 피해금 회복을 위해서는 민사 대응과 계좌 관련 절차가 함께 검토되어야 합니다.",
        },
      },
      {
        "@type": "Question",
        name: "대응은 언제 시작해야 하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 대응을 시작하는 것이 중요합니다.",
        },
      },
    ],
  }

  return (
    <main className="case-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .case-faq-box {
              max-width: 960px;
              margin: 72px auto 44px;
              padding: 38px 34px;
              border: 1px solid #d1d5db;
              border-radius: 22px;
              background: #ffffff;
              box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
            }

            .case-faq-title {
              margin: 0 0 28px;
              padding-bottom: 18px;
              border-bottom: 3px solid #111827;
              font-size: 34px;
              font-weight: 900;
              line-height: 1.35;
              letter-spacing: -0.04em;
              color: #111827;
            }

            .case-faq-item {
              margin: 0 0 14px;
              border: 1px solid #e5e7eb;
              border-radius: 15px;
              background: #ffffff;
              overflow: hidden;
            }

            .case-faq-item:last-child {
              margin-bottom: 0;
            }

            .case-faq-item summary {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 20px 22px;
              cursor: pointer;
              list-style: none;
              font-size: 19px;
              font-weight: 800;
              line-height: 1.45;
              color: #111827;
            }

            .case-faq-item summary::-webkit-details-marker {
              display: none;
            }

            .case-faq-item summary::after {
              content: "⌄";
              margin-left: auto;
              font-size: 24px;
              font-weight: 900;
              color: #111827;
              transition: transform 0.2s ease;
            }

            .case-faq-item[open] summary::after {
              transform: rotate(180deg);
            }

            .case-faq-number {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex: 0 0 30px;
              width: 30px;
              height: 30px;
              border-radius: 999px;
              background: #111827;
              color: #ffffff;
              font-size: 15px;
              font-weight: 900;
            }

            .case-faq-answer {
              margin: 0 20px 20px 64px;
              padding: 18px 20px;
              border: 1px solid #dbeafe;
              border-radius: 12px;
              background: #f8fbff;
              font-size: 16px;
              line-height: 1.85;
              color: #374151;
            }

            @media (max-width: 768px) {
              .case-faq-box {
                margin: 52px 16px 36px;
                padding: 26px 20px;
                border-radius: 18px;
              }

              .case-faq-title {
                font-size: 24px;
              }

              .case-faq-item summary {
                padding: 18px 16px;
                font-size: 17px;
              }

              .case-faq-answer {
                margin: 0 14px 16px;
                padding: 16px;
                font-size: 15px;
              }
            }
          `,
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(authorJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(imageJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="case-content">{content}</article>

      <section className="case-faq-box">
        <h2 className="case-faq-title">
          {keyword} 사기 피해 관련 자주 묻는 질문
        </h2>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">1</span>
            <span>피해금 회복이 가능한가요?</span>
          </summary>
          <div className="case-faq-answer">
            사기 피해는 계좌 추적과 민형사 대응을 통해 회복 가능성을 검토할 수
            있으며 초기 대응 속도가 중요합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">2</span>
            <span>경찰 신고만으로 해결되나요?</span>
          </summary>
          <div className="case-faq-answer">
            경찰 신고는 중요하지만 실제 피해금 회복을 위해서는 민사 대응과 계좌
            관련 절차가 함께 검토되어야 합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">3</span>
            <span>대응과 상담은 언제 시작해야 하나요?</span>
          </summary>
          <div className="case-faq-answer">
            사기 피해는 자금 이동 속도가 빠르기 때문에 피해 인지 직후 바로 상담과
            대응을 시작하는 것이 중요합니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">4</span>
            <span>후불제로 사건 진행을 하고 싶은데 가능한가요?</span>
          </summary>
          <div className="case-faq-answer">
            변호사 선임에서 후불은 불법이기에 후불이 가능하다는 곳은 변호사를
            사칭하는 곳이며, 변호사가 아닌 사람의 법률 서비스 제공 또한 불법이기에
            각종 전문가를 자칭하는 곳도 2차 사기 위험이 있으니 주의하시기
            바랍니다.
          </div>
        </details>

        <details className="case-faq-item">
          <summary>
            <span className="case-faq-number">5</span>
            <span>단체 소송으로 진행하는게 좋은가요?</span>
          </summary>
          <div className="case-faq-answer">
            단체 소송은 대표자 선정 과정과 같은 사건의 피해자를 모집하는 기간이
            길어져 의뢰인의 실익이 없기에 대온은 진행하지 않습니다.
          </div>
        </details>
      </section>

      {recentCases.length > 0 && (
        <section className="related-cases related-cases-box">
          <h2 className="related-cases-title">
            유사한 사기 유형 피해 사례 더 보기
          </h2>

          <ul className="related-cases-list">
            {recentCases.map((item) => (
              <li key={item.slug} className="related-cases-item">
                <Link
                  href={`/cases/${item.slug}`}
                  className="related-cases-link"
                >
                  {item.title.replace(/-/g, " ").replace(/사기$/, "")} 사기 피해
                  사례
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}