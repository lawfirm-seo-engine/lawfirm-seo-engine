const fs = require("node:fs")
const path = require("node:path")

const rootDir = process.cwd()
const casesDir = path.join(rootDir, "content", "daeonlawfintech", "cases")
const publicDir = path.join(rootDir, "public")

const domainPattern = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/i

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

const genericEnglishTokens = new Set([
  "app",
  "bar",
  "bit",
  "biz",
  "co",
  "coin",
  "com",
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

const genericKoreanTokens = new Set([
  "거래소",
  "공모주",
  "금",
  "대응",
  "리딩방",
  "부업",
  "비상장",
  "사기",
  "사례",
  "사칭",
  "쇼핑몰",
  "증권사",
  "체험단",
  "코인",
  "투자",
  "피해",
  "피해회복",
])

function readFrontmatter(source) {
  const match = source.match(/^---\s*([\s\S]*?)\s*---/)
  const frontmatter = {}

  if (!match) return frontmatter

  match[1].split(/\r?\n/).forEach((line) => {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*["']?(.+?)["']?\s*$/)
    if (item) frontmatter[item[1]] = item[2].trim()
  })

  return frontmatter
}

function romanizeHangul(input) {
  const choseong = [
    "g",
    "kk",
    "n",
    "d",
    "tt",
    "r",
    "m",
    "b",
    "pp",
    "s",
    "ss",
    "",
    "j",
    "jj",
    "ch",
    "k",
    "t",
    "p",
    "h",
  ]
  const jungseong = [
    "a",
    "ae",
    "ya",
    "yae",
    "eo",
    "e",
    "yeo",
    "ye",
    "o",
    "wa",
    "wae",
    "oe",
    "yo",
    "u",
    "wo",
    "we",
    "wi",
    "yu",
    "eu",
    "ui",
    "i",
  ]
  const jongseong = [
    "",
    "g",
    "kk",
    "gs",
    "n",
    "nj",
    "nh",
    "d",
    "l",
    "lg",
    "lm",
    "lb",
    "ls",
    "lt",
    "lp",
    "lh",
    "m",
    "b",
    "bs",
    "s",
    "ss",
    "ng",
    "j",
    "ch",
    "k",
    "t",
    "p",
    "h",
  ]

  return input
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)

      if (code < 0xac00 || code > 0xd7a3) return char

      const syllableIndex = code - 0xac00
      const cho = Math.floor(syllableIndex / 588)
      const jung = Math.floor((syllableIndex % 588) / 28)
      const jong = syllableIndex % 28

      return `${choseong[cho]}${jungseong[jung]}${jongseong[jong]}`
    })
    .join("")
}

function detectCaseType(text) {
  const value = text.toLowerCase()

  if (/대신증권|증권|증권사|securities|stock|주식|공모주|비상장|hts|mts|리딩방|애널리스트|fwrd6|daishin|allspring|\uace8\ub4dc\ub4dc\ub9bc|\uc804\ubb38\uac00|\uc138\ub825\ud2b8\ub808\uc774\ub529/.test(value)) {
    return "증권사 사칭 사기"
  }

  if (/쇼핑몰|마켓|mall|market|shop|store|구매대행|미션|리뷰|부업/.test(value)) {
    return "쇼핑몰 사칭 사기"
  }

  if (/코인|거래소|wallet|지갑|스테이킹|crypto|coin|bit/.test(value)) {
    return "코인 거래소 사칭 사기"
  }

  if (/해외선물|fx|마진|나스닥|선물/.test(value)) {
    return "해외선물 사칭 사기"
  }

  if (/방송|라이브|환전|채팅|만남/.test(value)) {
    return "방송 환전 사칭 사기"
  }

  return "플랫폼 사칭 사기"
}

function getIdentityTokens(text) {
  const rawLower = text.toLowerCase()
  const lower = romanizeHangul(text)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
  const tokens = new Set()
  const domains = lower.match(new RegExp(domainPattern, "g")) || []

  domains.forEach((domain) => {
    const compact = domain.replace(/[^a-z0-9]/g, "")
    const rootToken = domain.split(".")[0]

    if (compact.length >= 4) tokens.add(compact)
    if (rootToken.length >= 4 && !genericEnglishTokens.has(rootToken)) {
      tokens.add(rootToken)
    }
  })

  lower
    .split(/[\s\-_.:/|()[\]{}]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (/^[a-z0-9]+$/.test(token)) {
        if (token.length >= 4 && !genericEnglishTokens.has(token)) tokens.add(token)
        return
      }

      if (/^[가-힣]+$/.test(token) && token.length >= 3 && !genericKoreanTokens.has(token)) {
        tokens.add(token)
      }
    })

  aliasGroups.forEach((group) => {
    if (group.some((alias) => lower.includes(alias.toLowerCase()) || rawLower.includes(alias.toLowerCase()))) {
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
        (token.length >= 5 && target.length >= 5 && (token.includes(target) || target.includes(token)))
    )
  )
}

