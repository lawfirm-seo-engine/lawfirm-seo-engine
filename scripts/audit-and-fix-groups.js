/**
 * audit-and-fix-groups.js  v3
 * 전체 케이스 그룹핑 전수 감사 + 자동 수정
 *
 * 핵심 원칙:
 *  - 영문 브랜드 스템만으로 매칭 (한국어 단독 매칭 없음)
 *  - 한글↔영문은 음성 유사도(LCS≥0.72)로 자동 연결
 *  - Exact match만 허용 (prefix 매칭 제거 → 오분류 방지)
 *  - 스템 최소 5자 이상 (4자 이하는 일반어 오염 위험)
 *  - 한글 복합어 4자 이상, 전체 빈도 ≤4 → distinctive bridge
 *  - KNOWN_IMPERSONATION_TARGETS: 여러 사기단이 독립 사칭하는 기관명 → bridge 제외
 *
 * 사용법:
 *   node scripts/audit-and-fix-groups.js          → 감사만 (dry-run)
 *   node scripts/audit-and-fix-groups.js --fix    → 수정 적용
 */

const fs   = require("fs")
const path = require("path")

const APPLY_FIX = process.argv.includes("--fix")

const casesDir = path.join(process.cwd(), "content", "daeonlawfintech", "cases")

// ─── 브랜드 식별자로 신뢰할 수 없는 caseGroupId ────────────────────────────
const GENERIC_GROUP_IDS = new Set([
  // ── 한글: 사기 유형·행위어
  "사기","피해","피해회복","환불","신고","고소",
  "부업","재택","알바","아르바이트",
  "팀미션","미션","체험단","리뷰","리뷰어",
  "방송","라이브","환전","포인트",
  "로맨스스캠","구매대행",
  // ── 한글: 금융·투자 일반어
  "투자","재테크","자산","주식","코인","암호화폐","가상자산",
  "리딩방","리딩","방","선물","해외선물","파생",
  "증권","증권사","은행","뱅크","펀드","캐피탈","파이낸스",
  "에셋","인베스트","트레이딩","트레이드",
  "공모주","비상장","스테이킹","거래소","월렛","지갑",
  // ── 한글: 플랫폼·서비스 일반어
  "쇼핑몰","마켓","몰","스토어","플랫폼","어플","앱",
  "여행사","여행","항공","숙박","여행플랫폼",
  "영화사","영화","배급사","예매",
  "프로젝트","트레이닝","아카데미","클럽","그룹","센터",
  "솔루션","시스템","네트워크","디지털","온라인",
  // ── 한글: 지역·국가
  "한국","코리아","글로벌","인터내셔널","월드",
  // ── 영문 일반어 (방어적 중복)
  "market","shop","mall","store","exchange","trading","invest",
  "bank","asset","fund","capital","finance","securities","token",
  "project","training","academy","group","center","global","world",
  "platform","system","network","digital","online","solution",
  "marketing",
  // ── 추가: 투자·사기 유형 일반어
  "파이낸셜","자산운용","투자자문","비상장주","주식어플",
  "코인리딩","리뷰알바","해외송금","지수거래","텔레그램",
  "유한회사","에이아이","커뮤니케",
  // ── 추가: full chunk 일반어 (구조 변경 후에도 빈도 ≤4로 걸릴 수 있는 일반어)
  "선물거래","코인거래","뮤니케이","스마트트","투자사칭","상장주식",
  "비상장주식",
  // ── 추가: full chunk 방식에서 freq 2~4로 활성화되는 일반어
  "코인거래소",   // 코인 거래소 사칭 — 업종 일반어
  "자동트레이딩", // AI 자동트레이딩 — 서비스 일반어
  "비트코인",     // bitcoin — 가상자산 일반어
  "코인리딩방",   // 코인 리딩방 — 유형 일반어
  "코인투자",     // 코인 투자 — 행위 일반어
  "인베스트먼트", // investment 한글 표기 — 업종 일반어
])

