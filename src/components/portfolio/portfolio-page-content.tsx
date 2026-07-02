import Link from "next/link";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { BrandCarousels } from "@/components/portfolio/brand-carousels";
import { TestimonialsShowcase } from "@/components/portfolio/testimonials-showcase";
import type { Testimonial } from "@/types/content";

import styles from "./portfolio-page.module.scss";

type PortfolioPageContentProps = {
  testimonials: Testimonial[];
};

const stats = [
  { value: "1000+", label: "Столешниц и подоконников" },
  { value: "4", label: "Бренда кварца в работе" },
  { value: "5+", label: "Лет на рынке СПб" },
  { value: "Под ключ", label: "Замер, производство, монтаж" },
] as const;

export function PortfolioPageContent({ testimonials }: PortfolioPageContentProps) {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className={styles.introContent}>
            <span className="eyebrow">Наши работы</span>
            <h2 className={styles.editorialH2}>
              Реальные проекты из кварцевого агломерата в интерьерах клиентов
            </h2>
            <p>
              Каждый проект — это индивидуальное изделие: столешница, подоконник, остров или
              барная стойка. Фото с объектов и площадок VK и Avito — без стоков и рендеров.
            </p>
          </div>
          <div className={styles.statsGrid} style={{ marginTop: "clamp(32px, 4vw, 48px)" }}>
            {stats.map((item) => (
              <article key={item.label} className={styles.statCard}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <BrandCarousels />
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="section">
          <div className="container">
            <TestimonialsShowcase testimonials={testimonials} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className={styles.ctaBand}>
            <div className={styles.ctaBandContent}>
              <span className="eyebrow">Следующий проект — ваш</span>
              <h2 className={styles.ctaBandTitle}>Хотите такой же результат в своём интерьере?</h2>
              <p>
                Пришлите фото помещения или эскиз — подберём материал, рассчитаем стоимость
                и после замера зафиксируем смету под ключ.
              </p>
            </div>
            <div className="btn-row">
              <ConsultationButton source="portfolio-cta">Получить консультацию</ConsultationButton>
              <Link className="button-secondary" href="/catalog-kamnya">Выбрать камень</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
