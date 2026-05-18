import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile } from "@/lib/admin/github"

const REDIRECTS_PATH = "content/redirects.json"

type RedirectRule = { source: string; destination: string }

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

async function loadRules(): Promise<{ rules: RedirectRule[]; sha: string | undefined }> {
  const file = await ghGetFile(REDIRECTS_PATH)
  if (!file) return { rules: [], sha: undefined }
  try {
    return { rules: JSON.parse(file.content) as RedirectRule[], sha: file.sha }
  } catch {
    return { rules: [], sha: file.sha }
  }
}

// ─── GET: 리다이렉션 목록 조회 ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { rules } = await loadRules()
  return NextResponse.json({ redirects: rules })
}

// ─── POST: 리다이렉션 추가 ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { source?: string; destination?: string }
  const source      = (body.source      ?? "").trim()
  const destination = (body.destination ?? "").trim()

  if (!source || !destination) {
    return NextResponse.json({ error: "source, destination 모두 필수입니다." }, { status: 400 })
  }
  if (!source.startsWith("/")) {
    return NextResponse.json({ error: "source는 /로 시작해야 합니다." }, { status: 400 })
  }
  if (!destination.startsWith("/") && !destination.startsWith("http")) {
    return NextResponse.json({ error: "destination은 /로 시작하거나 절대 URL이어야 합니다." }, { status: 400 })
  }

  const { rules, sha } = await loadRules()

  if (rules.some((r) => r.source === source)) {
    return NextResponse.json({ error: `이미 존재하는 source입니다: ${source}` }, { status: 409 })
  }

  const updated = [...rules, { source, destination }]
  await ghPutFile(
    REDIRECTS_PATH,
    JSON.stringify(updated, null, 2) + "\n",
    `redirect: ${source} → ${destination}`,
    sha,
  )

  return NextResponse.json({ ok: true, redirects: updated })
}

// ─── DELETE: 리다이렉션 삭제 ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { source?: string }
  const source = (body.source ?? "").trim()

  if (!source) {
    return NextResponse.json({ error: "source 필수입니다." }, { status: 400 })
  }

  const { rules, sha } = await loadRules()
  const updated = rules.filter((r) => r.source !== source)

  if (updated.length === rules.length) {
    return NextResponse.json({ error: "해당 source를 찾을 수 없습니다." }, { status: 404 })
  }

  await ghPutFile(
    REDIRECTS_PATH,
    JSON.stringify(updated, null, 2) + "\n",
    `redirect: remove ${source}`,
    sha,
  )

  return NextResponse.json({ ok: true, redirects: updated })
}
