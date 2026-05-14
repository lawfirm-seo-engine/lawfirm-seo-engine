const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

/*
========================================
입력 사건명
========================================
*/

const args = process.argv.slice(2)
const imageOnly = args.includes("--image-only")

function readOption(name) {
  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))

  if (inline) return inline.slice(prefix.length).trim()

  const index = args.indexOf(name)

  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith("--")) {
    return args[index + 1].trim()
  }

  return ""
}

const explicitGroupId = readOption("--group")
const explicitRepresentativeSlug = readOption("--representative")
const caseName = args
  .filter((arg, index) => {
    if (arg === "--image-only") return false
    if (arg === "--group" || arg === "--representative") return false
    if (index > 0 && (args[index - 1] === "--group" || args[index - 1] === "--representative")) {
      return false
    }
    if (arg.startsWith("--group=") || arg.startsWith("--representative=")) return false

    return true
  })
  .join(" ")
  .trim()

if (!caseName) {
  console.error("사건명을 입력하세요.")
  process.exit(1)
}

const cleanCaseName = caseName.trim().replace(/\s+/g, " ")
const caseDisplayName = cleanCaseName.includes("사칭")
  ? cleanCaseName
  : `${cleanCaseName} (사칭)`

/*
========================================
slug 생성
========================================
*/

const slug = cleanCaseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const root = process.cwd()

const casesDir = path.join(
  root,
  "content",
  "daeonlawfintech",
  "cases"
)

const templatePath = path.join(casesDir, "_template.mdx")

const outputPath = path.join(
  casesDir,
  `${slug}.mdx`
)

if (!fs.existsSync(templatePath)) {
  console.error("_template.mdx 없음")
  process.exit(1)
}

if (!imageOnly && fs.existsSync(outputPath)) {
  console.error("이미 존재")
  process.exit(1)
}

/*
========================================
cluster 정규화 엔진
========================================
*/

function normalizeCluster(text) {
  return text
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(
      /\.(com|net|org|co|kr|vip|shop|site|store|io)/g,
      ""
    )
    .replace(
      /사기|사칭|피해|사례|대응|거래소|쇼핑몰|리딩방|공모주|비상장|골드바/g,
      ""
    )
    .replace(
      /market|mall|shop|store|company|investment|finance|securities/g,
      ""
    )
    .replace(/[0-9]/g, "")
    .replace(/[^a-z가-힣]/g, "")
}

const domainPattern =
  /[a-z0-9-]+(?:\.[a-z0-9-]+)+/i

const genericKoreanTokens = new Set([
  // 사기 유형 공통 동사·형용사
  "사기",
  "사칭",
  "피해",
  "사례",
  "대응",
  "피해회복",
  // 투자·금융 공통어 (브랜드 식별 불가)
  "투자",
  "리딩방",
  "거래소",
  "증권사",
  // 쇼핑·미션 유형 공통어
  "쇼핑몰",
  "부업",
  "체험단",
  "팀미션",      // 영화사·쇼핑몰 등 여러 유형에서 공통으로 사용
  "구매대행",
  // 영화사 유형 공통어 — 상호가 다른 케이스를 잘못 묶는 원인
  "영화예매",    // '영화예매' 단어만으로 동일 그룹 판정하면 오분류 발생
  "영상구매",
  "영화투자",
  "영화티켓",
  // 여행·쇼핑 유형 공통어
  "여행예약",
  "패키지구매",
])

const genericEnglishTokens = new Set([
  "app",
  "bar",
  "bit",
  "biz",
  "com",
  "co",
  "coin",
  "company",
  "corp",
  "crypto",
  "exchange",
  "finance",
  "financial",
  "georaeso",
  "gongmoju",
  "global",
  "gold",
  "group",
  "inc",
  "investment",
  "invest",
  "io",
  "koin",
  "kr",
  "korea",
  "ltd",
  "mall",
  "market",
  "me",
  "net",
  "org",
  "pihae",
  "pihaehoebog",
  "pihaehoebok",
  "saching",
  "sagi",
  "salye",
  "sarye",
  "securities",
  "shop",
  "site",
  "stock",
  "store",
  "syopingmol",
  "top",
  "trade",
  "trading",
  "tuja",
  "tujasagi",
  "vip",
  "wallet",
  "xyz",
])

const aliasGroups = [
  ["bellaxb", "벨라비"],
  ["deepellie", "디프엘리"],
  ["daishin", "대신증권"],
  ["allspring", "allspringmin", "\uace8\ub4dc\ub4dc\ub9bc", "goldeudeulim"],
]

const representativeRules = [
  {
    representativeSlug: "d2-\uace8\ub4dc\ub4dc\ub9bc-\uc0ac\uae30-allspring-min-\uc0ac\uce6d",
    tokens: ["allspring", "allspringmin", "\uace8\ub4dc\ub4dc\ub9bc", "goldeudeulim"],
  },
]

function hasDomainKeyword(text) {
  return domainPattern.test(text)
}

function hasLatinKeyword(text) {
  return /[a-z]/i.test(text)
}

// ============================================================
// 사건 유형 감지 (9종)
// 우선순위: 로맨스스캠 > 라이브방송 > 영화사 > 여행사 > 부업 > 코인 > 주식리딩방 > 쇼핑몰 > 기타
// ============================================================

function detectCaseType(text) {
  const v = text.toLowerCase()

  if (/채팅|만남|데이트|로맨스/.test(v)) return "로맨스스캠"
  if (/라이브|방송|live/.test(v) && !/영화|필름|film/.test(v)) return "라이브방송"
  if (/필름|film|스튜디오|studio|픽쳐스|pictures|시네마|cinema|영화/.test(v)) return "영화사"
  if (/투어|tour|트레블|트래블|travel|관광|트립|여행/.test(v)) return "여행사"
  if (/체험|체험단|구매대행|대리구매|리뷰|부업|알바/.test(v)) return "부업"
  if (/코인|coin|월렛|wallet|거래소|비트|크립토|crypto|체인|chain|usdc|usdt|테더|리플|btc|비티씨|토큰|token|채굴|스테이킹/.test(v)) return "코인"
  if (/전문가|교수|애널리스트|매니저|증권사|금융사|인베스트먼트|investment|캐피탈|capital|에셋|asset|뱅크|bank|나스닥|공모주|비상장|기관주|해외선물|etf|cfd|지수거래|리딩방|증권/.test(v)) return "주식리딩방"
  if (/몰|mall|무역|장터|샵|shop|마켓|market|쇼핑|shopping/.test(v)) return "쇼핑몰"

  return "기타"
}

// ============================================================
// 유형별 콘텐츠 세부 데이터
// ============================================================

