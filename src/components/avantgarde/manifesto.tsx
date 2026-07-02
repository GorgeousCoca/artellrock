"use client";

import styles from "./avantgarde-home.module.scss";

type ManifestItem = {
  title: string;
  text: string;
};

type ManifestoProps = {
  items: ManifestItem[];
};

export function Manifesto({ items }: ManifestoProps) {
  return (
    <section className={styles.section}>
      <div className={styles.manifestoGrid}>
        <article className={`${styles.glassCard} ${styles.manifestoQuote}`}>
          Мы не продаем камень.
          <br />
          <em>Мы создаем пространство, которое хочется трогать.</em>
        </article>

        <div className={`${styles.glassCard} ${styles.manifestoList}`}>
          {items.map((item) => (
            <div key={item.title} className={styles.manifestoItem}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
