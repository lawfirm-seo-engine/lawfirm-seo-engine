"use client"

import { useEffect, useState } from "react"

const slides = [
  {
    image: "/images/main/main-slide-01.png",
    title: "금융 투자 사기 피해자를 위한 사건 진행",
    desc: "대온 법률사무소 ㅣ 핀테크센터는 투자사기, 부업사기, 가상자산 사기 등 사건에서 의뢰인의 권리 보호와 피해회복을 위해 노력하고 있습니다.",
  },
  {
    image: "/images/main/main-slide-02.png",
    title: "Digital Finance",
    desc: "가상자산을 사칭한 사기 사건은 블록체인(Blockchain) 기반의 기술 이해를 통해 자산을 추적하여 동결하고 몰수, 추징의 종결을 이끌고 있습니다.",
  },
  {
    image: "/images/main/main-slide-03.png",
    title: "대온 핀테크센터",
    desc: "풍부한 사건 경험으로 맞춤형 전략을 수립하고 실행하는 대온 핀테크센터는 고도의 전문성을 입증하여 고객으로 부터 신뢰를 받고 있습니다.",
  },
]

export default function MainHeroSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 7500)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="hero">
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === index ? "active" : ""}`}>
          <img src={slide.image} alt={slide.title} />

          <div className="hero-overlay" />

          <div className="hero-text">
            <h2>{slide.title}</h2>
            <p>{slide.desc}</p>
          </div>
        </div>
      ))}

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === index ? "active" : ""}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번 슬라이드 보기`}
          />
        ))}
      </div>
    </section>
  )
}