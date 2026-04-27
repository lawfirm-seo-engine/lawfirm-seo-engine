"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    href: "/services",
    label: "주력분야",
  },
  {
    href: "/cases",
    label: "진행사건",
  },
  {
    href: "/process",
    label: "대응절차",
  },
  {
    href: "/consulting",
    label: "상담안내",
  },
]

export default function Header() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/cases") {
      return pathname === "/cases" || pathname.startsWith("/cases/")
    }

    return pathname === href
  }

  return (
    <header className="site-header">
      <nav className="nav">
        <Link href="/" className={pathname === "/" ? "nav-logo active" : "nav-logo"}>
          대온 핀테크센터
        </Link>

        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive(item.href) ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            </li>
          ))}

          <li>
            <a
              href="https://cafe.naver.com/daeonlawfintech"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              네이버카페
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}