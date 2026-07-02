"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe";

import styles from "./countertops-landing.module.scss";

const heroSlides = [
  { src: "/images/portfolio-brands/Avant_Quartz-07.jpg", alt: "Кухонный остров из кварцевого агломерата" },
  { src: "/images/portfolio-brands/Avarus-06.jpg", alt: "Изделие из кварца на заказ" },
  { src: "/images/portfolio-brands/Nobell_Quartz-04.jpg", alt: "Стеновая панель из искусственного камня" },
  { src: "/images/portfolio-brands/Smart_Quartz-02.jpg", alt: "Барная стойка из кварцевого агломерата" },
];

const benefits = [
  { title: "Любая форма", text: "Изготавливаем изделия по чертежам и эскизам — прямые, угловые, криволинейные, любой конфигурации." },
  { title: "Один материал", text: "Кварцевый агломерат подходит для кухни, ванной, зон отдыха, коммерческих и общественных пространств." },
  { title: "Точный размер", text: "Производство по индивидуальным размерам: учитываем геометрию помещения, коммуникации и смежные поверхности." },
  { title: "Под ключ", text: "Берём на себя весь цикл: замер, проект, производство, доставка и монтаж без посредников." },
] as const;

const useCases = [
  { title: "Мойки и раковины", text: "Интегрированные каменные мойки, накладные раковины, тумбы.", image: "/images/portfolio-brands/Avant_Quartz-08.jpg" },
  { title: "Острова и ресепшн", text: "Барные и кухонные острова, стойки ресепшн для офисов и салонов.", image: "/images/portfolio-brands/Avarus-06.jpg" },
  { title: "Стеновые панели", text: "Отделка стен и фартуков, акцентные панели для ванной и кухни.", image: "/images/portfolio-brands/Nobell_Quartz-04.jpg" },
  { title: "Столы и ступени", text: "Обеденные и журнальные столы, лестничные ступени, подиумы.", image: "/images/portfolio-brands/Smart_Quartz-02.jpg" },
] as const;

const workSlides = [
  { image: "/images/portfolio-brands/Avant_Quartz-07.jpg", title: "Кухонный остров с интегрированной мойкой", material: "Avant Quartz 7030" },
  { image: "/images/portfolio-brands/Avarus-06.jpg", title: "Барная стойка из кварцевого агломерата", material: "Avarus R-541" },
  { image: "/images/portfolio-brands/Nobell_Quartz-04.jpg", title: "Стеновая панель в ванной", material: "Nobell Quartz Calacatta" },
  { image: "/images/portfolio-brands/Smart_Quartz-03.jpg", title: "Обеденный стол из камня", material: "Smart Quartz Polar White" },
  { image: "/images/portfolio-brands/Avant_Quartz-09.jpg", title: "Ресепшн из кварца", material: "Avant Quartz 7020 Амбуаз" },
  { image: "/images/portfolio-brands/Avarus-07.jpg", title: "Ступени из кварцевого агломерата", material: "Avarus RM543" },
];

const colors = [
  { name: "Graphite", image: "/images/portfolio-brands/Avarus-06.jpg" },
  { name: "Pure White", image: "/images/portfolio-brands/Smart_Quartz-02.jpg" },
  { name: "Calacatta", image: "/images/portfolio-brands/Nobell_Quartz-04.jpg" },
  { name: "Warm Stone", image: "/images/portfolio-brands/Avant_Quartz-07.jpg" },
  { name: "Dark Marble", image: "/images/portfolio-brands/Avant_Quartz-09.jpg" },
] as const;

const trustPoints = [
  { title: "Гарантируем качество", text: "Контролируем изделие на каждом этапе — от раскроя до финишной обработки кромки." },
  { title: "Без посредников", text: "Собственное производство: от замера до монтажа всё в одних руках." },
  { title: "Точно в срок", text: "Фиксируем сроки после замера и соблюдаем их — по договору с гарантией." },
  { title: "Любая сложность", text: "Реализуем нестандартные конфигурации, вырезы, радиусные торцы и комбинированные изделия." },
  { title: "Подбор материала", text: "Помогаем выбрать декор, фактуру и кромку под ваш проект и бюджет." },
  { title: "Гибкие цены", text: "Предлагаем решения от практичных базовых до уникальных премиальных изделий." },
] as const;

