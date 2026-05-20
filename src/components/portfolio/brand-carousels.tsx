"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
    <section className={styles.section}>
      <div className={styles.head}>
        <h2>Реальные проекты с наших площадок</h2>
        <div className={styles.headMeta}>
          <p>Фото выполненных работ из нашей группы в VK от реальных клиентов</p>
          <div className={styles.socialLinks}>
            <Link
              href="https://vk.com/club230045850?ysclid=mo5ny4mikt343003951"
              target="_blank"
              rel="noreferrer"
              className={`${styles.socialLink} ${styles.socialLinkVk}`}
              aria-label="Перейти в группу VK"
            >
              <span className={styles.socialIcon} aria-hidden="true">
                <svg viewBox="0 0 101 100" aria-hidden="true" focusable="false">
                  <path
                    d="M53.7085 72.042C30.9168 72.042 17.9169 56.417 17.3752 30.417H28.7919C29.1669 49.5003 37.5834 57.5836 44.25 59.2503V30.417H55.0004V46.8752C61.5837 46.1669 68.4995 38.667 70.8329 30.417H81.5832C79.7915 40.5837 72.2915 48.0836 66.9582 51.1669C72.2915 53.6669 80.8336 60.2086 84.0836 72.042H72.2499C69.7082 64.1253 63.3754 58.0003 55.0004 57.1669V72.042H53.7085Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span>VK</span>
            </Link>
            <Link
              href="https://www.avito.ru/user/493c13ce7e29d787844ca8d238a644d5/profile?src=sharing"
              target="_blank"
              rel="noreferrer"
              className={`${styles.socialLink} ${styles.socialLinkAvito}`}
              aria-label="Перейти в профиль Avito"
            >
              <span className={styles.socialIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="7" cy="14.5" r="3.4" fill="#46A6FF" />
                  <circle cx="14.5" cy="8" r="3" fill="#66CD40" />
                  <circle cx="16.5" cy="16" r="2.3" fill="#FFD633" />
                  <circle cx="10.2" cy="8.8" r="1.8" fill="#FF5A7A" />
                </svg>
              </span>
              <span>Avito</span>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.grid}>
        {brandGroups.map((group) => {
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
          return (
            <article key={group.brand} className={`${styles.card} ${styles.cardShowcase}`}>
              <div className={styles.cardHead}>
                <div className={styles.titleWrap}>
                  <strong>{group.brand}</strong>
                  <p>{group.caption}</p>
                </div>
                <span className={styles.counter}>
                  {active + 1} / {group.images.length}
                </span>
              </div>

              <div className={styles.showcaseBody}>
                <div
                  className={styles.showcaseMedia}
                  onMouseEnter={() => setActiveCarousel({ brand: group.brand, total: group.images.length })}
                  onMouseLeave={() => setActiveCarousel(null)}
                >
                  <button
                    type="button"
                    className={`${styles.navButton} ${styles.navPrev}`}
                    onClick={() => shift(group.brand, group.images.length, -1)}
                    aria-label={`Предыдущая фотография бренда ${group.brand}`}
                  >
                    ‹
                  </button>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    quality={90}
                    className={styles.image}
                    priority={group.brand === brandGroups[0].brand && active === 0}
                  />
                  <button
                    type="button"
                    className={`${styles.navButton} ${styles.navNext}`}
                    onClick={() => shift(group.brand, group.images.length, 1)}
                    aria-label={`Следующая фотография бренда ${group.brand}`}
                  >
                    ›
                  </button>
                </div>

                <div className={styles.showcaseInfo}>
                  <div className={styles.showcaseMaterial}>
                    <p>Материал: {group.brand}</p>
                    <Link className={styles.catalogLink} href={`/catalog-kamnya?brand=${group.catalogBrandParam}`}>
                      Перейти в каталог камней
                    </Link>
                  </div>
                  <p className={styles.showcasePrice}>Цена от {formatRub(group.priceFrom)} руб./м²</p>
                  <Link className={`button ${styles.showcaseButton}`} href="/calculator">
                    Рассчитать стоимость
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
