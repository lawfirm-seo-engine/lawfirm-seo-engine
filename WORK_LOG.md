# WORK LOG — 대온 법률사무소 SEO 엔진

> 새 PC에서 작업 시작 전 반드시 이 파일을 먼저 읽을 것.
> 업데이트: 2026-05-14

---

## 프로젝트 개요

- **사이트**: https://daeonlawfintech.com
- **용도**: 금융사기 피해 법률사무소 SEO 특화 사이트
- **스택**: Next.js 16.2.4 (App Router) + MDX + Vercel (무료 플랜)
- **콘텐츠 경로**: `content/daeonlawfintech/cases/*.mdx` (현재 662개)
- **이미지 경로**: `public/images/cases/` (PNG + AVIF, git 커밋 필수)

---

## 핵심 아키텍처 결정사항

### 1. cases/[slug] — 정적 생성 (generateStaticParams)

**이유**: Vercel 무료 플랜 함수 크기 50MB 한도 초과 문제 해결

- `export const dynamic = "force-dynamic"` → 제거
- `generateStaticParams()` 추가: 빌드 시 전체 케이스 HTML 사전 생성
- `export const dynamicParams = false`: 목록에 없는 slug → 404
- **신규 MDX 추가 후 반드시 재배포해야 반영됨** (자동 배포는 git push 시)

### 2. publicImageExists() — 제거됨

**이유**: `fs.existsSync(process.cwd() + "/public/...")` 패턴이
Vercel 파일 추적기를 통해 `public/images/` 전체(245MB)를 함수 번들에 포함시켜
`function_size_exceeded` 에러 유발

- 현재: 이미지 경로는 slug에서 직접 반환 (`/images/cases/${slug}.png`)
- 이미지가 없으면 브라우저에서 alt 텍스트 표시 (662개 중 1개 누락 → 해결 완료)
- **절대 publicDir + fs.existsSync 조합을 다시 추가하지 말 것**

### 3. 템플릿 이미지 SEO 개선 (Next.js rewrites)

파일 복사 없이 사건명 기반 이미지 URL 제공

- MDX 렌더 시 `template-02.jpg ~ template-08.png` → `${slug}--02.jpg ~ ${slug}--08.png` 로 치환
- `next.config.ts`의 `rewrites()`가 실제 template 파일을 서빙
- **페이지당 8개 이미지 전체에 사건 키워드 포함됨**

### 4. 네이버 IndexNow 자동 제출

- Vercel 배포 시 `postbuild` 훅에서 전체 URL 자동 제출
- 엔드포인트: `api.indexnow.org` + `searchadvisor.naver.com/indexnow`
- **수동색인 불필요** (배포 시 자동으로 처리됨)

### 5. vercel.json

```json
{ "buildCommand": "npm run build" }
```

- `npm run build` 명시 필수: 기본값(next build 직접 실행)은 postbuild 훅을 건너뜀

---

## MDX 그룹 링크 시스템

케이스 간 연관 관계를 frontmatter로 관리

```yaml
caseGroupId: "bitcoinbinance"       # 그룹 식별자
groupRole: "representative"         # 또는 "variant"
groupOrder: "1"                     # 그룹 내 순서
representativeSlug: "slug-name"     # variant 파일에만 기재 (대표 케이스 slug)
```

- **representative**: 그룹 대표 케이스 (groupRole + groupOrder + caseGroupId만 기재)
- **variant**: 하위 케이스 (위 4개 필드 모두 기재)
- 관련 명령어: `npm run case-link`
- 감사 명령어: `git grep "caseGroupId: \"그룹명\""  -- "*.mdx"`

---

## 주요 npm 명령어

```bash
npm run case-create   # MDX 파일 생성
npm run case-image    # 대표 이미지 생성 (slug.avif) — PNG도 별도 필요
npm run case-link     # 그룹 링크 frontmatter 적용
npm run case-keyword  # 키워드 추가
npm run case-memo     # 메모 추가
npm run case-comment  # 댓글 추가
npm run case-audit    # 케이스 감사
npm run indexnow      # IndexNow 수동 제출 (배포 없이 테스트용)
```

---

## 이미지 워크플로우

