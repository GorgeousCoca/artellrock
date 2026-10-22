import { featuredProject } from "@/content/artellrock";
import { workLabelForImage } from "@/lib/portfolio";
import { Photo } from "@/components/site/photo";
import { ScrollRail } from "@/components/site/scroll-rail";

/** Блок 6: слева листаются фото одного объекта, справа название, абзац и ссылка на шаги заказа. */
export function FeaturedProject() {
  return (
    <section className="page block featured" aria-labelledby="featured-title">
      <div className="featured__gallery">
        <ScrollRail label={featuredProject.title} className="rail--slides">
          {featuredProject.images.map((image, index) => (
            <div key={image.src} className="slide">
              <Photo
                src={image.src}
                alt={image.alt}
                sizes="(max-width: 1000px) 100vw, 52vw"
                priority={false}
              />
              {workLabelForImage(image.src) ? (
                <span className="slide__chip">{workLabelForImage(image.src)}</span>
              ) : null}
              <span className="visually-hidden">
                {index + 1} / {featuredProject.images.length}
              </span>
            </div>
          ))}
        </ScrollRail>
      </div>

      <div className="featured__copy">
        <h2 id="featured-title" className="t-display-lg">
          {featuredProject.title}
        </h2>
        <p>{featuredProject.text}</p>
        <a className="text-link text-link--arrow" href={featuredProject.linkHref}>
          {featuredProject.link}
        </a>
      </div>
    </section>
  );
}