const TYPE_DETAILS = {
  "쇼핑몰": {
    label: "쇼핑몰·팀미션",
    caseType: "쇼핑몰 팀미션 사기",
    approach: "쇼핑몰 구매 대행, 리뷰 미션, 팀미션 주문 처리 방식",
    victimAction: "상품 주문 처리나 리뷰 미션 수행",
    mechanism: "주문 금액, 정산 포인트, 등급 업그레이드비, 주문 오류 해결비",
    delayType: "정산 지연·환불 거부",
    checklistItems: ["쇼핑몰 사이트 화면 및 주문 내역 캡처","정산 화면 및 수익금 표시 캡처","주문 처리 요청 내역과 입금 금액","담당자와의 카카오톡·텔레그램 대화","입금 계좌와 예금주 정보","환불 또는 출금 거부 답변 캡처"],
    caseA: "쇼핑몰 미션을 통해 소액 주문 처리를 진행하며 수익이 쌓이는 것처럼 보이지만, 일정 단계에서 주문 오류 또는 등급 부족을 이유로 해결 비용 입금을 요구받는 흐름입니다. 정산금은 실제로 출금되지 않습니다.",
    caseB: "구매 대행 업무처럼 안내받고 상품 결제를 대신 진행했으나, 정산이 지연된 상태에서 다음 주문 처리 비용까지 요구받은 유형입니다. 담당자와의 연락이 끊기거나 사이트가 폐쇄되는 경우도 있습니다.",
    caseC: "환불 또는 출금을 요청하자 계정 인증, 주문 미완료, 세금 납부 등의 명목으로 추가 입금을 요구받은 유형입니다. 추가 입금을 해도 문제가 해결되지 않습니다.",
    stopMessage: "정산이 지연되거나 추가 입금 요구가 발생했다면 즉시 송금을 중단해야 합니다. 주문 처리를 계속할수록 피해 금액만 늘어납니다.",
    descSuffix: "쇼핑몰 사칭·팀미션 사기 피해 신고. 주문 대행·정산 지연·추가 입금 요구 피해 사례 및 피해금 회복 방법 안내.",
  },
  "여행사": {
    label: "여행사·팀미션",
    caseType: "여행사 팀미션 사기",
    approach: "여행 패키지 예약 대행, 여행사 팀미션, 여행 상품 투자 안내",
    victimAction: "여행 상품 예약이나 패키지 결제 대행",
    mechanism: "예약금, 위약금, 비자·세금 수수료, 추가 좌석 비용",
    delayType: "예약 확정 지연·환불 거부",
    checklistItems: ["여행사 사이트 또는 예약 시스템 화면 캡처","여행 패키지 예약 확인서 및 일정표","입금 요청 내역과 계좌 정보","담당자와의 카카오톡·텔레그램 대화","환불 거부 또는 추가 납부 안내 내용","취소 불가 통보 내용"],
    caseA: "여행 패키지 예약을 대행해 주겠다는 안내를 받고 예약금을 입금했지만, 이후 비자 수수료나 추가 좌석 비용 명목으로 반복 입금을 요구받은 유형입니다. 실제 예약이 이루어지지 않거나 확인이 불가능합니다.",
    caseB: "여행사 팀미션을 통해 예약 건당 수익이 발생한다는 안내를 받고 투자금을 넣었으나, 출금 시 위약금·세금 납부를 요구받은 유형입니다. 정상 여행사 예약 시스템처럼 보이는 화면을 활용합니다.",
    caseC: "환불을 요청하자 취소 위약금이 전액 발생한다거나, 예약 오류 해결을 위한 추가 비용을 먼저 납부해야 한다는 안내를 받은 유형입니다.",
    stopMessage: "추가 비용 납부 요구가 있다면 송금을 멈추고 기존 대화와 예약 내역을 먼저 보존하세요.",
    descSuffix: "여행사 사칭·팀미션 사기 피해 신고. 여행 예약금·위약금·수수료 명목 금전 편취 피해 사례 및 대응 안내.",
  },
  "영화사": {
    label: "영화사·팀미션",
    caseType: "영화사 팀미션 사기",
    approach: "영화사 직원 사칭, 영상 구매 팀미션, 영화 투자 권유",
    victimAction: "영상 구매 미션 수행이나 영화 투자 참여",
    mechanism: "영상 구매 비용, 미션 포인트, 출금 조건 미달 비용, 세금",
    delayType: "포인트 출금 거부·미션 실패 통보",
    checklistItems: ["영화사 사이트 또는 미션 앱 화면 캡처","영상 구매 내역 및 미션 완료 화면","포인트 또는 수익 표시 화면","담당자와의 카카오톡·텔레그램 대화","출금 거부 또는 조건 제시 내용","입금 계좌와 예금주 정보"],
    caseA: "영화사 직원을 자칭한 담당자로부터 영상 구매 팀미션 참여 안내를 받은 뒤, 영상을 구매하면서 포인트가 적립되는 구조로 진행됩니다. 출금 시 특정 미션 달성이나 세금 납부를 조건으로 추가 입금을 요구합니다.",
    caseB: "영화 제작 투자 명목으로 소액부터 큰 금액까지 단계적으로 입금을 유도하는 유형입니다. 수익 배당이 발생한다고 안내하지만 실제 출금은 이루어지지 않습니다.",
    caseC: "미션을 완료하고 출금을 신청하자 계정 등급이 부족하다거나 세금을 먼저 납부해야 한다는 안내를 받은 유형입니다. 추가 납부 후에도 출금이 되지 않습니다.",
    stopMessage: "출금 조건이나 세금 납부를 요구받고 있다면 추가 입금을 즉시 중단하세요.",
    descSuffix: "영화사 사칭·팀미션 사기 피해 신고. 영상 구매 미션·수익 출금 거부 피해 사례 및 피해금 회복 방법 안내.",
  },
  "부업": {
    label: "부업·팀미션",
    caseType: "부업 팀미션 사기",
    approach: "앱테크, SNS 부업, 체험단, 영상 시청 알바 안내",
    victimAction: "영상 시청, 리뷰 작성, 체험단 미션 수행",
    mechanism: "포인트 적립, 등급 업그레이드비, 환전 수수료, 보증금",
    delayType: "환전 불가·포인트 지급 거부",
    checklistItems: ["부업 앱 또는 사이트 화면 캡처","임무 수행 내역 및 포인트 화면","담당자와의 카카오톡·텔레그램 대화","등급 또는 환전 조건 안내 내용","입금 계좌와 예금주 정보","환전 거부 또는 추가 비용 요구 내용"],
    caseA: "영상 시청이나 리뷰 작성으로 포인트를 적립하는 방식으로 시작하지만, 환전 신청 시 보증금이나 등급 업그레이드 비용을 요구받는 유형입니다. 입금해도 환전이 이루어지지 않습니다.",
    caseB: "체험단 또는 구매 대행 부업처럼 안내받고 상품 구매비를 본인이 먼저 결제했으나, 정산이 지연되며 다음 임무 비용까지 요구받는 유형입니다.",
    caseC: "일정 금액 이상 포인트를 모은 후 환전을 신청하자 계정 인증비, 수수료, 세금을 이유로 추가 입금을 요구받은 유형입니다.",
    stopMessage: "환전 수수료나 보증금 요구가 발생했다면 추가 입금을 중단하고 기존 자료를 보존하세요.",
    descSuffix: "부업·팀미션 사기 피해 신고. 알바·체험단·리뷰 미션 빙자 금전 편취 피해 사례 및 대응 안내.",
  },
  "주식리딩방": {
    label: "주식리딩방·투자",
    caseType: "주식리딩방 투자 사기",
    approach: "카카오 오픈채팅, 텔레그램 투자 채널, 전문가·애널리스트 자칭",
    victimAction: "리딩방 가입 후 추천 종목 투자 또는 자금 이체",
    mechanism: "증거금, 세금 선납, VIP 수수료, 수익 출금 조건",
    delayType: "수익 출금 지연·세금 선납 요구",
    checklistItems: ["리딩방 채팅 화면 및 수익 인증 캡처","투자 플랫폼 또는 HTS 화면","입금 내역과 계좌 정보","전문가·매니저와의 대화 내용","출금 거부 또는 세금 납부 안내 내용","VIP 가입 안내 및 추가 비용 요구 내용"],
    caseA: "텔레그램이나 카카오 오픈채팅에서 전문가를 자칭한 담당자로부터 종목 추천을 받아 투자했고, 수익이 발생했다는 화면을 보여주며 추가 증거금을 요구받은 유형입니다. 실제 수익은 허위입니다.",
    caseB: "소액 투자로 수익을 확인한 뒤 더 큰 금액을 넣었으나, 출금 시 세금 선납 또는 수익금 공증비를 요구받은 유형입니다. 납부 후에도 출금이 이루어지지 않습니다.",
    caseC: "리딩방 VIP 멤버십 가입을 안내받고 가입비를 납부했으나, 이후에도 계속 추가 비용을 요구받거나 담당자와 연락이 끊긴 유형입니다.",
    stopMessage: "세금 선납이나 증거금 추가 요구가 있다면 즉시 송금을 중단하세요. 정상 증권사는 절대 개인 계좌로 세금 납부를 요구하지 않습니다.",
    descSuffix: "주식리딩방·투자 사기 피해 신고. 허위 수익 인증·증거금·세금 명목 금전 편취 피해 사례 및 피해금 회복 안내.",
  },
  "코인": {
    label: "코인·가상자산",
    caseType: "코인 가상자산 사기",
    approach: "텔레그램 코인 채널, 가상자산 거래소 사칭, 스테이킹 수익 안내",
    victimAction: "코인 투자 또는 스테이킹 참여",
    mechanism: "스테이킹 기간 중 출금 불가, 출금 세금, 지갑 잠금 해제 수수료",
    delayType: "출금 불가·지갑 잠금·세금 요구",
    checklistItems: ["코인 거래소 또는 투자 플랫폼 화면 캡처","스테이킹 또는 수익 내역 화면","지갑 주소 및 입금 내역","담당자와의 텔레그램·카카오톡 대화","출금 불가 또는 수수료 요구 안내 내용","송금한 코인 또는 현금 내역"],
    caseA: "텔레그램 코인 채널에서 스테이킹 수익을 안내받고 투자했으나, 스테이킹 기간 종료 후 출금 시 세금·수수료 명목으로 추가 납부를 요구받은 유형입니다. 납부 후에도 출금이 이루어지지 않습니다.",
    caseB: "정상 거래소처럼 보이는 사이트에 코인을 입금했으나, 출금 신청 시 지갑 잠금 해제 비용이나 법적 공증비를 요구받은 유형입니다.",
    caseC: "채굴 수익 배당을 안내받고 초기 투자금을 납부했으나, 이후 추가 채굴 참여 비용이나 출금 조건 달성 비용을 반복 요구받은 유형입니다.",
    stopMessage: "출금 수수료나 지갑 잠금 해제 비용 요구가 있다면 즉시 추가 납부를 중단하세요. 정상 거래소는 출금 시 외부 수수료를 요구하지 않습니다.",
    descSuffix: "코인거래소 사칭·가상자산 투자 사기 피해 신고. 스테이킹 수익 출금 불가·세금 명목 피해 사례 및 대응 안내.",
  },
  "라이브방송": {
    label: "라이브방송·팀미션",
    caseType: "라이브방송 팀미션 사기",
    approach: "라이브 커머스 미션, 방송 시청 팀미션, 포인트 적립 부업 안내",
    victimAction: "방송 시청이나 후원 미션 수행",
    mechanism: "포인트 적립, 환전 수수료, 방송 참여비, 등급 업그레이드비",
    delayType: "포인트 환전 불가·계정 잠금",
    checklistItems: ["라이브 방송 플랫폼 화면 캡처","포인트 적립 및 수익 화면","담당자와의 카카오톡·텔레그램 대화","환전 신청 및 거부 내용","입금 계좌와 예금주 정보","추가 비용 요구 안내 내용"],
    caseA: "라이브 방송을 시청하거나 후원을 누르는 미션을 수행하면 포인트가 쌓인다는 안내를 받았으나, 환전 신청 시 수수료나 보증금 납부를 요구받은 유형입니다.",
    caseB: "방송 참여 팀미션으로 수익이 발생한다는 안내를 받고 참여비를 납부했지만, 이후 등급 업그레이드나 추가 방송 참여비를 계속 요구받은 유형입니다.",
    caseC: "포인트를 일정 수준 이상 적립한 후 환전을 신청하자 계정 등급이 부족하다거나 세금 납부를 조건으로 제시받은 유형입니다.",
    stopMessage: "환전 수수료나 참여비 추가 요구가 발생했다면 송금을 중단하고 기존 화면을 캡처해 보존하세요.",
    descSuffix: "라이브방송·팀미션 사기 피해 신고. 포인트 환전 불가·방송 미션 빙자 금전 편취 피해 사례 및 대응 안내.",
  },
  "로맨스스캠": {
    label: "로맨스스캠",
    caseType: "로맨스스캠 사기",
    approach: "SNS·채팅앱 친구 추가, 호감 형성 후 투자 또는 비용 요청",
    victimAction: "상대방 요청에 따른 투자 또는 비용 대납",
    mechanism: "가상자산 투자, 공항 세관 대납, 귀국 비용, 비상금 요청",
    delayType: "투자 출금 불가·추가 비용 반복 요구",
    checklistItems: ["SNS 또는 채팅앱 대화 내역 전체","상대방 프로필 사진 및 계정 정보","송금 내역과 계좌 또는 지갑 주소","투자 플랫폼 화면 캡처","비용 요청 내용 및 사유 설명","상대방이 보내온 사진·영상·서류"],
    caseA: "외국인 또는 해외 교포를 자칭하는 상대방과 SNS에서 연락을 주고받다가, 본인이 운영 중인 투자 플랫폼을 소개받고 투자금을 입금한 유형입니다. 출금 시 세금 납부나 공증비를 요구받습니다.",
    caseB: "공항이나 세관에 물건이 묶였다며 통관 비용 대납을 요청받은 유형입니다. 비용을 납부해도 추가 명목으로 계속 요구가 이어집니다.",
    caseC: "갑작스러운 의료비나 비상 상황을 이유로 송금을 요청받은 유형입니다. 상대방이 신뢰를 쌓은 후 반복적으로 금전을 요청합니다.",
    stopMessage: "상대방과의 연락을 유지한 채로 추가 금전 요청에 응하면 피해가 커집니다. 대화 내역을 보존하고 즉시 상담하세요.",
    descSuffix: "로맨스스캠 사기 피해 신고. SNS 만남·채팅 후 투자 유도·비용 대납 요구 피해 사례 및 피해금 회복 안내.",
  },
  "기타": {
    label: "사칭",
    caseType: "사칭 사기",
    approach: "메신저, SNS, 광고를 통한 접근",
    victimAction: "담당자 안내에 따른 투자 또는 결제",
    mechanism: "결제금, 보증금, 세금, 수수료",
    delayType: "출금 지연·환불 거부",
    checklistItems: ["사이트 또는 앱 화면 캡처","입금 내역과 계좌 정보","담당자와의 대화 내용","출금 거부 또는 추가 비용 요구 내용","관련 서류 또는 계약서","담당자 연락처 및 프로필 정보"],
    caseA: "처음에는 소액 결제로 신뢰를 쌓은 뒤 점차 큰 금액의 입금을 유도하는 유형입니다. 정산이나 출금 단계에서 추가 비용을 요구합니다.",
    caseB: "정상 업체처럼 보이는 사이트나 앱을 통해 결제를 유도하고, 환불이나 출금 요청 시 계정 오류나 세금 납부를 이유로 거부하는 유형입니다.",
    caseC: "추가 입금을 해도 문제가 해결되지 않고, 담당자와의 연락이 점점 줄어들다 결국 끊어지는 유형입니다.",
    stopMessage: "추가 입금 요구가 있다면 즉시 송금을 중단하고 기존 자료를 보존하는 것이 우선입니다.",
    descSuffix: "사칭 사기 피해 신고. 허위 투자 권유·출금 지연·추가 입금 요구 피해 사례 및 피해금 회복 방법 안내.",
  },
}

