export type CaseCategory = {
  id: string
  title: string
  shortTitle: string
  href: string
  description: string
  keywords: string[]
  match: RegExp
}

export const caseCategories: CaseCategory[] = [
  {
    id: "teammission",
    title: "팀미션 사기",
    shortTitle: "팀미션",
    href: "/cases/teammission",
    description:
      "쇼핑몰, 여행사, 체험단, 리뷰·주문대행 방식의 부업 사칭 사건입니다.",
    keywords: ["쇼핑몰", "여행사", "체험단", "리뷰·주문대행"],
    match:
      /팀미션|부업|쇼핑몰|마켓|스토어|몰|체험단|리뷰|주문|구매대행|예약|여행|여행사|항공|숙박|영화|예매|배급사|브릭|mall|market|shop|store|mission|review|travel|trip|tour/i,
  },
  {
    id: "stock-room",
    title: "주식리딩방 사기",
    shortTitle: "주식리딩방",
    href: "/cases/stock-room",
    description:
      "공모주·비상장, 전문가·증권사 사칭, 해외선물과 투자 플랫폼 사칭 사건입니다.",
    keywords: ["공모주·비상장", "전문가·증권사 사칭", "해외선물", "HTS"],
    match:
      /주식|리딩방|투자|전문가|증권|증권사|공모주|비상장|해외선물|선물|fx|마진|hts|mts|etf|cfd|asset|stock|futures|investment|invest|trading|trader|trade|securities|골드드림|세력트레이딩|allspring|daishin|fwrd6|sample-traders/i,
  },
  {
    // broadcast-exchange를 crypto-room 앞에 배치:
    // "라이브|방송|환전+코인" 혼합 케이스가 코인 패턴에 먼저 걸리는 오분류 방지
    // (getCaseCategoryForText는 배열 순서대로 첫 번째 매칭을 반환)
    id: "broadcast-exchange",
    title: "방송환전 사기",
    shortTitle: "방송환전",
    href: "/cases/broadcast-exchange",
    description:
      "라이브 방송, 포인트 환전, 채팅·만남 유도 방식의 사칭 사건입니다.",
    keywords: ["라이브 방송", "포인트 환전", "채팅", "만남 유도"],
    match:
      /방송|라이브|환전|포인트|채팅|만남|미팅|소개팅|티켓|스타티켓|live|point|chat|ticket/i,
  },
  {
    id: "crypto-room",
    title: "코인리딩방 사기",
    shortTitle: "코인리딩방",
    href: "/cases/crypto-room",
    description:
      "코인, 월렛, 거래소 사칭, 스테이킹 유도형 가상자산 사건입니다.",
    keywords: ["코인", "월렛", "거래소 사칭", "스테이킹"],
    match:
      /코인|가상자산|암호화폐|거래소|월렛|지갑|스테이킹|토큰|선물거래|coin|crypto|wallet|exchange|staking|token|phantom|polygon|webull|bit|nexo|doge|axs|pundiai|vobitex|luckykr/i,
  },
]

export function getCaseCategoryById(id: string) {
  return caseCategories.find((category) => category.id === id)
}

export function getCaseCategoryForText(value: string) {
  return (
    caseCategories.find((category) => category.match.test(value)) ||
    caseCategories[1]
  )
}

export function getPublicCaseCategories() {
  return caseCategories.map(({ id, title, shortTitle, href, description, keywords }) => ({
    id,
    title,
    shortTitle,
    href,
    description,
    keywords,
  }))
}
