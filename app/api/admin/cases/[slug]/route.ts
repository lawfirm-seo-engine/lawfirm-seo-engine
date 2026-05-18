import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile, casesFilePath } from "@/lib/admin/github"

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

// ─── GET: 파일시스템에서 읽기 (빠름, 한글 슬러그 문제 없음) ──────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { slug }  = await ctx.params
    const mdxPath   = path.join(CASES_DIR, `${slug}.mdx`)
    const memoPath  = path.join(CASES_DIR, `${slug}.memo`)
    const commPath  = path.join(CASES_DIR, `${slug}.comments`)

    if (!fs.existsSync(mdxPath)) {
      return NextResponse.json({ error: "파일 없음" }, { status: 404 })
    }

    const raw            = fs.readFileSync(mdxPath, "utf8")
    const { frontmatter, body } = splitMdx(raw)
    const memos          = fs.existsSync(memoPath) ? fs.readFileSync(memoPath,  "utf8") : ""
    const comments       = fs.existsSync(commPath) ? fs.readFileSync(commPath, "utf8") : ""

    return NextResponse.json({ slug, frontmatter, body, memos, comments })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── PUT: GitHub API로 저장 (SHA를 저장 시점에 조회) ─────────────────────────

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { slug }                = await ctx.params
    const { frontmatter, body }   = await req.json()

    if (frontmatter === undefined || body === undefined) {
      return NextResponse.json({ error: "frontmatter와 body가 필요합니다." }, { status: 400 })
    }

    // 저장 시점에 현재 SHA 조회 (GitHub PUT에 sha 필요)
    const existing = await ghGetFile(casesFilePath(slug))
    if (!existing) {
      return NextResponse.json({ error: "GitHub에서 파일을 찾을 수 없습니다." }, { status: 404 })
    }

    const newContent = `---\n${frontmatter}\n---\n${body}`
    const commitMsg  = `content: ${slug} 원고 수정 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
    await ghPutFile(casesFilePath(slug), newContent, commitMsg, existing.sha)

    return NextResponse.json({
      ok:      true,
      slug,
      message: "GitHub에 커밋 완료. Vercel이 자동 재배포를 시작합니다.",
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
