<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:seo-rules -->
# SEO 영향 분석 선행 규칙

어떤 수정·개선·기능 추가 지시를 받더라도 실행 전에 반드시 SEO 영향을 먼저 분석하고 명시해야 한다.

## 분석 항목 (해당되는 항목만)

- **색인 변화**: 기존 색인된 페이지가 noindex·삭제·URL 변경되는가
- **sitemap 영향**: 추가/제거 대상이 생기는가, noindex 페이지가 sitemap에 포함/제외되는가
- **canonical 변화**: 대표 URL이 바뀌거나 variant/representative 관계가 달라지는가
- **robots 변화**: index/follow 설정이 변경되는가
- **내부 링크 변화**: 링크 구조·PageRank 흐름이 달라지는가
- **중복 콘텐츠**: 동일 내용이 여러 URL에 노출될 가능성이 생기는가
- **구조화 데이터**: JSON-LD의 정합성이 깨지는가

## 판단 기준

- noindex 페이지 → sitemap 제외가 올바른 처리 (모순 신호 방지)
- 기존 색인 페이지를 noindex로 전환 → 색인 탈락 발생, 의도 확인 필요
- variant 페이지 → noindex + canonical 대표 페이지 지향이 올바른 처리
- 페이지 삭제·URL 변경 → 301 리디렉션 필요 여부 검토
<!-- END:seo-rules -->
