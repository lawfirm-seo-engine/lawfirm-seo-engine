import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutFile, ghPutBinary, casesFilePath } from "@/lib/admin/github"
import { generateMdx, buildSvgOverlay } from "@/lib/admin/mdxTemplate"

const CASES_DIR = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

function readFm(source: string, key: string): string {
  const m = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return m?.[1]?.trim() ?? ""
}

// ─── GET: 케이스 목록 (배포된 파일시스템 기준, 빠름) ──────────────────────────

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

// ─── POST: 새 케이스 생성 (GitHub API로 커밋) ─────────────────────────────────

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { caseName, groupId, representativeSlug } = await req.json()
    if (!caseName?.trim()) {
      return NextResponse.json({ error: "사건명을 입력하세요." }, { status: 400 })
    }

    // MDX 내용 생성
    const generated = generateMdx({
      caseName:           caseName.trim(),
      groupId:            groupId?.trim()            || "",
      representativeSlug: representativeSlug?.trim() || "",
    })

    // 이미 존재 여부 확인 (GitHub API)
    const existing = await ghGetFile(casesFilePath(generated.slug))
    if (existing) {
      return NextResponse.json(
        { error: `이미 존재하는 슬러그입니다: ${generated.slug}`, slug: generated.slug },
        { status: 409 }
      )
    }

    // MDX 파일 커밋
    const commitMsg = `content: ${generated.slug} 신규 등록 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
    await ghPutFile(casesFilePath(generated.slug), generated.full, commitMsg)

    // 이미지 생성 및 커밋 (Sharp 사용)
    let imageCommitted = false
    try {
      const sharp = (await import("sharp")).default
      const templatePath = path.join(process.cwd(), "public", "images", "templates", "case-template.png")
      const svgOverlay   = buildSvgOverlay(
        caseName.trim().includes("사칭") ? caseName.trim() : `${caseName.trim()} (사칭)`
      )
      const pngBuffer = await sharp(templatePath)
        .resize(1200, 630)
        .composite([{ input: Buffer.from(svgOverlay) }])
        .png({ quality: 90 })
        .toBuffer()

      const imgPath    = `public/images/cases/${generated.slug}.png`
      const imgCommitMsg = `content: ${generated.slug} 대표 이미지 추가\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
      await ghPutBinary(imgPath, pngBuffer, imgCommitMsg)
      imageCommitted = true
    } catch (imgErr) {
      console.warn("이미지 생성/커밋 실패 (무시):", imgErr)
    }

    return NextResponse.json({
      ok:    true,
      slug:  generated.slug,
      imageCommitted,
      message: "GitHub에 커밋 완료. Vercel이 자동 재배포를 시작합니다.",
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
