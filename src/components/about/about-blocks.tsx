import Image from "next/image";
import Link from "next/link";

import { Photo } from "@/components/site/photo";
import { reviewsPage } from "@/content/trust";
import type { AboutCard, AboutFact } from "@/content/about";

import styles from "./about.module.scss";

/** Вводный текст: абзацы на всю ширину страницы. */
export function AboutIntro({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <section className={`page ${styles.intro}`} aria-label="О мастерской">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}

function CardMedia({ card }: { card: AboutCard }) {
  if (card.media.kind === "photo") {
    return <Photo src={card.media.src} alt={card.media.alt} sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 24vw" />;
  }

  return (
    <div className={styles.sources} aria-hidden="true">
      {reviewsPage.sources.map((source) => (
        <Image key={source.id} src={source.icon} alt="" width={source.width} height={source.height} unoptimized />
      ))}
    </div>
  );
}

/** Четыре карточки-перехода: фото, заголовок и кнопка «Подробнее». */
export function AboutCards({ cards }: { cards: readonly AboutCard[] }) {
  return (
    <section className={`page block ${styles.cards}`} aria-label="Разделы сайта">
      {cards.map((card) => (
        <article key={card.href} className={styles.card}>
          <h2>{card.title}</h2>
          <Link
            href={card.href}
            className={card.media.kind === "photo" && card.media.fit === "contain" ? `${styles.media} ${styles.mediaContain}` : styles.media}
            tabIndex={-1}
            aria-hidden="true"
          >
            <CardMedia card={card} />
          </Link>
          <Link href={card.href} className="btn btn--secondary" aria-label={card.actionLabel}>
            Подробнее
          </Link>
        </article>
      ))}
    </section>
  );
}

/** Крупные числа под тонким заголовком, как на странице-образце. */
export function AboutFacts({ title, facts }: { title: string; facts: readonly AboutFact[] }) {
  return (
    <section className={`page block ${styles.facts}`} aria-labelledby="about-facts-title">
      <h2 id="about-facts-title">{title}</h2>
      <ul>
        {facts.map((fact) => (
          <li key={fact.text}>
            <strong>{fact.value}</strong>
            <p>{fact.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