1. `npm run case-image "사건명"` → `public/images/cases/${slug}.avif` 생성
2. PNG도 별도 생성 필요 (현재 스크립트는 AVIF만 생성)
3. 생성된 이미지는 반드시 git add → commit → push
4. `template-02 ~ template-08` 파일은 건드리지 않음 (rewrite로 자동 처리)

---

## Vercel 배포 구조

```
npm run build
  ├── next build          # 679개 정적 페이지 생성 (4~5분 소요)
  └── postbuild
       ├── patch-nft.mjs  # cases/[slug] 번들 크기 패치 (254MB → 6MB)
       ├── next-sitemap   # sitemap.xml 자동 생성
       └── indexnow-submit.mjs  # 네이버+IndexNow 전체 URL 제출
```

- 무료 플랜 함수 크기 한도: 50MB (현재 6.2MB — 여유 충분)
- 무료 플랜 빌드 타임아웃: 45분 (현재 5분 — 수천 개까지 여유)
- **MDX 추가해도 함수 번들 크기 변화 없음** (이미지·MDX 파일이 번들에 미포함)

---

## 주의사항 (절대 하지 말 것)

1. `publicDir = path.join(process.cwd(), "public")` + `fs.existsSync` 조합 재추가 금지
2. `cases/[slug]/page.tsx`에 `export const dynamic = "force-dynamic"` 재추가 금지
3. `process.exit(1)` in postbuild 스크립트 추가 금지 (배포 실패 원인)
4. 대용량 바이너리를 git에 직접 커밋 시 Vercel 배포 속도 저하 주의

---

## 최근 주요 작업 이력 (2026-05-12)

| 커밋 | 내용 |
|------|------|
| 7c8525c | /cases noindex 처리 — 사건명 키워드 개별 페이지 노출 개선 |
| d07888c | 템플릿 이미지 → 사건명 기반 URL 치환 (이미지 SEO) |
| a9cb1e0 | publicImageExists 제거 (function_size_exceeded 해결) |
| 7b5ba38 | vercel.json buildCommand 명시 |
| 9261ff9 | cases/[slug] 정적 생성 전환 |
| 9edd045 | IndexNow 실패 시 빌드 중단 방지 |
| 3b81dd1 | 네이버 IndexNow 엔드포인트 추가 |
| 856b180 | H3 bold 스타일 + 21개 그룹 링크 적용 |

---

## /cases 페이지 noindex 결정 (2026-05-12)

**문제**: 'goldsilverex 사기', '국제귀금속거래소 사기' 등 사건명 검색 시
개별 케이스 페이지 대신 /cases 목록 페이지가 네이버에 노출됨.

**원인**: /cases 페이지가 662개 사건명을 모두 포함 → 키워드 경쟁 발생

**해결**:
- `app/cases/page.tsx`: `robots: { index: false, follow: true }`
- `next-sitemap.config.js`: `/cases` sitemap 제외

**follow: true 유지 이유**: /cases → 개별 페이지 내부 링크가 계속 크롤링되어
PageRank(링크 권위)가 각 케이스 페이지로 전달됨. 색인 차단만, 링크 추적은 허용.

---

## 주요 작업 이력 (2026-05-14)

| 커밋 | 내용 |
|------|------|
| 3102bd9 | fix: 허브 noindex + 분류 순서 + 그룹 정리 + D+1 자동화 |
| 5893277 | 키워드 사기 MDX 생성 |

### 3102bd9 작업 상세

#### 1. 허브 페이지 4개 noindex (`CategoryHubPage.tsx`)
- `/cases/crypto-room`, `/cases/stock-room`, `/cases/teammission`, `/cases/broadcast-exchange`
- `robots: { index: false, follow: true }` — 허브 페이지가 브랜드 키워드를 흡수해 개별 케이스 페이지와 키워드 경쟁하는 문제 해소
- `next-sitemap.config.js`: 허브 URL 4개 sitemap 제외 목록에 추가
- **follow: true 유지**: 허브 → 개별 케이스 내부 링크로 PageRank 흐름은 유지

#### 2. 분류 순서 수정 (`lib/caseCategories.ts`)
- `broadcast-exchange`를 `crypto-room` **앞**으로 이동
- **이유**: "라이브|방송|환전+코인" 혼합 케이스가 COIN_PATTERN에 먼저 걸려 crypto-room으로 오분류되던 문제 수정
- `getCaseCategoryForText()`는 배열 순서대로 첫 번째 매칭 반환하므로 순서가 판정 결과에 직결

