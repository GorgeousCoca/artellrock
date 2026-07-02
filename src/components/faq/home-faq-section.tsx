import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/types/content";

import { renderFaqAnswer } from "./render-faq-answer";
import styles from "./home-faq-section.module.scss";

type HomeFaqSectionProps = {
  items: FaqItem[];
  /** Вне главной — собственные отступы секции */
  standalone?: boolean;
};

export function HomeFaqSection({ items, standalone = false }: HomeFaqSectionProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className={[styles.section, standalone ? styles.standalone : "home-flow-section"].join(" ")}
    >
      <div className="container">
        <h2 className={styles.title}>Вопросы по теме</h2>
        <div className={styles.list}>
          {items.map((item) => (
            <details key={item.id} className={styles.item}>
              <summary className={styles.summary}>
                <span className={styles.question}>{item.question}</span>
                <span className={styles.toggle} aria-hidden>
                  <ChevronDown size={18} strokeWidth={2} />
                </span>
              </summary>
              <div className={styles.body}>
                <p>{renderFaqAnswer(item.answer)}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
