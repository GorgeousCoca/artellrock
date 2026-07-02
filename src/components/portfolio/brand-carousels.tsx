"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ConsultationButton } from "@/components/forms/consultation-button";
import { PlatformLinks } from "@/components/ui/platform-links";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe";
import { brandCatalogHref } from "@/lib/stone/brands";

import styles from "./brand-carousels.module.scss";

type BrandGroup = {
  brand: string;
  caption: string;
  catalogBrandParam: string;
  priceFrom: number;
  images: { src: string; alt: string }[];
};

type ActiveCarousel = {
  brand: string;
  total: number;
};

const brandGroups: BrandGroup[] = [
  {
    brand: "Avant Quartz",
    caption: "Премиальные столешницы, подоконники и острова",
    catalogBrandParam: "avant",
    priceFrom: 45000,
    images: [
      { src: "/images/portfolio-brands/Avant_Quartz-01.jpg", alt: "Avant Quartz: реализованный проект 1" },
      { src: "/images/portfolio-brands/Avant_Quartz-02.jpg", alt: "Avant Quartz: реализованный проект 2" },
      { src: "/images/portfolio-brands/Avant_Quartz-03.jpg", alt: "Avant Quartz: реализованный проект 3" },
      { src: "/images/portfolio-brands/Avant_Quartz-04.jpg", alt: "Avant Quartz: реализованный проект 4" },
      { src: "/images/portfolio-brands/Avant_Quartz-05.jpg", alt: "Avant Quartz: реализованный проект 5" },
      { src: "/images/portfolio-brands/Avant_Quartz-06.jpg", alt: "Avant Quartz: реализованный проект 6" },
      { src: "/images/portfolio-brands/Avant_Quartz-07.jpg", alt: "Avant Quartz: реализованный проект 7" },
      { src: "/images/portfolio-brands/Avant_Quartz-08.jpg", alt: "Avant Quartz: реализованный проект 8" },
      { src: "/images/portfolio-brands/Avant_Quartz-09.jpg", alt: "Avant Quartz: реализованный проект 9" },
      { src: "/images/portfolio-brands/Avant_Quartz-10.jpg", alt: "Avant Quartz: реализованный проект 10" }
    ]
  },
  {
    brand: "Avarus",
    caption: "Практичные решения для кухни и ванной",
    catalogBrandParam: "avarus",
    priceFrom: 50000,
    images: [
      { src: "/images/portfolio-brands/Avarus-01.jpg", alt: "Avarus: реализованный проект 1" },
      { src: "/images/portfolio-brands/Avarus-02.jpg", alt: "Avarus: реализованный проект 2" },
      { src: "/images/portfolio-brands/Avarus-04.jpg", alt: "Avarus: реализованный проект 4" },
      { src: "/images/portfolio-brands/Avarus-05.jpg", alt: "Avarus: реализованный проект 5" },
      { src: "/images/portfolio-brands/Avarus-06.jpg", alt: "Avarus: реализованный проект 6" },
      { src: "/images/portfolio-brands/Avarus-07.jpg", alt: "Avarus: реализованный проект 7" },
      { src: "/images/portfolio-brands/Avarus-08.jpg", alt: "Avarus: реализованный проект 8" },
      { src: "/images/portfolio-brands/Avarus-09.jpg", alt: "Avarus: реализованный проект 9" }
    ]
  },
  {
    brand: "Nobell Quartz",
    caption: "Кейсы с акцентом на текстуру и цветовую глубину",
    catalogBrandParam: "noblle",
    priceFrom: 47500,
    images: [
      { src: "/images/portfolio-brands/Nobell_Quartz-01.jpg", alt: "Nobell Quartz: реализованный проект 1" },
      { src: "/images/portfolio-brands/Nobell_Quartz-02.jpg", alt: "Nobell Quartz: реализованный проект 2" },
      { src: "/images/portfolio-brands/Nobell_Quartz-03.jpg", alt: "Nobell Quartz: реализованный проект 3" },
      { src: "/images/portfolio-brands/Nobell_Quartz-04.jpg", alt: "Nobell Quartz: реализованный проект 4" },
      { src: "/images/portfolio-brands/Nobell_Quartz-05.jpg", alt: "Nobell Quartz: реализованный проект 5" }
    ]
  },
  {
    brand: "Smart Quartz",
    caption: "Современные минималистичные интерьеры",
    catalogBrandParam: "smart",
    priceFrom: 49000,
    images: [
      { src: "/images/portfolio-brands/Smart_Quartz-01.jpg", alt: "Smart Quartz: реализованный проект 1" },
      { src: "/images/portfolio-brands/Smart_Quartz-02.jpg", alt: "Smart Quartz: реализованный проект 2" },
      { src: "/images/portfolio-brands/Smart_Quartz-03.jpg", alt: "Smart Quartz: реализованный проект 3" },
      { src: "/images/portfolio-brands/Smart_Quartz-04.jpg", alt: "Smart Quartz: реализованный проект 4" }
    ]
  }
];

