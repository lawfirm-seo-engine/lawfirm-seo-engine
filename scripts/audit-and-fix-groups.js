/**
 * audit-and-fix-groups.js  v2
 * 전체 케이스 그룹핑 전수 감사 + 자동 수정
 *
 * 핵심 원칙:
 *  - 영문 브랜드 스템만으로 매칭 (한국어 단독 매칭 없음)
 *  - 한글↔영문은 ALIAS_GROUPS로만 연결
 *  - Exact match만 허용 (prefix 매칭 제거 → 오분류 방지)
 *  - 스템 최소 5자 이상 (4자 이하는 일반어 오염 위험)
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
// Step 1(기존 caseGroupId 기반 union)에서 이 값들은 무시한다.
// 한글 일반명사나 업종어를 groupId로 사용한 파일이 있으면
// 전혀 무관한 사건들이 하나의 클러스터로 합쳐지는 버그 발생.
const GENERIC_GROUP_IDS = new Set([
  // ── 한글: 사기 유형·행위어
  "사기","피해","피해회복","환불","신고","고소",
  "부업","재택","알바","아르바이트",
  "팀미션","미션","체험단","리뷰","리뷰어",
  "방송","라이브","환전","포인트",
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
])

// ─── 일반어 목록 (브랜드 식별자로 사용 금지, 영문 스템 매칭에서 제외) ──────

const GENERIC_EN = new Set([
  // 도메인 · 법인 형태
  "app","biz","com","corp","co","inc","io","kr","ltd","me","net","org",
  "site","top","vip","xyz",
  // 도메인 합성 패턴 (.kr.com → krcom 등 브랜드가 아닌 도메인 부산물)
  "krcom","krcом","comkr",
  // 금융·투자 업종어
  "asset","assets","bank","banking","capital","coin","crypto","exchange",
  "finance","financial","fund","global","gold","group","invest","investment",
  "koin","securities","stock","token","trade","trading","wallet","wealth",
  "trust","hedge","index","forex","commodity","commodities",
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
  // 지역·국가
  "korea","global","world","international","asia","pacific",
  // 수식어 (어떤 브랜드에나 붙음)
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
// 새 쌍이 발견되면 여기에 추가
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
]

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
// 반환: Set<string>  — 최소 5자의 영문 브랜드 식별자만 포함

function extractEnglishStems(text) {
  const lower = text
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    // TLD 제거
    .replace(/\.(com|shop|kr|net|org|vip|store|site|xyz|top|io|me|biz)\b/g, "")

  const stems = new Set()

  // 1. 직접 영문 토큰 (영문+숫자, 4자 이상)
  const enTokens = lower.match(/[a-z][a-z0-9]{3,}/g) || []  // 합이 4자 이상
  for (const tok of enTokens) {
    if (GENERIC_EN.has(tok)) continue
    if (tok.length >= 5) stems.add(tok)  // 5자 이상만 브랜드 스템으로 사용
    // 접미사 반복 제거 → 루트 스템
    let t = tok
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

  // 2. aliasGroups: 텍스트에 매칭되면 그룹의 영문 멤버만 추가
  for (const group of ALIAS_GROUPS) {
    const hit = group.some(a => lower.includes(a.toLowerCase()))
    if (!hit) continue
    for (const a of group) {
      // 영문 멤버만 추가 (한글 멤버 제외)
      if (!/^[a-z]/.test(a)) continue
      const al = a.toLowerCase()
      if (!GENERIC_EN.has(al) && al.length >= 5) stems.add(al)
      // 루트 스템도 추가
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

// ─── 두 케이스 매칭 여부 ────────────────────────────────────────────────────

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
    caseGroupId:       front.caseGroupId        || "",
    groupRole:         front.groupRole           || "",
    groupOrder:        parseInt(front.groupOrder) || 0,
    representativeSlug:front.representativeSlug  || "",
    noindex:           front.noindex === "true",
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
  if (!hasDomain && hasEn && hasKr) score += 300   // 영문+한글 혼합 최우선
  else if (!hasDomain && hasEn)      score += 200   // 영문만
  else if (hasKr)                    score += 150   // 한글만
  else                               score += 50    // 도메인만
  score += c.stems.size * 5
  return score
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

console.log("\n=== 전수 그룹핑 감사 (v2) ===\n")

const cases = fs.readdirSync(casesDir)
  .filter(f => f.endsWith(".mdx") && f !== "_template.mdx" && !f.startsWith("_"))
  .map(readCase)

console.log(`총 ${cases.length}개 케이스 로드`)

const uf = new UnionFind()
const slugToCase = new Map(cases.map(c => [c.slug, c]))

// Step 1: 기존 caseGroupId로 초기 union
// ※ GENERIC_GROUP_IDS에 속하는 groupId는 신뢰하지 않음
//   (한글 일반명사·업종어를 groupId로 사용한 파일이 있으면 무관한 사건이 합쳐짐)
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

// Step 2: 영문 스템 exact match로 추가 union
// 스템별로 인덱스를 만들어 O(n) 탐색
const stemIndex = new Map()  // stem → [slug, ...]
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
console.log(`스템 매칭으로 ${newLinks}개 신규 연결 발견\n`)

// Step 3: 클러스터 분석
const clusters = uf.clusters()
  .filter(cl => cl.length > 1)
  .sort((a, b) => b.length - a.length)  // 큰 클러스터 먼저

let issueCount = 0, alreadyOkCount = 0
const fixes = []

for (const slugs of clusters) {
  const members = slugs.map(s => slugToCase.get(s)).filter(Boolean)

  // 기존 그룹 ID 수집
  const groupIds = new Set(members.filter(m => m.caseGroupId).map(m => m.caseGroupId))
  const hasMultipleGroups = groupIds.size > 1
  const standalones = members.filter(m => !m.caseGroupId)

  // 이미 하나의 그룹으로 정리된 클러스터 → 대표/variant 역할 확인
  if (groupIds.size === 1 && standalones.length === 0) {
    const gid = [...groupIds][0]
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

  // 대표 결정
  let rep = members.find(m => m.groupRole === "representative")
  if (!rep) {
    rep = members.slice().sort((a, b) => repScore(b) - repScore(a))[0]
  }

  // 그룹 ID 결정 (대표의 기존 ID 우선, 없으면 최단 영문 스템)
  let groupId = rep.caseGroupId || ""
  if (!groupId) {
    const enStems = [...rep.stems].filter(s => /^[a-z]/.test(s)).sort((a, b) => a.length - b.length)
    groupId = enStems[0] || rep.slug
  }

  // 멤버 이름 표시
  const memberStr = members
    .map(m => m.slug + (m.caseGroupId ? "" : " [독립]"))
    .join(", ")
  console.log(`ISSUE [${groupId}] (${members.length}개): ${memberStr}`)

  // 정렬: representative #1, 나머지는 기존 groupOrder 유지
  const sorted = [rep, ...members
    .filter(m => m !== rep)
    .sort((a, b) => (a.groupOrder || 999) - (b.groupOrder || 999) || a.slug.localeCompare(b.slug))
  ]

  sorted.forEach((m, idx) => {
    const isRep  = m === rep
    const order  = idx + 1
    const updates = {}

    if (m.caseGroupId !== groupId)              updates.caseGroupId = groupId
    if (isRep) {
      if (m.groupRole !== "representative")     updates.groupRole   = "representative"
      if (m.groupOrder !== 1)                   updates.groupOrder  = "1"
      if (m.front.noindex === "true")           updates.noindex     = "__DELETE__"
      if (m.representativeSlug)                 updates.representativeSlug = "__DELETE__"
    } else {
      if (m.groupRole !== "variant")            updates.groupRole   = "variant"
      if (m.representativeSlug !== rep.slug)    updates.representativeSlug = rep.slug
      if (!m.noindex)                           updates.noindex     = "true"
      if (m.groupOrder !== order)               updates.groupOrder  = String(order)
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
