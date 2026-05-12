"use client"

import { useEffect, useRef, useState } from "react"

// 타이핑 속도 상수
const TYPE_SPEED = 30        // ms/자 — 자연스러운 타이핑 속도
const DELETE_SPEED = 18      // ms/자 — 삭제는 타이핑보다 빠르게
const PAUSE_AFTER_TYPE = 2200  // ms — 다 타이핑 후 읽는 시간
const PAUSE_AFTER_DELETE = 400 // ms — 다 지운 후 짧은 숨 고르기

interface Props {
  text: string
  level?: "h1" | "h2" | "h3"
}

export default function TypingHeading({ text, level = "h2" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  // SSR: 전체 텍스트 렌더링 (SEO 크롤러 대응)
  // hydration 후 IntersectionObserver가 발화하면 애니메이션 시작
  const [visible, setVisible] = useState(false)
  const [displayText, setDisplayText] = useState(text)
  const [animating, setAnimating] = useState(false)

  // 헤딩이 뷰포트에 진입할 때 단 한 번 트리거
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 루프 애니메이션: 타이핑 → 정지 → 삭제 → 정지 → 반복
  useEffect(() => {
    if (!visible) return

    // 접근성: prefers-reduced-motion 설정 시 전체 텍스트 즉시 표시
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text)
      return
    }

    let cancelled = false
    let len = 0
    let phase: "typing" | "deleting" = "typing"
    let timerId: ReturnType<typeof setTimeout>

    setDisplayText("")
    setAnimating(true)

    function step() {
      if (cancelled) return

      if (phase === "typing") {
        if (len < text.length) {
          len++
          setDisplayText(text.slice(0, len))
          timerId = setTimeout(step, TYPE_SPEED)
        } else {
          // 타이핑 완료 → PAUSE_AFTER_TYPE 대기 후 삭제 시작
          timerId = setTimeout(() => {
            if (cancelled) return
            phase = "deleting"
            step()
          }, PAUSE_AFTER_TYPE)
        }
      } else {
        // deleting
        if (len > 0) {
          len--
          setDisplayText(text.slice(0, len))
          timerId = setTimeout(step, DELETE_SPEED)
        } else {
          // 삭제 완료 → PAUSE_AFTER_DELETE 대기 후 타이핑 재시작
          timerId = setTimeout(() => {
            if (cancelled) return
            phase = "typing"
            step()
          }, PAUSE_AFTER_DELETE)
        }
      }
    }

    timerId = setTimeout(step, 0)

    return () => {
      cancelled = true
      clearTimeout(timerId)
      setAnimating(false)
    }
  }, [text, visible])

  const Tag = level

  return (
    <Tag
      ref={ref}
      className={`typing-heading ${visible ? "typing-active" : ""}`}
    >
      {/* visible 이전(SSR/크롤러): 전체 텍스트 / visible 이후: 애니메이션 텍스트 */}
      {visible ? displayText : text}
      {animating && (
        <span className="typing-cursor" aria-hidden="true" />
      )}
    </Tag>
  )
}
