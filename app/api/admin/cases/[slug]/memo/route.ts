import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"

const CASES_DIR = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

function updateModifiedAt(filePath: string) {
  const today = new Date().toISOString().slice(0, 10)
  let content = fs.readFileSync(filePath, "utf8")
  if (/^modifiedAt:/m.test(content)) {
    content = content.replace(
      /^(modifiedAt:\s*)"?[0-9]{4}-[0-9]{2}-[0-9]{2}"?/m,
      `$1"${today}"`
    )
  } else {
    content = content.replace(
      /^(publishedAt:\s*"?[^"\n]*"?)/m,
      `$1\nmodifiedAt: "${today}"`
    )
  }
  fs.writeFileSync(filePath, content, "utf8")
}

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug }   = await ctx.params
  const mdxPath    = path.join(CASES_DIR, `${slug}.mdx`)
  const memoPath   = path.join(CASES_DIR, `${slug}.memo`)

  if (!fs.existsSync(mdxPath)) {
    return NextResponse.json({ error: "파일 없음" }, { status: 404 })
  }

  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: "메모 내용이 비어있습니다." }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const entry = `[${today}] ${content.trim()}\n`

  fs.appendFileSync(memoPath, entry, "utf8")
  updateModifiedAt(mdxPath)

  const memos = fs.readFileSync(memoPath, "utf8")
  return NextResponse.json({ ok: true, memos })
}
