import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"

const SECRET     = "daeon_admin_hmac_secret_key_2026"
const COOKIE_NAME = "admin_session"

function isValidToken(token: string): boolean {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx < 0) return false
    const data     = token.slice(0, dotIdx)
    const sig      = token.slice(dotIdx + 1)
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url")
    if (sig !== expected) return false
    const payload  = JSON.parse(Buffer.from(data, "base64url").toString("utf8"))
    return typeof payload.exp === "number" && payload.exp > Date.now()
  } catch {
    return false
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin 이외 경로는 통과
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next()
  }

  // 로그인 페이지·로그인 API는 인증 없이 접근 허용
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/api/admin/auth/")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !isValidToken(token)) {
    // API 요청이면 401 JSON, 페이지 요청이면 로그인으로 redirect
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