#### 3. 그룹 재편
- **틴그스라이브**: 라이브펄스 그룹 variant → 독립 케이스(representative)로 전환, robots.index=true 복원
- **TRX 그룹**: trx-forex1com을 해외선물-나스닥-리딩방-사기 그룹에서 해제 → trx트레이드(representative) + trx-forex1com(variant) 새 그룹으로 재연결

#### 4. case-cafe D+1 자동화 (`scripts/create-case.js`)
- MDX 생성 완료 후 자동으로 `node scripts/create-cafe-post.mjs "{caseName}"` 실행
- **목적**: 네이버 카페에 케이스 URL 포스팅 → Naver Yeti가 카페 크롤 중 URL 발견 → D+1 네이버 색인 가능성 향상
- 실패 시 빌드 중단 없이 경고만 출력: `⚠️ 카페 포스트 생성 실패 — 수동으로 npm run case-cafe 실행하세요`

---

## 주요 작업 이력 (2026-05-13)

| 커밋 | 내용 |
|------|------|
| ca64344 | SEO: variant noindex, 을/를 문법 전체 교정, keywords 자동생성, zenith 본문 고유화 |
| 3d93a95 | SX-Algo ~ SL Company 및 5/13 MDX 생성 |
| 28fe278 | fix: .keywords 유형별 공통 키워드 중복 제거 (91개 파일, 284건) |
| 10a1701 | fix: 3d93a95에서 생성된 .keywords 파일 공통 키워드 중복 제거 (3개 파일) |

### 5/13 작업 상세

#### 1. variant 페이지 noindex (`ca64344`)
- `app/cases/[slug]/page.tsx` robots 조건에 `!isVariant` 추가
- variant 페이지는 canonical이 대표 페이지를 가리키므로 색인 시 중복 콘텐츠 패널티 위험
- `isVariant`: `groupRole === "variant" && representativeSlug 유효 && 자기 자신이 아닌 경우`

#### 2. 을/를 문법 전체 교정 (`ca64344`)
- `scripts/create-case.js`에 `euReul(word)` 함수 추가
  - 마지막 음절 유니코드 `(code - 0xAC00) % 28 === 0` → 받침 없으면 "를", 있으면 "을"
- 기존 MDX 748개 파일 일괄 교정: 1,506건 수정
  - `자금 이체을` → `자금 이체를`, `선납 요구을` → `선납 요구를` 등 14가지 패턴

#### 3. .keywords 자동 생성 (`ca64344`)
- MDX 생성 시 `buildKeywords(caseName, slug)` → `.keywords` 파일 자동 작성
- 동시에 `~/Downloads/{slug}.keywords.txt`로 저장
- **포함 키워드**: 브랜드명, 인물명+사칭, slug 변형 등 케이스 고유 키워드만
- **미포함**: 유형 공통 키워드("리딩방 사기" 등) — `page.tsx`의 `scamTopicKeywords`가 모든 페이지에 자동 적용하므로 중복 방지

#### 4. .keywords 공통 키워드 중복 제거 (`28fe278`, `10a1701`)
- `page.tsx` `scamTopicKeywords` 배열(15개)과 겹치는 키워드를 전체 `.keywords` 파일에서 제거
- 제거 대상: `주식리딩방 사기`, `리딩방 사기`, `코인 사기`, `투자 사기 피해`, `주식 사기` 등
- `buildKeywords()` 함수에서도 typeKws 섹션 완전 제거 (신규 생성 파일도 안전)
- 총 100개 파일 전수 정리 완료

#### 5. zenith 케이스 본문 고유화 (`ca64344`)
- "박두환" → "박두환 사칭" 형식으로 통일 (사칭 명시)
- 섹션 1·2에 "박두환 사칭" 자연어로 삽입 → 검색어·본문 일치도 개선

---

## 아키텍처 논의 결정사항 (2026-05-13)

### 유형 판정 로직 단일화 현황

`lib/caseTypes.js`가 사실상 단일 소스. `COIN_PATTERN → STOCK_PATTERN → SHOPPING_PATTERN` 순서로 판정.

