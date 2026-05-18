import { NextRequest, NextResponse } from "next/server"
import { checkCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/admin/auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 })
    }

    if (!checkCredentials(String(username), String(password))) {
      return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 })
    }

    const token = createSessionToken(String(username))
    const res   = NextResponse.json({ ok: true, user: username })
    res.cookies.set({
      ...SESSION_COOKIE,
      value: token,
    })
    return res
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
