"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe";

import styles from "./countertops-landing.module.scss";

const heroSlides = [
  { src: "/images/podokonnik-01.webp", alt: "Серый подоконник из кварцевого агломерата" },
  { src: "/images/portfolio-brands/Avarus-01.jpg", alt: "Подоконник Avarus в реализованном проекте" },
  { src: "/images/podokonnik-02.webp", alt: "Эркерный бесшовный подоконник из камня" },
  { src: "/images/portfolio-brands/Nobell_Quartz-01.jpg", alt: "Подоконник с текстурой мрамора" },
];

const benefits = [
  { title: "Влагостойкость", text: "Не впитывает воду от конденсата и цветочных горшков — поверхность остаётся опрятной годами." },
  { title: "Прочность", text: "Выдерживает царапины, удары и бытовые нагрузки без потери внешнего вида." },
  { title: "Гигиеничность", text: "Плотная структура не собирает пыль и легко очищается." },
  { title: "Точный размер", text: "Изготавливаем по индивидуальным размерам с учётом откосов, геометрии и толщины стен." },
] as const;

const useCases = [
  { title: "Классический подоконник", text: "Под стандартное окно с ровной геометрией и откосами.", image: "/images/podokonnik-01.webp" },
  { title: "Эркерный подоконник", text: "Бесшовная конструкция для сложной геометрии эркера.", image: "/images/podokonnik-02.webp" },
  { title: "Подоконник-полка", text: "Расширенная глубина — удобная рабочая зона или место для растений.", image: "/images/podokonnik-03.webp" },
  { title: "Под мрамор", text: "Светлые декоры с прожилками для изысканного интерьера.", image: "/images/portfolio-brands/Nobell_Quartz-03.jpg" },
] as const;

const workSlides = [
  { image: "/images/podokonnik-01.webp", title: "Серый подоконник из искусственного камня", material: "VicoStone BQ-9470 Azul Aran" },
  { image: "/images/podokonnik-02.webp", title: "Эркерный бесшовный подоконник", material: "Primax S-5040 Pure White" },
  { image: "/images/podokonnik-03.webp", title: "Чёрный подоконник", material: "Smart Quartz Negro Imperial" },
  { image: "/images/portfolio-brands/Avant_Quartz-01.jpg", title: "Светлый подоконник из кварца", material: "Avant Quartz 7030" },
  { image: "/images/portfolio-brands/Avarus-01.jpg", title: "Подоконник с фактурой камня", material: "Avarus RM543" },
  { image: "/images/portfolio-brands/Nobell_Quartz-01.jpg", title: "Подоконник под мрамор", material: "Nobell Quartz Calacatta" },
];

const colors = [
  { name: "Pure White", image: "/images/podokonnik-02.webp" },
  { name: "Stone Grey", image: "/images/podokonnik-01.webp" },
  { name: "Negro Imperial", image: "/images/podokonnik-03.webp" },
  { name: "Calacatta", image: "/images/portfolio-brands/Nobell_Quartz-01.jpg" },
  { name: "Warm Beige", image: "/images/portfolio-brands/Avant_Quartz-01.jpg" },
] as const;

const trustPoints = [
  { title: "Гарантируем качество", text: "Контролируем изделие на каждом этапе производства и проверяем качество перед отправкой." },
  { title: "Без задержек", text: "Фиксируем сроки после замера и согласуем этапы изготовления и монтажа заранее." },
  { title: "Под ключ", text: "Замер, производство, доставка и монтаж — всё в одном контексте без посредников." },
  { title: "Мы — производитель", text: "Собственное производство позволяет точнее контролировать качество и стоимость." },
  { title: "Индивидуально для вас", text: "Подбираем глубину, форму, кромку и декор под вашу геометрию окна и интерьер." },
  { title: "Гибкие цены", text: "Предлагаем решения от практичных базовых до премиальных декоров под мрамор." },
] as const;

