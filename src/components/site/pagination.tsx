import clsx from "clsx";
import Link from "next/link";

import { pageButtons } from "@/lib/pagination";

import styles from "./pagination.module.scss";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Путь без номера страницы, например `/otzivy`. Страница 1 ссылается на него же. */
  basePath: string;
  /** Якорь, к которому прокручивается страница после перехода, без `#`. */
  anchor?: string;
  label?: string;
};

function hrefFor(basePath: string, page: number, anchor?: string) {
  const query = page > 1 ? `?page=${page}` : "";
  return `${basePath}${query}${anchor ? `#${anchor}` : ""}`;
}

/** Переключатель страниц: «Назад», номера и «Вперёд». Обычные ссылки, работает без JavaScript. */
export function Pagination({ page, pageCount, basePath, anchor, label = "Страницы" }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label={label}>
      {page > 1 ? (
        <Link className={clsx(styles.item, styles.step)} href={hrefFor(basePath, page - 1, anchor)} rel="prev">
          Назад
        </Link>
      ) : (
        <span className={clsx(styles.item, styles.step, styles.disabled)} aria-hidden>
          Назад
        </span>
      )}

      <ol className={styles.list}>
        {pageButtons(page, pageCount).map((number, index) =>
          number === null ? (
            <li key={`gap-${index}`} className={styles.gap} aria-hidden>
              …
            </li>
          ) : (
            <li key={number}>
              <Link
                className={clsx(styles.item, number === page && styles.current)}
                href={hrefFor(basePath, number, anchor)}
                aria-label={`Страница ${number}`}
                aria-current={number === page ? "page" : undefined}
              >
                {number}
              </Link>
            </li>
          )
        )}
      </ol>

      {page < pageCount ? (
        <Link className={clsx(styles.item, styles.step)} href={hrefFor(basePath, page + 1, anchor)} rel="next">
          Вперёд
        </Link>
      ) : (
        <span className={clsx(styles.item, styles.step, styles.disabled)} aria-hidden>
          Вперёд
        </span>
      )}
    </nav>
  );
}
