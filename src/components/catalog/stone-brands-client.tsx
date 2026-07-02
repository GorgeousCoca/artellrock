import { BrandIconGrid } from "@/components/catalog/brand-icon-grid";

import styles from "./stone-brands.module.scss";

const QUARTZ_BENEFITS = {
  title: "Какие преимущества у кварцевого агломерата?",
  items: [
    {
      title: "Высокая прочность",
      text: "Прочность искусственного камня аналогична прочности природного материала. Продукт демонстрирует высокую устойчивость к механическим воздействиям и эффективно справляется с ударными и вибрационными нагрузками. Даже при интенсивной эксплуатации материал не подвержен образованию потертостей, царапин и других повреждений."
    },
    {
      title: "Отсутствие пор",
      text: "Одной из ключевых особенностей кварцевого агломерата является его однородная структура, которая препятствует впитыванию жидкостей и неприятных запахов. Кварцевый агломерат не нуждается в регулярной обработке пастами или сложной периодической чистке. Для поддержания чистоты достаточно просто протереть поверхность влажной салфеткой."
    },
    {
      title: "Стойкость к химическому воздействию",
      text: "Продукция сохраняет свои эксплуатационные характеристики при взаимодействии с кислотами и щелочами."
    },
    {
      title: "Температурная стойкость",
      text: "Кварцевый агломерат обладает устойчивостью к воздействию высоких температур. На его поверхности можно безопасно размещать горячие предметы, не опасаясь возникновения деформаций и ожогов."
    }
  ]
} as const;

export function StoneBrandsClient() {
  return (
    <>
      <section className={styles.catalogHero} aria-labelledby="catalog-kamnya-title">
        <div className={`container ${styles.catalogHeroContent}`}>
          <h1 id="catalog-kamnya-title" className={styles.catalogHeroTitle}>
            Кварцевый агломерат — каталог брендов
          </h1>
          <p className={styles.catalogHeroLead}>
            Кварцевый агломерат с природной текстурой и высокой износостойкостью. Выберите бренд — откроется
            каталог декоров с ориентиром по цене.
          </p>
          <BrandIconGrid />
          <p className={styles.catalogHeroHint}>Выберите бренд, чтобы увидеть образцы и цены</p>
        </div>
      </section>

      <section className={styles.catalogBenefits} aria-labelledby="catalog-benefits-title">
        <div className={`container ${styles.catalogBenefitsContent}`}>
          <h2 id="catalog-benefits-title" className={styles.catalogBenefitsTitle}>
            {QUARTZ_BENEFITS.title}
          </h2>
          <div className={styles.catalogBenefitsGrid}>
            {QUARTZ_BENEFITS.items.map((item) => (
              <article key={item.title} className={styles.catalogBenefitItem}>
                <h3 className={styles.catalogBenefitTitle}>{item.title}</h3>
                <p className={styles.catalogBenefitText}>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
