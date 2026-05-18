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

  const { slug }   = await ctx.params
  const { content } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: "메모 내용이 비어있습니다." }, { status: 400 })
  }

  // .memo 파일 읽기 (없으면 빈 내용)
  const memoFile = await ghGetFile(casesFilePath(slug, "memo"))
  const today    = new Date().toISOString().slice(0, 10)
  const newEntry = `[${today}] ${content.trim()}\n`
  const newMemos = (memoFile?.content ?? "") + newEntry

  // .memo 커밋
  const memoMsg = `content: ${slug} 메모 추가 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
  await ghPutFile(casesFilePath(slug, "memo"), newMemos, memoMsg, memoFile?.sha)

  // MDX의 modifiedAt 갱신
  const mdxFile = await ghGetFile(casesFilePath(slug))
  if (mdxFile) {
    const match = mdxFile.content.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (match) {
      const updatedFm  = updateModifiedAt(match[1])
      const newContent = `---\n${updatedFm}\n---\n${match[2]}`
      const mdxMsg     = `content: ${slug} modifiedAt 갱신 (메모)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
      await ghPutFile(casesFilePath(slug), newContent, mdxMsg, mdxFile.sha)
    }
  }

  return NextResponse.json({ ok: true, memos: newMemos })
}
