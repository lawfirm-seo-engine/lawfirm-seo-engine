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
  "사기",
  "사칭",
  "피해",
  "사례",
  "대응",
  "피해회복",
  "투자",
  "쇼핑몰",
  "리딩방",
  "거래소",
  "증권사",
  "부업",
  "체험단",
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

function detectCaseType(text) {
  const value = text.toLowerCase()

  if (/쇼핑몰|마켓|mall|market|shop|store/.test(value)) {
    return "쇼핑몰 사칭 사기"
  }

  if (/증권|증권사|securities|stock|fwrd|daishin|allspring|\uace8\ub4dc\ub4dc\ub9bc|\ub9ac\ub529\ubc29|\uc804\ubb38\uac00|\uc138\ub825\ud2b8\ub808\uc774\ub529/.test(value)) {
    return "증권사 사칭 사기"
  }

  if (/거래소|코인|wallet|coin|crypto|exchange/.test(value)) {
    return "가상자산 사칭 사기"
  }

  if (/부업|체험단|리뷰|미션/.test(value)) {
    return "부업 사칭 사기"
  }

  return "기타 사칭 사기"
}

function getTypeLabel(type) {
  if (type === "증권사 사칭 사기") return "증권사 사칭"
  if (type === "가상자산 사칭 사기") return "코인 거래소 사칭"
  if (type === "기타 사칭 사기") return "플랫폼 사칭"
  return type.replace(/\s*사기$/, "")
}

