import Link from "next/link"

export default function Header() {
  return (
    <header className="site-header">
      <nav className="nav">
        <Link href="/">대온 핀테크센터</Link>

        <ul>
          <li>
            <Link href="/services">주력분야</Link>
          </li>

          <li>
            <Link href="/cases">진행사건</Link>
          </li>

          <li>
            <Link href="/process">대응절차</Link>
          </li>

          <li>
            <Link href="/consulting">상담안내</Link>
          </li>

          <li>
            <a
              href="https://cafe.naver.com/daeonlawfintech"
              target="_blank"
              rel="noopener noreferrer"
            >
              네이버카페
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}