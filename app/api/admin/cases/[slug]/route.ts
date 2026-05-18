import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile, casesFilePath } from "@/lib/admin/github"

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

// ─── GET: GitHub API로 최신 내용 읽기 ────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug } = await ctx.params

  const [mdxFile, memoFile, commFile] = await Promise.all([
    ghGetFile(casesFilePath(slug)),
    ghGetFile(casesFilePath(slug, "memo")),
    ghGetFile(casesFilePath(slug, "comments")),
  ])

  if (!mdxFile) return NextResponse.json({ error: "파일 없음" }, { status: 404 })

  const { frontmatter, body } = splitMdx(mdxFile.content)

  return NextResponse.json({
    slug,
    frontmatter,
    body,
    sha:      mdxFile.sha,
    memos:    memoFile?.content    ?? "",
    comments: commFile?.content ?? "",
  })
}

// ─── PUT: GitHub API로 저장 (커밋) ────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug } = await ctx.params
  const { frontmatter, body, sha } = await req.json()

  if (frontmatter === undefined || body === undefined) {
    return NextResponse.json({ error: "frontmatter와 body가 필요합니다." }, { status: 400 })
  }

  const newContent = `---\n${frontmatter}\n---\n${body}`
  const commitMsg  = `content: ${slug} 원고 수정 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`

  await ghPutFile(casesFilePath(slug), newContent, commitMsg, sha)

  return NextResponse.json({
    ok:      true,
    slug,
    message: "GitHub에 커밋 완료. Vercel이 자동 재배포를 시작합니다.",
  })
}
