"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useConsultation } from "@/components/forms/consultation-provider";
import { publicAssetPath } from "@/lib/utils";
import styles from "./avantgarde-home.module.scss";

type HeroProps = {
  title: string;
  subtitle: string;
};

const CONSULTATION_CTA = "Получить консультацию";

const heroBenefits = [
  { title: "Собственное производство", text: "Контроль заказа на всех этапах: от заявки до монтажа." },
  { title: "Точный подбор декора", text: "Подберём оптимальный оттенок и фактуру кварцевого агломерата." },
  { title: "Гарантия результата", text: "Фиксируем сроки и отвечаем за качество установки." }
];

export function Hero({ title, subtitle }: HeroProps) {
  const { openConsultation } = useConsultation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = useMemo(() => publicAssetPath("/images/vidio-proizvodstva.mp4"), []);

  const [loadVideo] = useState(true);
  const [videoRevealed, setVideoRevealed] = useState(false);

  useEffect(() => {
    if (!loadVideo) return;
    const video = videoRef.current;
    if (!video) return;

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      void video.play().catch(() => {});
      requestAnimationFrame(() => setVideoRevealed(true));
    };

    let fallback: number | undefined;
    const onLoadedData = () => {
      if (fallback) window.clearTimeout(fallback);
      reveal();
    };

    video.load();
    video.addEventListener("loadeddata", onLoadedData, { once: true });
    fallback = window.setTimeout(reveal, 2800);

    return () => {
      if (fallback) window.clearTimeout(fallback);
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, [loadVideo]);

  return (
    <section className={`home-flow-section ${styles.heroSection}`}>
      <div className="container">
        <div className={styles.heroLayout}>
          <div className={styles.heroMain}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Создаём поверхности</span>
              <span className={styles.heroTitleLine}>которые вдохновляют</span>
            </h1>

            <ul className={styles.heroBenefits}>
              {heroBenefits.map((item) => (
                <li key={item.title} className={styles.heroBenefit}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <div className={styles.heroActions}>
              <button type="button" className="button" onClick={() => openConsultation("hero")}>
                {CONSULTATION_CTA}
              </button>
              <Link className="button-secondary" href="/portfolio">
                Портфолио проектов
              </Link>
            </div>
          </div>

          <aside className={styles.heroVisual} aria-label="Видео производства" suppressHydrationWarning>
            <video
              ref={videoRef}
              className={`${styles.heroVideo} ${videoRevealed ? styles.heroVideoVisible : ""}`.trim()}
              loop
              muted
              playsInline
              preload="metadata"
            >
              {loadVideo ? <source src={videoSrc} type="video/mp4" /> : null}
            </video>
          </aside>
        </div>
      </div>
    </section>
  );
}
