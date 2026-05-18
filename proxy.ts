import { NextRequest, NextResponse } from "next/server"

// auth.ts의 SECRET과 반드시 동일해야 함 → 환경변수로 중앙 관리
// (proxy는 Edge 런타임이라 auth.ts를 직접 import 불가)
const SECRET_KEY  = process.env.ADMIN_SECRET_KEY ?? "daeon_admin_hmac_secret_key_2026"
const COOKIE_NAME = "admin_session"

// ─── base64url → Uint8Array (패딩 자동 보완) ─────────────────────────────────
// atob()는 표준 base64(패딩 포함)만 허용합니다.
// HMAC-SHA256 출력 32바이트 → base64url 43자 (= 1개 필요) → 패딩 없이 atob() 실패
function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, "=")
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

// base64url 문자열 → UTF-8 문자열 (패딩 자동 보완)
function base64urlToStr(b64url: string): string {
  const b64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(b64url.length + (4 - (b64url.length % 4)) % 4, "=")
  return atob(b64)
}

// ─── Web Crypto API로 HMAC-SHA256 검증 (Edge Runtime 호환) ───────────────────

let _cryptoKey: CryptoKey | null = null
async function getKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey
  _cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )
  return _cryptoKey
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx < 0) return false

    const dataPart = token.slice(0, dotIdx)   // base64url(payload JSON)
    const sigPart  = token.slice(dotIdx + 1)   // base64url(HMAC bytes)

    // 서명 검증
    const sigBytes  = base64urlToBytes(sigPart).buffer as ArrayBuffer
    const dataBytes = new TextEncoder().encode(dataPart).buffer as ArrayBuffer
    const key       = await getKey()
    const valid     = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes)
    if (!valid) return false

    // 만료 확인
    const payload = JSON.parse(base64urlToStr(dataPart))
    return typeof payload.exp === "number" && payload.exp > Date.now()
  } catch {
    return false
  }
}

// ─── Proxy (구 Middleware) ────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next()
  }

  // 로그인 페이지 · 인증 API는 무인증 허용
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/api/admin/auth/")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await isValidToken(token))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