type BrandShowcaseMediaProps = {
  brand: string;
  total: number;
  active: number;
  item: { src: string; alt: string };
  priority?: boolean;
  onShift: (direction: -1 | 1) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

function BrandShowcaseMedia({
  brand,
  total,
  active,
  item,
  priority,
  onShift,
  onHoverStart,
  onHoverEnd
}: BrandShowcaseMediaProps) {
  const swipe = useHorizontalSwipe(
    () => onShift(1),
    () => onShift(-1)
  );

  return (
    <div
      className={styles.showcaseMedia}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Фотографии проектов ${brand}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
      onTouchCancel={swipe.onTouchCancel}
    >
      <div className={styles.imageFrame}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          quality={90}
          className={styles.image}
          priority={priority}
          draggable={false}
        />
      </div>
      <span className={styles.counter} aria-hidden>
        {active + 1} / {total}
      </span>
      <button
        type="button"
        className={`${styles.navButton} ${styles.navPrev}`}
        onClick={() => onShift(-1)}
        aria-label={`Предыдущая фотография бренда ${brand}`}
      >
        ‹
      </button>
      <button
        type="button"
        className={`${styles.navButton} ${styles.navNext}`}
        onClick={() => onShift(1)}
        aria-label={`Следующая фотография бренда ${brand}`}
      >
        ›
      </button>
      <span className="visually-hidden" aria-live="polite">
        Фото {active + 1} из {total}
      </span>
    </div>
  );
}

export function BrandCarousels() {
  const [indices, setIndices] = useState<Record<string, number>>(
    () => Object.fromEntries(brandGroups.map((group) => [group.brand, 0])) as Record<string, number>
  );
  const [activeCarousel, setActiveCarousel] = useState<ActiveCarousel | null>(null);

  const formatRub = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

  const shift = useCallback((brand: string, total: number, direction: -1 | 1) => {
    setIndices((current) => {
      const active = current[brand] ?? 0;
      const next = (active + direction + total) % total;
      return { ...current, [brand]: next };
    });
  }, []);

  useEffect(() => {
    if (!activeCarousel) {
      return;
    }

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        shift(activeCarousel.brand, activeCarousel.total, -1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        shift(activeCarousel.brand, activeCarousel.total, 1);
      }
    };

    // addEventListener на document в SSR не вызывается (только useEffect), но защищаемся от нестандартных сред без document.
    if (typeof document === "undefined") {
      return;
    }
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [activeCarousel, shift]);

  return (
    <section className={styles.section} aria-label="Проекты по брендам">
      <div className={styles.head}>
        <span className={styles.eyebrow}>Фото с площадок</span>
        <h2>Реальные проекты с наших площадок</h2>
        <div className={styles.headMeta}>
          <p>Фото выполненных работ из нашей группы в VK от реальных клиентов</p>
          <PlatformLinks />
        </div>
      </div>
      <div className={styles.brandList}>
        {brandGroups.map((group, index) => {
          if (group.images.length === 0) {
            // Без снимков item === undefined → у Image пустой src и ошибки в консоли при расширении данных.
            return null;
          }
          const activeRaw = indices[group.brand] ?? 0;
          const active = ((activeRaw % group.images.length) + group.images.length) % group.images.length;
          const item = group.images[active];
          if (!item) {
            return null;
          }
          const reversed = index % 2 === 1;

          return (
            <article
              key={group.brand}
              className={`${styles.brandRow} ${reversed ? styles.brandRowReverse : ""}`}
            >
              <BrandShowcaseMedia
                brand={group.brand}
                total={group.images.length}
                active={active}
                item={item}
                priority={group.brand === brandGroups[0].brand && active === 0}
                onShift={(direction) => shift(group.brand, group.images.length, direction)}
                onHoverStart={() =>
                  setActiveCarousel({ brand: group.brand, total: group.images.length })
                }
                onHoverEnd={() => setActiveCarousel(null)}
              />

              <div className={styles.brandContent}>
                <div className={styles.titleWrap}>
                  <strong>{group.brand}</strong>
                  <p>{group.caption}</p>
                </div>
                <div className={styles.showcaseInfo}>
                  <div className={styles.showcaseMaterial}>
                    <p>Материал: {group.brand}</p>
                    <Link className={styles.catalogLink} href={brandCatalogHref(group.catalogBrandParam)}>
                      Перейти в каталог камней
                    </Link>
                  </div>
                  <p className={styles.showcasePrice}>Цена от {formatRub(group.priceFrom)} руб./м²</p>
                  <ConsultationButton
                    source={`portfolio:${group.catalogBrandParam}`}
                    className={`button ${styles.showcaseButton}`}
                  >
                    Получить консультацию
                  </ConsultationButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
