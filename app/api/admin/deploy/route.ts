import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"

const execAsync = promisify(exec)
const ROOT      = process.cwd()

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

async function run(cmd: string): Promise<{ stdout: string; stderr: string; ok: boolean }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: ROOT, timeout: 60_000 })
    return { stdout: stdout.trim(), stderr: stderr.trim(), ok: true }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return {
      stdout: e.stdout?.trim() ?? "",
      stderr: e.stderr?.trim() || e.message || String(err),
      ok: false,
    }
  }
}

// ─── GET: git status ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const status = await run("git status --short")
  const log    = await run("git log --oneline -10")
  return NextResponse.json({
    status: status.stdout,
    log:    log.stdout,
  })
}

// ─── POST: git add + commit + push ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: "커밋 메시지를 입력하세요." }, { status: 400 })
  }

  const steps: Array<{ step: string; stdout: string; stderr: string; ok: boolean }> = []

  // 1) git add
  const add = await run("git add content/daeonlawfintech/cases/")
  steps.push({ step: "git add", ...add })
  if (!add.ok) return NextResponse.json({ ok: false, steps }, { status: 500 })

  // 2) git status (confirm staged)
  const status = await run("git status --short")
  steps.push({ step: "git status", ...status })

  if (!status.stdout.trim()) {
    steps.push({ step: "skip", stdout: "변경사항 없음. 커밋 생략.", stderr: "", ok: true })
    return NextResponse.json({ ok: true, steps, skipped: true })
  }

  // 3) git commit
  const safeMsg = message.trim().replace(/"/g, '\\"')
  const commit  = await run(`git commit -m "${safeMsg}\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>"`)
  steps.push({ step: "git commit", ...commit })
  if (!commit.ok) return NextResponse.json({ ok: false, steps }, { status: 500 })

  // 4) git push
  const push = await run("git push origin main")
  steps.push({ step: "git push", ...push })
  if (!push.ok) return NextResponse.json({ ok: false, steps }, { status: 500 })

  return NextResponse.json({ ok: true, steps })
}
