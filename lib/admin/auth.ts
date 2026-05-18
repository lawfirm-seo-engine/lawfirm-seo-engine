import { createHmac } from "crypto"

// ─── 상수 ─────────────────────────────────────────────────────────────────────

// 환경변수 우선 → 없으면 하드코딩 폴백 (proxy.ts와 반드시 동일해야 함)
export const SECRET = process.env.ADMIN_SECRET_KEY ?? "daeon_admin_hmac_secret_key_2026"
export const COOKIE_NAME = "admin_session"
const SESSION_MS = 24 * 60 * 60 * 1000 // 24시간

/** 허가된 계정 목록 (환경변수 ADMIN_USERS="user1:pw1,user2:pw2" 우선) */
function buildUsers(): Record<string, string> {
  const envUsers = process.env.ADMIN_USERS
  if (envUsers) {
    return Object.fromEntries(
      envUsers.split(",").map((pair) => {
        const [u, ...rest] = pair.trim().split(":")
        return [u, rest.join(":")]
      })
    )
  }
  return {
    phytomer:  "daeonadmin",
    sunthelaw: "daeonadmin",
    noleosi:   "daeonadmin",
    cantury77: "daeonadmin",
  }
}
const USERS = buildUsers()

// ─── 토큰 서명 / 검증 ─────────────────────────────────────────────────────────
// 포맷: base64url(JSON) + "." + base64url(HMAC-SHA256)
// middleware.ts의 Web Crypto 검증과 동일한 포맷을 사용합니다.

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig  = createHmac("sha256", SECRET).update(data).digest("base64url")
  return `${data}.${sig}`
}

function verify(token: string): Record<string, unknown> | null {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx < 0) return null
    const data     = token.slice(0, dotIdx)
    const sig      = token.slice(dotIdx + 1)
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url")
    if (sig !== expected) return null
    const payload  = JSON.parse(Buffer.from(data, "base64url").toString("utf8"))
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ─── 공개 API ─────────────────────────────────────────────────────────────────

export function checkCredentials(username: string, password: string): boolean {
  return USERS[username] !== undefined && USERS[username] === password
}

export function createSessionToken(username: string): string {
  return sign({ user: username, exp: Date.now() + SESSION_MS })
}

export function verifyToken(token: string): string | null {
  const payload = verify(token)
  if (!payload || typeof payload.user !== "string") return null
  return payload.user
}

// ─── 쿠키 옵션 ───────────────────────────────────────────────────────────────
// secure: true → HTTPS에서만 전송 (Vercel 프로덕션 필수)
// sameSite: "lax" → 같은 사이트 내 이동 시 쿠키 포함 허용

export const SESSION_COOKIE = {
  name:     COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax" as const,
  path:     "/",
  maxAge:   24 * 60 * 60,
  secure:   process.env.NODE_ENV === "production",
} as const
