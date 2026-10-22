import clsx from "clsx";
import Link from "next/link";

import { Photo } from "@/components/site/photo";
import type { GuideCard, GuideCompareRow, GuideSpecRow } from "@/content/guides";

import styles from "./guide.module.scss";

/** Карточки с заголовком и абзацем. `numbered` нумерует шаги. */
export function GuideCards({
  items,
  numbered = false,
  columns = 3
}: {
  items: readonly GuideCard[];
  numbered?: boolean;
  columns?: 3 | 4 | 5;
}) {
  return (
    <div className={clsx(styles.grid, columns === 4 && styles["grid--four"], columns === 5 && styles["grid--five"])}>
      {items.map((item, index) => (
        <article key={item.title} className="info-card">
          {numbered ? (
            <span className={styles.index} aria-hidden>
              {index + 1}
            </span>
          ) : null}
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

/** Таблица «параметр — значение». */
export function GuideSpecTable({
  rows,
  caption,
  headings = ["Параметр", "Значение"]
}: {
  rows: readonly GuideSpecRow[];
  caption: string;
  headings?: readonly [string, string];
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{headings[0]}</th>
            <th scope="col">{headings[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Сравнение кварца с гранитом/мрамором и акрилом. */
export function GuideCompareTable({ rows, caption }: { rows: readonly GuideCompareRow[]; caption: string }) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Что сравниваем</th>
            <th scope="col">Кварцевый агломерат</th>
            <th scope="col">Гранит и мрамор</th>
            <th scope="col">Акриловый камень</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <th scope="row">{row.feature}</th>
              <td>{row.quartz}</td>
              <td>{row.natural}</td>
              <td>{row.acrylic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideProse({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className={styles.prose}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

export function GuideChecklist({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.checklist}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function GuideLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  return (
    <ul className={styles.links}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

/** Карточка кромки или бортика: фото, если оно есть, название и пояснение. Цена живёт в прайс-листе. */
export function EdgeCard({
  name,
  note,
  image
}: {
  name: string;
  note?: string;
  image?: string;
}) {
  return (
    <article className={styles.edge}>
      <div className={styles.edgeMedia}>
        {image ? <Photo src={image} alt={name} sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : null}
      </div>
      <div className={styles.edgeBody}>
        <h3>{name}</h3>
        {note ? <p>{note}</p> : null}
      </div>
    </article>
  );
}

/** Карточка модели мойки: фото, краткое описание, список размеров и цена. */
export function SinkModelCard({
  name,
  summary,
  rows,
  image
}: {
  name: string;
  summary?: string;
  rows: readonly GuideSpecRow[];
  image?: string;
}) {
  return (
    <article className={styles.edge}>
      <div className={styles.edgeMedia}>
        {image ? <Photo src={image} alt={name} sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : null}
      </div>
      <div className={styles.edgeBody}>
        <h3>{name}</h3>
        {summary ? <p>{summary}</p> : null}
        <dl className={styles.specList}>
          {rows.map((row) => (
            <div key={row.name}>
              <dt>{row.name}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

/** Карточки условий и акций: с меткой («Всегда», дата окончания и т. п.). */
export function PromoCards({ items }: { items: readonly { title: string; text: string; badge: string }[] }) {
  return (
    <div className={clsx(styles.grid, styles["grid--pair"])}>
      {items.map((item) => (
        <article key={item.title} className="info-card">
          <span className={styles.badge}>{item.badge}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

export function ReviewCard({
  author,
  role,
  quote,
  rating,
  date
}: {
  author: string;
  role: string;
  quote: string;
  rating: number;
  /** Дата отзыва в ISO; показывается как «6 октября 2026». */
  date?: string;
}) {
  const stars = Math.max(1, Math.min(5, Math.round(rating)));
  const parsed = date ? new Date(date) : null;
  const dateLabel =
    parsed && !Number.isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(parsed)
      : null;
  return (
    <article className={styles.review}>
      <div className={styles.reviewHead}>
        <p className={styles.reviewAuthor}>
          {author}
          {role ? <span> · {role}</span> : null}
          {dateLabel && parsed ? (
            <>
              <br />
              <time dateTime={parsed.toISOString()}>{dateLabel}</time>
            </>
          ) : null}
        </p>
        <p className={styles.stars} role="img" aria-label={`Оценка ${stars} из 5`}>
          {"★".repeat(stars)}
          {"☆".repeat(5 - stars)}
        </p>
      </div>
      <blockquote>{quote}</blockquote>
    </article>
  );
}

export function CertificateCard({ title, issuer, image, alt }: { title: string; issuer: string; image: string; alt: string }) {
  return (
    <figure className={styles.cert}>
      <div className={styles.certMedia}>
        <Photo src={image} alt={alt} sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 25vw" />
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{issuer}</span>
      </figcaption>
    </figure>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export { styles as guideStyles };
