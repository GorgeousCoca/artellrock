import Link from "next/link";

import { directions } from "@/content/artellrock";
import { Photo } from "@/components/site/photo";
import { ScrollRail } from "@/components/site/scroll-rail";

/** Крупные карточки направлений. Цену не показываем. На странице изделий карточка — раздел h2, на главной — подраздел h3. */
export function DirectionCards({ heading = "h3" }: { heading?: "h2" | "h3" }) {
  const Title = heading;

  return (
    <ScrollRail label="Направления" className="rail--grid rail--directions">
      {directions.map((direction) => (
        <article key={direction.slug} className="card">
          <div className="card__media">
            <Photo
              src={direction.image}
              alt={direction.imageAlt}
              sizes="(max-width: 570px) 100vw, (max-width: 1000px) 44vw, 33vw"
            />
          </div>
          <div className="card__body">
            <Title className="t-tagline">
              <Link className="card__link" href={`/izdeliya/${direction.slug}`}>
                {direction.title}
              </Link>
            </Title>
            <p>{direction.line}</p>
            <span className="text-link text-link--arrow">Смотреть {direction.title.toLowerCase()}</span>
          </div>
        </article>
      ))}
    </ScrollRail>
  );
}
