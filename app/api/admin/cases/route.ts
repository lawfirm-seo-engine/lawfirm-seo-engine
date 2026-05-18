import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutMultipleFiles, casesFilePath } from "@/lib/admin/github"
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
        groupId:     readFm(source, "groupId"),
        noindex:     readFm(source, "noindex") === "true",
        mtime:       stat.mtime.getTime(),
        hasMemo:     fs.existsSync(path.join(CASES_DIR, `${slug}.memo`)),
        hasComments: fs.existsSync(path.join(CASES_DIR, `${slug}.comments`)),
      }
    })
    // publishedAt DESC → modifiedAt DESC → slug ASC
    // ※ Vercel 빌드 시 mtime = git 커밋 타임스탬프로 초기화되므로 mtime 정렬 금지
    .sort((a, b) => {
      const da = a.publishedAt || a.modifiedAt || ""
      const db = b.publishedAt || b.modifiedAt || ""
      if (da !== db) return db.localeCompare(da)
      return a.slug.localeCompare(b.slug)
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

    // MDX + 이미지를 단일 커밋으로 처리 (Vercel 배포 1회만 트리거)
    const commitMsg  = `content: ${generated.slug} 신규 등록 (관리자)\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
    const filesToCommit: import("@/lib/admin/github").GhFileEntry[] = [
      { path: casesFilePath(generated.slug), content: generated.full },
    ]

    // 이미지 생성 — /tmp에 폰트 복사 후 file:// URI로 librsvg에 전달 (한글 렌더링)
    let imageCommitted = false
    try {
      const sharp        = (await import("sharp")).default
      const templatePath = path.join(process.cwd(), "public", "images", "templates", "case-template.png")
      const fontSrc      = path.join(process.cwd(), "public", "fonts", "NanumGothic-Bold.ttf")

      // /tmp에 폰트 복사 (Vercel 서버리스는 /tmp 만 쓰기 가능)
      let fontUri: string | undefined
      if (fs.existsSync(fontSrc)) {
        const tmpFont = "/tmp/NanumGothic-Bold.ttf"
        if (!fs.existsSync(tmpFont)) fs.copyFileSync(fontSrc, tmpFont)
        fontUri = `file://${tmpFont}`
      }

      const displayName = caseName.trim().includes("사칭")
        ? caseName.trim()
        : `${caseName.trim()} (사칭)`
      const svgOverlay  = buildSvgOverlay(displayName, fontUri)

      const pngBuffer   = await sharp(templatePath)
        .resize(1200, 630)
        .composite([{ input: Buffer.from(svgOverlay), gravity: "center" }])
        .png({ quality: 90 })
        .toBuffer()

      filesToCommit.push({ path: `public/images/cases/${generated.slug}.png`, content: pngBuffer })
      imageCommitted = true
    } catch (imgErr) {
      console.warn("이미지 생성 실패 (MDX만 커밋):", imgErr)
    }

    await ghPutMultipleFiles(filesToCommit, commitMsg)

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
