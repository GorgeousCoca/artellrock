"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe";

import styles from "./countertops-landing.module.scss";

const heroSlides = [
  { src: "/images/portfolio-brands/Avant_Quartz-01.jpg", alt: "Столешница Avant Quartz в реализованном проекте" },
  { src: "/images/portfolio-brands/Avant_Quartz-05.jpg", alt: "Кухонная столешница из кварцевого агломерата" },
  { src: "/images/portfolio-brands/Avarus-05.jpg", alt: "Столешница Avarus в интерьере" },
  { src: "/images/portfolio-brands/Nobell_Quartz-03.jpg", alt: "П-образная столешница из камня" },
];

const benefits = [
  { title: "Экологичность", text: "Безопасен для кухни и ванной, не выделяет запахов и подходит для контакта с продуктами." },
  { title: "Прочность", text: "Устойчив к царапинам, бытовым нагрузкам и сохраняет аккуратный вид годами." },
  { title: "Гигиеничность", text: "Плотная поверхность не впитывает влагу и загрязнения, легко очищается." },
  { title: "Влагостойкость", text: "Идеальное решение для кухонных зон, ванных и островов с активной эксплуатацией." },
] as const;

const useCases = [
  { title: "Столешницы на кухню", text: "Под варочную панель, мойку, остров или угловую кухню.", image: "/images/portfolio-brands/Avant_Quartz-05.jpg" },
  { title: "Столешницы в ванную", text: "Влагостойкие, под накладные и интегрированные раковины.", image: "/images/portfolio-brands/Avarus-05.jpg" },
  { title: "Под мрамор", text: "Светлые декоры с прожилками для премиального интерьера.", image: "/images/portfolio-brands/Nobell_Quartz-03.jpg" },
  { title: "С мойкой и фартуком", text: "Единая бесшовная композиция: столешница, фартук, остров.", image: "/images/portfolio-brands/Avant_Quartz-06.jpg" },
] as const;

const workSlides = [
  { image: "/images/portfolio-brands/Avant_Quartz-05.jpg", title: "Столешница прямая с низким фартуком", material: "Avarus R-541 Снега Сибири" },
  { image: "/images/portfolio-brands/Avant_Quartz-06.jpg", title: "Столешница угловая с фартуком", material: "Radianz AL450 Alluring" },
  { image: "/images/portfolio-brands/Nobell_Quartz-03.jpg", title: "Столешница П-образная с подоконником", material: "Avant Quartz 7020 Амбуаз" },
  { image: "/images/portfolio-brands/Avarus-05.jpg", title: "Столешница с интегрированной мойкой", material: "Avarus R-515" },
  { image: "/images/portfolio-brands/Smart_Quartz-01.jpg", title: "Столешница с каменным фартуком", material: "Smart Quartz Slate" },
  { image: "/images/portfolio-brands/Avant_Quartz-02.jpg", title: "Кухонный остров из кварца", material: "Avant Quartz 7030" },
];

const colors = [
  { name: "Calacatta Vision", image: "/images/portfolio-brands/Avant_Quartz-05.jpg" },
  { name: "Graphite Premium", image: "/images/portfolio-brands/Avarus-05.jpg" },
  { name: "Pure White", image: "/images/portfolio-brands/Nobell_Quartz-02.jpg" },
  { name: "Warm Marble", image: "/images/portfolio-brands/Avant_Quartz-01.jpg" },
  { name: "Stone Grey", image: "/images/portfolio-brands/Smart_Quartz-01.jpg" },
] as const;

const trustPoints = [
  { title: "Гарантируем качество", text: "Работаем с проверенными материалами и контролируем изделие на каждом этапе производства." },
  { title: "Без задержек", text: "Фиксируем сроки после замера и заранее согласуем этапы изготовления и монтажа." },
  { title: "Под ключ", text: "Замер, чертежи, производство, доставка и монтаж проходят в одном контексте." },
  { title: "Мы — производитель", text: "Собственное производство помогает точнее контролировать качество и стоимость." },
  { title: "Индивидуально для вас", text: "Подбираем форму, кромку, фартук и декор под ваш интерьер и бюджет." },
  { title: "Гибкие цены", text: "Предлагаем разные материалы и декоры: от практичных базовых до премиальных решений." },
] as const;

