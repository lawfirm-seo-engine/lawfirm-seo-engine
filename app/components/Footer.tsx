export default function Footer() {
  return (
    <footer className="daeon-footer">
      <div className="daeon-footer-inner">
        {/* 로고 */}
        <div className="daeon-footer-logo">
          <img
            src="/images/logo.png"
            alt="대온 법률사무소 핀테크센터 로고"
            className="daeon-footer-logo-img"
          />
        </div>

        {/* 기본 정보 */}
        <div className="daeon-footer-info">
          대표변호사 : 신동우 | 주소 : 서울 서초구 서초대로 250
          스타갤러리브릿지빌딩 802호 | 전화번호 : 02-6952-3695 |
          이메일 : noleosi@daeonlaw.co.kr
        </div>

        {/* 네이버 카페 링크 */}
        <div className="daeon-footer-cafe">
          최신 금융사기 피해 사례와 대응 정보는&nbsp;
          <a
            href="https://cafe.naver.com/daeonlawfintech"
            target="_blank"
            rel="noopener noreferrer external"
            className="daeon-footer-cafe-link"
          >
            네이버 카페에서도 확인하실 수 있습니다
          </a>
        </div>

        {/* 저작권 */}
        <div className="daeon-footer-copy">
          COPYRIGHT © 2024 대온 법률사무소 All rights reserved.
        </div>
      </div>
    </footer>
  )
}