import Image from "next/image";

import { reviewsPage } from "@/content/trust";

import styles from "./review-sources.module.scss";

/** Форма отзыва слева, справа блок со ссылками на официальные страницы (ВК, Авито). */
export function ReviewFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      {children}
      <aside className={styles.aside} aria-label="Наши официальные страницы">
        <p>{reviewsPage.sourcesText}</p>
        <ul className={styles.links}>
          {reviewsPage.sources.map((source) => (
            <li key={source.id}>
              <a
                className={styles.link}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${source.label} (откроется в новой вкладке)`}
              >
                <Image className={styles.icon} src={source.icon} alt="" width={source.width} height={source.height} unoptimized />
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
