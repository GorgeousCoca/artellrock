"use client";

import { ConsultationButton } from "@/components/forms/consultation-button";
import type { Testimonial } from "@/types/content";

import styles from "./avantgarde-home.module.scss";

type TestimonialsMarqueeProps = {
  testimonials: Testimonial[];
};

export function TestimonialsMarquee({ testimonials }: TestimonialsMarqueeProps) {
  const repeated = [...testimonials, ...testimonials];

  return (
    <section className={styles.section}>
      <div className={styles.calcReviews}>
        <article className={`${styles.glassCard} ${styles.calcCard}`}>
          <h2>Консультация и расчёт проекта</h2>
          <p>Оставьте контакты — подберём материал и ориентир по бюджету после уточнения размеров.</p>
          <ConsultationButton source="testimonials-marquee" className={styles.btnPrimary}>
            Получить консультацию
          </ConsultationButton>
        </article>

        <article className={`${styles.glassCard} ${styles.reviewsCard}`}>
          <div className={styles.marquee}>
            {repeated.map((item, index) => (
              <span key={`${item.id}-${index}`} className={styles.reviewChip}>
                {/* Частичные данные из CMS: undefined не должны ломать рендер строки. */}
                {item.quote ?? ""}
                <span className={styles.reviewAuthor}>— {item.author ?? ""}</span>
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
