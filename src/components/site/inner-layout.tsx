import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SectionHead } from "@/components/site/section-head";
import { steps } from "@/content/artellrock";

import styles from "./inner-layout.module.scss";

type CardItem = { title: string; text: string };

function Cards({
  items,
  numbered,
  className
}: {
  items: readonly CardItem[];
  numbered: boolean;
  className: string;
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <article key={item.title} className={styles.card}>
          {numbered ? (
            <span className={styles.index} aria-hidden="true">
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

/** Пять карточек: три сверху уже, две снизу шире. */
export function BentoFive({ items, numbered = false }: { items: readonly CardItem[]; numbered?: boolean }) {
  return <Cards items={items} numbered={numbered} className={styles.bento} />;
}

/** Карточки в два столбца. */
export function CardGrid({ items, numbered = false }: { items: readonly CardItem[]; numbered?: boolean }) {
  return <Cards items={items} numbered={numbered} className={styles.pair} />;
}

/** Список пунктов как плашки с иконками. Иконка только украшает, текст пункта не меняется. */
export function ChecklistTiles({ items, icons }: { items: readonly string[]; icons: readonly LucideIcon[] }) {
  return (
    <ul className={styles.tiles}>
      {items.map((item, index) => {
        const Icon = icons[index];
        return (
          <li key={item} className={styles.tile}>
            {Icon ? <Icon size={26} strokeWidth={1.75} aria-hidden="true" /> : null}
            <p>{item}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** Крупные цифры и короткие подписи. */
export function StatRow({ items }: { items: readonly { value: string; label: string }[] }) {
  return (
    <ul className={styles.stats}>
      {items.map((item) => (
        <li key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Слева заголовок, справа содержимое. */
export function Split({
  id,
  title,
  lead,
  children
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className={`page block ${styles.split}`} aria-labelledby={id}>
      <div className={styles.splitCopy}>
        <h2 id={id} className="t-display-md">
          {title}
        </h2>
        {lead ? <p>{lead}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

export function AsideNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}

/** Ссылки в несколько колонок. Вся плашка — ссылка. */
export function LinkGrid({ items }: { items: readonly { href: string; label: string }[] }) {
  return (
    <div className={styles.linkGrid}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.linkCard}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
export function LinkBento({ items }: { items: readonly { href: string; label: string }[] }) {
  return (
    <div className={styles.bento}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.linkCard}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Полоса в конце раздела: текст и кнопки в одном блоке. */
export function ActionPanel({ id, title, text, children }: { id: string; title: string; text?: string; children: ReactNode }) {
  return (
    <section className="page block" aria-labelledby={id}>
      <div className={styles.panel}>
        <div>
          <h2 id={id} className="t-display-md">
            {title}
          </h2>
          {text ? <p>{text}</p> : null}
        </div>
        <div className={styles.panelActions}>{children}</div>
      </div>
    </section>
  );
}

/** Пять этапов заказа на внутренних страницах. На главной остаётся прежний ряд. */
export function InnerSteps() {
  return (
    <section id="kak-prohodit-zakaz" className="page block" aria-labelledby="steps-title">
      <SectionHead id="steps-title" title={steps.title} />
      <BentoFive items={steps.items} numbered />
    </section>
  );
}
