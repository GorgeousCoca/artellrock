import clsx from "clsx";
import Link from "next/link";

import { Photo } from "@/components/site/photo";
import { SectionHead } from "@/components/site/section-head";

import styles from "./catalog-links.module.scss";

const CATALOGS = [
  {
    title: "Каталог изделий",
    href: "/izdeliya",
    image: "/images/portfolio/case-island-light.jpg",
    alt: "Светлый кухонный остров из кварца"
  },
  {
    title: "Каталог камня",
    href: "/catalog-kvarca",
    image: "/images/stones/primax/pq702-primax-quartz-702-light-calacatta/texture.jpg",
    alt: "Светлый кварцевый агломерат с серыми прожилками"
  },
  {
    title: "Каталог моек",
    href: "/moyki-iz-kvarca",
    image: "/images/portfolio/case-sink-double.jpg",
    alt: "Столешница из кварца с мойкой"
  },
  {
    title: "Каталог профилей",
    href: "/kromki",
    image: "/images/portfolio/case-edge-narrow.jpg",
    alt: "Профиль кромки столешницы из кварца"
  }
] as const;

/** Четыре входа в каталоги: изделия, камень, мойки, профили кромок. Стоит перед первой формой заявки. */
export function CatalogLinks() {
  return (
    <section className="page block" aria-labelledby="catalogs-title">
      <SectionHead
        id="catalogs-title"
        title="Каталоги"
        lead="Изделия, декоры камня, мойки и профили кромок. Выбирайте и считайте стоимость в калькуляторе."
      />
      <div className={styles.grid}>
        {CATALOGS.map((item) => (
          <article key={item.href} className="card">
            <div className={clsx("card__media", styles.media)}>
              <Photo src={item.image} alt={item.alt} sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 25vw" />
            </div>
            <div className="card__body">
              <h3 className="t-tagline">
                <Link className="card__link" href={item.href}>
                  {item.title}
                </Link>
              </h3>
              <span className={clsx("btn btn--primary", styles.action)}>Подробнее</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