// ─── 여러 독립 사기단이 동일 기관을 사칭하는 경우 bridge 제외 ───────────────
// 이 기관명이 포함된 한글 복합어는 같은 사기단 식별자로 사용하지 않는다
const KNOWN_IMPERSONATION_TARGETS = new Set([
  // 증권사
  "신영증권","대신증권","삼성증권","키움증권","미래에셋","한국투자증권",
  "NH투자증권","KB증권","하나증권","신한금융투자","메리츠증권",
  "이베스트투자증권","교보증권","유안타증권","DB금융투자",
  // 은행
  "국민은행","신한은행","하나은행","우리은행","농협은행","기업은행",
  "카카오뱅크","케이뱅크","토스뱅크",
  // 가상자산 거래소
  "업비트","빗썸","코인원","코빗","바이낸스","바이비트","오케이엑스",
  // 기타 금융
  "한국거래소","금융감독원","금융위원회","코스피","코스닥",
])

// ─── 일반어 목록 (영문 스템 매칭에서 제외) ──────────────────────────────────

const GENERIC_EN = new Set([
  // 도메인 · 법인 형태
  "app","biz","com","corp","co","inc","io","kr","ltd","me","net","org",
  "site","top","vip","xyz",
  // 도메인 합성 패턴
  "krcom","krcом","comkr",
  // 금융·투자 업종어
  "asset","assets","bank","banking","capital","coin","crypto","exchange",
  "finance","financial","fund","global","gold","group","invest","investment",
  "koin","securities","stock","token","trade","trading","wallet","wealth",
  "trust","hedge","index","forex","commodity","commodities",
  // 거래소 phonetic form (거래소 → georaeso → goreso): 일반어
  "goreso",
  // markets: market 복수형도 일반어
  "markets",
  // 고유명사처럼 보이지만 음성 유사도 오분류 유발하는 영문 브랜드
  "montellis",   // moelis(모엘리스)와 음성 유사(0.86) → 오그룹핑 방지
  "montelis",    // "montellis" → normalizePhonetic double-l collapse → "montelis" — 동일 목적
  // 선물·파생
  "futures","forward","option","options","margin","leverage","spread",
  // 쇼핑·서비스 업종어
  "mall","market","shop","store","commerce","retail","delivery",
  // 법인·서비스 일반어
  "company","corp","center","service","services","solution","solutions",
  "network","platform","system","systems","digital","online","tech","technology",
  // 교육·조직 일반어
  "academy","training","school","class","club","team","room","lab","studio",
  // 가격·가치 일반어
  "price","value","worth","profit","return","yield","revenue","income",
  // 전략·방향 일반어
  "strategy","strategies","plan","plans","venture","ventures",
  "partner","partners","advisor","advisors","advisory","management",
  // 마케팅
  "marketing",
  // 지역·국가
  "korea","global","world","international","asia","pacific",
  // 수식어
  "best","elite","max","mega","mini","plus","prime","pro","real","smart",
  "super","ultra","new","next","alpha","beta","delta","omega","sigma",
  // 한국어 로마자 일반어
  "georaeso","gongmoju","pihae","pihaehoebog","pihaehoebok","saching",
  "sagi","salye","sarye","syopingmol","tuja","tujasagi",
])

// 영문 브랜드 접미사 (반복 제거 → 루트 스템 추출)
const EN_STRIP_SUFFIXES = [
  "market","mall","shop","store","kr","com","vip","net","org","pro",
]

// 알려진 한글↔영문 동일 브랜드 매핑
const ALIAS_GROUPS = [
  // 쇼핑몰·팀미션
  ["bellaxb","벨라비"],
  ["deepellie","deepelliemarket","디프엘리","디프엘리마켓"],
  ["dayinstore","dayin","다인스토어"],
  ["etbeermarket","에트비어"],
  ["forneymoll","포니몰"],
  // 영화사
  ["jkfilm","제이케이필름"],
  // 여행사
  ["travelridge","트래블릿지","트레블릿지"],
  // 투자·증권
  ["daishin","대신증권"],
  ["allspring","allspringmin","골드드림","goldeudeulim"],
  // 한글↔영문 동일 브랜드 — phonetic threshold 상향(0.78)으로 누락되는 쌍 보완
  ["nobleshine","nobleshine365","노블샤인","노블샤인365"],
  ["lurinmall","루린몰"],
  ["goldmanshot","골드맨샷"],
  ["goldplate","골드플레이트"],
  ["kucentral","쿠센트럴"],
  ["picnictrip","피크닉트립"],
  ["pundiai","펀디에이아이"],
  // phonetic threshold 0.85로 인해 누락되는 동일 브랜드 쌍 보완
  ["bigtometv","빅톰tv","빅톰티비"],
  ["systemfx","시스템fx"],
]

