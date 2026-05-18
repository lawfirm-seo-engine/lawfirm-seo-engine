import { NextRequest, NextResponse } from "next/server"

const SECRET_KEY = "daeon_admin_hmac_secret_key_2026"
const COOKIE_NAME = "admin_session"

// ─── Web Crypto API (Edge Runtime 호환) ──────────────────────────────────────

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx < 0) return false
    const data    = token.slice(0, dotIdx)
    const sigB64  = token.slice(dotIdx + 1)

    // base64url → Uint8Array
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    )

    const key = await importKey()
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    )
    if (!valid) return false

    // 만료 확인
    const payload = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.exp === "number" && payload.exp > Date.now()
  } catch {
    return false
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin 이외 경로는 통과
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next()
  }

  // 로그인 페이지·로그인/로그아웃 API는 인증 없이 허용
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
