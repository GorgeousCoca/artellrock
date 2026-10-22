import type { Work } from "@/lib/portfolio";
import { Photo } from "@/components/site/photo";
import { ScrollRail } from "@/components/site/scroll-rail";

export function WorkCard({ work, sizes }: { work: Work; sizes: string }) {
  return (
    <figure className="work">
      <div className="work__media">
        <Photo src={work.image} alt={work.title ?? work.label} sizes={sizes} />
      </div>
      <figcaption>
        <span className="work__title">{work.title ?? work.label}</span>
        {work.text ? <span className="work__text">{work.text}</span> : null}
      </figcaption>
    </figure>
  );
}

/** Горизонтальная лента своих фото готовых изделий: три карточки в ряд на десктопе. */
export function WorksRail({ works, label }: { works: Work[]; label: string }) {
  return (
    <ScrollRail label={label} className="rail--thirds">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} sizes="(max-width: 570px) 86vw, (max-width: 800px) 50vw, 33vw" />
      ))}
    </ScrollRail>
  );
}