// ─── 한글 로마자화 + 음성 유사도 ─────────────────────────────────────────────

const INITIALS  = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h']
const VOWELS_KO = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i']
const FINALS_KO = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t']

function romanizeHangul(text) {
  let result = ''
  for (const ch of text) {
    const c = ch.charCodeAt(0)
    if (c >= 0xAC00 && c <= 0xD7A3) {
      const off = c - 0xAC00
      result += INITIALS[Math.floor(off / 28 / 21)] + VOWELS_KO[Math.floor(off / 28) % 21] + FINALS_KO[off % 28]
    } else {
      result += ch.toLowerCase()
    }
  }
  return result
}

function normalizePhonetic(s) {
  return s
    .replace(/eu/g, 'e').replace(/eo/g, 'o').replace(/ae/g, 'e')
    .replace(/ya/g, 'a').replace(/ye/g, 'e').replace(/yo/g, 'o').replace(/yu/g, 'u')
    .replace(/wo/g, 'o').replace(/wi/g, 'i').replace(/ui/g, 'i')
    .replace(/sy/g, 'sh').replace(/ng$/, '').replace(/([a-z])\1+/g, '$1')
}

function lcsRatio(a, b) {
  const m = a.length, n = b.length
  if (!m || !n) return 0
  let prev = new Array(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    const curr = new Array(n + 1).fill(0)
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i-1] === b[j-1] ? prev[j-1] + 1 : Math.max(prev[j], curr[j-1])
    }
    prev = curr
  }
  return 2 * prev[n] / (m + n)
}

// ─── frontmatter 파서 ─────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n")
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return { front: {}, rest: text }
  const front = {}
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    front[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim()
  }
  return { front, rest: text.slice(m[0].length) }
}

function writeFrontmatter(front, rest, hasCRLF) {
  const ORDER = [
    "title","caseName","description","slug",
    "noindex",
    "publishedAt","createdAt","modifiedAt",
    "caseGroupId","groupRole","groupOrder","representativeSlug",
    "primaryKeyword","aliases","caseType",
  ]
  const lines = []
  const seen  = new Set()
  for (const key of ORDER) {
    if (!(key in front)) continue
    const val  = String(front[key])
    const raw  = val === "true" || val === "false" || /^\d+$/.test(val)
    lines.push(raw ? `${key}: ${val}` : `${key}: "${val}"`)
    seen.add(key)
  }
  for (const [k, v] of Object.entries(front)) {
    if (seen.has(k)) continue
    const val = String(v)
    const raw = val === "true" || val === "false" || /^\d+$/.test(val)
    lines.push(raw ? `${k}: ${val}` : `${k}: "${val}"`)
  }
  const content = `---\n${lines.join("\n")}\n---${rest}`
  return hasCRLF ? content.replace(/\n/g, "\r\n") : content
}

// ─── 영문 브랜드 스템 추출 ───────────────────────────────────────────────────

