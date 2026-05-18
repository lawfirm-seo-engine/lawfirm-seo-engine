import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, COOKIE_NAME } from "@/lib/admin/auth"
import { ghGetFile, ghPutMultipleFiles, casesFilePath } from "@/lib/admin/github"
import { generateMdx, buildSvgOverlay } from "@/lib/admin/mdxTemplate"
import type { GhFileEntry } from "@/lib/admin/github"

function getUser(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  return token ? verifyToken(token) : null
}

export async function POST(req: NextRequest) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { cases } = await req.json() as {
      cases: Array<{ caseName: string; groupId?: string; representativeSlug?: string }>
    }
    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: "cases 배열이 비어있습니다." }, { status: 400 })
    }
    if (cases.length > 50) {
      return NextResponse.json({ error: "한 번에 최대 50개까지 생성 가능합니다." }, { status: 400 })
    }

    // /tmp 폰트 준비
    const fontSrc  = path.join(process.cwd(), "public", "fonts", "NanumGothic-Bold.ttf")
    let fontUri: string | undefined
    if (fs.existsSync(fontSrc)) {
      const tmpFont = "/tmp/NanumGothic-Bold.ttf"
      if (!fs.existsSync(tmpFont)) fs.copyFileSync(fontSrc, tmpFont)
      fontUri = `file://${tmpFont}`
    }

    const sharp        = (await import("sharp")).default
    const templatePath = path.join(process.cwd(), "public", "images", "templates", "case-template.png")

    const results: Array<{ caseName: string; slug: string; ok: boolean; error?: string }> = []
    const filesToCommit: GhFileEntry[] = []

    for (const item of cases) {
      const caseName = item.caseName?.trim()
      if (!caseName) {
        results.push({ caseName: item.caseName, slug: "", ok: false, error: "사건명이 비어있습니다." })
        continue
      }

      try {
        const generated = generateMdx({
          caseName,
          groupId:            item.groupId?.trim()            || "",
          representativeSlug: item.representativeSlug?.trim() || "",
        })

        // 중복 확인
        const existing = await ghGetFile(casesFilePath(generated.slug))
        if (existing) {
          results.push({ caseName, slug: generated.slug, ok: false, error: "이미 존재하는 슬러그" })
          continue
        }

        filesToCommit.push({ path: casesFilePath(generated.slug), content: generated.full })

        // 이미지 생성
        try {
          const displayName = caseName.includes("사칭") ? caseName : `${caseName} (사칭)`
          const svgOverlay  = buildSvgOverlay(displayName, fontUri)
          const pngBuffer   = await sharp(templatePath)
            .resize(1200, 630)
            .composite([{ input: Buffer.from(svgOverlay), gravity: "center" }])
            .png({ quality: 90 })
            .toBuffer()
          filesToCommit.push({ path: `public/images/cases/${generated.slug}.png`, content: pngBuffer })
        } catch {
          // 이미지 실패 무시 — MDX는 커밋
        }

        results.push({ caseName, slug: generated.slug, ok: true })
      } catch (e) {
        results.push({ caseName, slug: "", ok: false, error: e instanceof Error ? e.message : String(e) })
      }
    }

    const succeeded = results.filter((r) => r.ok)
    if (filesToCommit.length > 0) {
      const slugList  = succeeded.map((r) => r.slug).join(", ")
      const commitMsg = `content: 대량 등록 ${succeeded.length}건 (${slugList.slice(0, 100)})\n\nCo-Authored-By: ${user} <admin@daeonlawfintech.com>`
      await ghPutMultipleFiles(filesToCommit, commitMsg)
    }

    return NextResponse.json({
      ok:        succeeded.length > 0,
      total:     cases.length,
      succeeded: succeeded.length,
      failed:    results.filter((r) => !r.ok).length,
      results,
      message:   succeeded.length > 0
        ? `${succeeded.length}건 GitHub 커밋 완료. Vercel 자동 재배포 시작.`
        : "생성된 케이스 없음",
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
