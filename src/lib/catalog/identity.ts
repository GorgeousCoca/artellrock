/**
 * Тождество материала: единственное место, где решается, «один и тот же ли это камень».
 * Чистые функции, без Next и Payload. На них опираются все сопоставления:
 * витрина каталога (`quartz-match`), сверка с базой (`stone-sync`), импорт прайса и характеристик (`lib/import`),
 * хук уникальности материала в админке.
 *
 * Названия в разных источниках не совпадают буквально, поэтому обе стороны приводятся к ключу (`normalizeTitle`):
 *  - регистр не важен («BQ 8926» = «Bq 8926»);
 *  - признаки матовости «(Мат)», «(матовый)», «Matt», «Matovyy» -> один токен `mat`. Токен НЕ выбрасывается:
 *    матовый и глянцевый варианты — разные позиции с разной ценой;
 *  - «(5мм)» = «5mm»;
 *  - скобки не мешают, остальные слова сравниваются как есть (опечатки исходных названий «Charocal», «Virtrum»
 *    не исправляются: в БД и на сайте они в том же виде).
 *
 * Ключ материала БД строится из `артикул + название` целиком, поэтому не важно, как `seed-materials` разрезал строку
 * на артикул и название, и у брендов без артикула (Smart Quartz, Technistone) работает тот же ключ — по названию.
 * У Belenco артикул не уникален («1010 Premium White» и «1010 Premium White Seta»), поэтому ключ — артикул ПЛЮС
 * остаток названия, а не артикул один.
 *
 * Исключение — бренды, у которых название кириллицей, а в БД транслитом и восстановить написание нельзя
 * («Калакатта Вивье» ↔ «Kalakatta Vive Print»): они сопоставляются по артикулу (`SKU_MATCHED_BRANDS`).
 */

/** Бренды, которые сопоставляются по артикулу (кириллица в источнике против транслита в БД). */
export const SKU_MATCHED_BRANDS: readonly string[] = ["Avant Quartz", "Avarus"];

/** Что нужно знать о материале из БД. */
export type MaterialLike = {
  id: number | string;
  brand: string;
  name: string;
  sku?: string | null;
};

const MAT_TOKENS = new Set(["mat", "matt", "matovyy", "мат", "матовый"]);

/** Нормализованный ключ названия (см. описание модуля). */
export function normalizeTitle(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()]/g, " ")
    // «5мм» -> «5mm». `\b` в JS не знает кириллицу, поэтому граница слова — через lookahead.
    .replace(/(\d+)\s*мм(?![\p{L}\p{N}])/gu, "$1mm")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (MAT_TOKENS.has(token) ? "mat" : token))
    .join(" ");
}

/** Есть ли в ключе токен матовости. */
export const hasMat = (key: string) => key.split(" ").includes("mat");

/** Ключ без токена матовости. */
export const stripMat = (key: string) => key.split(" ").filter((token) => token !== "mat").join(" ");

/** Первое слово ключа (артикул у брендов, сопоставляемых по артикулу). */
export const firstToken = (key: string) => key.split(" ")[0] ?? "";

/** Ключ материала БД: артикул и название вместе. */
export const materialKey = (material: MaterialLike) => normalizeTitle(`${material.sku ?? ""} ${material.name}`);

/** Один бренд у двух названий? Регистр и скобки не важны. */
export const sameBrandName = (left: string, right: string) => normalizeTitle(left) === normalizeTitle(right);

export function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