**현재 판정 우선순위** (이미 올바르게 구현됨):
```
1순위: COIN_PATTERN  (코인|coin|wallet|거래소|crypto|staking...)
2순위: STOCK_PATTERN (stock|ETF|asset|investment|trading|securities|futures|HTS|MTS|공모주|비상장|증권|해외선물...)
3순위: SHOPPING_PATTERN (mall|shop|market|쇼핑...)
```
→ stock/ETF/해외선물 키워드가 있으면 market/shop이 있어도 주식리딩방으로 판정
→ "코인 해외선물"은 COIN이 먼저 잡혀 crypto-room 판정

**미결: 특수규칙 블록이 COIN/STOCK 체크보다 앞에 있는지 확인 필요**

### caseType 정본화 방향 (미적용, 검토 중)

현재 `page.tsx`가 프론트매터 `caseType`을 무시하고 slug에서 재판정. 개선안:
```typescript
// 프론트매터 caseType 있으면 우선, 없으면 slug에서 자동감지
const caseTypeKey = fm.caseType
  ? LEGACY_KEY_MAP[fm.caseType] ?? detectCaseTypeKey(`${slug} ${caseName}`)
  : detectCaseTypeKey(`${slug} ${caseName}`)
```

### 감사(audit) 로직 보강 필요 항목

현재 audit-cases.js에서 **빠진 검사** (향후 추가 예정):
```
① 대표-variant 간 caseType 불일치
② aliases(식별 토큰) 충돌 — 두 케이스가 같은 브랜드명/인물명 공유
③ representative 없는 고아 variant 그룹
④ .keywords primaryKeyword ↔ MDX caseName 불일치
```

### description 차별화 방향 (미적용, 검토 중)

현재 description 패턴이 caseName만 다르고 나머지 동일 → 중복 설명 경고 위험.
개선: `buildGeneratedDescription()`에서 aliases(인물명·앱명) 주입.

### 추가하지 않기로 결정한 필드

- `qualityChecked: true` — 파일 수정 시 stale되어 신뢰도 낮음. git 이력로 대체.
- `indexIntent: representative|variant|noindex` — 현재 `groupRole` + `noindex` 조합으로 충분. 748개 마이그레이션 비용 대비 실익 없음.

### 문법 유틸 공통화 방향 (미적용, 검토 중)

`euReul()` 등 문법 함수를 `lib/grammarUtils.js`로 추출 → create-case.js·audit-cases.js 양쪽에서 import.
생성 단계(예방) + 감사 단계(회귀 감지) 모두 적용하는 것이 이상적.

---

## 주요 작업 이력 (2026-05-14) — 그룹핑·카테고리 전면 개선

| 커밋 | 내용 |
|------|------|
| 64ef0ec | feat: 그룹핑 로직 강화 + 서비스 페이지 UX 개선 |
| 9043294 | fix: 잘못 묶인 그룹 분리·누락 그룹 생성 및 카테고리 오분류 수정 |

---

### 64ef0ec 작업 상세

#### 1. 서비스 페이지 정렬 (`app/services/page.tsx`)
- 그룹·단독 케이스 모두 **publishedAt 내림차순** (최신 생성순) 정렬
- 기존: `localeCompare` 알파벳 순 → 변경: `groupLatest()` 함수로 그룹 내 최신 날짜 기준

#### 2. attorney 페이지 문구 변경 (`app/attorney/page.tsx`)
- "상담 가능 시간" 카드 라벨 → "상담 대응"
- "평일 09:00 – 18:00 / 주말·공휴일 제외" → "24시간 긴급 상담 대응"

#### 3. consulting 페이지 하이퍼링크 추가 (`app/consulting/page.tsx`)
- FAQ 2번 항목 "전화(02-6952-3695)" → `<Link href="tel:0269523695">` 적용
- "카카오톡 채널(대온 법률사무소)" → `<Link href="http://pf.kakao.com/_xcypmn/chat">` 적용
- `FaqItem` 타입에 `aNode?: ReactNode` 추가, 렌더 시 `f.aNode ?? f.a` 로 분기