function getRepresentativeRule(text) {
  const rawLower = text.toLowerCase()
  const lower = romanizeHangul(text).toLowerCase()

  return representativeRules.find((rule) =>
    rule.tokens.some((token) => {
      const normalizedToken = token.toLowerCase()

      return rawLower.includes(normalizedToken) || lower.includes(normalizedToken)
    })
  )
}

function collectImageSources(source) {
  return Array.from(source.matchAll(/(?:src=["']|!\[[^\]]*]\()([^"')]+)(?:["']|\))/g))
    .map((match) => match[1].split("?")[0])
    .filter((src) => src.startsWith("/"))
}

function addIssue(issues, severity, file, message) {
  issues.push({ severity, file, message })
}

function removeRepresentativeMetaAndPreamble(source) {
  return source
    .replace(
      /^---\s*([\s\S]*?)\s*---/,
      (match, body) => {
        const cleaned = body
          .split(/\r?\n/)
          .filter((line) => !line.trim().startsWith("representativeSlug:"))
          .join("\n")
          .trim()

        return `---\n${cleaned}\n---`
      }
    )
    .replace(/^(---[\s\S]*?---)\s*[\s\S]*?(?=^#\s)/m, "$1\n\n")
}

function removeRepresentativePreamble(source) {
  return source.replace(/^(---[\s\S]*?---)\s*[\s\S]*?(?=^#\s)/m, "$1\n\n")
}

function setRepresentativeSlug(source, nextRepresentativeSlug) {
  return removeRepresentativePreamble(source).replace(
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
}

const contentMismatchTypes = new Set([
  "증권사 사칭 사기",
  "코인 거래소 사칭 사기",
  "해외선물 사칭 사기",
  "방송 환전 사칭 사기",
])

const shoppingContextPattern =
  /쇼핑몰|주문 대행|리뷰 업무|환불 보류|상품 주문|상품 구매|쇼핑몰 운영|쇼핑몰 업무|구매 대행/

function getTypeLabel(type) {
  if (type === "증권사 사칭 사기") return "증권사 사칭"
  if (type === "코인 거래소 사칭 사기") return "코인 거래소 사칭"
  if (type === "해외선물 사칭 사기") return "해외선물 사칭"
  if (type === "방송 환전 사칭 사기") return "방송 환전 사칭"
  return "플랫폼 사칭"
}

function rewriteShoppingContextForType(source, type) {
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

function main() {
  const shouldFix = process.argv.includes("--fix")
  const issues = []
  const fixes = []
  const files = fs
    .readdirSync(casesDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => file !== "_template.mdx")
    .filter((file) => !file.startsWith("_"))
    .sort()

  const cases = files.map((file) => {
    const filePath = path.join(casesDir, file)
    const source = fs.readFileSync(filePath, "utf8")
    const slug = file.replace(/\.mdx$/, "")
    const frontmatter = readFrontmatter(source)
    const caseName = frontmatter.caseName || slug.replace(/-/g, " ")
    const text = `${slug} ${caseName}`

    return {
      file,
      slug,
      source,
      frontmatter,
      caseName,
      representativeSlug: frontmatter.representativeSlug || "",
      type: detectCaseType(text),
      text,
      identityTokens: getIdentityTokens(text),
    }
  })

  const bySlug = new Map(cases.map((item) => [item.slug, item]))

  cases.forEach((item) => {
    if (item.frontmatter.slug && item.frontmatter.slug !== item.slug) {
      addIssue(issues, "error", item.file, `frontmatter slug mismatch: ${item.frontmatter.slug}`)
    }

    if (!item.frontmatter.title) {
      addIssue(issues, "warning", item.file, "missing title frontmatter")
    }

    if (!item.frontmatter.description) {
      addIssue(issues, "warning", item.file, "missing description frontmatter")
    }

    if (!item.frontmatter.caseName) {
      addIssue(issues, "warning", item.file, "missing caseName frontmatter")
    }

    let invalidRepresentative = false

    if (item.representativeSlug) {
      const representative = bySlug.get(item.representativeSlug)

      if (!representative) {
        addIssue(issues, "error", item.file, `representativeSlug does not exist: ${item.representativeSlug}`)
        invalidRepresentative = true
      } else {
        if (item.type !== representative.type) {
          addIssue(issues, "error", item.file, `representative type mismatch: ${item.type} -> ${representative.type}`)
          invalidRepresentative = true
        }

        if (!sharesIdentity(item.text, representative.text)) {
          addIssue(
            issues,
            "error",
            item.file,
            `representative identity mismatch: ${item.slug} -> ${representative.slug}`
          )
          invalidRepresentative = true
        }
      }
    }

    const preMainHeading = item.source.match(/^---[\s\S]*?---\s*([\s\S]*?)(?=^#\s)/m)?.[1] || ""
    const guideCount =
      (item.source.match(/관련 대표 사건 안내/g) || []).length +
      (preMainHeading.match(/\/cases\//g) || []).length
    if (guideCount > 1) {
      addIssue(issues, "error", item.file, `duplicate representative guide blocks: ${guideCount}`)
    }

    if (guideCount > 0 && !item.representativeSlug) {
      addIssue(issues, "error", item.file, "representative guide exists without representativeSlug")
      invalidRepresentative = true
    }

    if (shouldFix && (invalidRepresentative || guideCount > 0)) {
      const nextSource = invalidRepresentative
        ? removeRepresentativeMetaAndPreamble(item.source)
        : removeRepresentativePreamble(item.source)

      if (nextSource !== item.source) {
        fs.writeFileSync(path.join(casesDir, item.file), nextSource, "utf8")
        fixes.push(item.file)
      }
    }

    const representativeRule = getRepresentativeRule(item.text)
    const expectedRepresentativeSlug = representativeRule?.representativeSlug || ""

    if (expectedRepresentativeSlug && bySlug.has(expectedRepresentativeSlug)) {
      if (item.slug === expectedRepresentativeSlug && item.representativeSlug) {
        addIssue(issues, "error", item.file, "representative page should not point to another representative")

        if (shouldFix) {
          const currentSource = fs.readFileSync(path.join(casesDir, item.file), "utf8")
          const nextSource = removeRepresentativeMetaAndPreamble(currentSource)

          if (nextSource !== currentSource) {
            fs.writeFileSync(path.join(casesDir, item.file), nextSource, "utf8")
            fixes.push(item.file)
          }
        }
      }

      if (item.slug !== expectedRepresentativeSlug && item.representativeSlug !== expectedRepresentativeSlug) {
        addIssue(
          issues,
          "error",
          item.file,
          `representativeSlug should be ${expectedRepresentativeSlug}`
        )

        if (shouldFix) {
          const currentSource = fs.readFileSync(path.join(casesDir, item.file), "utf8")
          const nextSource = setRepresentativeSlug(currentSource, expectedRepresentativeSlug)

          if (nextSource !== currentSource) {
            fs.writeFileSync(path.join(casesDir, item.file), nextSource, "utf8")
            fixes.push(item.file)
          }
        }
      }
    }

    const hasContentMismatch =
      contentMismatchTypes.has(item.type) && shoppingContextPattern.test(item.source)

    if (hasContentMismatch) {
      addIssue(issues, "error", item.file, `content type mismatch: ${item.type} page contains shopping-mall context`)
    }

    if (shouldFix && hasContentMismatch) {
      const currentSource = fs.readFileSync(path.join(casesDir, item.file), "utf8")
      const nextSource = rewriteShoppingContextForType(currentSource, item.type)

      if (nextSource !== currentSource) {
        fs.writeFileSync(path.join(casesDir, item.file), nextSource, "utf8")
        fixes.push(item.file)
      }
    }

    collectImageSources(item.source).forEach((src) => {
      const imagePath = path.join(publicDir, src.replace(/^\//, ""))

      if (!fs.existsSync(imagePath)) {
        addIssue(issues, "error", item.file, `missing image: ${src}`)
      }
    })

    ;["png", "avif"].forEach((extension) => {
      const ogImage = `/images/cases/${item.slug}.${extension}`
      const ogImagePath = path.join(publicDir, ogImage.replace(/^\//, ""))

      if (!fs.existsSync(ogImagePath)) {
        addIssue(issues, "error", item.file, `missing case OG image: ${ogImage}`)
      }
    })
  })

  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")

  console.log(`cases=${cases.length}`)
  console.log(`errors=${errors.length}`)
  console.log(`warnings=${warnings.length}`)
  console.log(`fixes=${fixes.length}`)

  issues.forEach((issue) => {
    console.log(`[${issue.severity}] ${issue.file} - ${issue.message}`)
  })

  if (errors.length > 0) process.exitCode = 1
}

main()
