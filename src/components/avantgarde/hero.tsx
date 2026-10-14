"use client";

import Image from "next/image";
import Link from "next/link";

import { useConsultation } from "@/components/forms/consultation-provider";
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

          <aside className={styles.heroVisual} aria-label="Производство ArtellRock">
            <Image
              className={styles.heroPoster}
              src="/images/hero-proizvodstvo.png"
              alt="Обработка кварцевого агломерата на собственном производстве ArtellRock"
              fill
              sizes="(max-width: 1023px) 100vw, 55vw"
              quality={75}
              priority
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
