/**
 * Удаляет камни без цены из базы и из витрины `stone-catalog.json`.
 *
 * Запуск:
 *   npm run remove:unpriced-stones              — только отчёт;
 *   $env:APPLY=1; npm run remove:unpriced-stones — удалить.
 *
 * Материал с ценой больше 0 не удаляется. Карточка остаётся, если после удаления
 * нулевых записей у неё есть цена. Если у камня с ценой цена изменится — запись не выполняется.
 * Повторный запуск ничего не удаляет.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";
import { stoneCatalog, type StoneRecord } from "../src/content/stone-catalog";
import { planUnpricedRemoval } from "../src/lib/catalog/unpriced-stones";
import type { QuartzMaterialRef } from "../src/lib/catalog/quartz-match";
import { SKIP_REVALIDATE_CONTEXT } from "../src/payload/hooks/revalidate";
import type { Material } from "../src/payload-types";

const CATALOG_PATH = path.resolve(process.cwd(), "src/content/stone-catalog.json");

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // переменные уже заданы окружением
    }
  }
}

function asRef(doc: Material): QuartzMaterialRef {
  return {
    id: doc.id,
    brand: doc.brand,
    name: doc.name,
    sku: doc.sku,
    image: typeof doc.image === "string" ? doc.image : null,
    isActive: doc.isActive === true,
    pricePerSqm: typeof doc.pricePerSqm === "number" && doc.pricePerSqm > 0 ? doc.pricePerSqm : 0,
    formats: [],
    thicknessesMm: [],
    shades: [],
    textures: []
  };
}

loadEnv();

const payload = await getPayload({ config });
const result = await payload.find({
  collection: "materials",
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true
});
const materials = result.docs.map(asRef);
const plan = planUnpricedRemoval(quartzBrands, stoneCatalog, materials);
const dropKeys = new Set(plan.dropStoneKeys);
const kept = stoneCatalog.filter((stone) => !dropKeys.has(`${stone.brandSlug}/${stone.slug}`));
const byBrand = new Map<string, number>();

for (const key of plan.dropStoneKeys) {
  const brand = key.slice(0, key.indexOf("/"));
  byBrand.set(brand, (byBrand.get(brand) ?? 0) + 1);
}

console.log(
  [
    `Материалов в базе: ${materials.length}`,
    `С ценой, остаются: ${materials.length - plan.dropMaterialIds.length}`,
    `Без цены, удалить: ${plan.dropMaterialIds.length}`,
    `Карточек в каталоге: ${stoneCatalog.length}`,
    `Карточек останется: ${plan.keptStones}`,
    `Карточек удалить: ${plan.dropStoneKeys.length}`,
    `Блок: ${plan.blocked.length}`
  ].join("\n")
);

for (const [brand, count] of [...byBrand.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${brand}: ${count}`);
}

if (plan.blocked.length > 0) {
  console.log(plan.blocked.slice(0, 20).join("\n"));
  throw new Error("Удаление остановлено: у камня с ценой цена изменилась бы.");
}

const apply = process.env.APPLY === "1";
if (!apply) {
  console.log("База и каталог не изменены. Для удаления: $env:APPLY=1; npm run remove:unpriced-stones");
} else {
  const pricedIds = new Set(materials.filter((material) => material.pricePerSqm > 0).map((material) => material.id));
  const ids = plan.dropMaterialIds.filter((id) => !pricedIds.has(id));
  if (ids.length !== plan.dropMaterialIds.length) {
    throw new Error("В список удаления попал материал с ценой.");
  }

  writeFileSync(CATALOG_PATH, `${JSON.stringify(kept satisfies StoneRecord[])}\n`, "utf8");

  const context = { [SKIP_REVALIDATE_CONTEXT]: true };
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);
    await payload.delete({
      collection: "materials",
      where: { id: { in: chunk } },
      overrideAccess: true,
      context
    });
  }

  console.log(`Удалено материалов: ${ids.length}. Карточек в каталоге: ${kept.length}.`);
}
