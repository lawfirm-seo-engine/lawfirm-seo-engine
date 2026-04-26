import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "사기 피해 대응 법률 정보"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: { slug: string }
}) {
  const decodedSlug = decodeURIComponent(params.slug)
  const keyword = decodedSlug.toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0f172a",
          color: "white",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 38, marginBottom: 24 }}>
          법무법인 대온 핀테크센터
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {keyword} 사기
        </div>

        <div style={{ fontSize: 34, marginTop: 28 }}>
          피해 사례와 대응 방법 안내
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}