const workflowSteps = [
  { num: "01", title: "Заявка", text: "Связываетесь с нами любым удобным способом и описываете задачу." },
  { num: "02", title: "Замер", text: "Специалист выезжает на объект, выполняет точные размеры и показывает образцы." },
  { num: "03", title: "Производство", text: "Изготавливаем изделие по утвержденным параметрам с контролем качества." },
  { num: "04", title: "Монтаж", text: "Привозим и устанавливаем аккуратно, с проверкой всех примыканий." },
  { num: "05", title: "Гарантия", text: "Передаем готовый результат и гарантийные обязательства." },
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
      aria-label="Примеры реализованных столешниц"
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
        aria-label="Выполненные столешницы"
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
        <ConsultationButton source={`countertops-works:${item.title}`} className="button">Заказать такую</ConsultationButton>
      </div>
      <div className={styles.worksDots} aria-hidden>
        {workSlides.map((_, i) => (
          <button key={i} type="button" className={`${styles.dot} ${i === active ? styles.dotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

export function CountertopsLanding() {
  return (
    <>
      {/* ─── 1. Intro editorial ─── */}
      <section className={`section ${styles.introSection}`}>
        <div className={`container ${styles.introGrid}`}>
          <HeroSlider />
          <div className={styles.introContent}>
            <span className="eyebrow">Столешницы из кварцевого агломерата</span>
            <h2 className={styles.editorialH2}>
              Столешница из искусственного камня — лучшее решение для интерьера
            </h2>
            <p>
              Столешницы из искусственного камня популярны за счёт сочетания эстетики и практичности.
              Поверхность выглядит аккуратно, легко вписывается в современный интерьер и выдерживает ежедневную нагрузку.
            </p>
            <p>
              Вы получаете широкий выбор цветов, текстур и форм: от спокойных однотонных решений
              до выразительных мраморных декоров. Это позволяет реализовать как сдержанный классический стиль,
              так и более смелые современные проекты.
            </p>
            <div className="btn-row">
              <ConsultationButton source="countertops-intro">Узнать стоимость</ConsultationButton>
              <span className="pill">от 7 670 ₽/м²</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Benefits ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="eyebrow">Практичность и индивидуальность</span>
            <h2 className={styles.editorialH2}>Столешница из кварца на заказ</h2>
            <p>
              Кварцевый агломерат подходит для кухни, ванной, острова и коммерческих зон:
              выглядит как натуральный камень, но проще в уходе и стабильнее в эксплуатации.
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
            <span className="eyebrow">Популярные решения</span>
            <h2 className={styles.editorialH2}>Какие столешницы можно заказать</h2>
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

      {/* ─── 4. Price CTA band ─── */}
      <section className="section">
        <div className="container">
          <div className={styles.ctaBand}>
            <div className={styles.ctaBandContent}>
              <span className="eyebrow">Стоимость под ваш проект</span>
              <h2 className={styles.ctaBandTitle}>Проверим цену столешницы до замера?</h2>
              <p>
                Пришлите размеры, фото кухни или эскиз — быстро дадим ориентир по бюджету,
                подскажем материал и после замера зафиксируем точную смету.
              </p>
            </div>
            <div className="btn-row">
              <Link className="button" href="/contacts">Узнать стоимость столешницы</Link>
              <ConsultationButton source="countertops-cta" className="button-secondary">Получить консультацию</ConsultationButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Color picker ─── */}
      <section className="section">
        <div className={`container ${styles.colorsGrid}`}>
          <div className={styles.colorsText}>
            <span className="eyebrow">Подбор цвета</span>
            <h2 className={styles.editorialH2}>Большой выбор оттенков кварцевого агломерата</h2>
            <p>
              Цвет задаёт характер всей кухни или ванной зоны: может быть акцентным, нейтральным
              или поддерживать общий тон интерьера. При выборе важно учитывать фасады, освещение,
              кромку и фактуру, чтобы итоговое изделие выглядело цельно.
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
            <span className="eyebrow">Реализованные форматы</span>
            <h2 className={styles.editorialH2}>Изготовили более 1000 столешниц в Санкт-Петербурге</h2>
            <p>Типовые форматы изделий, которые чаще всего заказывают для кухонь и ванных.</p>
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
            <h2 className={styles.editorialH2}>Каждый этап фиксируется от первой заявки до монтажа</h2>
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