function getTypeDetails(text) {
  return TYPE_DETAILS[detectCaseType(text)] || TYPE_DETAILS["기타"]
}

// ── SEO 키워드 추출 (page.tsx와 동일 로직) ──────────────────────────────────
const AFTER_HARD_STOP = new Set([
  "피해", "허위", "사례", "어플", "앱", "안내", "복구", "신고", "방법", "경고", "주의",
])
const AFTER_BRAND_STOP = new Set([
  "사칭", "리딩방", "해외선물", "지수거래", "자동매매", "투자", "코인", "비트코인", "국내주식",
])

function extractSeoKeyword(caseName) {
  const match = caseName.match(/^(.*?)\s+사기(?:\s+(.*))?$/)
  if (!match) return caseName
  const beforePart = (match[1] || "").trim()
  const afterPart  = (match[2] || "").trim()
  if (!afterPart) return `${beforePart} 사기`

  const hasSachingBefore = beforePart.split(/\s+/).includes("사칭")
  const taken = []

  for (const token of afterPart.split(/\s+/).filter(Boolean)) {
    if (token === "사칭" && hasSachingBefore) break
    if (AFTER_HARD_STOP.has(token)) break
    if (AFTER_BRAND_STOP.has(token)) {
      if (taken.length === 0) taken.push(token)
      break
    }
    if (/[A-Za-z]/.test(token)) { taken.push(token); break }
    taken.push(token)
  }

  const afterStr = taken.join(" ")
  return afterStr ? `${beforePart} 사기 ${afterStr}` : `${beforePart} 사기`
}

// caseType별 title / H1 suffix (create-case.js의 detectCaseType 기준)
const CREATE_SUFFIX_MAP = {
  "주식리딩방": { typeWord: "리딩방",   titleSuffix: "리딩방 피해 사례",   h1Suffix: "리딩방 피해 신고와 구제 방안"   },
  "코인":       { typeWord: "코인",     titleSuffix: "코인 피해 사례",     h1Suffix: "코인 피해 신고와 구제 방안"     },
  "쇼핑몰":     { typeWord: "쇼핑몰",   titleSuffix: "쇼핑몰 피해 사례",   h1Suffix: "쇼핑몰 피해 신고와 구제 방안"   },
  "여행사":     { typeWord: "여행사",   titleSuffix: "여행사 피해 사례",   h1Suffix: "여행사 피해 신고와 구제 방안"   },
  "영화사":     { typeWord: "영화사",   titleSuffix: "영화사 피해 사례",   h1Suffix: "영화사 피해 신고와 구제 방안"   },
  "부업":       { typeWord: "부업",     titleSuffix: "부업 피해 사례",     h1Suffix: "부업 피해 신고와 구제 방안"     },
  "라이브방송": { typeWord: "방송",     titleSuffix: "방송 피해 사례",     h1Suffix: "방송 피해 신고와 구제 방안"     },
  "로맨스스캠": { typeWord: "로맨스스캠", titleSuffix: "로맨스스캠 피해 사례", h1Suffix: "로맨스스캠 피해 신고와 구제 방안" },
  "기타":       { typeWord: "사칭",     titleSuffix: "사칭 피해 사례",     h1Suffix: "사칭 피해 신고와 구제 방안"     },
}