const workflowSteps = [
  { num: "01", title: "Заявка", text: "Описываете задачу удобным способом: форма, звонок или мессенджер." },
  { num: "02", title: "Замер", text: "Специалист выезжает на объект, снимает точные размеры и показывает образцы." },
  { num: "03", title: "Производство", text: "Изготавливаем подоконник по согласованной конфигурации на собственном производстве." },
  { num: "04", title: "Монтаж", text: "Привозим и устанавливаем с контролем качества финишных работ." },
  { num: "05", title: "Гарантия", text: "Фиксируем гарантийные обязательства на материал и монтаж." },
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
      aria-label="Примеры реализованных подоконников"
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
        aria-label="Выполненные подоконники"
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
        <ConsultationButton source={`window-sills-works:${item.title}`} className="button">Заказать такой</ConsultationButton>
      </div>
      <div className={styles.worksDots} aria-hidden>
        {workSlides.map((_, i) => (
          <button key={i} type="button" className={`${styles.dot} ${i === active ? styles.dotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

export function WindowSillsLanding() {
  return (
    <>
      {/* ─── 1. Intro editorial ─── */}
      <section className={`section ${styles.introSection}`}>
        <div className={`container ${styles.introGrid}`}>
          <HeroSlider />
          <div className={styles.introContent}>
            <span className="eyebrow">Подоконники из кварцевого агломерата</span>
            <h2 className={styles.editorialH2}>
              Подоконники из камня — практичное решение для интерьера
            </h2>
            <p>
              Подоконник должен быть не только аккуратным визуально, но и устойчивым к ежедневной
              эксплуатации. Искусственный камень хорошо справляется с влагой, температурными
              перепадами и бытовыми нагрузками.
            </p>
            <p>
              Мы подбираем формат под ваш интерьер: от классических решений до эркерных и рабочих
              подоконников с расширенной функциональностью.
            </p>
            <div className="btn-row">
              <ConsultationButton source="window-sills-intro">Узнать стоимость</ConsultationButton>
              <span className="pill">от 11 760 ₽/м²</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Benefits ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Практичность и долговечность</span>
            <h2 className={styles.editorialH2}>Подоконник из кварца на заказ</h2>
            <p>
              Кварцевый агломерат сочетает красоту натурального камня и современную технологичность —
              подоконник сохраняет внешний вид долгие годы без особого ухода.
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
            <span className="eyebrow">Популярные форматы</span>
            <h2 className={styles.editorialH2}>Какие подоконники можно заказать</h2>
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

      {/* ─── 4. Price CTA ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.ctaBand}>
            <div className={styles.ctaBandContent}>
              <span className="eyebrow">Стоимость под ваш проект</span>
              <h2 className={styles.ctaBandTitle}>Проверим цену подоконника до замера?</h2>
              <p>
                Пришлите размеры и фото оконных зон — быстро дадим ориентир по бюджету,
                подскажем материал и после замера зафиксируем точную смету.
              </p>
            </div>
            <div className="btn-row">
              <Link className="button" href="/contacts">Узнать стоимость подоконника</Link>
              <ConsultationButton source="window-sills-cta" className="button-secondary">Получить консультацию</ConsultationButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Color picker ─── */}
      <section className="section">
        <div className={`container ${styles.colorsGrid}`}>
          <div className={styles.colorsText}>
            <span className="eyebrow">Подбор цвета</span>
            <h2 className={styles.editorialH2}>Широкий выбор оттенков под любой интерьер</h2>
            <p>
              Цвет и текстура подоконника должны сочетаться с оконными рамами, откосами и отделкой.
              Подбираем материалы с учётом освещения, площади и стилистики.
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
            <h2 className={styles.editorialH2}>Примеры выполненных подоконников</h2>
            <p>Форматы, которые чаще всего заказывают для квартир и домов в Санкт-Петербурге.</p>
          </div>
          <WorksSlider />
        </div>
      </section>

      {/* ─── 7. Trust ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Почему ArtellRock</span>
            <h2 className={styles.editorialH2}>Ваш лучший выбор в Санкт-Петербурге</h2>
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
            <h2 className={styles.editorialH2}>Каждый этап фиксируется от заявки до монтажа</h2>
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
