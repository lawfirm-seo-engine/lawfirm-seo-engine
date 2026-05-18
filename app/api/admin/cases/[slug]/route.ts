import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"

const CASES_DIR = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

function splitMdx(raw: string): { frontmatter: string; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n")
  const match      = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (match) return { frontmatter: match[1], body: match[2] }
  return { frontmatter: "", body: normalized }
}

type RouteContext = { params: Promise<{ slug: string }> }

// ─── GET: 케이스 상세 읽기 ────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug }  = await ctx.params
  const filePath  = path.join(CASES_DIR, `${slug}.mdx`)
  const memoPath  = path.join(CASES_DIR, `${slug}.memo`)
  const commPath  = path.join(CASES_DIR, `${slug}.comments`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "파일 없음" }, { status: 404 })
  }

  const raw            = fs.readFileSync(filePath, "utf8")
  const { frontmatter, body } = splitMdx(raw)
  const memos          = fs.existsSync(memoPath)  ? fs.readFileSync(memoPath,  "utf8") : ""
  const comments       = fs.existsSync(commPath)  ? fs.readFileSync(commPath,  "utf8") : ""

  return NextResponse.json({ slug, frontmatter, body, memos, comments })
}

// ─── PUT: 케이스 저장 ────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug }  = await ctx.params
  const filePath  = path.join(CASES_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "파일 없음" }, { status: 404 })
  }

  const { frontmatter, body } = await req.json()
  if (frontmatter === undefined || body === undefined) {
    return NextResponse.json({ error: "frontmatter와 body가 필요합니다." }, { status: 400 })
  }

  const newContent = `---\n${frontmatter}\n---\n${body}`
  fs.writeFileSync(filePath, newContent, "utf8")

  return NextResponse.json({ ok: true, slug })
}
