/**
 * cafeArticle.ts
 * 네이버 카페 원고 생성 유틸리티
 */

import { detectCaseType, TYPE_DETAILS } from "./mdxTemplate"

function readFmKey(fm: string, key: string): string {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return m?.[1]?.trim() ?? ""
}

export interface CafeArticleData {
  slug:        string
  frontmatter: string
  body?:       string
}

export function generateCafeArticle(data: CafeArticleData): string {
  const { slug, frontmatter } = data
  const caseName   = readFmKey(frontmatter, "caseName")   || slug
  const primary    = readFmKey(frontmatter, "primaryKeyword") || caseName
  const aliases    = readFmKey(frontmatter, "aliases")
  const caseType   = readFmKey(frontmatter, "caseType")
  const pageUrl    = `https://daeonlawfintech.com/cases/${encodeURIComponent(slug)}`
  const today      = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })

  const td         = TYPE_DETAILS[detectCaseType(`${slug} ${caseName}`)] || TYPE_DETAILS["기타"]

  // 체크리스트 항목
  const checklist  = td.checklistItems.map((item) => `✔ ${item}`).join("\n")

  // 해시태그 — primaryKeyword + aliases 기반
  const tagBase = [primary, ...(aliases ? aliases.split(/[,，]/).map((s) => s.trim()) : [])]
    .filter(Boolean)
    .slice(0, 6)
    .map((t) => `#${t.replace(/\s+/g, "")}`)
    .join(" ")
  const extraTags = "#사기피해 #피해구제 #대온법무법인 #법률상담 #금융사기"

  const article = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
제목: ${caseName} 피해 공유 및 법률 대응 안내
작성일: ${today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

안녕하세요, 대온법무법인입니다.

${caseName} 관련 피해 사례를 공유드리며, 피해 구제 방법을 안내해드립니다.


■ 사건 유형
${caseType || td.caseType}


■ 주요 피해 방식
${td.approach}

피해자분들은 주로 ${td.victimAction}을(를) 하다가 피해를 입게 됩니다.
${td.mechanism} 등의 방식으로 금전을 편취합니다.


■ 주의사항
${td.stopMessage || `${caseName}은 정상적인 거래처럼 위장하여 피해자를 유인합니다.`}


■ 피해 확인 체크리스트
아래 항목에 해당되신다면 피해를 입으신 것입니다.

${checklist}


■ 피해 증거자료 준비 방법
피해를 입으셨다면 아래 자료를 최대한 보존해두세요:

✔ 상대방과의 채팅 기록 (카카오톡, 텔레그램, 문자 등) 전체 캡처
✔ 입금 내역 및 계좌 정보 (송금 앱 거래내역, 통장 사본)
✔ 해당 플랫폼 또는 앱 화면 캡처
✔ 상대방이 제시한 수익 인증, 계약서 등 모든 자료
✔ 담당자가 안내한 수수료·세금·보증금 납부 요구 내용


■ 피해 구제 안내
대온법무법인은 ${td.caseType} 피해자분들의 피해금 회복을 위한 법률 지원을 제공하고 있습니다.
피해 상황을 구체적으로 파악하여 맞춤형 대응 전략을 수립해드립니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 무료 상담 및 문의
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 카카오톡 채널: http://pf.kakao.com/_xcypmn/chat
📞 전화 상담: 02-6952-3695 (평일 09:00~18:00)
🌐 피해 사례 상세 정보: ${pageUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${tagBase} ${extraTags}
`

  return article.trim()
}
