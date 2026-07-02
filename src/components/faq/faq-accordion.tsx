import type { FaqItem } from "@/types/content";

import { renderFaqAnswer } from "./render-faq-answer";

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="faq-accordion stack">
      {items.map((item) => (
        <details key={item.id} className="faq-accordion__item card card--glass">
          <summary className="faq-accordion__summary">{item.question}</summary>
          <div className="faq-accordion__body">
            <p>{renderFaqAnswer(item.answer)}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
