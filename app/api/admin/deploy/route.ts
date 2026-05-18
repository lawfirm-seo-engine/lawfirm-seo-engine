import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghRecentCommits } from "@/lib/admin/github"

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

// ─── GET: 최근 커밋 이력 + Vercel 배포 상태 ─────────────────────────────────

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const commits = await ghRecentCommits(20)

  // Vercel 배포 상태 (VERCEL_TEAM_ID + VERCEL_TOKEN 환경변수가 있으면 조회)
  let deployments: Array<{ uid: string; state: string; createdAt: number; url: string }> = []
  const vercelToken  = process.env.VERCEL_TOKEN
  const vercelTeamId = process.env.VERCEL_TEAM_ID
  const vercelProjectId = process.env.VERCEL_PROJECT_ID

  if (vercelToken && vercelProjectId) {
    try {
      const teamQ = vercelTeamId ? `&teamId=${vercelTeamId}` : ""
      const vRes  = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=5${teamQ}`,
        { headers: { Authorization: `Bearer ${vercelToken}` }, cache: "no-store" }
      )
      if (vRes.ok) {
        const vData = await vRes.json()
        deployments = (vData.deployments ?? []).map((d: {
          uid: string; state: string; createdAt: number; url: string
        }) => ({
          uid:       d.uid,
          state:     d.state,
          createdAt: d.createdAt,
          url:       d.url,
        }))
      }
    } catch { /* Vercel API 오류는 무시 */ }
  }

  return NextResponse.json({ commits, deployments })
}

// ─── POST: Vercel Deploy Hook 트리거 (강제 재배포) ──────────────────────────

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) {
    return NextResponse.json(
      { error: "VERCEL_DEPLOY_HOOK_URL 환경변수가 설정되지 않았습니다." },
      { status: 400 }
    )
  }

  const res = await fetch(hookUrl, { method: "POST" })
  if (!res.ok) {
    return NextResponse.json({ error: `Vercel Hook 실패: ${res.status}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: "Vercel 재배포가 트리거되었습니다." })
}
