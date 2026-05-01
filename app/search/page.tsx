import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";

const siteUrl = "https://daeonlawfintech.com";
const siteName = "대온 핀테크센터";

export const metadata: Metadata = {
  title: `사건 검색 | ${siteName}`,
  description:
    "대온 핀테크센터 사건 검색 페이지입니다. 금융사기, 투자사기, 리딩방 사기, 코인 사기 피해 사례를 검색할 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/search`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

type CaseItem = {
  slug: string;
  title: string;
  href: string;
  mtime: number;
};

function readFrontmatterValue(source: string, key: string) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"));
  return match?.[1]?.trim() || "";
}

function getCases(): CaseItem[] {
  const casesDir = path.join(
    process.cwd(),
    "content",
    "daeonlawfintech",
    "cases"
  );

  if (!fs.existsSync(casesDir)) return [];

  return fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .map((file) => {
      const filePath = path.join(casesDir, file);
      const stat = fs.statSync(filePath);
      const slug = file.replace(/\.mdx$/, "");
      const source = fs.readFileSync(filePath, "utf8");
      const title = readFrontmatterValue(source, "caseName") || slug.replace(/-/g, " ");

      return {
        slug,
        title,
        href: `/cases/${slug}`,
        mtime: stat.mtime.getTime(),
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const cases = getCases();

  const filteredCases =
    query.length > 0
      ? cases.filter((item) => {
          const target = `${item.slug} ${item.title}`.toLowerCase();
          return target.includes(query.toLowerCase());
        })
      : cases.slice(0, 30);

  const searchJsonLd = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "@id": `${siteUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    url: `${siteUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    name: query
      ? `${query} 검색 결과 | ${siteName}`
      : `사건 검색 | ${siteName}`,
    description: query
      ? `${query} 관련 사건 검색 결과입니다.`
      : "대온 핀테크센터 사건 검색 페이지입니다.",
    inLanguage: "ko-KR",
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
  };

  return (
    <main className="search-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .search-page {
              width: 100%;
              max-width: 1120px;
              margin: 0 auto;
              padding: 80px 20px 100px;
            }

            .search-hero {
              margin-bottom: 36px;
              padding: 42px 34px;
              border-radius: 24px;
              background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
              color: #ffffff;
            }

            .search-eyebrow {
              margin: 0 0 12px;
              font-size: 15px;
              font-weight: 800;
              color: #a7f3d0;
            }

            .search-title {
              margin: 0 0 16px;
              font-size: 40px;
              font-weight: 900;
              line-height: 1.28;
              letter-spacing: -0.04em;
            }

            .search-desc {
              margin: 0;
              max-width: 780px;
              font-size: 18px;
              line-height: 1.75;
              color: #e5e7eb;
            }

            .search-form {
              display: flex;
              gap: 10px;
              margin: 0 0 34px;
            }

            .search-input {
              flex: 1;
              min-width: 0;
              height: 56px;
              padding: 0 18px;
              border: 1px solid #d1d5db;
              border-radius: 14px;
              font-size: 17px;
              outline: none;
            }

            .search-input:focus {
              border-color: #111827;
              box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.12);
            }

            .search-button {
              height: 56px;
              padding: 0 24px;
              border: 0;
              border-radius: 14px;
              background: #111827;
              color: #ffffff;
              font-size: 17px;
              font-weight: 900;
              cursor: pointer;
            }

            .search-summary {
              margin: 0 0 20px;
              font-size: 17px;
              font-weight: 800;
              color: #111827;
            }

            .search-list {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 16px;
              margin: 0;
              padding: 0;
              list-style: none;
            }

            .search-item {
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              background: #ffffff;
              box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
              overflow: hidden;
            }

            .search-link {
              display: block;
              height: 100%;
              padding: 22px 20px;
              text-decoration: none;
              color: inherit;
            }

            .search-link:hover {
              background: #f9fafb;
            }

            .search-case-title {
              margin: 0 0 10px;
              font-size: 19px;
              font-weight: 900;
              line-height: 1.45;
              color: #111827;
            }

            .search-case-desc {
              margin: 0;
              font-size: 15px;
              line-height: 1.7;
              color: #4b5563;
            }

            .search-empty {
              padding: 34px 28px;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              background: #ffffff;
              font-size: 17px;
              line-height: 1.8;
              color: #374151;
            }

            @media (max-width: 900px) {
              .search-list {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 640px) {
              .search-page {
                padding: 52px 16px 80px;
              }

              .search-hero {
                padding: 32px 22px;
              }

              .search-title {
                font-size: 30px;
              }

              .search-desc {
                font-size: 16px;
              }

              .search-form {
                flex-direction: column;
              }

              .search-button {
                width: 100%;
              }

              .search-list {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />

      <script
        id="search-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(searchJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="search-hero">
        <p className="search-eyebrow">DAEON FINTECH CENTER</p>
        <h1 className="search-title">사건 검색</h1>
        <p className="search-desc">
          금융사기, 투자사기, 리딩방 사기, 코인 사기, 쇼핑몰 사칭 사기,
          부업 사기 등 대온 핀테크센터에 등록된 사건 페이지를 검색할 수
          있습니다.
        </p>
      </section>

      <form className="search-form" action="/search" method="get">
        <input
          className="search-input"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="예: VIP603, 리딩방, 쇼핑몰, 코인, 팀미션"
          aria-label="사건 검색어"
        />
        <button className="search-button" type="submit">
          검색
        </button>
      </form>

      <p className="search-summary">
        {query
          ? `"${query}" 검색 결과 ${filteredCases.length}건`
          : `최근 등록 사건 ${filteredCases.length}건`}
      </p>

      {filteredCases.length > 0 ? (
        <ul className="search-list">
          {filteredCases.map((item) => (
            <li key={item.slug} className="search-item">
              <Link href={item.href} className="search-link">
                <h2 className="search-case-title">
                  {item.title.replace(/사기$/, "")} 사기 피해 사례
                </h2>
                <p className="search-case-desc">
                  {item.title} 관련 사기 피해 사례와 대응 방법을 확인할 수
                  있습니다.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="search-empty">
          검색 결과가 없습니다. 사건명, 업체명, 사기 유형 키워드를 다르게 입력해
          다시 검색해 주세요.
        </div>
      )}
    </main>
  );
}
