import Link from "next/link";
import Image from "next/image";

import { formatPrice } from "@/lib/utils";

export function SectionIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-header">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{description}</p>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  titleClassName,
  descriptionClassName,
  actionsClassName,
  visualImageSrc,
  visualImageAlt,
  visualBadgeText,
  heroImageSizes,
  heroImagePriority
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
  visualImageSrc?: string;
  visualImageAlt?: string;
  visualBadgeText?: string;
  /** Responsive width hints for LCP/preload (default suits 2-col hero). */
  heroImageSizes?: string;
  /** Default true — hero media is typically LCP. */
  heroImagePriority?: boolean;
}) {
  const resolvedTitleClassName = `section-title ${titleClassName ?? ""}`.trim();
  const resolvedDescriptionClassName = descriptionClassName ?? "";

  return (
    <section className="section page-hero">
      <div className="container">
        <div className="card page-hero__card">
          <div className="page-hero__grid">
            <div className="stack">
              {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
              <h1 className={resolvedTitleClassName}>{title}</h1>
              <p className={resolvedDescriptionClassName}>{description}</p>
              {actions ? <div className={actionsClassName ?? "btn-row"}>{actions}</div> : null}
            </div>
            <div className="page-hero__visual">
              <Image
                src={visualImageSrc ?? "/images/quartz-hero-editorial.svg"}
                alt={visualImageAlt ?? "Премиальная композиция из кварцевого агломерата"}
                width={1600}
                height={1000}
                sizes={
                  heroImageSizes ?? "(max-width: 900px) 100vw, min(52vw, 720px)"
                }
                priority={heroImagePriority !== false}
              />
              <div className="page-hero__badge">{visualBadgeText ?? "Quartz. Detail. Installation."}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MediaCard({
  href,
  title,
  description,
  label,
  price,
  meta,
  imageUrl,
  className,
  imagePriority,
  titleLevel = 3
}: {
  href: string;
  title: string;
  description: string;
  label?: string;
  price?: number;
  meta?: string;
  imageUrl?: string;
  className?: string;
  /** Первый экран / LCP — отключает ленивую загрузку для обложки. */
  imagePriority?: boolean;
  /** Уровень заголовка карточки: на странице с одним `h1` без промежуточного `h2` используйте `2`. */
  titleLevel?: 2 | 3;
}) {
  const TitleTag = titleLevel === 2 ? "h2" : "h3";
  return (
    <article className={`card media-card ${className ?? ""}`.trim()}>
      {imageUrl ? (
        <Image
          className="media-image"
          src={imageUrl}
          alt={title}
          width={800}
          height={500}
          sizes="(max-width: 900px) 100vw, min(400px, 33vw)"
          priority={imagePriority ?? false}
        />
      ) : (
        <div className="media-placeholder" aria-hidden="true" />
      )}
      <div className="media-card__content stack">
        {label ? <span className="eyebrow">{label}</span> : null}
        <TitleTag>{title}</TitleTag>
        <p>{description}</p>
        {meta ? <span className="muted">{meta}</span> : null}
        <div className="btn-row">
          {price ? <span className="pill">от {formatPrice(price)} руб.</span> : null}
          <Link className="button-ghost" href={href}>
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Pagination({
  page,
  totalPages,
  makeHref
}: {
  page: number;
  totalPages: number;
  makeHref: (pageNumber: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <Link
          key={pageNumber}
          className={pageNumber === page ? "button" : "button-secondary"}
          href={makeHref(pageNumber)}
        >
          {pageNumber}
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card stack">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