const workflowSteps = [
  { num: "01", title: "Заявка", text: "Описываете задачу: что именно нужно, для какого пространства, какой стиль." },
  { num: "02", title: "Обсуждение", text: "Уточняем размеры, конфигурацию, материал — по фото, эскизу или при встрече." },
  { num: "03", title: "Замер", text: "Специалист выезжает на объект и фиксирует точные параметры для производства." },
  { num: "04", title: "Производство", text: "Изготавливаем изделие по согласованному проекту с контролем качества." },
  { num: "05", title: "Монтаж и гарантия", text: "Доставляем, устанавливаем и фиксируем гарантийные обязательства." },
] as const;

function HeroSlider() {
  const [active, setActive] = useState(0);
  const total = heroSlides.length;
  const shift = useCallback((dir: -1 | 1) => {
    setActive((prev) => (prev + dir + total) % total);
  }, [total]);
  const swipe = useHorizontalSwipe(() => shift(1), () => shift(-1));
  const item = heroSlides[active]!;

  return (
    <div
      className={styles.heroSlider}
      role="group"
      aria-roledescription="carousel"
      aria-label="Примеры изделий из кварцевого агломерата"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
      onTouchCancel={swipe.onTouchCancel}
    >
      <div className={styles.heroSliderFrame}>
        <Image src={item.src} alt={item.alt} fill sizes="(max-width: 900px) 100vw, 56vw" quality={92} priority />
      </div>
      <span className={styles.heroSliderCounter} aria-hidden>{active + 1} / {total}</span>
      <button type="button" className={`${styles.sliderNav} ${styles.sliderNavPrev}`} onClick={() => shift(-1)} aria-label="Предыдущее фото">‹</button>
      <button type="button" className={`${styles.sliderNav} ${styles.sliderNavNext}`} onClick={() => shift(1)} aria-label="Следующее фото">›</button>
      <div className={styles.heroDots} aria-hidden>
        {heroSlides.map((_, i) => (
          <button key={i} type="button" className={`${styles.dot} ${i === active ? styles.dotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

function WorksSlider() {
  const [active, setActive] = useState(0);
  const total = workSlides.length;
  const shift = useCallback((dir: -1 | 1) => {
    setActive((prev) => (prev + dir + total) % total);
  }, [total]);
  const swipe = useHorizontalSwipe(() => shift(1), () => shift(-1));
  const item = workSlides[active]!;

  return (
    <div className={styles.worksSlider}>
      <div
        className={styles.worksSliderMedia}
        role="group"
        aria-roledescription="carousel"
        aria-label="Выполненные изделия на заказ"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        onTouchCancel={swipe.onTouchCancel}
      >
        <Image src={item.image} alt={item.title} fill sizes="(max-width: 900px) 100vw, 60vw" quality={90} />
        <span className={styles.worksCounter} aria-hidden>{active + 1} / {total}</span>
        <button type="button" className={`${styles.sliderNav} ${styles.sliderNavPrev}`} onClick={() => shift(-1)} aria-label="Предыдущая работа">‹</button>
        <button type="button" className={`${styles.sliderNav} ${styles.sliderNavNext}`} onClick={() => shift(1)} aria-label="Следующая работа">›</button>
      </div>
      <div className={styles.worksSliderInfo}>
        <p className={styles.worksTitle}>{item.title}</p>
        <p className={styles.worksMaterial}>{item.material}</p>
        <ConsultationButton source={`other-products-works:${item.title}`} className="button">Заказать такое</ConsultationButton>
      </div>
      <div className={styles.worksDots} aria-hidden>
        {workSlides.map((_, i) => (
          <button key={i} type="button" className={`${styles.dot} ${i === active ? styles.dotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

export function OtherProductsLanding() {
  return (
    <>
      {/* ─── 1. Intro editorial ─── */}
      <section className={`section ${styles.introSection}`}>
        <div className={`container ${styles.introGrid}`}>
          <HeroSlider />
          <div className={styles.introContent}>
            <span className="eyebrow">Изделия из кварцевого агломерата на заказ</span>
            <h2 className={styles.editorialH2}>
              Изготовим любое изделие из искусственного камня под ваш проект
            </h2>
            <p>
              Кварцевый агломерат — универсальный материал для любого пространства. Мы изготавливаем
              не только столешницы и подоконники, но и острова, раковины, стеновые панели, ступени,
              столы и любые другие изделия по индивидуальным чертежам.
            </p>
            <p>
              Собственное производство позволяет реализовать нестандартные конфигурации, точно
              выдержать размеры и соблюдать сроки без посредников.
            </p>
            <div className="btn-row">
              <ConsultationButton source="other-products-intro">Обсудить проект</ConsultationButton>
              <span className="pill">Изготовление под ключ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Benefits ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Возможности производства</span>
            <h2 className={styles.editorialH2}>Кварц подходит для любого изделия</h2>
            <p>
              Материал сочетает высокую прочность, влагостойкость и широкий выбор декоров —
              это делает его универсальным решением для кухонь, ванных, офисов и общественных пространств.
            </p>
          </div>
          <div className={styles.benefitsGrid}>
            {benefits.map((item) => (
              <article key={item.title} className={styles.benefitCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Use cases ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Что мы изготавливаем</span>
            <h2 className={styles.editorialH2}>Популярные форматы изделий</h2>
          </div>
          <div className={styles.useCasesGrid}>
            {useCases.map((item) => (
              <Link key={item.title} className={styles.useCaseCard} href="/catalog-kamnya">
                <div className={styles.useCaseImage}>
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 25vw" />
                  <div className={styles.useCaseOverlay}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. CTA band ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.ctaBand}>
            <div className={styles.ctaBandContent}>
              <span className="eyebrow">Нестандартный проект?</span>
              <h2 className={styles.ctaBandTitle}>Опишите задачу — рассчитаем стоимость</h2>
              <p>
                Пришлите фото, эскиз или просто опишите, что нужно. Мы быстро дадим ориентир по
                бюджету и срокам, а после замера оформим точную смету.
              </p>
            </div>
            <div className="btn-row">
              <Link className="button" href="/contacts">Оставить заявку</Link>
              <ConsultationButton source="other-products-cta" className="button-secondary">Получить консультацию</ConsultationButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Color picker ─── */}
      <section className="section">
        <div className={`container ${styles.colorsGrid}`}>
          <div className={styles.colorsText}>
            <span className="eyebrow">Выбор материала</span>
            <h2 className={styles.editorialH2}>Более 200 декоров кварцевого агломерата</h2>
            <p>
              Для каждого изделия подбираем цвет и текстуру с учётом общего стиля пространства,
              освещения и функционального назначения. Работаем с ведущими брендами — Avant Quartz,
              Avarus, Nobell, Smart Quartz и другими.
            </p>
            <Link className="button-secondary" href="/catalog-kamnya">Каталог кварца</Link>
          </div>
          <div className={styles.colorSwatches}>
            {colors.map((item) => (
              <figure key={item.name} className={styles.swatch}>
                <div className={styles.swatchImage}>
                  <Image src={item.image} alt={item.name} fill sizes="(max-width: 900px) 33vw, 160px" />
                </div>
                <figcaption>{item.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Works slider ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Реализованные проекты</span>
            <h2 className={styles.editorialH2}>Примеры изделий, которые мы изготовили</h2>
            <p>Нестандартные и типовые форматы из нашего производства в Санкт-Петербурге.</p>
          </div>
          <WorksSlider />
        </div>
      </section>

      {/* ─── 7. Trust ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Почему ArtellRock</span>
            <h2 className={styles.editorialH2}>Производство, которому доверяют</h2>
          </div>
          <div className={styles.trustGrid}>
            {trustPoints.map((item) => (
              <article key={item.title} className={styles.trustCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Process ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Как проходит работа</span>
            <h2 className={styles.editorialH2}>От обсуждения идеи до готового изделия</h2>
          </div>
          <ol className={styles.processSteps}>
            {workflowSteps.map((step) => (
              <li key={step.num} className={styles.processStep}>
                <span className={styles.processNum}>{step.num}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