function buildTypedTitle(caseName, kind) {
  const extracted  = extractSeoKeyword(caseName)
  const caseType   = detectCaseType(`${caseName}`)
  const map        = CREATE_SUFFIX_MAP[caseType] || CREATE_SUFFIX_MAP["기타"]
  const lastToken  = extracted.split(" ").pop() || ""
  const noTypeWord = lastToken === map.typeWord
  const suffix = noTypeWord
    ? (kind === "meta" ? "피해 사례" : "피해 신고와 구제 방안")
    : (kind === "meta" ? map.titleSuffix : map.h1Suffix)
  return `${extracted} ${suffix}`
}

// ============================================================
// 유형별 진행 단계 표 데이터 (섹션 8)
// ============================================================

const TYPE_TABLES = {
  "주식리딩방": [
    { stage: "1단계", flow: "접근 및 관심 유도",        method: "SNS 광고, 문자, 오픈채팅, 리딩방 초대 등을 통해 투자 성공 사례와 고수익 정보를 강조",              analysis: "무료 투자 기회로 보이지만 실제로는 투자 관심층 확보 목적" },
    { stage: "2단계", flow: "관계 형성 및 신뢰 구축",    method: "전문가·애널리스트·매니저 등을 사칭하며 상담과 수익 인증 자료 전달",                              analysis: "실제 전문가로 믿게 만들어 경계심을 낮추는 단계" },
    { stage: "3단계", flow: "소액 참여 및 성과 연출",    method: "소액 투자 유도 후 플랫폼 화면에 수익 증가·적중 사례 등을 허위 표시",                            analysis: "수익이 발생했다고 믿게 하여 추가 투자를 유도" },
    { stage: "4단계", flow: "고액 투자 및 플랫폼 이용 유도", method: "VIP 투자, 특별 종목, 해외 거래 등을 명목으로 가짜 사이트·앱 가입 요구",                     analysis: "정상 투자 플랫폼처럼 보이지만 자금 통제 목적" },
    { stage: "5단계", flow: "출금 지연 및 추가 비용 요구", method: "출금 시 세금, 보증금, 인증비 등의 명목으로 추가 입금 요구",                                    analysis: "출금 가능하다고 믿게 하며 반복 입금을 유도" },
    { stage: "6단계", flow: "잠적 및 플랫폼 종료",       method: "추가 송금 이후 연락 차단, 단체방 강퇴, 사이트 폐쇄 진행",                                        analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "코인": [
    { stage: "1단계", flow: "접근 및 관심 유도",         method: "텔레그램 코인 채널, SNS 광고를 통해 고수익 스테이킹·채굴 정보를 강조",                           analysis: "가상자산 투자 관심층 확보 목적" },
    { stage: "2단계", flow: "전문가 신뢰 구축",          method: "가상자산 전문가·트레이더를 사칭하며 수익 인증 자료·차트 전달",                                    analysis: "코인 전문가로 믿게 만들어 경계심을 낮추는 단계" },
    { stage: "3단계", flow: "소액 투자 및 수익 연출",    method: "소액 입금 후 플랫폼 화면에 수익·이자를 허위 표시",                                               analysis: "출금 가능하다고 믿게 하여 추가 입금을 유도" },
    { stage: "4단계", flow: "고액 투자 및 전용 플랫폼 유도", method: "특별 채굴 풀, 프리미엄 스테이킹 명목으로 가짜 거래소·월렛 앱 가입 요구",                    analysis: "정상 거래소처럼 보이지만 자금 통제 목적" },
    { stage: "5단계", flow: "출금 불가 및 비용 요구",    method: "출금 시 지갑 잠금 해제 수수료, 세금, 공증비 명목으로 추가 입금 요구",                            analysis: "출금 가능하다고 믿게 하며 반복 입금을 유도" },
    { stage: "6단계", flow: "잠적 및 플랫폼 종료",       method: "추가 송금 이후 연락 차단, 텔레그램 방 삭제, 사이트 폐쇄 진행",                                   analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "쇼핑몰": [
    { stage: "1단계", flow: "접근 및 모집",              method: "SNS 광고, 문자, 카카오톡으로 쇼핑몰 구매 대행·팀미션 아르바이트 안내",                           analysis: "정상 부업처럼 보이도록 유도" },
    { stage: "2단계", flow: "소액 미션 및 정산 경험",    method: "소액 주문 처리 후 수수료 정산 경험 제공",                                                         analysis: "실제 정산이 된다는 신뢰 형성 단계" },
    { stage: "3단계", flow: "미션량 증가 및 고액 유도",  method: "등급 상승, 더 많은 주문 처리로 수익 증가 유도",                                                   analysis: "더 큰 금액을 투입하도록 유도" },
    { stage: "4단계", flow: "주문 오류 및 비용 요구",    method: "주문 오류, 등급 부족, 계정 잠금 명목으로 추가 입금 요구",                                         analysis: "문제 해결 명목으로 반복 입금을 유도" },
    { stage: "5단계", flow: "출금·정산 지연",            method: "정산 조건 미달, 세금 납부, 보증금 명목으로 출금 거부",                                             analysis: "피해금 회수 명목으로 추가 입금을 유도" },
    { stage: "6단계", flow: "잠적 및 사이트 폐쇄",       method: "담당자 연락 차단, 사이트 종료 진행",                                                              analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "여행사": [
    { stage: "1단계", flow: "접근 및 모집",              method: "SNS 광고, 문자로 여행사 예약 대행·팀미션 아르바이트 안내",                                        analysis: "정상 여행사 대리 업무처럼 보이도록 유도" },
    { stage: "2단계", flow: "소액 예약 처리 및 수수료 경험", method: "소액 예약금 처리 후 수수료 지급으로 신뢰 형성",                                               analysis: "실제 수익이 발생한다는 신뢰 구축 단계" },
    { stage: "3단계", flow: "고액 패키지 예약 유도",     method: "더 높은 수수료의 해외 패키지·VIP 상품 예약 대행 요청",                                            analysis: "더 큰 금액을 투입하도록 유도" },
    { stage: "4단계", flow: "예약 오류 및 추가 비용 요구", method: "비자 수수료, 추가 좌석비, 세금 명목으로 입금 요구",                                             analysis: "문제 해결 명목으로 반복 입금을 유도" },
    { stage: "5단계", flow: "환불 거부 및 위약금 통보",  method: "취소 위약금 발생, 환불 불가 통보, 추가 오류 해결비 요구",                                          analysis: "기납입금 회수 명목으로 추가 입금을 유도" },
    { stage: "6단계", flow: "잠적",                      method: "담당자 연락 차단, 예약 확인 불가, 사이트 폐쇄 진행",                                              analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "영화사": [
    { stage: "1단계", flow: "접근 및 모집",              method: "SNS 광고, 문자로 영화사 영상 구매 미션 아르바이트 안내",                                           analysis: "정상 미디어 플랫폼 이용처럼 보이도록 유도" },
    { stage: "2단계", flow: "소액 영상 구매 및 포인트 적립", method: "소액 영상 구매 후 포인트 적립 확인",                                                          analysis: "실제 수익이 쌓인다는 신뢰 형성 단계" },
    { stage: "3단계", flow: "미션 확대 및 등급 안내",    method: "등급 상승으로 더 많은 포인트 유도, 추가 영상 구매 요청",                                           analysis: "더 큰 금액 투입을 유도" },
    { stage: "4단계", flow: "출금 조건 제시 및 비용 요구", method: "미션 달성 조건, 세금 선납, 등급 업그레이드비 요구",                                              analysis: "포인트 출금을 위한 추가 입금을 유도" },
    { stage: "5단계", flow: "추가 비용 반복 요구",       method: "납부 후에도 새로운 조건 추가, 계정 오류 명목 반복 요구",                                           analysis: "출금 가능하다는 믿음 유지하며 반복 입금을 유도" },
    { stage: "6단계", flow: "잠적 및 플랫폼 종료",       method: "담당자 연락 차단, 미션 앱·사이트 폐쇄 진행",                                                      analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "부업": [
    { stage: "1단계", flow: "접근 및 모집",              method: "SNS 광고, 문자, 카카오톡으로 재택 가능 부업·체험단 안내",                                          analysis: "진입장벽 낮은 간단한 부업처럼 보이도록 유도" },
    { stage: "2단계", flow: "초기 미션 및 포인트 적립",  method: "영상 시청, 리뷰 작성, 체험단 활동으로 포인트 적립",                                                analysis: "실제 수익이 쌓인다는 신뢰 형성 단계" },
    { stage: "3단계", flow: "포인트 누적 및 등급 안내",  method: "등급 상승으로 더 많은 포인트·수익 유도",                                                           analysis: "환전 기대감으로 추가 미션 참여를 유도" },
    { stage: "4단계", flow: "환전 조건 제시 및 비용 요구", method: "보증금, 등급 업그레이드비, 인증비 명목으로 입금 요구",                                           analysis: "포인트 환전을 위한 추가 입금을 유도" },
    { stage: "5단계", flow: "추가 비용 반복 요구",       method: "납부 후에도 수수료·세금 명목 새 조건을 반복 추가",                                                 analysis: "환전 가능하다는 믿음 유지하며 반복 입금을 유도" },
    { stage: "6단계", flow: "잠적",                      method: "담당자 연락 차단, 플랫폼 폐쇄 진행",                                                              analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "라이브방송": [
    { stage: "1단계", flow: "접근 및 모집",              method: "SNS 광고, 문자, 카카오톡으로 라이브 방송 시청 부업 안내",                                          analysis: "스마트폰만으로 가능한 간단한 부업처럼 유도" },
    { stage: "2단계", flow: "방송 시청 미션 및 포인트 적립", method: "방송 시청·후원 클릭으로 포인트 적립 경험 제공",                                               analysis: "실제 수익이 발생한다는 신뢰 형성 단계" },
    { stage: "3단계", flow: "포인트 누적 및 등급 안내",  method: "등급 상승·참여 확대로 더 많은 포인트 유도",                                                        analysis: "환전 기대감으로 추가 참여를 유도" },
    { stage: "4단계", flow: "환전 조건 및 비용 요구",    method: "환전 수수료, 보증금, 방송 참여비 명목으로 입금 요구",                                              analysis: "포인트 환전을 위한 추가 입금을 유도" },
    { stage: "5단계", flow: "추가 비용 반복 요구",       method: "납부 후에도 계정 등급·세금 명목으로 반복 요구",                                                    analysis: "환전 가능하다는 믿음 유지하며 반복 입금을 유도" },
    { stage: "6단계", flow: "잠적",                      method: "담당자 연락 차단, 플랫폼 폐쇄 진행",                                                              analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "로맨스스캠": [
    { stage: "1단계", flow: "접근 및 관심 유도",         method: "SNS·채팅앱에서 외국인·해외 교포를 자칭하며 친구 추가",                                            analysis: "이성적 호감 형성으로 경계심을 낮추는 단계" },
    { stage: "2단계", flow: "관계 형성 및 신뢰 구축",    method: "장기간 일상 대화·호감 표현으로 친밀감 형성",                                                       analysis: "실제 연인처럼 믿게 하여 금전 요청 수용 가능성을 높이는 단계" },
    { stage: "3단계", flow: "투자 또는 비용 요청 유도",  method: "본인 운영 투자 플랫폼 소개, 공항 세관·의료비·비상 상황 명목 비용 요청",                           analysis: "신뢰 관계를 활용해 첫 금전 지출을 유도" },
    { stage: "4단계", flow: "고액 투자 또는 반복 비용 요구", method: "수익 인증 후 추가 투자 유도, 또는 지속적인 비용 대납 요청",                                    analysis: "초기 요청 수용 후 점차 금액을 증가" },
    { stage: "5단계", flow: "출금 불가 및 추가 비용 요구", method: "투자 출금 시 세금·공증비 요구, 비용 대납 후 새 명목 추가",                                      analysis: "피해금 회수 불가 상태에서 추가 입금을 유도" },
    { stage: "6단계", flow: "잠적 및 연락 차단",         method: "의심 또는 거절 시 연락 차단, SNS 계정 삭제 진행",                                                 analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
  "기타": [
    { stage: "1단계", flow: "접근 및 관심 유도",         method: "메신저, SNS, 광고를 통해 수익·혜택·기회를 강조하며 접근",                                         analysis: "다양한 경로로 잠재 피해자를 확보하는 목적" },
    { stage: "2단계", flow: "신뢰 형성",                 method: "소액 거래 성공 경험 제공, 전문가·공신력 있는 기관 사칭",                                           analysis: "정상 거래라는 믿음을 형성하는 단계" },
    { stage: "3단계", flow: "본격 거래 유도",            method: "더 높은 수익·혜택을 약속하며 고액 결제·투자·이체 요청",                                            analysis: "신뢰 형성 이후 본격적인 금전 편취 시작" },
    { stage: "4단계", flow: "출금·환불 거부 및 비용 요구", method: "출금·환불 시 계정 오류, 세금, 보증금 명목으로 추가 입금 요구",                                   analysis: "기납입금 회수를 방해하며 반복 입금을 유도" },
    { stage: "5단계", flow: "추가 요구 반복",            method: "납부 후에도 새로운 조건·비용 명목을 추가",                                                         analysis: "출금 가능하다는 믿음 유지하며 반복 편취" },
    { stage: "6단계", flow: "잠적",                      method: "담당자 연락 차단, 플랫폼 폐쇄 진행",                                                              analysis: "피해금 확보 후 조직이 잠적하는 최종 단계" },
  ],
}


function readFrontmatterValue(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"))
  return match ? match[1].trim() : ""
}

function getIdentityTokens(text) {
  const lower = text.toLowerCase().replace(/https?:\/\//g, "").replace(/www\./g, "")
  const tokens = new Set()

  const domains = lower.match(new RegExp(domainPattern, "g")) || []

  domains.forEach((domain) => {
    const compact = domain.replace(/[^a-z0-9]/g, "")
    const rootToken = domain.split(".")[0]

    if (compact.length >= 4) tokens.add(compact)
    if (rootToken.length >= 4) tokens.add(rootToken)
  })

  lower
    .split(/[\s\-_.:/|()[\]{}]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (/^[a-z0-9]+$/.test(token)) {
        if (token.length >= 4 && !genericEnglishTokens.has(token)) {
          tokens.add(token)
        }

        return
      }

      if (
        /^[가-힣]+$/.test(token) &&
        token.length >= 3 &&
        !genericKoreanTokens.has(token)
      ) {
        tokens.add(token)
      }
    })

  aliasGroups.forEach((group) => {
    if (group.some((alias) => lower.includes(alias.toLowerCase()))) {
      group.forEach((alias) => tokens.add(alias.toLowerCase()))
    }
  })

  return Array.from(tokens)
}

function sharesIdentity(a, b) {
  const aTokens = getIdentityTokens(a)
  const bTokens = getIdentityTokens(b)

  return aTokens.some((token) =>
    bTokens.some(
      (target) =>
        token === target ||
        token.includes(target) ||
        target.includes(token)
    )
  )
}

function slugifyGroupId(value) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function deriveGroupIdFromDomain(text) {
  const domains = text.toLowerCase().match(new RegExp(domainPattern, "g")) || []
  const genericTlds = new Set([
    "app",
    "biz",
    "cc",
    "co",
    "com",
    "io",
    "kr",
    "me",
    "net",
    "org",
    "shop",
    "site",
    "store",
    "top",
    "vip",
    "xyz",
  ])

  for (const domain of domains) {
    const labels = domain.split(".").filter(Boolean)

    if (labels.length < 2) continue

    const last = labels.at(-1)
    const rootLabel = genericTlds.has(last) ? labels.at(-2) : labels.at(-1)
    const groupId = slugifyGroupId(rootLabel || "")

    if (groupId.length >= 3 && !genericEnglishTokens.has(groupId)) {
      return groupId
    }
  }

  return ""
}

function deriveCaseGroupId(text) {
  if (explicitGroupId) return slugifyGroupId(explicitGroupId)

  const domainGroupId = deriveGroupIdFromDomain(text)
  if (domainGroupId) return domainGroupId

  const hyphenName = text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)+/)
  if (hyphenName) return slugifyGroupId(hyphenName[0])

  const tokens = getIdentityTokens(text)
    .map(slugifyGroupId)
    .filter((token) => token.length >= 3)
    .filter((token) => !genericEnglishTokens.has(token))

  return tokens[0] || slugifyGroupId(slug)
}

function getRepresentativeRule(text) {
  const lower = text.toLowerCase()

  return representativeRules.find((rule) =>
    rule.tokens.some((token) => lower.includes(token.toLowerCase()))
  )
}

function getRepresentativePriority(item) {
  let score = 0

  // 영문 상호명 > 한글 상호명 > 도메인 URL 순
  if (hasDomainKeyword(item.caseName)) {
    score += 100  // 도메인은 최저 우선순위
  } else if (hasLatinKeyword(item.caseName)) {
    score += 300  // 영문 상호명 최우선
  } else {
    score += 200  // 한글 상호명 차선
  }

  score += getIdentityTokens(`${item.slug} ${item.caseName}`).length * 10

  return score
}

function buildCaseSummary(file) {
  const existSlug = file.replace(".mdx", "")
  const filePath = path.join(casesDir, file)
  const rawSource = fs.readFileSync(filePath, "utf-8")
  const caseNameFromMeta = readFrontmatterValue(rawSource, "caseName")
  const caseName = caseNameFromMeta || existSlug.replace(/-/g, " ")
  const caseGroupId = readFrontmatterValue(rawSource, "caseGroupId")
  const groupRole = readFrontmatterValue(rawSource, "groupRole")
  const groupOrder = Number(readFrontmatterValue(rawSource, "groupOrder")) || 0
  const representativeSlugFromMeta = readFrontmatterValue(rawSource, "representativeSlug")
  const createdAt = readFrontmatterValue(rawSource, "createdAt")
  const stat = fs.statSync(filePath)

  return {
    slug: existSlug,
    caseName,
    caseGroupId,
    groupRole,
    groupOrder,
    representativeSlug: representativeSlugFromMeta,
    createdAt,
    text: `${existSlug} ${caseName}`,
    type: detectCaseType(`${existSlug} ${caseName}`),
    birthtime: createdAt ? Date.parse(createdAt) || stat.birthtime.getTime() : stat.birthtime.getTime(),
  }
}

/*
========================================
대표 slug 자동 탐색
========================================
*/

let representativeGroup = []
let caseGroupId = deriveCaseGroupId(cleanCaseName)
const createdAt = new Date().toISOString()
let groupOrder = 1
let groupRole = "representative"

function findRepresentativeSlug() {
  if (!fs.existsSync(casesDir)) return null

  const current = {
    slug,
    caseName: cleanCaseName,
    caseGroupId,
    groupRole,
    groupOrder,
    representativeSlug: "",
    createdAt,
    text: `${slug} ${cleanCaseName}`,
    type: detectCaseType(`${slug} ${cleanCaseName}`),
    birthtime: Date.parse(createdAt),
  }

  const existingCases = fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .map(buildCaseSummary)
    .filter((item) => item.slug !== slug)

  const sameExplicitGroup = existingCases.filter(
    (item) => item.caseGroupId && item.caseGroupId === caseGroupId
  )

  if (sameExplicitGroup.length > 0) {
    representativeGroup = [...sameExplicitGroup, current]

    const representative =
      sameExplicitGroup.find((item) => item.groupRole === "representative") ||
      sameExplicitGroup.find((item) => !item.representativeSlug) ||
      sameExplicitGroup
        .slice()
        .sort((a, b) => (a.groupOrder || 999999) - (b.groupOrder || 999999) || a.birthtime - b.birthtime)[0]

    groupRole = "variant"
    groupOrder = Math.max(...sameExplicitGroup.map((item) => item.groupOrder || 0), 0) + 1
    current.groupRole = groupRole
    current.groupOrder = groupOrder

    return representative.slug
  }

  const groupedCandidates = existingCases
    .filter((item) => item.caseGroupId)
    .filter((item) => item.type === current.type)
    .filter((item) => sharesIdentity(current.text, item.text))
  const matchedGroupIds = Array.from(
    new Set(groupedCandidates.map((item) => item.caseGroupId))
  )

  if (matchedGroupIds.length === 1) {
    caseGroupId = matchedGroupIds[0]

    const matchedGroup = existingCases.filter((item) => item.caseGroupId === caseGroupId)
    representativeGroup = [...matchedGroup, current]

    const representative =
      matchedGroup.find((item) => item.groupRole === "representative") ||
      matchedGroup.find((item) => !item.representativeSlug) ||
      matchedGroup
        .slice()
        .sort((a, b) => (a.groupOrder || 999999) - (b.groupOrder || 999999) || a.birthtime - b.birthtime)[0]

    groupRole = "variant"
    groupOrder = Math.max(...matchedGroup.map((item) => item.groupOrder || 0), 0) + 1
    current.caseGroupId = caseGroupId
    current.groupRole = groupRole
    current.groupOrder = groupOrder

    return representative.slug
  }

  if (explicitRepresentativeSlug) {
    const representative = existingCases.find((item) => item.slug === explicitRepresentativeSlug)

    if (!representative) {
      console.error(`대표 사건을 찾을 수 없습니다: ${explicitRepresentativeSlug}`)
      process.exit(1)
    }

    representativeGroup = [representative, current]
    if (representative.caseGroupId) {
      caseGroupId = representative.caseGroupId
      current.caseGroupId = caseGroupId
    }
    groupRole = "variant"
    groupOrder = Math.max(representative.groupOrder || 1, 1) + 1
    current.groupRole = groupRole
    current.groupOrder = groupOrder

    return representative.slug
  }

  const representativeRule = getRepresentativeRule(current.text)

  if (
    representativeRule &&
    representativeRule.representativeSlug !== slug &&
    existingCases.some((item) => item.slug === representativeRule.representativeSlug)
  ) {
    representativeGroup = [
      ...existingCases.filter((item) => getRepresentativeRule(item.text) === representativeRule),
      current,
    ]

    groupRole = "variant"
    groupOrder = representativeGroup.length
    current.groupRole = groupRole
    current.groupOrder = groupOrder

    return representativeRule.representativeSlug
  }

  const candidates = existingCases
    .filter((item) => item.type === current.type)
    .filter((item) => sharesIdentity(current.text, item.text))
    .filter((item) => !item.caseGroupId)

  if (candidates.length === 0) return null

  representativeGroup = [...candidates, current]
  groupRole = "variant"
  groupOrder = representativeGroup.length
  current.groupRole = groupRole
  current.groupOrder = groupOrder

  return representativeGroup
    .sort(
      (a, b) =>
        a.birthtime - b.birthtime ||
        getRepresentativePriority(b) - getRepresentativePriority(a)
    )[0].slug
}

const representativeSlug =
  findRepresentativeSlug()

function replaceRepresentativeBlock(source, nextRepresentativeSlug) {
  let nextSource = source.replace(
    /^---\s*([\s\S]*?)\s*---/,
    (match, body) => {
      const cleaned = body
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("representativeSlug:"))
        .join("\n")
        .trim()

      return `---\n${cleaned}\nrepresentativeSlug: "${nextRepresentativeSlug}"\n---`
    }
  )

  const block = `## 관련 대표 사건 안내

해당 사건은 아래 대표 사건과 동일 유형입니다.

👉 /cases/${nextRepresentativeSlug}

`

  const blockPattern =
    /(^|\r?\n)#{1,6}\s*관련\s*대표\s*사건\s*안내[\s\S]*?(?=\r?\n#{1,6}\s|\r?\n<img|\r?\n!\[|\r?\n\d+\.\s|$)/m

  if (blockPattern.test(nextSource)) {
    return nextSource.replace(blockPattern, `\n\n${block}`)
  }

  return nextSource.replace(/^---[\s\S]*?---\s*/, (frontmatter) => `${frontmatter}\n${block}`)
}

function syncRepresentativeLinks() {
  if (!representativeSlug || representativeGroup.length === 0) return

  representativeGroup
    .filter((item) => item.slug !== representativeSlug)
    .forEach((item) => {
      const filePath = path.join(casesDir, `${item.slug}.mdx`)

      if (!fs.existsSync(filePath)) return

      const source = fs.readFileSync(filePath, "utf-8")
      const nextSource = replaceRepresentativeBlock(source, representativeSlug)

      if (nextSource !== source) {
        fs.writeFileSync(filePath, nextSource, "utf-8")
      }
    })
}

/*
========================================
대표 링크 삽입 블록 생성
========================================
*/

let representativeBlock = ""

if (representativeSlug && representativeSlug !== slug) {
  representativeBlock = `

## 관련 대표 사건 안내

해당 사건은 아래 대표 사건과 동일 유형입니다.

👉 /cases/${representativeSlug}

`
}

/*
========================================
이미지 생성
========================================
*/

const templateImagePath = path.join(
  root,
  "public",
  "images",
  "templates",
  "case-template.png"
)

const outputImageDir = path.join(
  root,
  "public",
  "images",
  "cases"
)

if (!fs.existsSync(outputImageDir)) {
  fs.mkdirSync(outputImageDir, {
    recursive: true
  })
}

const pngPath = path.join(
  outputImageDir,
  `${slug}.png`
)

const avifPath = path.join(
  outputImageDir,
  `${slug}.avif`
)

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function splitTitleLines(text, maxLength = 18) {
  const words = text.split(" ")
  const lines = []
  let current = ""

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (next.length <= maxLength) {
      current = next
      return
    }

    if (current) {
      lines.push(current)
    }

    current = word
  })

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 2)
}

const titleLines = splitTitleLines(caseDisplayName)
const titleY = titleLines.length > 1 ? 110 : 126
const titleLineGap = 62
const subtitleY = titleY + (titleLines.length - 1) * titleLineGap + 48
const titleTspans = titleLines
  .map((line, index) => {
    const dy = index === 0 ? 0 : titleLineGap
    return `<tspan x="600" dy="${dy}">${escapeXml(line)}</tspan>`
  })
  .join("")

const svgOverlay = `
<svg width="1200" height="630">
  <style>
    .title {
      fill: #ffffff;
      font-size: 58px;
      font-weight: 900;
      text-anchor: middle;
      font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
    }

    .subtitle {
      fill: #ffffff;
      font-size: 28px;
      font-weight: 800;
      text-anchor: middle;
      font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
    }
  </style>

  <rect width="1200" height="630" fill="rgba(0,0,0,0.28)" />
  <text x="600" y="${titleY}" class="title">${titleTspans}</text>
  <text x="600" y="${subtitleY}" class="subtitle">피해 회복을 위한 법률 정보</text>
</svg>
`

async function generateImages() {
  const overlay = Buffer.from(svgOverlay)

  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: overlay }])
    .png({ quality: 90 })
    .toFile(pngPath)

  await sharp(templateImagePath)
    .resize(1200, 630)
    .composite([{ input: overlay }])
    .avif({ quality: 70 })
    .toFile(avifPath)

  console.log("대표 이미지 생성 완료")
}

/*
========================================
frontmatter 생성
========================================
*/

const seoTitle = buildTypedTitle(cleanCaseName, "meta")
const h1Title  = buildTypedTitle(cleanCaseName, "h1")

const td = getTypeDetails(`${slug} ${cleanCaseName}`)
const seoDescription = `${cleanCaseName} ${td.descSuffix}`
const caseType = td.caseType
const primaryKeyword = cleanCaseName
const aliases = getIdentityTokens(`${slug} ${cleanCaseName}`).join(", ")

const frontmatter = `---
title: "${seoTitle}"
caseName: "${cleanCaseName}"
description: "${seoDescription}"
slug: "${slug}"
publishedAt: "${createdAt.slice(0,10)}"
createdAt: "${createdAt}"
caseGroupId: "${caseGroupId}"
groupRole: "${groupRole}"
groupOrder: "${groupOrder}"
primaryKeyword: "${primaryKeyword}"
aliases: "${aliases}"
caseType: "${caseType}"
${representativeSlug && representativeSlug !== slug ? `representativeSlug: "${representativeSlug}"` : ""}
---

${representativeBlock}
`

// ─── 한국어 목적격 조사 자동 선택 ─────────────────────────────────────────────
// 앞 음절이 받침(종성) 있으면 '을', 없으면 '를' 반환
function euReul(word) {
  if (!word) return "을"
  const last = word[word.length - 1]
  const code = last.charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return "을"          // 한글 범위 밖 → 기본값
  return (code - 0xAC00) % 28 === 0 ? "를" : "을"           // 받침 없으면 '를'
}

// ─── .keywords 파일 및 Downloads txt 생성 ────────────────────────────────────
function buildKeywords(caseName, slug, typeLabel) {
  const kw = new Set()

  // 1. caseName 전체 및 기본 변형
  kw.add(caseName)
  kw.add(`${caseName} 피해`)
  kw.add(`${caseName} 신고`)
  kw.add(`${caseName} 피해 사례`)

  // 2. "사기" 앞 브랜드 키워드
  const sagiIdx = caseName.indexOf("사기")
  const brand = sagiIdx > 0 ? caseName.slice(0, sagiIdx).trim() : ""
  if (brand && brand !== caseName) {
    kw.add(`${brand} 사기`)
    kw.add(`${brand} 사기 피해`)
    kw.add(`${brand} 피해`)
    kw.add(`${brand} 피해 신고`)
    // 영문 소문자 변형
    const brandLow = brand.toLowerCase().replace(/\s+/g, "")
    if (/[a-z]/i.test(brand) && brandLow !== brand.toLowerCase()) {
      kw.add(`${brandLow} 사기`)
    }
    // 한글+영문 혼합이면 공백 제거 변형도 추가
    if (/[a-z]/i.test(brand) && brand.includes(" ")) {
      kw.add(`${brand.replace(/\s+/g, "")} 사기`)
    }
  }

  // 3. "사기" 뒤 토큰 (인물명, 서비스명 등)
  const afterSagi = sagiIdx >= 0 ? caseName.slice(sagiIdx + 2).trim() : ""
  if (afterSagi) {
    const tokens = afterSagi.split(/[\s\-]+/).filter((t) => t.length >= 2 && !/^(사칭|피해|사례|리딩방|투자|코인|사기|쇼핑몰|거래소|증권사|부업|방송)$/.test(t))
    tokens.forEach((t) => {
      kw.add(`${t} 사칭`)
      kw.add(`${t} 사기`)
      if (brand) kw.add(`${brand} ${t} 사기`)
    })
  }

  // ※ 유형별 공통 키워드("리딩방 사기", "주식리딩방 사기" 등)는 추가하지 않음
  //   page.tsx의 scamTopicKeywords 배열이 모든 케이스 페이지에 이미 자동 포함하므로
  //   여기서 추가하면 JSON-LD에 중복 등재됨

  return Array.from(kw)
}

function writeKeywordsFiles(slug, keywords) {
  const casesDir2 = path.join(process.cwd(), "content", "daeonlawfintech", "cases")
  const keywordsPath = path.join(casesDir2, `${slug}.keywords`)
  fs.writeFileSync(keywordsPath, keywords.join("\n") + "\n", "utf-8")

  // Windows Downloads 폴더에 리뷰용 txt 저장
  const homeDir = process.env.USERPROFILE || process.env.HOME || ""
  const downloadsDir = path.join(homeDir, "Downloads")
  if (fs.existsSync(downloadsDir)) {
    const txtPath = path.join(downloadsDir, `${slug}-keywords.txt`)
    const txtContent = [
      `# ${slug} 키워드 목록`,
      `# 생성일: ${new Date().toISOString().slice(0, 10)}`,
      `# 총 ${keywords.length}개`,
      "",
      ...keywords,
    ].join("\n")
    fs.writeFileSync(txtPath, txtContent, "utf-8")
    console.log(`📄 키워드 txt: ${txtPath}`)
  }

  console.log(`🔑 .keywords 생성: ${keywordsPath} (${keywords.length}개)`)
}

function detectKeywordRole(value) {
  const normalized = value.toLowerCase()
  const subject = normalized
    .replace(/사기|사칭|피해|쇼핑몰|대응|사례/g, "")
    .replace(/\s+/g, "")

  if (hasDomainKeyword(normalized)) {
    return "domain"
  }

  if (/[a-z]/i.test(normalized)) {
    const compact = normalized.replace(/[^a-z0-9]/g, "")

    return compact.length <= 10 ? "english-short" : "english-full"
  }

  if (/마켓|몰/.test(subject)) {
    return "korean-full"
  }

  return "korean-short"
}

function imageBlock(number, alt) {
  const templateImageExtensions = {
    "03": "png",
    "05": "png",
    "07": "gif",
    "08": "png",
  }
  const extension = templateImageExtensions[number] ?? "jpg"

  return `<img
  src="/images/cases/template-${number}.${extension}"
  alt="${alt}"
/>`
}

function kakaoImageBlock(alt) {
  return `<a
  href="http://pf.kakao.com/_xcypmn/chat"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="/images/cases/template-06.jpg"
    alt="${alt}"
  />
</a>`
}

function phoneImageBlock(alt) {
  return `<a href="tel:0269523695">
  <img
    src="/images/cases/template-07.gif"
    alt="${alt}"
  />
</a>`
}

function buildTypeTable() {
  const caseType = detectCaseType(`${slug} ${cleanCaseName}`)
  const rows = TYPE_TABLES[caseType] || TYPE_TABLES["기타"]

  const rowsHtml = rows.map(row => `    <tr>
      <td>${row.stage}</td>
      <td>${row.flow}</td>
      <td>${row.method}</td>
      <td>${row.analysis}</td>
    </tr>`).join("\n")

  return `<table className="case-process-table">
  <thead>
    <tr>
      <th>구분</th>
      <th>진행 흐름</th>
      <th>주요 방식</th>
      <th>상황 분석</th>
    </tr>
  </thead>
  <tbody>
${rowsHtml}
  </tbody>
</table>`
}

function buildRoleBody() {
  const name = caseDisplayName
  const plainName = cleanCaseName

  const td = getTypeDetails(`${slug} ${cleanCaseName}`)

  const checklistText = td.checklistItems.map(item => `✔ ${item}`).join("\n\n")

  const commonCaution = `✔ 대표자를 선정한 뒤 장기간 기다려야 하는 단체 대응은 신중하게 판단해야 합니다

✔ 진행비 명목의 선입금 또는 후불제를 요구하는 방식은 반드시 확인이 필요합니다

✔ 전문가를 자칭하더라도 변호사가 아니라면 법률서비스 제공은 불가능합니다

특히 변호사의 후불제 수임은 법적으로 허용되지 않는 방식이므로, 후불제를 언급하는 경우 또 다른 사기 가능성을 반드시 의심해야 합니다.`

  const table = buildTypeTable()

  return `## 1. ${name} 피해 개요

${plainName}은 ${td.caseType} 유형입니다.

특징은 ${td.approach} 방식으로 피해자에게 접근한다는 점입니다.

피해자는 ${td.victimAction}${euReul(td.victimAction)} 요청받습니다.

이후 ${td.mechanism} 명목으로 금전을 요구하며, ${td.delayType}를 이유로 추가 입금을 반복 요구하는 것이 이 유형의 전형적인 구조입니다.

${imageBlock("02", `${plainName} ${td.label} 사칭 피해 구조 안내 이미지`)}

## 2. ${name} 접근 방식

${td.label} 사기는 ${td.approach} 방식을 통해 피해자를 끌어들입니다.

처음에는 ${td.victimAction}${euReul(td.victimAction)} 요청받고, 신뢰가 쌓인 뒤 점차 ${td.mechanism} 명목으로 금전을 요구받습니다.

처음에는 소액으로 시작해 실제로 수익이 발생하는 것처럼 보이도록 유도합니다.

출금이나 환불을 요청하면 ${td.delayType}${euReul(td.delayType)} 이유로 추가 입금을 요구합니다.

이 구조는 피해 금액이 커질 때까지 반복됩니다.

${imageBlock("03", `${plainName} 피해 대온 법률사무소 주력분야 안내 이미지`)}

## 3. ${name} 피해 사례

### 사례 1

${td.caseA}

### 사례 2

${td.caseB}

### 사례 3

${td.caseC}

${imageBlock("04", `${plainName} ${td.label} 피해 사례 상세 이미지`)}

## 4. ${name} 피해 즉시 확인 사항

${td.stopMessage}

${checklistText}

${imageBlock("05", `${plainName} 피해 자료 수집 체크리스트 이미지`)}

## 5. ${name} 대응 절차

${plainName} 피해는 초기 대응 속도가 피해 회복률에 직접적인 영향을 미칩니다.

아래 순서에 따라 즉시 행동하시기 바랍니다.

### ① 증거 확보 (최우선)

상대방과의 대화창이 삭제되거나 계정이 차단되면 복구가 어렵습니다.

지금 바로 아래 자료를 캡처·저장하세요.

- 카카오톡·텔레그램·문자·이메일 대화 내용 전체
- 입금 확인증 및 이체 내역
- 상대방이 보낸 수익 화면, 계약서, 안내문
- 상대방 연락처·계좌번호·플랫폼 URL

### ② 추가 입금 즉시 중단

어떠한 명목으로든 추가 입금 요청이 오면 응하지 마세요.

"입금하면 기존 금액도 같이 돌려준다"는 말은 전형적인 2차 편취 수법입니다.

### ③ 법률 전문가 상담

증거 분석, 피해금 회수 전략, 형사 고소는 핀테크 금융사기 전문 법률사무소의 조력을 받으시는 것이 중요합니다.

초기 자료만 있으면 상담이 가능합니다.

${kakaoImageBlock(`${plainName} ${td.label} 피해 법률 상담 안내 이미지`)}

## 6. ${name} 2차 피해 주의

${commonCaution}

${imageBlock("08", `${plainName} ${td.label} 2차 피해 주의 안내 이미지`)}

## 7. ${name} 상담 및 피해 신고

${plainName} 피해와 관련한 상담은 아래 방법으로 접수할 수 있습니다.

입금 규모와 무관하게 초기 자료만 있으면 상담이 가능합니다.

${phoneImageBlock(`${plainName} 사기 피해 복구 골든타임 법률 상담 이미지`)}

## 8. 진행 과정과 상황 분석에 필요한 정보

지금 어느 단계에 진입했는지 상황을 분석하고 사기를 인지하였다면 즉시 추가 입금을 멈추셔야 합니다.

${table}
`
}

function buildMdx() {
  let template = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  const imagePath = `/images/cases/${slug}.png`

  template = template
    .replaceAll(
      "{{H1_TITLE}}",
      h1Title
    )
    .replaceAll(
      "{{CASE_NAME}}",
      cleanCaseName
    )
    .replaceAll(
      "{{CASE_DISPLAY_NAME}}",
      caseDisplayName
    )
    .replaceAll(
      "{{IMAGE_PATH}}",
      imagePath
    )
    .replaceAll(
      "{{IMAGE_ALT}}",
      `${caseDisplayName} 피해 회복을 위한 법률 정보 이미지`
    )
    .replaceAll(
      "{{IMAGE_CAPTION}}",
      `${caseDisplayName} 피해 사례 및 대응 방법 안내`
    )
    .replaceAll(
      "{{IMAGE_DESCRIPTION}}",
      `${caseDisplayName} 피해 사례와 대응 방법을 정리한 법률 정보 이미지입니다.`
    )
    .replaceAll(
      "{{SLUG}}",
      slug
    )
    .replaceAll(
      "{{ROLE_BODY}}",
      buildRoleBody()
    )

  template =
    frontmatter +
    template.replace(
      /^---[\s\S]*?---\s*/,
      ""
    )

  fs.writeFileSync(
    outputPath,
    template,
    "utf-8"
  )

  console.log("MDX 생성 완료")
}

/*
========================================
실행
========================================
*/

;(async () => {
  await generateImages()

  if (imageOnly) {
    console.log("")
    console.log(`/cases/${slug}`)
    return
  }

  buildMdx()
  syncRepresentativeLinks()

  // .keywords 파일 자동 생성
  const tdForKw = getTypeDetails(`${slug} ${cleanCaseName}`)
  const keywords = buildKeywords(cleanCaseName, slug, tdForKw.label)
  writeKeywordsFiles(slug, keywords)

  console.log("")
  console.log(`/cases/${slug}`)

  // 카페 포스트 자동 생성 — D+1 네이버 색인 가능성 향상
  // (카페에 URL 포스팅 → Naver Yeti가 카페 크롤 중 URL 발견 → 빠른 색인)
  const { execSync } = require("child_process")
  try {
    console.log("\n📋 네이버 카페 포스트 생성 중...")
    execSync(`node scripts/create-cafe-post.mjs "${cleanCaseName.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
    })
  } catch (e) {
    console.warn("⚠️  카페 포스트 생성 실패 — 수동으로 npm run case-cafe 실행하세요")
  }
})()
