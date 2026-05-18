import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile, casesFilePath } from "@/lib/admin/github"

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

function updateModifiedAt(frontmatter: string): string {
  const today = new Date().toISOString().slice(0, 10)
  if (/^modifiedAt:/m.test(frontmatter)) {
    return frontmatter.replace(
      /^(modifiedAt:\s*)"?[0-9]{4}-[0-9]{2}-[0-9]{2}"?/m,
      `$1"${today}"`
    )
  }
  return frontmatter.replace(
    /^(publishedAt:\s*"?[^"\n]*"?)/m,
    `$1\nmodifiedAt: "${today}"`
  )
}

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, ctx: RouteContext) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug } = await ctx.params
  const { author, content } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용이 비어있습니다." }, { status: 400 })
  }

  // .comments 파일 읽기
  const commFile   = await ghGetFile(casesFilePath(slug, "comments"))
  const today      = new Date().toISOString().slice(0, 10)
  const authorName = author?.trim() || "익명"
  const newEntry   = `[${today}][${authorName}] ${content.trim()}\n`
  const newComments = (commFile?.content ?? "") + newEntry

  // .comments 커밋
  const commMsg = `content: ${slug} 댓글 추가 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
  await ghPutFile(casesFilePath(slug, "comments"), newComments, commMsg, commFile?.sha)

  // MDX modifiedAt 갱신
  const mdxFile = await ghGetFile(casesFilePath(slug))
  if (mdxFile) {
    const match = mdxFile.content.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (match) {
      const updatedFm  = updateModifiedAt(match[1])
      const newContent = `---\n${updatedFm}\n---\n${match[2]}`
      const mdxMsg     = `content: ${slug} modifiedAt 갱신 (댓글)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
      await ghPutFile(casesFilePath(slug), newContent, mdxMsg, mdxFile.sha)
    }
  }

  return NextResponse.json({ ok: true, comments: newComments })
}
