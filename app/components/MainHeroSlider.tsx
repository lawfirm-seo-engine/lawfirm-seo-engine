"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/main/main-slide-01.png",
    alt: "금융 투자 사기 피해자를 위한 사건 진행 대온 법률사무소 핀테크센터",
  },
  {
    image: "/images/main/main-slide-02.png",
    alt: "Digital Finance 가상자산 사기 사건 자산 추적 동결 몰수 추징",
  },
  {
    image: "/images/main/main-slide-03.png",
    alt: "대온 핀테크센터 풍부한 사건 경험과 맞춤형 전략",
  },
];

export default function MainHeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="main-hero-slider" aria-label="대온 핀테크센터 메인 슬라이드">
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`main-hero-slide ${index === current ? "active" : ""}`}
        >
          <img src={slide.image} alt={slide.alt} />
        </div>
      ))}

      <div className="main-hero-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={index === current ? "active" : ""}
            onClick={() => setCurrent(index)}
            aria-label={`${index + 1}번 슬라이드 보기`}
          />
        ))}
      </div>
    </section>
  );
}