function extractEnglishStems(text) {
  const lower = text
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/\.(com|shop|kr|net|org|vip|store|site|xyz|top|io|me|biz)\b/g, "")

  const stems = new Set()

  const enTokens = lower.match(/[a-z][a-z0-9]{3,}/g) || []
  for (const tok of enTokens) {
    // 숫자 접미사 제거: nobleshine365 → nobleshine
    const stripped = tok.replace(/\d+$/, "")
    const candidates = stripped !== tok ? [tok, stripped] : [tok]

    for (const cand of candidates) {
      if (GENERIC_EN.has(cand)) continue
      if (cand.length >= 5) stems.add(cand)
      // 접미사 반복 제거 → 루트 스템
      let t = cand
      let changed = true
      while (changed) {
        changed = false
        for (const suf of EN_STRIP_SUFFIXES) {
          if (t.endsWith(suf) && t.length - suf.length >= 5) {
            t = t.slice(0, -suf.length)
            if (!GENERIC_EN.has(t)) stems.add(t)
            changed = true
            break
          }
        }
      }
    }
  }

  // ALIAS_GROUPS: 텍스트에 매칭되면 그룹의 영문 멤버만 추가
  for (const group of ALIAS_GROUPS) {
    const hit = group.some(a => lower.includes(a.toLowerCase()))
    if (!hit) continue
    for (const a of group) {
      if (!/^[a-z]/.test(a)) continue
      const al = a.toLowerCase()
      if (!GENERIC_EN.has(al) && al.length >= 5) stems.add(al)
      let t = al
      for (const suf of EN_STRIP_SUFFIXES) {
        if (t.endsWith(suf) && t.length - suf.length >= 5) {
          const root = t.slice(0, -suf.length)
          if (!GENERIC_EN.has(root)) stems.add(root)
        }
      }
    }
  }

  return stems
}

function stemsOverlap(stemsA, stemsB) {
  for (const a of stemsA) {
    if (stemsB.has(a)) return true
  }
  return false
}

// ─── Union-Find ───────────────────────────────────────────────────────────────

class UnionFind {
  constructor() { this.p = new Map() }
  find(x) {
    if (!this.p.has(x)) this.p.set(x, x)
    if (this.p.get(x) !== x) this.p.set(x, this.find(this.p.get(x)))
    return this.p.get(x)
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b)
    if (ra !== rb) this.p.set(ra, rb)
  }
  clusters() {
    const m = new Map()
    for (const k of this.p.keys()) {
      const r = this.find(k)
      if (!m.has(r)) m.set(r, [])
      m.get(r).push(k)
    }
    return Array.from(m.values())
  }
}

// ─── 파일 읽기 ────────────────────────────────────────────────────────────────

function readCase(filename) {
  const filePath = path.join(casesDir, filename)
  const raw = fs.readFileSync(filePath, "utf8")
  const { front, rest } = parseFrontmatter(raw)
  const slug     = filename.replace(/\.mdx$/, "")
  const caseName = front.caseName || slug.replace(/-/g, " ")
  const text     = `${slug} ${caseName}`
  return {
    filename, slug, caseName, front, rest,
    caseGroupId:        front.caseGroupId        || "",
    groupRole:          front.groupRole           || "",
    groupOrder:         parseInt(front.groupOrder) || 0,
    representativeSlug: front.representativeSlug  || "",
    noindex:            front.noindex === "true",
    hasCRLF: raw.includes("\r\n"),
    text,
    stems: extractEnglishStems(text),
  }
}

// ─── 대표 우선순위 점수 ───────────────────────────────────────────────────────

