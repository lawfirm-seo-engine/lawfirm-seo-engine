# WORK LOG — 대온 법률사무소 SEO 엔진

> 새 PC에서 작업 시작 전 반드시 이 파일을 먼저 읽을 것.
> 업데이트: 2026-05-11

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
