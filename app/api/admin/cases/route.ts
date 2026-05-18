import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { execFile } from "child_process"
import { promisify } from "util"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"

const execFileAsync = promisify(execFile)

const CASES_DIR = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

function readFm(source: string, key: string): string {
  const m = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return m?.[1]?.trim() ?? ""
}

// ─── GET: 케이스 목록 ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!fs.existsSync(CASES_DIR)) {
    return NextResponse.json({ cases: [] })
  }

  const files = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".mdx") && f !== "_template.mdx" && !f.startsWith("_"))

  const cases = files
    .map((filename) => {
      const slug     = filename.replace(/\.mdx$/, "")
      const filePath = path.join(CASES_DIR, filename)
      const source   = fs.readFileSync(filePath, "utf8")
      const stat     = fs.statSync(filePath)
      return {
        slug,
        caseName:    readFm(source, "caseName") || slug,
        publishedAt: readFm(source, "publishedAt"),
        modifiedAt:  readFm(source, "modifiedAt"),
        categoryId:  readFm(source, "categoryId"),
        noindex:     readFm(source, "noindex") === "true",
        mtime:       stat.mtime.getTime(),
        hasMemo:     fs.existsSync(path.join(CASES_DIR, `${slug}.memo`)),
        hasComments: fs.existsSync(path.join(CASES_DIR, `${slug}.comments`)),
      }
    })
    .sort((a, b) => {
      if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt)
      if (a.publishedAt) return -1
      if (b.publishedAt) return 1
      return b.mtime - a.mtime
    })

  return NextResponse.json({ cases })
}

// ─── POST: 새 케이스 생성 ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { caseName, groupId, representativeSlug } = await req.json()
  if (!caseName?.trim()) {
    return NextResponse.json({ error: "사건명을 입력하세요." }, { status: 400 })
  }

  // 슬러그 계산 (create-case.js와 동일 로직)
  const slug = caseName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")

  const outPath = path.join(CASES_DIR, `${slug}.mdx`)
  if (fs.existsSync(outPath)) {
    return NextResponse.json({ error: `이미 존재하는 슬러그입니다: ${slug}`, slug }, { status: 409 })
  }

  // 기존 create-case.js 스크립트 실행
  const scriptPath = path.join(process.cwd(), "scripts", "create-case.js")
  const args: string[] = [caseName.trim()]
  if (groupId?.trim())              args.push("--group", groupId.trim())
  if (representativeSlug?.trim())   args.push("--representative", representativeSlug.trim())

  try {
    const { stdout, stderr } = await execFileAsync("node", [scriptPath, ...args], {
      cwd: process.cwd(),
      timeout: 60_000,
    })
    return NextResponse.json({ ok: true, slug, stdout, stderr })
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return NextResponse.json(
      { error: "MDX 생성 실패", detail: e.stderr || e.message || String(err) },
      { status: 500 }
    )
  }
}
