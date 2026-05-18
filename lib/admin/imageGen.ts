/**
 * imageGen.ts
 * Sharp의 Pango 텍스트 렌더러로 한글 썸네일 생성.
 * librsvg 대신 libvips 내장 Pango를 직접 사용하므로 커스텀 폰트가 동작함.
 */

import fs   from "fs"
import path from "path"
import type { OverlayOptions } from "sharp"

const FONT_PATH     = path.join(process.cwd(), "public", "fonts",  "NanumGothic-Bold.ttf")
const TEMPLATE_PATH = path.join(process.cwd(), "public", "images", "templates", "case-template.png")

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export async function generateCaseImage(caseName: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default

  const displayName = caseName.trim().includes("사칭")
    ? caseName.trim()
    : `${caseName.trim()} (사칭)`

  // ── 반투명 어두운 오버레이 (librsvg로 렌더링 — 텍스트 없으므로 문제없음)
  const darkOverlay: OverlayOptions = {
    input: Buffer.from(
      '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="1200" height="630" fill="rgba(0,0,0,0.40)"/></svg>'
    ),
    top: 0, left: 0,
  }

  const overlays: OverlayOptions[] = [darkOverlay]

  // ── Pango 텍스트 렌더러로 한글 텍스트 생성 (fontfile 지정 → fontconfig 불필요)
  if (fs.existsSync(FONT_PATH)) {
    try {
      // 제목
      const titleBuf = await sharp({
        text: {
          text:     `<span foreground="white" size="62000" weight="ultrabold">${esc(displayName)}</span>`,
          fontfile: FONT_PATH,
          font:     "NanumGothic",
          width:    1060,
          rgba:     true,
          wrap:     "word-char",
          align:    "centre",
          dpi:      144,
        },
      }).png().toBuffer()

      const { width: tw = 0, height: th = 0 } = await sharp(titleBuf).metadata()

      // 부제목
      const subBuf = await sharp({
        text: {
          text:     '<span foreground="white" size="28000">피해 회복을 위한 법률 정보</span>',
          fontfile: FONT_PATH,
          font:     "NanumGothic",
          width:    900,
          rgba:     true,
          wrap:     "none",
          align:    "centre",
          dpi:      144,
        },
      }).png().toBuffer()

      const { width: sw = 0 } = await sharp(subBuf).metadata()

      // 수직 중앙 정렬 (제목 + 여백 + 부제목)
      const cx      = 600
      const cy      = 315
      const titleTop = Math.max(0, Math.round(cy - th / 2) - 30)
      const subTop   = titleTop + th + 24

      overlays.push(
        { input: titleBuf, left: Math.max(0, Math.round(cx - tw / 2)), top: titleTop },
        { input: subBuf,   left: Math.max(0, Math.round(cx - sw / 2)), top: subTop  },
      )
    } catch (textErr) {
      console.warn("[imageGen] Pango 텍스트 실패 (오버레이만 사용):", textErr)
    }
  } else {
    console.warn("[imageGen] 폰트 파일 없음:", FONT_PATH)
  }

  return sharp(TEMPLATE_PATH)
    .resize(1200, 630)
    .composite(overlays)
    .png({ quality: 90 })
    .toBuffer()
}
