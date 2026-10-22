import { reasons, steps } from "@/content/artellrock";
import { ScrollRail } from "@/components/site/scroll-rail";
import { SectionHead } from "@/components/site/section-head";

/** Блок 7, часть 1: «Почему ArtellRock» — столько карточек, сколько абзацев в TEXTS.md. */
export function ReasonsSection() {
  return (
    <section className="page block" aria-labelledby="reasons-title">
      <SectionHead id="reasons-title" title={reasons.title} />
      <ScrollRail label={reasons.title} className="rail--grid rail--cols-4">
        {reasons.items.map((item) => (
          <article key={item.title} className="info-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </ScrollRail>
    </section>
  );
}

/** Блок 7, часть 2: пять шагов. Якорь — цель ссылки «Как проходит заказ». */
export function StepsSection() {
  return (
    <section id="kak-prohodit-zakaz" className="page block" aria-labelledby="steps-title">
      <SectionHead id="steps-title" title={steps.title} />
      <ScrollRail label={steps.title} className="rail--grid rail--cols-5">
        {steps.items.map((item, index) => (
          <article key={item.title} className="info-card">
            <span className="step-card__index" aria-hidden>
              {index + 1}
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </ScrollRail>
    </section>
  );
}
