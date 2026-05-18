import { NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/admin/auth"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name:    COOKIE_NAME,
    value:   "",
    maxAge:  0,
    path:    "/",
    httpOnly: true,
    sameSite: "strict",
  })
  return res
}
