import Link from "next/link";

import { HomeFaqSection } from "@/components/faq/home-faq-section";
import { ConsultationButton } from "@/components/forms/consultation-button";
import { HomeReasonsStrip } from "@/components/home/home-reasons-strip";
import { HomeStoneAdvantages } from "@/components/home/home-stone-advantages";
import { MaterialsStrip } from "@/components/home/materials-strip";
import { TrustPlatformsStrip } from "@/components/home/trust-platforms-strip";
import type { CompanySettings, FaqItem } from "@/types/content";

import styles from "./avantgarde-home.module.scss";
import { Hero } from "./hero";

const productGroups = [
  {
    title: "Столешницы",
    points: [
      "Для кухни и островов",
      "Для ванной комнаты",
      "Интегрированные мойки и фартуки",
      "Прямые и сложные формы"
    ],
    href: "/catalog/countertops"
  },
  {
    title: "Подоконники",
    points: [
      "Классические и эркерные",
      "Подоконник-столешница",
      "Для жилых и коммерческих интерьеров",
      "Монтаж в один цикл"
    ],
    href: "/catalog/window-sills"
  },
  {
    title: "Другие изделия",
    points: [
      "Столы и барные стойки",
      "Ресепшн и общественные зоны",
      "Стеновые панели и откосы",
      "Индивидуальные решения под проект"
    ],
    href: "/catalog/sinks"
  }
];

type HomeAvantgardeProps = {
  settings: CompanySettings;
  faqItems: FaqItem[];
};

export function HomeAvantgarde({ settings, faqItems }: HomeAvantgardeProps) {
  return (
    <>
      <div className="home-warm-flow">
        <Hero
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
        />

        <MaterialsStrip />

        <HomeReasonsStrip />

        <TrustPlatformsStrip settings={settings} />

        <HomeStoneAdvantages />

        <section className={`home-flow-section ${styles.homeFlowProducts}`}>
          <div className="container">
            <div className={styles.sectionHead}>
              <h2>Выполняем заказы любой сложности</h2>
              <p>По стандартным и индивидуальным размерам. Выезд на замер по Санкт-Петербургу.</p>
            </div>
            <div className={styles.productGrid}>
              {productGroups.map((group) => (
                <article key={group.title} className={styles.productCard}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className={styles.productActions}>
                    <ConsultationButton source={`home-product:${group.title}`}>
                      Получить консультацию
                    </ConsultationButton>
                    <Link className="button-secondary" href={group.href}>
                      Подробнее
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <HomeFaqSection items={faqItems} />
      </div>
    </>
  );
}
