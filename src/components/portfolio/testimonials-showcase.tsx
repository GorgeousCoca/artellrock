"use client";

import { useRef } from "react";

import { PlatformLinks } from "@/components/ui/platform-links";
import type { Testimonial } from "@/types/content";

import styles from "./testimonials-showcase.module.scss";

type TestimonialsShowcaseProps = {
  testimonials: Testimonial[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function TestimonialsShowcase({ testimonials }: TestimonialsShowcaseProps) {
  const railRef = useRef<HTMLDivElement>(null);

  function shift(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const offset = Math.max(rail.clientWidth * 0.9, 260);
    rail.scrollBy({ left: direction * offset, behavior: "smooth" });
  }

  if (!testimonials.length) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Отзывы о нашей работе">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Отзывы клиентов</span>
          <h2>Отзывы о нашей работе</h2>
          <p>Реальные отклики клиентов по выполненным проектам.</p>
        </div>
        <PlatformLinks />
      </div>

      <div ref={railRef} className={styles.rail}>
        {testimonials.map((item) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.avatar} aria-hidden="true">
                {initials(item.author)}
              </span>
              <p className={styles.quote}>{item.quote}</p>
            </div>
            <div className={styles.divider} />
            <div className={styles.authorBlock}>
              <strong>{item.author}</strong>
              <span>{item.role}</span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.controls} aria-label="Навигация по отзывам">
        <button type="button" onClick={() => shift(-1)} aria-label="Предыдущие отзывы">
          ←
        </button>
        <button type="button" onClick={() => shift(1)} aria-label="Следующие отзывы">
          →
        </button>
      </div>
    </section>
  );
}
