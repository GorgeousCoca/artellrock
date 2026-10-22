import clsx from "clsx";
import { Droplets, Factory, Gem, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Photo } from "@/components/site/photo";
import { SectionHead } from "@/components/site/section-head";
import { FORM_ANCHOR, pages, type DirectionSection, type ProductCatalogCard } from "@/content/artellrock";
import { directionBenefits, directionBlocks, type DirectionBenefitIcon, type DirectionIdea } from "@/content/direction-blocks";
import type { ReelSlide } from "@/lib/catalog/quartz-catalog";

import styles from "./direction.module.scss";

const ICONS: Record<DirectionBenefitIcon, LucideIcon> = {
  gem: Gem,
  droplets: Droplets,
  shield: ShieldCheck,
  factory: Factory
};

export type GalleryItem = { id: string; image: string; label: string };

/** Тёмная шапка: заголовок, до четырёх фото готовых работ, короткий текст и кнопка. */
export function DirectionHero({
  title,
  line,
  gallery
}: {
  title: string;
  line: string;
  gallery: readonly GalleryItem[];
}) {
  const items = gallery.slice(0, 4);
  return (
    <section className={clsx("page", styles.hero)} aria-labelledby="direction-title">
      <h1 id="direction-title" className={clsx("t-display-lg", styles.heroTitle)}>
        {title}
      </h1>
      <div className={clsx(styles.gallery, items.length === 1 && styles["gallery--one"], items.length === 3 && styles["gallery--three"])}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.galleryItem}>
            <Photo src={item.image} alt={item.label} sizes="(max-width: 1000px) 50vw, 28vw" priority={index === 0} />
          </div>
        ))}
      </div>
      <div className={styles.heroCopy}>
        <p className={styles.heroLine}>{line}</p>
        <p>{pages.direction.lead}</p>
        <div className={styles.heroBuy}>
          <a className="btn btn--primary" href={FORM_ANCHOR}>
            {directionBlocks.heroCta}
          </a>
        </div>
      </div>
    </section>
  );
}

/** Вступление слева, четыре преимущества справа. */
export function DirectionIntro({ name, idea }: { name: string; idea: DirectionIdea }) {
  return (
    <section className={clsx("page block", styles.intro)} aria-labelledby="direction-intro">
      <div className={styles.introCopy}>
        <h2 id="direction-intro" className="t-display-md">
          {directionBlocks.introTitle(name)}
        </h2>
        <p className={styles.introSubtitle}>{idea.subtitle}</p>
        {idea.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <ul className={styles.benefits}>
        {directionBenefits.map((benefit) => {
          const Icon = ICONS[benefit.icon];
          return (
            <li key={benefit.title} className={styles.benefit}>
              <span className={styles.benefitIcon} aria-hidden>
                <Icon size={26} strokeWidth={1.75} />
              </span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Особенности заказа: короткие карточки в сетке вместо отдельных блоков друг под другом. */
export function DirectionDetails({ sections }: { sections: readonly DirectionSection[] }) {
  if (sections.length === 0) return null;
  const columns = sections.length === 1 ? "one" : sections.length === 2 || sections.length === 4 ? "two" : "three";
  return (
    <section className="page block" aria-labelledby="direction-details">
      <SectionHead id="direction-details" title={directionBlocks.detailsTitle} />
      <div className={clsx(styles.details, styles[`details--${columns}`])}>
        {sections.map((section) => (
          <article key={section.id} id={section.id} className={clsx("info-card", styles.detail)}>
            <h3>{section.title}</h3>
            <p>{section.lead}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Карточки вариантов изделия: ведут к разделам этой же страницы. */
export function DirectionVariants({ cards }: { cards: readonly ProductCatalogCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="page block" aria-labelledby="direction-variants">
      <SectionHead id="direction-variants" title={directionBlocks.variantsTitle} />
      <div className={styles.variants}>
        {cards.map((card) => (
          <article key={card.href} className="card">
            <div className={clsx("card__media", styles.variantMedia)}>
              <Photo src={card.image} alt={card.imageAlt} sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 25vw" />
            </div>
            <div className="card__body">
              <h3 className="t-tagline">
                <Link className="card__link" href={card.href}>
                  {card.title}
                </Link>
              </h3>
              <p>{card.line}</p>
              <span className={clsx("btn btn--primary", styles.variantAction)}>{directionBlocks.variantsMore}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Сетка расцветок из каталога: ссылки на страницы камней. */
export function DirectionSwatches({ slides }: { slides: readonly ReelSlide[] }) {
  if (slides.length === 0) return null;
  return (
    <section className="page block" aria-labelledby="direction-swatches">
      <SectionHead id="direction-swatches" title={directionBlocks.swatchesTitle} lead={directionBlocks.swatchesLead} />
      <div className={styles.swatches}>
        {slides.map((slide) => (
          <Link key={`${slide.brandSlug}-${slide.slug}`} className={styles.swatch} href={`/catalog-kvarca/${slide.brandSlug}/${slide.slug}`}>
            <Photo src={slide.image} alt={`${slide.name}, ${slide.brandName}`} sizes="(max-width: 570px) 50vw, (max-width: 1000px) 33vw, 16vw" />
            <span className={styles.swatchLabel}>
              {slide.name}
              <small>{slide.brandName}</small>
            </span>
          </Link>
        ))}
      </div>
      <div className={styles.moreRow}>
        <Link className="btn btn--secondary" href="/catalog-kvarca">
          {directionBlocks.swatchesMore}
        </Link>
      </div>
    </section>
  );
}

export function DirectionEdgePromo() {
  const edge = directionBlocks.edge;
  return (
    <section className="page block" aria-labelledby="direction-edge">
      <div className={styles.edge}>
        <div className={styles.edgeMedia}>
          <Photo src={edge.image} alt={edge.imageAlt} sizes="(max-width: 1000px) 100vw, 40vw" />
        </div>
        <div className={styles.edgeCopy}>
          <h2 id="direction-edge" className="t-display-md">
            {edge.title}
          </h2>
          <p>{edge.text}</p>
          <Link className="btn btn--primary" href="/kromki">
            {edge.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Куда смотреть цену: без цифр на этой странице. */
export function DirectionPrice({ name }: { name: string }) {
  return (
    <section className="page block" aria-labelledby="direction-price">
      <SectionHead id="direction-price" title={directionBlocks.priceTitle(name)} lead={directionBlocks.priceLead} />
      <div className={styles.priceActions}>
        <Link className="btn btn--primary" href="/catalog-kvarca">
          {directionBlocks.priceCatalog}
        </Link>
        <Link className="btn btn--secondary" href="/kalkulyator">
          {directionBlocks.priceCalculator}
        </Link>
      </div>
    </section>
  );
}