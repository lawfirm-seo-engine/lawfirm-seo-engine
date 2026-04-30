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
  const [typedText, setTypedText] = useState("")

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

  useEffect(() => {
    if (!visible) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      setTypedText(text)
      return
    }

    setTypedText("")

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setTypedText(text.slice(0, index))

      if (index >= text.length) {
        window.clearInterval(timer)
      }
    }, 36)

    return () => window.clearInterval(timer)
  }, [text, visible])

  const Tag = level

  return (
    <Tag
      ref={ref}
      className={`typing-heading ${
        visible ? "typing-active" : ""
      }`}
    >
      {visible ? typedText : text}
      {visible && typedText.length < text.length && (
        <span className="typing-cursor" aria-hidden="true" />
      )}
    </Tag>
  )
}