#### 4. caseCategories.ts — 카테고리 오분류 수정 (`lib/caseCategories.ts`)
- `broadcast-exchange`를 `crypto-room` **앞**으로 배치 (혼합 케이스 오분류 방지)
- teammission regex에 `트래블|트레블|트립|여행플랫폼` 추가 (트래블릿지 등 여행 키워드 오분류 해소)
- `getCaseCategoryForText()` 함수에 우선처리 로직 2개 추가:
  - `CRYPTO_PRIORITY`: 코인마켓캡·코인+거래소 조합 → crypto-room 강제
  - `STOCK_PRIORITY`: 리딩방·주식리딩·해외선물리딩 → stock-room 강제
  - **해결 케이스**: troymarket(주식리딩), fwdmuxqs(해외선물리딩), ABRGlobalMarkets(ETF리딩방), 코인마켓캡(거래소사칭) 오분류 해소

#### 5. audit-and-fix-groups.js 알고리즘 강화
- **`GENERIC_GROUP_IDS`** 신규 추가: 프론트매터 `caseGroupId`가 일반어("프로젝트", "뱅크", "트레이닝" 등)인 경우 Step 1 유니온에서 제외
  - 기존 문제: `caseGroupId: "프로젝트"`가 17개 무관한 케이스를 연결하는 허위 클러스터 생성
- **`GENERIC_EN`** 대폭 확장: bank, banking, training, academy, club, team, room, korea, trust, wealth, futures, forward, option, margin, company, center, service, network, platform, strategy, price, value, partner, advisor 등 자연어 추가
  - 기존 문제: "futures" 스템이 ambergrid·futures-kr·svi-trade·sm-futures-investment를 잘못 연결
- 237개 MDX 파일 `--fix` 적용 (그룹 재조정)

---

### 9043294 작업 상세

#### A. 잘못 묶인 그룹 분리 (수동 수정)

| 파일 | 기존 그룹 | 처리 |
|------|-----------|------|
| 휘파람투어-사기-사칭-여행사-부업-리뷰알바.mdx | starticket | 독립 (브랜드명 불일치) |
| 쿠폰스토리-사기-여행사-사칭.mdx | starticket | 독립 (브랜드명 불일치) |
| smartkorea-사기-smart-krcom-해외선물.mdx | ourbit | 독립 (브랜드명 불일치) |
| smartkorea-사기.mdx | ourbit | 독립 (브랜드명 불일치) |
| smarttrading-사기-스마트트레이딩-자동매매-리딩방.mdx | ourbit | 독립 (브랜드명 불일치) |

**원인**: aliases 필드의 공통 스템(`krcom` 등)이 서로 다른 브랜드를 허위 연결

#### B. 누락 그룹 신규 생성 (수동 수정)

| 그룹ID | 대표 케이스 | variant | 이유 |
|--------|-------------|---------|------|
| `daesang` | 대상여행사-사기 | 대상트립-사기 | 한글 브랜드 "대상" — 알고리즘이 한글 단일어 매칭 불가 |
| `imatraining` | ima스마트트레이닝-프로젝트-사기-db증권-사칭 | db증권-사칭-사기-ima스마트트레이닝-프로젝트-리딩방 | "db"(2자), "ima"(3자) — 스템 최솟값(5자) 미달 |
| `smartkorea` | smartkorea-사기 | smartkorea-사기-smart-krcom-해외선물 | 알고리즘 자동 매칭 후 `--fix` 적용 |

#### C. 알고리즘 개선 — GENERIC_EN에 `krcom` 추가

- **문제**: `smart-kr.com` 도메인 → aliases에 "krcom" → ourbit 그룹의 "ourbit-krcom" aliases "krcom" 공유 → 허위 연결
- **해결**: "krcom" (`.kr.com` 도메인 합성 패턴) → GENERIC_EN 추가로 스템 매칭 대상에서 제외

---

### 현재 그룹 현황 (2026-05-14 기준)

- 총 케이스: 987개
- 정상 클러스터: 179개
- 미결 이슈: 0개

---

### 알려진 한계 및 향후 개선 필요 항목

1. **한글 단일 브랜드 자동 감지 불가**: "대상", "휘파람" 등 영문 스템 없는 한글 브랜드는 알고리즘이 매칭 불가 → 수동 그룹 생성 필요
2. **2~4자 영문 코드 자동 감지 불가**: "db", "ima", "csn" 등 5자 미만 → 수동 그룹 생성 필요
3. **aliases 오염 위험**: aliases에 도메인 패턴 토큰("krcom", "smart" 등)을 직접 기재하면 무관한 케이스와 허위 연결 발생 — aliases에는 순수 브랜드명만 기재할 것
