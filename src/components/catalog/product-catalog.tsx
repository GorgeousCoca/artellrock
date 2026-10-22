import Link from "next/link";

import { Photo } from "@/components/site/photo";
import { productCatalog } from "@/content/artellrock";

/** Сетка каталога изделий. Карточка ведёт на уже существующую страницу. */
export function ProductCatalog() {
  return (
    <div className="catalog-grid">
      {productCatalog.map((card) => (
        <article key={card.title} className="card">
          <div className="card__media">
            <Photo
              src={card.image}
              alt={card.imageAlt}
              sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 25vw"
            />
          </div>
          <div className="card__body">
            <h2 className="t-tagline">
              <Link className="card__link" href={card.href}>
                {card.title}
              </Link>
            </h2>
            <p>{card.line}</p>
            <span className="text-link text-link--arrow">Подробнее</span>
          </div>
        </article>
      ))}
    </div>
  );
}
