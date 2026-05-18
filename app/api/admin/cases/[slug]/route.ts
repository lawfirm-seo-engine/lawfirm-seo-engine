import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile, ghDeleteFile, casesFilePath } from "@/lib/admin/github"

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

// ─── GET: 항상 GitHub API로 읽기 ─────────────────────────────────────────────
// Vercel Lambda는 NFT 추적 파일만 번들에 포함 → content/ 동적 읽기 불가
// GitHub API는 항상 최신 파일을 반환하므로 단일 케이스 편집에 적합

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { slug } = await ctx.params

    const [ghMdx, ghMemo, ghComm] = await Promise.all([
      ghGetFile(casesFilePath(slug)),
      ghGetFile(casesFilePath(slug, "memo")),
      ghGetFile(casesFilePath(slug, "comments")),
    ])

    if (!ghMdx) return NextResponse.json({ error: "파일 없음" }, { status: 404 })

    const { frontmatter, body } = splitMdx(ghMdx.content)
    return NextResponse.json({
      slug,
      frontmatter,
      body,
      memos:    ghMemo?.content ?? "",
      comments: ghComm?.content ?? "",
      source:   "github",
    })
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
    const raw = err instanceof Error ? err.message : String(err)
    // GitHub SHA 충돌 (동시 편집): 409 → 사용자 친화적 메시지
    const msg = raw.includes("409") || raw.toLowerCase().includes("conflict")
      ? "다른 관리자가 방금 이 파일을 수정했습니다. 페이지를 새로고침 후 다시 저장하세요."
      : raw
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── DELETE: 케이스 삭제 (MDX + memo + comments) ─────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { slug } = await ctx.params

    // MDX 삭제 (필수)
    const mdxFile = await ghGetFile(casesFilePath(slug))
    if (!mdxFile) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 })
    }
    const delMsg = `content: ${slug} 삭제 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
    await ghDeleteFile(casesFilePath(slug), mdxFile.sha, delMsg)

    // memo / comments 삭제 (있을 때만)
    const memoFile = await ghGetFile(casesFilePath(slug, "memo"))
    if (memoFile) {
      await ghDeleteFile(casesFilePath(slug, "memo"), memoFile.sha,
        `content: ${slug} 메모 삭제 (관리자)`)
    }
    const commFile = await ghGetFile(casesFilePath(slug, "comments"))
    if (commFile) {
      await ghDeleteFile(casesFilePath(slug, "comments"), commFile.sha,
        `content: ${slug} 댓글 삭제 (관리자)`)
    }

    return NextResponse.json({ ok: true, slug })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