function repScore(c) {
  let score = 0
  const cn = c.caseName.toLowerCase()
  const hasDomain = /[a-z0-9]\.[a-z]/.test(cn)
  const hasEn     = /[a-z]/.test(cn)
  const hasKr     = /[가-힣]/.test(cn)
  if (!hasDomain && hasEn && hasKr) score += 300
  else if (!hasDomain && hasEn)      score += 200
  else if (hasKr)                    score += 150
  else                               score += 50
  score += c.stems.size * 5
  return score
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

console.log("\n=== 전수 그룹핑 감사 (v3) ===\n")

const cases = fs.readdirSync(casesDir)
  .filter(f => f.endsWith(".mdx") && f !== "_template.mdx" && !f.startsWith("_"))
  .map(readCase)

console.log(`총 ${cases.length}개 케이스 로드`)

// ─── Phase 0: 한글 복합어 빈도 테이블 ──────────────────────────────────────
// caseName에서 4자 이상 연속 한글 시퀀스(full chunk)만 사용
// ★ 구조 변경: sliding window 제거 → full chunk 단위만 집계
//   - 일반어(비트코인, 코인거래소 등)는 전체 케이스에서 빈도 >4 → 자동 필터
//   - 슬라이딩 윈도우 shift 문제(차단 → 인접 substring 활성화) 근본 해소
// 빈도 ≤4이고 GENERIC_GROUP_IDS·KNOWN_IMPERSONATION_TARGETS에 없으면
// distinctive bridge token으로 사용

const krCompoundFreq = new Map()  // token → count
for (const c of cases) {
  const chunks = c.caseName.match(/[가-힣]{4,}/g) || []
  const seen = new Set()
  for (const chunk of chunks) {
    // full chunk 단위만 집계 (sliding window 제거)
    if (!seen.has(chunk)) {
      seen.add(chunk)
      krCompoundFreq.set(chunk, (krCompoundFreq.get(chunk) || 0) + 1)
    }
  }
}

// distinctive: 빈도 ≤4이고 일반어/사칭대상 아닌 것
function isDistinctiveKrToken(tok) {
  if (GENERIC_GROUP_IDS.has(tok)) return false
  if (KNOWN_IMPERSONATION_TARGETS.has(tok)) return false
  const freq = krCompoundFreq.get(tok) || 0
  return freq >= 2 && freq <= 4
}

// 케이스별 distinctive 한글 bridge 토큰 목록
const caseKrBridge = new Map()  // slug → Set<token>
for (const c of cases) {
  const tokens = new Set()
  const chunks = c.caseName.match(/[가-힣]{4,}/g) || []
  for (const chunk of chunks) {
    // full chunk 단위만 bridge 토큰으로 사용 (sliding window 제거)
    if (isDistinctiveKrToken(chunk)) tokens.add(chunk)
  }
  if (tokens.size > 0) caseKrBridge.set(c.slug, tokens)
}

// ─── 케이스별 음성 정규화 스템 ──────────────────────────────────────────────
// 한글 caseName → romanize → normalizePhonetic → 5자 이상 영문 토큰

function extractPhoneticStems(caseName) {
  const romanized = romanizeHangul(caseName)
  const normalized = normalizePhonetic(romanized)
  const tokens = normalized.match(/[a-z]{5,}/g) || []
  return tokens.filter(t => !GENERIC_EN.has(t))
}

const slugToCase = new Map(cases.map(c => [c.slug, c]))
const uf = new UnionFind()

// ─── Step 1: 기존 caseGroupId로 초기 union ──────────────────────────────────
const byGroupId = new Map()
for (const c of cases) {
  uf.find(c.slug)
  if (c.caseGroupId && !GENERIC_GROUP_IDS.has(c.caseGroupId)) {
    if (!byGroupId.has(c.caseGroupId)) byGroupId.set(c.caseGroupId, [])
    byGroupId.get(c.caseGroupId).push(c)
  }
}
for (const members of byGroupId.values()) {
  for (let i = 1; i < members.length; i++) uf.union(members[0].slug, members[i].slug)
}

// ─── Step 2: 영문 스템 exact match union ────────────────────────────────────
const stemIndex = new Map()
for (const c of cases) {
  for (const s of c.stems) {
    if (!stemIndex.has(s)) stemIndex.set(s, [])
    stemIndex.get(s).push(c.slug)
  }
}

let newLinks = 0
for (const [, slugs] of stemIndex) {
  if (slugs.length < 2) continue
  for (let i = 1; i < slugs.length; i++) {
    if (uf.find(slugs[0]) !== uf.find(slugs[i])) {
      uf.union(slugs[0], slugs[i])
      newLinks++
    }
  }
}
console.log(`[Step 2] 영문 스템 매칭: ${newLinks}개 신규 연결`)

// ─── Step 2b: 한글 복합어 bridge (빈도 ≤4) ──────────────────────────────────
const krBridgeIndex = new Map()  // token → [slug, ...]
for (const [slug, tokens] of caseKrBridge) {
  for (const tok of tokens) {
    if (!krBridgeIndex.has(tok)) krBridgeIndex.set(tok, [])
    krBridgeIndex.get(tok).push(slug)
  }
}

let krLinks = 0
const krBridgeLog = []
for (const [tok, slugs] of krBridgeIndex) {
  if (slugs.length < 2) continue
  for (let i = 1; i < slugs.length; i++) {
    if (uf.find(slugs[0]) !== uf.find(slugs[i])) {
      uf.union(slugs[0], slugs[i])
      krLinks++
      krBridgeLog.push(`  [KR-bridge:"${tok}"] ${slugs[0]} ↔ ${slugs[i]}`)
    }
  }
}
console.log(`[Step 2b] 한글 복합어 bridge: ${krLinks}개 신규 연결`)
if (krBridgeLog.length > 0) krBridgeLog.forEach(l => console.log(l))

// ─── Step 2c: 음성 유사도 bridge (LCS ≥ 0.72) ───────────────────────────────
// 각 케이스의 영문 스템과 한글 phonetic 스템을 합친 pool을 만들고
// 서로 다른 케이스 쌍 간에 LCS ratio가 threshold 이상이면 union

// phonetic 스템 인덱스 구축
const phoneticStemsMap = new Map()  // slug → string[] (normalized phonetic stems)
for (const c of cases) {
  const krOnly = c.caseName.replace(/[^가-힣]/g, "")
  if (krOnly.length >= 2) {
    const ps = extractPhoneticStems(c.caseName)
    if (ps.length > 0) phoneticStemsMap.set(c.slug, ps)
  }
}

// 영문 스템 pool: slug → string[] (영문 직접 스템)
const enStemsMap = new Map()
for (const c of cases) {
  const enStems = [...c.stems].filter(s => s.length >= 5 && /^[a-z]/.test(s))
  if (enStems.length > 0) enStemsMap.set(c.slug, enStems)
}

// phonetic bridge: 한글 케이스(phonetic stem) ↔ 영문 케이스(en stem)
let phoneticLinks = 0
const phoneticLog = []

const phoneticSlugs = [...phoneticStemsMap.keys()]
const enSlugs = [...enStemsMap.keys()]

for (const krSlug of phoneticSlugs) {
  const krStems = phoneticStemsMap.get(krSlug)
  for (const enSlug of enSlugs) {
    if (krSlug === enSlug) continue
    if (uf.find(krSlug) === uf.find(enSlug)) continue
    const enStems = enStemsMap.get(enSlug)
    // 두 풀 사이 최대 LCS ratio 계산
    let best = 0, bestPair = ["",""]
    for (const ks of krStems) {
      const ksN = normalizePhonetic(ks)
      for (const es of enStems) {
        const esN = normalizePhonetic(es)
        if (Math.min(ksN.length, esN.length) < 5) continue
        const r = lcsRatio(ksN, esN)
        if (r > best) { best = r; bestPair = [ks, es] }
      }
    }
    if (best >= 0.85) {
      uf.union(krSlug, enSlug)
      phoneticLinks++
      phoneticLog.push(`  [phonetic:${best.toFixed(2)} "${bestPair[0]}"↔"${bestPair[1]}"] ${krSlug} ↔ ${enSlug}`)
    }
  }
}
console.log(`[Step 2c] 음성 유사도 bridge: ${phoneticLinks}개 신규 연결`)
if (phoneticLog.length > 0) phoneticLog.forEach(l => console.log(l))

console.log("")

// ─── Step 3: 클러스터 분석 ──────────────────────────────────────────────────
const clusters = uf.clusters()
  .filter(cl => cl.length > 1)
  .sort((a, b) => b.length - a.length)

let issueCount = 0, alreadyOkCount = 0
const fixes = []

for (const slugs of clusters) {
  const members = slugs.map(s => slugToCase.get(s)).filter(Boolean)

  const groupIds  = new Set(members.filter(m => m.caseGroupId).map(m => m.caseGroupId))
  const standalones = members.filter(m => !m.caseGroupId)

  // ─── Coherence check ──────────────────────────────────────────────────────
  // 대표 후보와 스템이 전혀 겹치지 않는 멤버가 있으면 경고
  if (standalones.length > 0 || groupIds.size > 1) {
    const rep = members.find(m => m.groupRole === "representative")
      || members.slice().sort((a, b) => repScore(b) - repScore(a))[0]
    for (const m of members) {
      if (m === rep) continue
      if (!stemsOverlap(rep.stems, m.stems)) {
        // 한글 bridge로 연결된 경우는 제외 (경고만)
        const sharedKr = [...(caseKrBridge.get(rep.slug) || [])].some(t =>
          (caseKrBridge.get(m.slug) || new Set()).has(t)
        )
        if (!sharedKr) {
          console.log(`  ⚠ coherence: "${rep.slug}" ↔ "${m.slug}" — 공유 스템 없음 (phonetic bridge?)`)
        }
      }
    }
  }

  if (groupIds.size === 1 && standalones.length === 0) {
    const repCount = members.filter(m => m.groupRole === "representative").length
    const hasRep   = repCount === 1
    const wrongRep = members.filter(m =>
      m.groupRole === "variant" &&
      m.representativeSlug &&
      !slugToCase.has(m.representativeSlug)
    ).length > 0

    if (hasRep && !wrongRep) {
      alreadyOkCount++
      continue
    }
  }

  issueCount++

  let rep = members.find(m => m.groupRole === "representative")
  if (!rep) {
    rep = members.slice().sort((a, b) => repScore(b) - repScore(a))[0]
  }

  let groupId = rep.caseGroupId || ""
  if (!groupId) {
    const enStems = [...rep.stems].filter(s => /^[a-z]/.test(s)).sort((a, b) => a.length - b.length)
    groupId = enStems[0] || rep.slug
  }

  const memberStr = members
    .map(m => m.slug + (m.caseGroupId ? "" : " [독립]"))
    .join(", ")
  console.log(`ISSUE [${groupId}] (${members.length}개): ${memberStr}`)

  const sorted = [rep, ...members
    .filter(m => m !== rep)
    .sort((a, b) => (a.groupOrder || 999) - (b.groupOrder || 999) || a.slug.localeCompare(b.slug))
  ]

  sorted.forEach((m, idx) => {
    const isRep  = m === rep
    const order  = idx + 1
    const updates = {}

    if (m.caseGroupId !== groupId)           updates.caseGroupId = groupId
    if (isRep) {
      if (m.groupRole !== "representative")  updates.groupRole   = "representative"
      if (m.groupOrder !== 1)               updates.groupOrder  = "1"
      if (m.front.noindex === "true")        updates.noindex     = "__DELETE__"
      if (m.representativeSlug)             updates.representativeSlug = "__DELETE__"
    } else {
      if (m.groupRole !== "variant")         updates.groupRole   = "variant"
      if (m.representativeSlug !== rep.slug) updates.representativeSlug = rep.slug
      if (!m.noindex)                        updates.noindex     = "true"
      if (m.groupOrder !== order)           updates.groupOrder  = String(order)
    }

    if (Object.keys(updates).length > 0) {
      fixes.push({ slug: m.slug, updates, filename: m.filename, front: m.front, rest: m.rest, hasCRLF: m.hasCRLF })
    }
  })
}

console.log(`\n이미 정상: ${alreadyOkCount}개 클러스터`)
console.log(`수정 필요: ${issueCount}개 클러스터`)
console.log(`수정 대상 파일: ${fixes.length}개\n`)

// ─── 수정 적용 ────────────────────────────────────────────────────────────────

if (!APPLY_FIX) {
  console.log("※ 실제 수정을 적용하려면 --fix 옵션을 추가하세요.\n")
  process.exit(0)
}

console.log("=== 수정 적용 중 ===\n")
let ok = 0, fail = 0

for (const { slug, updates, filename, front, rest, hasCRLF } of fixes) {
  try {
    const nf = { ...front }
    for (const [k, v] of Object.entries(updates)) {
      if (v === "__DELETE__") delete nf[k]
      else nf[k] = v
    }
    fs.writeFileSync(path.join(casesDir, filename), writeFrontmatter(nf, rest, hasCRLF), "utf8")
    console.log(`  ✓ ${slug}`)
    ok++
  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`)
    fail++
  }
}

console.log(`\n완료: 성공 ${ok}개, 실패 ${fail}개\n`)
