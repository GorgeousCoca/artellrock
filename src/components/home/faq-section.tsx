import { faq } from "@/content/artellrock";
import { ScrollRail } from "@/components/site/scroll-rail";
import { SectionHead } from "@/components/site/section-head";

type FaqItem = { question: string; answer: string };

type FaqSectionProps = {
  items?: readonly FaqItem[];
  title?: string;
  id?: string;
};

/** Вопросы и ответы. Без JavaScript: обычные details. Вопрос — заголовок h3 под h2 раздела. */
export function FaqSection({ items = faq.items, title = faq.title, id = "voprosy" }: FaqSectionProps) {
  const headingId = `${id}-title`;
  const half = Math.ceil(items.length / 2);
  const columns = [items.slice(0, half), items.slice(half)];

  return (
    <section id={id} className="page block" aria-labelledby={headingId}>
      <SectionHead id={headingId} title={title} />
      <div className="faq-columns">
        <ScrollRail label={title} className="rail--grid rail--cols-2 rail--start">
          {columns.map((column, index) => (
            <div key={index} className="faq-column">
              {column.map((item) => (
                <details key={item.question} className="faq__item">
                  <summary>
                    <h3>{item.question}</h3>
                    <span className="faq__marker" aria-hidden />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          ))}
        </ScrollRail>
      </div>
    </section>
  );
}
