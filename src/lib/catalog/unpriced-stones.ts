/**
 * Какие камни без цены можно убрать, не задев позиции с ценой.
 *
 * Материал без цены — `pricePerSqm` не больше 0. Такой удаляется из базы.
 * Карточка каталога остаётся, только если после этого удаления у неё всё ещё есть цена:
 * активный материал с ценой больше 0. Если нулевая запись заслоняла платную (одна картинка),
 * карточка остаётся и начинает показывать цену.
 *
 * Если у камня, у которого цена уже была, цена пропадёт или изменится — план блокируется
 * и ничего удалять нельзя.
 */
import { catalogRefForStone, type StoneRecord } from "@/content/stone-catalog";
import { joinBrandDecors, type QuartzMaterialRef } from "@/lib/catalog/quartz-match";

export type UnpricedBrand = {
  name: string;
  slug: string;
  decors: readonly { name: string; image: string }[];
};

export type UnpricedPlan = {
  dropMaterialIds: Array<number | string>;
  dropStoneKeys: string[];
  keptStones: number;
  blocked: string[];
};

function stoneKey(stone: Pick<StoneRecord, "brandSlug" | "slug">) {
  return `${stone.brandSlug}/${stone.slug}`;
}

function displayedPrices(
  brands: readonly UnpricedBrand[],
  stones: readonly StoneRecord[],
  materials: readonly QuartzMaterialRef[]
): Map<string, number | null> {
  const prices = new Map<string, number | null>();
  const byBrand = new Map<string, StoneRecord[]>();

  for (const stone of stones) {
    const list = byBrand.get(stone.brandSlug);
    if (list) list.push(stone);
    else byBrand.set(stone.brandSlug, [stone]);
    prices.set(stoneKey(stone), null);
  }

  for (const brand of brands) {
    const own = byBrand.get(brand.slug);
    if (!own || own.length === 0) continue;
    const joined = joinBrandDecors(
      brand.name,
      own.map((stone) => catalogRefForStone(stone, brand.decors)),
      materials
    );
    own.forEach((stone, index) => {
      prices.set(stoneKey(stone), joined[index]?.price ?? null);
    });
  }

  return prices;
}

export function planUnpricedRemoval(
  brands: readonly UnpricedBrand[],
  stones: readonly StoneRecord[],
  materials: readonly QuartzMaterialRef[]
): UnpricedPlan {
  const before = displayedPrices(brands, stones, materials);
  const keptMaterials = materials.filter((material) => material.pricePerSqm > 0);
  const after = displayedPrices(brands, stones, keptMaterials);
  const blocked: string[] = [];

  for (const stone of stones) {
    const key = stoneKey(stone);
    const price = before.get(key);
    if (price == null || price <= 0) continue;
    if (after.get(key) !== price) blocked.push(`${key}: ${price} → ${after.get(key) ?? "нет"}`);
  }

  const dropStoneKeys = stones
    .filter((stone) => {
      const price = after.get(stoneKey(stone));
      return price == null || price <= 0;
    })
    .map(stoneKey);

  return {
    dropMaterialIds: materials.filter((material) => !(material.pricePerSqm > 0)).map((material) => material.id),
    dropStoneKeys,
    keptStones: stones.length - dropStoneKeys.length,
    blocked
  };
}
