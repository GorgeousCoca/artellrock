import Link from "next/link";

import { hero } from "@/content/artellrock";
import { Photo } from "@/components/site/photo";

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero__inner">
        <div className="home-hero__copy">
          <p className="home-hero__mark" translate="no">
            {hero.wordmark}
          </p>
          <p className="home-hero__tag">{hero.tagline}</p>
          <h1 id="hero-title" className="home-hero__title">
            {hero.title}
          </h1>
          <p className="home-hero__lead">{hero.lead}</p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary home-hero__cta" href={hero.primaryHref}>
              {hero.primary}
            </Link>
            <Link className="text-link" href={hero.catalogHref}>
              {hero.catalog}
            </Link>
          </div>
        </div>

        <div className="home-hero__stage">
          <div className="home-hero__plate home-hero__plate--back" aria-hidden="true" />
          <div className="home-hero__rule" aria-hidden="true" />
          <div className="home-hero__laptop">
            <div className="home-hero__screen">
              <Photo src={hero.image} alt={hero.imageAlt} sizes="(max-width: 900px) 100vw, 46vw" priority />
            </div>
            <div className="home-hero__chin" aria-hidden="true" />
          </div>
          <div className="home-hero__plate home-hero__plate--front" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
