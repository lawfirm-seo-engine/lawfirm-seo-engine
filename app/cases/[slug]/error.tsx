"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function CaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서 모니터링 서비스로 전송 가능)
    console.error("[CasePage Error]", error?.message ?? error)
  }, [error])

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "80px 20px 120px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: "13px",
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: "#6b7280",
          textTransform: "uppercase",
        }}
      >
        페이지 오류
      </p>

      <h1
        style={{
          margin: "0 0 20px",
          fontSize: "32px",
          fontWeight: 900,
          color: "#111827",
          letterSpacing: "-0.03em",
        }}
      >
        사건 페이지를 불러오지 못했습니다
      </h1>

      <p
        style={{
          margin: "0 0 40px",
          fontSize: "16px",
          lineHeight: 1.8,
          color: "#6b7280",
        }}
      >
        일시적인 오류가 발생했습니다. 잠시 후 다시 시도하거나
        <br />
        아래 버튼을 통해 다른 페이지로 이동하세요.
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={reset}
          style={{
            height: "48px",
            padding: "0 28px",
            borderRadius: "12px",
            background: "#111827",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>

        <Link
          href="/cases"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "48px",
            padding: "0 28px",
            borderRadius: "12px",
            border: "2px solid #111827",
            color: "#111827",
            fontSize: "15px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          진행 사건 목록
        </Link>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "48px",
            padding: "0 28px",
            borderRadius: "12px",
            border: "2px solid #e5e7eb",
            color: "#374151",
            fontSize: "15px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          홈으로
        </Link>
      </div>

      <div
        style={{
          marginTop: "60px",
          padding: "24px 28px",
          borderRadius: "16px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "15px",
            fontWeight: 800,
            color: "#111827",
          }}
        >
          긴급 법률 상담이 필요하신가요?
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
          📞{" "}
          <a href="tel:0269523695" style={{ color: "#111827", fontWeight: 700 }}>
            02-6952-3695
          </a>
          &nbsp;·&nbsp; 평일 09:00 – 18:00
        </p>
      </div>
    </main>
  )
}
