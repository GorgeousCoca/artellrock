import Link from "next/link";

import { Photo } from "@/components/site/photo";
import { reelSlides, type ReelSlide } from "@/lib/catalog/quartz-catalog";

import styles from "./catalog-reel.module.scss";

function SlideList({ slides, hidden = false }: { slides: ReelSlide[]; hidden?: boolean }) {
  return (
    <ul className={hidden ? `${styles.group} ${styles.clone}` : styles.group} aria-hidden={hidden || undefined}>
      {slides.map((slide) => (
        <li key={`${slide.brandSlug}/${slide.slug}`}>
          <Link
            className={styles.card}
            href={`/catalog-kvarca/${slide.brandSlug}/${slide.slug}`}
            tabIndex={hidden ? -1 : undefined}
          >
            <span className={styles.frame}>
              <Photo src={slide.image} alt="" sizes="(max-width: 570px) 46vw, 180px" />
            </span>
            <span className={styles.brand}>{slide.brandName}</span>
            <span className={styles.name}>{slide.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Бегущая лента: по пять камней каждого бренда. Наведение и фокус останавливают движение. */
export function CatalogReel() {
  const slides = reelSlides();
  if (slides.length === 0) return null;

  return (
    <section className={styles.reel} aria-label="Камни брендов">
      <div className={styles.viewport}>
        <div className={styles.track}>
          <SlideList slides={slides} />
          <SlideList slides={slides} hidden />
        </div>
      </div>
    </section>
  );
}
