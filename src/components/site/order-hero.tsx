import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { FORM_ANCHOR } from "@/content/artellrock";
import type { OrderWay } from "@/content/guides";
import type { BreadcrumbItem } from "@/lib/seo/schema";

import styles from "./order-hero.module.scss";

type OrderHeroProps = {
  title: string;
  subtitle: string;
  lead: string;
  waysTitle: string;
  ways: readonly OrderWay[];
  crumbs: readonly BreadcrumbItem[];
};

/** Начало страницы «Как оформить заказ»: заголовок, подзаголовок, вступление и три способа начать. */
export function OrderHero({ title, subtitle, lead, waysTitle, ways, crumbs }: OrderHeroProps) {
  return (
    <>
      <header className={`page ${styles.head}`}>
        <Breadcrumbs items={crumbs} />
        <h1 className="t-display-lg">{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.lead}>{lead}</p>
      </header>

      <section className={`page ${styles.ways}`} aria-labelledby="order-ways">
        <h2 id="order-ways" className="visually-hidden">
          {waysTitle}
        </h2>
        <ul>
          {ways.map((way) => (
            <li key={way.title}>
              <h3>
                <CircleCheck size={26} strokeWidth={1.75} aria-hidden="true" />
                <span>{way.title}</span>
              </h3>
              <p>{way.text}</p>
              <Link className="btn btn--secondary" href={way.href ?? FORM_ANCHOR}>
                {way.action}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
