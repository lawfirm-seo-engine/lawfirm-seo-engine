export default function FloatingContact() {
  return (
    <div className="floating-contact">
      <a href="tel:0269523695" className="floating-btn phone">
        <span className="floating-icon">☎</span>
        <span>전화문의</span>
      </a>

      <a
        href="http://pf.kakao.com/_xcypmn/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn kakao"
      >
        <span className="floating-kakao">TALK</span>
        <span>카톡상담</span>
      </a>
    </div>
  )
}