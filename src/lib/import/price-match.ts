/**
 * Сопоставление «строка прайса ↔ материал в БД». Чистая функция: БД не читает, пишет только результат.
 *
 * Названия в прайсе и в БД не совпадают буквально, поэтому обе стороны приводятся к ключу (`normalizeTitle`):
 *  - регистр не важен («BQ 8926» = «Bq 8926»);
 *  - признаки матовости «(Мат)», «(матовый)», «Matt», «Matovyy» -> один токен `mat`. Токен НЕ выбрасывается:
 *    матовый и глянцевый варианты — разные позиции с разной ценой;
 *  - «(5мм)» = «5mm»;
 *  - скобки не мешают, остальные слова сравниваются как есть (опечатки исходных названий «Charocal», «Virtrum»
 *    не исправляются: в БД и на сайте они в том же виде, прайс ничего не переименовывает).
 *
 * Ключ БД строится из `артикул + название` целиком, поэтому не важно, как `seed-materials` разрезал строку на
 * артикул и название, и у брендов без артикула (Smart Quartz, Technistone) работает тот же ключ — по названию.
 * У Belenco артикул не уникален («1010 Premium White» и «1010 Premium White Seta»), поэтому ключ — артикул ПЛЮС
 * остаток названия, а не артикул один.
 *
 * Исключение — бренды, у которых название в прайсе кириллицей, а в БД транслитом и восстановить написание нельзя
 * («Калакатта Вивье» ↔ «Kalakatta Vive Print»): они сопоставляются по артикулу, если он уникален в бренде
 * и в прайсе, и в БД.
 *
 * Неоднозначность — это ошибка, а не повод угадывать: такая строка попадает в `ambiguous`, запись не выполняется.
 */
import {
  firstToken,
  groupBy,
  hasMat,
  materialKey,
  normalizeTitle,
  SKU_MATCHED_BRANDS,
  type MaterialLike
} from "@/lib/catalog/identity";
import type { PriceRow } from "./price-list";

export type MatchedPrice = { row: PriceRow; material: MaterialLike; via: "key" | "sku" };
export type MatchProblem = { row: PriceRow; reason: string; candidates: MaterialLike[] };

export type MatchResult = {
  matched: MatchedPrice[];
  /** В БД ничего подходящего. */
  notFound: MatchProblem[];
  /** Подходит несколько записей, либо ключ повторяется в прайсе, либо противоречат признаки. */
  ambiguous: MatchProblem[];
  /** Материалы брендов из прайса, для которых в прайсе не нашлось ни одной строки. */
  unusedMaterials: MaterialLike[];
  /** Бренды прайса, которых нет в БД вообще. */
  missingBrands: string[];
};

export function matchPrices(
  rows: readonly PriceRow[],
  materials: readonly MaterialLike[],
  options: { skuBrands?: readonly string[] } = {}
): MatchResult {
  const skuBrands = new Set(options.skuBrands ?? SKU_MATCHED_BRANDS);
  const result: MatchResult = { matched: [], notFound: [], ambiguous: [], unusedMaterials: [], missingBrands: [] };
  const used = new Set<MaterialLike>();

  const rowsByBrand = groupBy([...rows], (row) => row.brand);
  const materialsByBrand = groupBy([...materials], (material) => material.brand);

  for (const [brand, brandRows] of rowsByBrand) {
    const brandMaterials = materialsByBrand.get(brand) ?? [];
    if (brandMaterials.length === 0) result.missingBrands.push(brand);

    const bySku = skuBrands.has(brand);
    // Ключ сопоставления: артикул (первый токен названия в прайсе / поле sku в БД) или ключ целиком.
    const rowKey = (row: PriceRow) => (bySku ? firstToken(normalizeTitle(row.title)) : normalizeTitle(row.title));
    const materialMatchKey = (material: MaterialLike) =>
      bySku ? normalizeTitle(material.sku ?? "") : materialKey(material);

    const rowGroups = groupBy(brandRows, rowKey);
    // У материала без артикула в sku-бренде ключа нет: сопоставить его нечем.
    const materialGroups = groupBy(
      brandMaterials.filter((material) => materialMatchKey(material) !== ""),
      materialMatchKey
    );

    for (const row of brandRows) {
      const key = rowKey(row);
      const sameRows = rowGroups.get(key) ?? [];
      const candidates = materialGroups.get(key) ?? [];
      const what = bySku ? `артикул «${key}»` : `название «${key}»`;

      if (sameRows.length > 1) {
        result.ambiguous.push({ row, reason: `${what} повторяется в прайсе (${sameRows.length} раза)`, candidates });
        continue;
      }
      if (candidates.length === 0) {
        result.notFound.push({ row, reason: `в БД нет записи: ${what}`, candidates });
        continue;
      }
      if (candidates.length > 1) {
        result.ambiguous.push({ row, reason: `${what}: в БД ${candidates.length} подходящих записи`, candidates });
        continue;
      }

      const [material] = candidates;
      // По артикулу название не сверяется, зато матовость обязана совпасть: «R104» и «RM104» — разные позиции.
      if (bySku && hasMat(normalizeTitle(row.title)) !== hasMat(normalizeTitle(material.name))) {
        result.ambiguous.push({ row, reason: `${what}: признак матовости в прайсе и в БД не совпадает`, candidates });
        continue;
      }

      used.add(material);
      result.matched.push({ row, material, via: bySku ? "sku" : "key" });
    }

    for (const material of brandMaterials) {
      if (!used.has(material)) result.unusedMaterials.push(material);
    }
  }

  return result;
}
