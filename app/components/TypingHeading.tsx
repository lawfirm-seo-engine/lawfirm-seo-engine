"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  text: string
  level?: "h1" | "h2" | "h3"
}

export default function TypingHeading({
  text,
  level = "h2",
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const Tag = level

  return (
    <Tag
      ref={ref}
      className={`typing-heading ${
        visible ? "typing-active" : ""
      }`}
    >
      {text}
    </Tag>
  )
}