function rewriteGeneratedContextForType(source, type) {
  if (type === "쇼핑몰 사칭 사기" || type === "부업 사칭 사기") return source

  const label = getTypeLabel(type)

  return source
    .replace(/쇼핑몰 사칭/g, label)
    .replace(/해외 쇼핑몰/g, `해외 ${label} 사이트`)
    .replace(/쇼핑몰 형태의 정산 사이트/g, `${label} 형태의 사칭 사이트`)
    .replace(/정상 쇼핑몰처럼/g, `정상 ${label} 사이트처럼`)
    .replace(/도메인형 쇼핑몰/g, `도메인형 ${label}`)
    .replace(/한글명 쇼핑몰/g, `한글명 ${label}`)
    .replace(/영문 사이트명 쇼핑몰/g, `영문 사이트명 ${label}`)
    .replace(/영문명 쇼핑몰/g, `영문명 ${label}`)
    .replace(/축약명 쇼핑몰/g, `축약명 ${label}`)
    .replace(/쇼핑몰 운영/g, "투자 상담")
    .replace(/쇼핑몰 업무/g, "투자 상담")
    .replace(/구매 대행/g, "투자 대행")
    .replace(/주문 대행/g, "거래 대행")
    .replace(/리뷰 업무/g, "리딩방 안내")
    .replace(/상품 주문/g, "거래 신청")
    .replace(/상품 구매/g, "투자 상품 가입")
    .replace(/투자 상품 가입나/g, "투자 상품 가입이나")
    .replace(/투자 상품 가입로/g, "투자 상품 가입으로")
    .replace(/상품 처리/g, "거래 처리")
    .replace(/주문 처리/g, "거래 처리")
    .replace(/주문 완료/g, "거래 승인")
    .replace(/거래 승인를/g, "거래 승인을")
    .replace(/주문 금액/g, "거래 금액")
    .replace(/주문 미완료/g, "거래 미완료")
    .replace(/정산금/g, "수익금")
    .replace(/환불 보류/g, "출금 보류")
    .replace(/환불 지연/g, "출금 지연")
    .replace(/환불 거부/g, "출금 거부")
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

  if (hasDomainKeyword(item.caseName)) {
    score += 300
  } else if (hasLatinKeyword(item.caseName)) {
    score += 200
  } else {
    score += 100
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

const seoTitle = `${caseDisplayName} 피해회복`

const seoDescription = `${cleanCaseName} 피해 사례 및 대응 전략 안내`
const caseType = detectCaseType(`${slug} ${cleanCaseName}`)
const primaryKeyword = cleanCaseName
const aliases = getIdentityTokens(`${slug} ${cleanCaseName}`).join(", ")

const frontmatter = `---
title: "${seoTitle}"
caseName: "${cleanCaseName}"
description: "${seoDescription}"
slug: "${slug}"
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

function buildRoleBody() {
  const role = detectKeywordRole(cleanCaseName)
  const name = caseDisplayName
  const plainName = cleanCaseName

  const commonEvidence = `✔ 입금확인증과 계좌번호  
✔ 사이트 주소와 로그인 화면 캡처  
✔ 상품 주문 내역 또는 정산 화면  
✔ 담당자와의 카카오톡, 텔레그램, 문자 대화  
✔ 출금 또는 환불 요청 후 받은 답변  
✔ 추가 입금 요구 내역`

  const commonCaution = `✔ 대표자를 선정한 뒤 장기간 기다려야 하는 단체 대응은 신중하게 판단해야 합니다

✔ 진행비 명목의 선입금 또는 후불제를 요구하는 방식은 반드시 확인이 필요합니다

✔ 전문가를 자칭하더라도 변호사가 아니라면 법률서비스 제공은 불가능합니다

특히 변호사의 후불제 수임은 법적으로 허용되지 않는 방식이므로, 후불제를 언급하는 경우 또 다른 사기 가능성을 반드시 의심해야 합니다.`

  const bodies = {
    domain: `## 1. ${name} 도메인 확인이 중요한 이유

${plainName}은 실제 접속 주소를 기준으로 피해 여부를 확인해야 하는 쇼핑몰 사칭 의심 사례입니다. 도메인이 남아 있을 때는 메인 화면, 로그인 화면, 주문 또는 정산 화면, 고객센터 안내 문구를 빠르게 확보하는 것이 중요합니다.

도메인형 사칭 사이트는 폐쇄되거나 다른 주소로 이동되는 경우가 많습니다. 따라서 단순히 사이트 이름만 기억하는 것보다 주소 전체, 접속 경로, 안내받은 링크, 결제 또는 입금 요청 화면을 함께 정리해야 합니다.

${imageBlock("02", `${plainName} 도메인 기반 쇼핑몰 사칭 구조 안내 이미지`)}

## 2. ${name} 접속 경로와 유입 방식

도메인형 쇼핑몰 사칭은 문자, 카카오톡, SNS 광고, 오픈채팅방, 부업 안내 메시지 등을 통해 시작되는 경우가 많습니다. 처음에는 상품 구매, 리뷰 작성, 주문 대행, 정산 수익 같은 표현으로 접근합니다.

피해자는 ${plainName}에 접속해 정상 쇼핑몰처럼 보이는 화면을 확인하지만, 실제 목적은 결제나 입금을 반복적으로 유도하는 구조일 수 있습니다. 특히 주문 금액, 정산 가능 금액, 보증금, 인증비가 순차적으로 늘어나는 흐름이라면 주의가 필요합니다.

${imageBlock("03", `${plainName} 접속 경로와 입금 유도 방식 설명 이미지`)}

## 3. ${name} 사이트 구조 분석

도메인 페이지에서는 사이트 화면 자체가 중요한 증거입니다. 상품 목록, 주문 내역, 정산 페이지, 고객센터 문구, 계정 등급, 출금 또는 환불 메뉴가 어떻게 구성되어 있는지 확인해야 합니다.

✔ 도메인 주소와 하위 경로  
✔ 로그인 계정과 회원번호  
✔ 주문, 구매, 배송, 정산 화면  
✔ 출금 제한 또는 환불 지연 안내  
✔ 입금 계좌와 예금주 정보  
✔ 사이트 폐쇄 또는 접속 차단 여부  

${imageBlock("04", `${plainName} 사이트 화면과 허위 정산 구조 안내 이미지`)}

## 4. ${name} 피해 사례

첫 번째 사례는 소액 상품 구매로 시작된 뒤 정산금이 표시되면서 추가 결제를 요구받는 흐름입니다. 피해자는 실제 수익이 쌓이는 것처럼 보이는 화면을 보고 더 큰 금액을 입금하게 됩니다.

두 번째 사례는 주문 대행 또는 쇼핑몰 운영을 돕는다는 안내를 받은 뒤 보증금, 인증비, 세금 명목으로 추가 송금을 요구받는 유형입니다.

세 번째 사례는 출금이나 환불을 요청했을 때 계정 오류, 주문 미완료, 등급 부족 등을 이유로 접속 제한 또는 추가 입금을 요구받는 유형입니다.

${imageBlock("05", `${plainName} 피해 사례와 추가 입금 요구 구조 이미지`)}

## 5. ${name} 대응 전략과 증거 정리

${plainName} 관련 피해가 의심된다면 사이트가 사라지기 전에 자료를 먼저 확보해야 합니다. 도메인 기반 사건은 주소와 화면 캡처가 사건 연결성을 설명하는 핵심 자료가 됩니다.

${commonEvidence}

계좌 추적, 가압류, 민사상 손해배상 청구 가능성은 입금 흐름과 상대방 특정 가능성에 따라 달라지므로 초기 자료 정리가 중요합니다.

${kakaoImageBlock(`${plainName} 도메인 사칭 피해 상담 안내 이미지`)}

## 6. ${name} 현재 확인 포인트

같은 도메인 또는 유사 도메인을 안내받은 피해자가 있다면 상담 방식, 입금 계좌, 주문 화면, 정산 화면의 공통점을 비교해야 합니다. 도메인 하나가 닫히더라도 유사 주소로 반복 운영될 수 있기 때문입니다.

이미 출금 지연, 환불 거부, 추가 입금 요구가 발생했다면 더 이상의 송금은 중단하고 기존 대화와 입금 내역을 정리하는 것이 우선입니다.

${phoneImageBlock(`${plainName} 피해 회복 골든타임 안내 이미지`)}

## 7. ${name} 2차 피해 주의

${commonCaution}

${imageBlock("08", `${plainName} 쇼핑몰 사칭 2차 피해 주의 이미지`)}`,

    "english-full": `## 1. ${name} 영문 사이트명 검색 대응

${plainName}은 영문 사이트명 또는 서비스명으로 검색되는 쇼핑몰 사칭 의심 사례입니다. 피해자는 정확한 도메인을 기억하지 못하더라도 영문 표기만으로 검색하는 경우가 많기 때문에, 영문명 자체의 기록이 중요합니다.

영문명이 안내된 경우에는 같은 이름을 사용하는 도메인, 앱, 고객센터 계정, 오픈채팅방 이름이 함께 존재하는지 확인해야 합니다.

${imageBlock("02", `${plainName} 영문 사이트명 쇼핑몰 사칭 구조 이미지`)}

## 2. ${name} 안내 방식

영문명 기반 사칭은 해외 쇼핑몰, 구매 대행, 주문 처리, 정산 업무처럼 보이도록 포장되는 경우가 있습니다. 담당자는 안정적인 수익이나 빠른 정산을 강조하며 사이트 가입 또는 결제를 유도합니다.

이때 실제 회사 정보보다 영문명, 로고, 사이트 화면만 반복적으로 노출되는 경우가 많습니다. 법인 정보, 통신판매업 정보, 환불 정책이 불명확하다면 주의해야 합니다.

${imageBlock("03", `${plainName} 영문명 안내와 접근 방식 이미지`)}

## 3. ${name} 구조 분석

영문명 페이지에서는 표기 변형을 함께 확인해야 합니다. 하이픈, 점, 숫자, com 여부에 따라 검색 결과가 달라질 수 있고, 같은 운영자가 여러 주소를 병행할 가능성도 있습니다.

✔ ${plainName} 영문 표기  
✔ 유사 도메인 또는 하위 주소  
✔ 같은 로고와 화면을 쓰는 사이트  
✔ 주문, 정산, 환불 메뉴 구성  
✔ 입금 계좌와 예금주 반복 여부  

${imageBlock("04", `${plainName} 영문명 변형과 사이트 구조 분석 이미지`)}

## 4. ${name} 피해 사례

첫 번째 피해 유형은 영문 사이트명을 신뢰하고 회원가입한 뒤 상품 구매나 정산을 이유로 입금한 사례입니다.

두 번째 피해 유형은 구매 대행 또는 쇼핑몰 운영 업무처럼 안내받고, 처리해야 할 주문 금액이 점점 커지는 흐름입니다.

세 번째 피해 유형은 출금을 요청하자 계정 인증, 세금, 보증금, 주문 오류 해결 비용을 요구받는 흐름입니다.

${imageBlock("05", `${plainName} 영문 사이트명 피해 사례 이미지`)}

## 5. ${name} 대응 자료

영문명만으로도 사건을 정리할 수 있지만, 가능하면 도메인 주소와 화면 자료를 함께 확보해야 합니다. 같은 영문명을 쓰는 피해자들이 모이면 계좌와 운영 방식의 공통점을 확인하기 쉽습니다.

${commonEvidence}

${kakaoImageBlock(`${plainName} 영문명 사칭 피해 상담 이미지`)}

## 6. ${name} 현재 상황

${plainName}을 검색해 들어온 경우라면 정확한 주소, 한글 안내명, 담당자 계정명까지 함께 정리해 두는 것이 좋습니다. 영문 표기는 피해자마다 다르게 기억될 수 있어 여러 변형을 비교해야 합니다.

추가 입금을 요구받는 단계라면 송금을 중단하고, 이미 입금한 내역과 안내받은 URL을 기준으로 대응 방향을 검토해야 합니다.

${phoneImageBlock(`${plainName} 쇼핑몰 사칭 피해 신속 대응 이미지`)}

## 7. ${name} 주의 사항

${commonCaution}

${imageBlock("08", `${plainName} 영문명 쇼핑몰 사칭 주의 이미지`)}`,

    "english-short": `## 1. ${name} 축약 영문명 확인

${plainName}은 짧은 영문명으로 기억되거나 검색되는 쇼핑몰 사칭 의심 사례입니다. 축약명은 실제 도메인, 앱 이름, 채팅방 이름, 담당자 프로필에 일부만 노출되는 경우가 많습니다.

따라서 ${plainName}만 보고 판단하기보다, 함께 안내받은 전체 사이트 주소와 한글명, 입금 계좌를 같이 확인해야 합니다.

${imageBlock("02", `${plainName} 축약 영문명 사칭 구조 이미지`)}

## 2. ${name} 검색자가 놓치기 쉬운 부분

짧은 영문명은 여러 사이트명에 포함될 수 있습니다. 피해자는 전체 주소를 기억하지 못하고 일부 단어만 검색하는 경우가 많아, 같은 축약명이 들어간 도메인 변형을 함께 살펴볼 필요가 있습니다.

특히 주문 대행, 리뷰 업무, 정산금, 환불 보류 같은 설명과 함께 ${plainName}이 등장했다면 쇼핑몰 사칭 구조일 가능성을 확인해야 합니다.

${imageBlock("03", `${plainName} 축약명 접근 경로 안내 이미지`)}

## 3. ${name} 관련 구조 분석

축약명 페이지에서는 이름 자체보다 주변 정보가 중요합니다. 어떤 사이트에서 보았는지, 누가 안내했는지, 어떤 계좌로 입금을 요구했는지를 연결해야 합니다.

✔ 축약명과 전체 사이트명 비교  
✔ 도메인, 앱, 채팅방 이름 확인  
✔ 주문 또는 정산 화면 캡처  
✔ 환불 지연 사유 기록  
✔ 입금 계좌 반복 여부 확인  

${imageBlock("04", `${plainName} 축약명 쇼핑몰 사칭 분석 이미지`)}

## 4. ${name} 피해 사례

첫 번째 사례는 ${plainName}이라는 짧은 이름만 기억한 상태에서 검색을 시작한 경우입니다. 전체 URL을 나중에 확인해 보니 쇼핑몰 형태의 정산 사이트였습니다.

두 번째 사례는 채팅 담당자가 축약명을 사용하면서 별도 링크를 보내고, 상품 처리나 주문 완료를 이유로 입금을 요구한 경우입니다.

세 번째 사례는 환불을 요청하자 계정 오류나 정산 지연을 이유로 추가 금액을 요구한 경우입니다.

${imageBlock("05", `${plainName} 축약명 피해 사례 이미지`)}

## 5. ${name} 대응 자료

${plainName}만 알고 있더라도 대화 내용, 링크 미리보기, 캡처 이미지, 입금 계좌를 모으면 사건의 흐름을 정리할 수 있습니다.

${commonEvidence}

${kakaoImageBlock(`${plainName} 축약명 쇼핑몰 사칭 상담 이미지`)}

## 6. ${name} 현재 확인 방향

동일한 축약명을 사용하는 다른 피해 사례가 있는지 확인하고, 도메인형 대표 사건과 연결되는지 비교해야 합니다. 짧은 이름은 단독으로는 불명확하므로 주소와 계좌 정보가 함께 필요합니다.

이미 추가 입금 요구가 있었다면 더 이상의 송금을 중단하고, 기존 자료를 보존하는 것이 우선입니다.

${phoneImageBlock(`${plainName} 피해 회복 신속 대응 이미지`)}

## 7. ${name} 주의 사항

${commonCaution}

${imageBlock("08", `${plainName} 축약 영문명 2차 피해 주의 이미지`)}`,

    "korean-full": `## 1. ${name} 한글명으로 안내되는 쇼핑몰 사칭

${plainName}은 한글명으로 안내받은 피해자가 검색할 가능성이 높은 쇼핑몰 사칭 의심 사례입니다. 카카오톡, 문자, 오픈채팅방에서는 영문 도메인보다 한글명을 먼저 보여주는 경우가 많습니다.

한글명 페이지에서는 피해자가 기억하는 명칭, 안내 문구, 상담원이 사용한 표현을 중심으로 사건을 정리하는 것이 중요합니다.

${imageBlock("02", `${plainName} 한글명 쇼핑몰 사칭 구조 이미지`)}

## 2. ${name} 접근 경위

한글명 쇼핑몰 사칭은 부업, 공동구매, 상품 주문 처리, 리뷰 업무, 정산 수익 같은 설명으로 접근하는 경우가 있습니다. 처음에는 소액 처리로 신뢰를 만든 뒤 점차 큰 금액의 결제나 입금을 요구할 수 있습니다.

피해자는 ${plainName}이라는 이름을 정상 업체명처럼 인식하지만, 실제 사업자 정보와 환불 정책이 불명확하다면 사칭 여부를 확인해야 합니다.

${imageBlock("03", `${plainName} 한글명 접근 경위 이미지`)}

## 3. ${name} 구조 분석

한글명으로 안내받은 경우에는 실제 접속 주소와 연결해야 합니다. 같은 한글명을 쓰더라도 도메인이나 계좌가 다를 수 있고, 반대로 같은 운영자가 여러 한글명을 사용할 수도 있습니다.

✔ 한글명과 영문 도메인 연결 여부  
✔ 카카오톡 또는 문자 안내 내용  
✔ 주문, 결제, 정산 화면  
✔ 환불이나 출금 지연 사유  
✔ 입금 계좌와 예금주 정보  

${imageBlock("04", `${plainName} 한글명 쇼핑몰 사칭 분석 이미지`)}

## 4. ${name} 피해 사례

첫 번째 사례는 한글명 쇼핑몰을 믿고 상품 주문 또는 처리 업무를 진행하다가 입금을 반복한 경우입니다.

두 번째 사례는 정산금이 표시되는 화면을 보고 실제 수익이 발생한 것처럼 오인해 추가 금액을 보낸 경우입니다.

세 번째 사례는 환불 요청 후 보증금, 인증비, 세금 등 다른 명목의 추가 입금을 요구받은 경우입니다.

${imageBlock("05", `${plainName} 한글명 쇼핑몰 피해 사례 이미지`)}

## 5. ${name} 대응 자료

한글명으로 안내받은 피해자는 해당 명칭이 표시된 화면과 대화 내용을 먼저 확보해야 합니다. 명칭만으로는 상대방 특정이 어렵기 때문에 도메인, 계좌, 담당자 정보가 함께 필요합니다.

${commonEvidence}

${kakaoImageBlock(`${plainName} 한글명 사칭 피해 상담 이미지`)}

## 6. ${name} 현재 상황

${plainName}과 같은 한글명을 검색하는 피해자가 있다면 같은 도메인 또는 같은 계좌로 연결되는지 확인해야 합니다. 동일한 문구와 화면이 반복된다면 공동 대응에 필요한 단서를 찾을 수 있습니다.

이미 출금 지연이나 환불 거부가 발생했다면 자료를 보존하고 추가 송금은 멈추는 것이 좋습니다.

${phoneImageBlock(`${plainName} 쇼핑몰 사칭 피해 신속 대응 이미지`)}

## 7. ${name} 주의 필수

${commonCaution}

${imageBlock("08", `${plainName} 한글명 쇼핑몰 사칭 주의 이미지`)}`,

    "korean-short": `## 1. ${name} 축약 한글명 검색 대응

${plainName}은 전체 명칭보다 짧게 기억되거나 줄여서 검색될 가능성이 있는 쇼핑몰 사칭 의심 사례입니다. 피해자는 정확한 사이트명이나 도메인을 모르고 일부 한글명만 기억하는 경우가 많습니다.

축약 한글명 페이지는 전체 한글명, 영문명, 도메인 페이지로 이어지는 보조 검색 입구 역할을 해야 합니다.

${imageBlock("02", `${plainName} 축약 한글명 사칭 구조 이미지`)}

## 2. ${name}으로 검색되는 유입 경로

피해자는 채팅방 이름, 담당자 설명, 입금 안내 문구에서 본 일부 명칭만으로 검색할 수 있습니다. 이 경우 ${plainName}과 관련된 전체 명칭과 사이트 주소를 함께 확인해야 합니다.

부업, 쇼핑몰 운영, 주문 처리, 정산금, 환불 지연 같은 표현이 함께 있었다면 쇼핑몰 사칭 피해 가능성을 열어두어야 합니다.

${imageBlock("03", `${plainName} 축약 한글명 접근 경위 이미지`)}

## 3. ${name} 관련 구조 분석

축약 한글명은 단독으로는 넓은 표현입니다. 따라서 같은 그룹의 전체 명칭, 영문명, 도메인과 연결되는지 확인하는 방식으로 정리해야 합니다.

✔ 축약명과 전체명 비교  
✔ 안내받은 URL 또는 링크 미리보기  
✔ 상품 주문, 결제, 정산 화면  
✔ 환불 지연과 추가 입금 요구  
✔ 담당자 계정과 입금 계좌  

${imageBlock("04", `${plainName} 축약 한글명 구조 분석 이미지`)}

## 4. ${name} 피해 사례

첫 번째 사례는 축약명만 기억한 상태에서 상담을 요청했고, 이후 전체 사이트명과 도메인이 확인된 경우입니다.

두 번째 사례는 쇼핑몰 업무처럼 안내받고 주문 처리 금액을 대신 결제했다가 정산이 지연된 경우입니다.

세 번째 사례는 환불을 요청했지만 계정 인증, 주문 오류, 세금 등의 명목으로 추가 입금을 요구받은 경우입니다.

${imageBlock("05", `${plainName} 축약 한글명 피해 사례 이미지`)}

## 5. ${name} 대응 자료

축약명만 알고 있어도 대화방 캡처, 링크, 입금 내역, 담당자 프로필을 모으면 전체 사건과 연결할 수 있습니다.

${commonEvidence}

${kakaoImageBlock(`${plainName} 축약 한글명 피해 상담 이미지`)}

## 6. ${name} 현재 확인 방향

${plainName}으로 검색한 경우에는 같은 그룹의 대표 도메인 페이지와 함께 보는 것이 좋습니다. 축약명은 검색 입구이고, 실제 대응은 도메인과 계좌 정보를 중심으로 정리해야 합니다.

추가 입금을 요구받고 있다면 송금을 중단하고, 기존 대화 내용과 입금 자료를 먼저 보존해야 합니다.

${phoneImageBlock(`${plainName} 축약 한글명 피해 신속 대응 이미지`)}

## 7. ${name} 주의 사항

${commonCaution}

${imageBlock("08", `${plainName} 축약 한글명 2차 피해 주의 이미지`)}`,
  }

  return bodies[role]
}

/*
========================================
template 처리
========================================
*/

function buildMdx() {
  let template = fs.readFileSync(
    templatePath,
    "utf-8"
  )

  const imagePath = `/images/cases/${slug}.png`

  template = template
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

  template = rewriteGeneratedContextForType(
    template,
    detectCaseType(cleanCaseName)
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

  console.log("")
  console.log(`/cases/${slug}`)
})()
