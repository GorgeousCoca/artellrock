/** Постраничный вывод списков: номер страницы из адреса, срез элементов, список номеров для кнопок. */

export type PageSlice<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};

/**
 * Номер страницы из `?page=`. Пусто, не число, ноль и отрицательные значения дают 1.
 * Дробные округляются вниз.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Срез для страницы `page`. Страница за пределами списка не подгоняется: вызывающий решает, что делать (например, 404). */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): PageSlice<T> {
  const pageCount = pageCountFor(items.length, pageSize);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageCount, total: items.length };
}

/**
 * Номера для кнопок. Всё помещается, пока страниц не больше `maxButtons`; иначе остаются первая, последняя,
 * текущая и соседи, а пропуски обозначаются `null` (многоточие).
 */
export function pageButtons(page: number, pageCount: number, maxButtons = 7): (number | null)[] {
  if (pageCount <= maxButtons) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const wanted = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => wanted.add(n));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((n) => wanted.add(n));

  const sorted = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  for (const n of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && n - previous > 1) result.push(null);
    result.push(n);
  }
  return result;
}
