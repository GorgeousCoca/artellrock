/**
 * Сверка каталога камня (`src/content/stone-catalog.json`) с коллекцией `materials`.
 *
 * Запуск:
 *   npm run sync:stones              — только отчёт, база не меняется;
 *   $env:APPLY=1; npm run sync:stones — записать.
 *
 * Что пишет:
 *   - кадр материала становится первым кадром витрины (`/images/stones/…`);
 *   - пустые оттенок, полировка, формат, толщина и размер слэба добираются из каталога;
 *   - камня нет в базе — создаётся выключенным, с ценой 0.
 *
 * Цену, флаг «Показывать в калькуляторе» и уже заполненные характеристики не меняет.
 * Лишние материалы не удаляет. Неоднозначные пары пропускает.
 * Повторный запуск ничего не пишет, если расхождений не осталось.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";
import { catalogRefForStone, stoneCatalog, type StoneRecord } from "../src/content/stone-catalog";
import { planStoneSync, type SyncMaterial, type SyncStone } from "../src/lib/catalog/stone-sync";
import { SKIP_REVALIDATE_CONTEXT } from "../src/payload/hooks/revalidate";
import type { Material } from "../src/payload-types";
import { flushSiteCache } from "./lib/site-cache";

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

function characteristic(stone: StoneRecord, title: string): string {
  return stone.characteristics.find((item) => item.title === title)?.value.trim() ?? "";
}

/** «3200 х 1600 мм» → большая сторона как длина. Мелкие числа (толщина) не берём. */
function slabSize(value: string): { length: number; width: number } | undefined {
  const numbers = [...value.matchAll(/(\d{3,4})/g)].map((match) => Number(match[1])).filter((n) => n >= 1000);
  if (numbers.length < 2) return undefined;
  const [a, b] = numbers;
  return a >= b ? { length: a, width: b } : { length: b, width: a };
}

function heroReady(urlPath: string): boolean {
  if (!urlPath.startsWith("/images/stones/")) return false;
  const relative = urlPath.replace(/^\//, "").split("/").join(path.sep);
  return existsSync(path.join(process.cwd(), "public", relative));
}

function toSyncMaterial(doc: Material): SyncMaterial {
  return {
    id: doc.id,
    brand: doc.brand,
    name: doc.name,
    sku: doc.sku,
    image: doc.image,
    shade: doc.shade,
    finish: doc.finish,
    formats: doc.formats,
    thicknessesMm: doc.thicknessesMm,
    sheetLengthMm: doc.sheetLengthMm,
    sheetWidthMm: doc.sheetWidthMm
  };
}

function toSyncStone(stone: StoneRecord, sortOrder: number): SyncStone | undefined {
  const brand = quartzBrands.find((item) => item.slug === stone.brandSlug);
  if (!brand) return undefined;
  const ref = catalogRefForStone(stone, brand.decors);
  const sheet = slabSize(characteristic(stone, "Размер слэба"));
  return {
    brandName: brand.name,
    name: stone.name,
    sku: stone.sku,
    slug: stone.slug,
    sortOrder,
    hero: ref.image,
    heroReady: heroReady(ref.image),
    formats: ref.formats ?? [],
    thicknessesMm: ref.thicknessesMm ?? [],
    finish: ref.finish,
    shades: ref.shades ?? [],
    sheetLengthMm: sheet?.length,
    sheetWidthMm: sheet?.width,
    ref
  };
}

function line(brand: string, sku: string, name: string): string {
  return `  [${brand}] ${[sku, name].filter(Boolean).join(" ")}`;
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "materials", limit: 0, pagination: false, depth: 0 });

  const order = new Map<string, number>();
  const stones: SyncStone[] = [];
  const unknownBrands = new Set<string>();
  for (const stone of stoneCatalog) {
    const index = order.get(stone.brandSlug) ?? 0;
    order.set(stone.brandSlug, index + 1);
    const syncStone = toSyncStone(stone, index * 10);
    if (syncStone) stones.push(syncStone);
    else unknownBrands.add(stone.brandSlug);
  }

  const fullPlan = planStoneSync(stones, found.docs.map(toSyncMaterial));
  // IMAGES_ONLY=1 — обновить только кадр материала (после смены обложек), без характеристик и новых записей.
  const imagesOnly = process.env.IMAGES_ONLY === "1";
  const plan = imagesOnly
    ? {
        ...fullPlan,
        updates: fullPlan.updates
          .filter((item) => item.patch.image)
          .map((item) => ({ ...item, patch: { image: item.patch.image } })),
        creates: []
      }
    : fullPlan;
  const imageUpdates = plan.updates.filter((item) => item.patch.image).length;
  const specUpdates = plan.updates.filter((item) => Object.keys(item.patch).some((key) => key !== "image")).length;

  console.log(`Камней в каталоге: ${stoneCatalog.length}`);
  console.log(`Материалов в базе: ${found.docs.length} (демо, не трогаем: ${plan.ignoredDemo})`);
  console.log(`Кадр обновится: ${imageUpdates}`);
  console.log(`Пустые характеристики дополнятся: ${specUpdates}`);
  console.log(`Новые материалы (выключены, цена 0): ${plan.creates.length}`);
  console.log(`Неоднозначно, пропуск: ${plan.ambiguous.length}`);
  const tally = (items: Array<{ brand: string }>) => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
      .map(([brand, count]) => `${brand}: ${count}`)
      .join(", ");
  };
  console.log(`В базе нет камня каталога (не удаляем): ${plan.unused.length}`);
  console.log(`Новые по брендам: ${tally(plan.creates) || "—"}`);
  console.log(`Без камня по брендам: ${tally(plan.unused) || "—"}`);
  if (unknownBrands.size > 0) console.log(`Неизвестный бренд каталога: ${[...unknownBrands].join(", ")}`);

  for (const item of plan.creates.slice(0, 25)) console.log(line(item.brand, item.sku ?? "", item.name));
  if (plan.creates.length > 25) console.log(`  … и ещё ${plan.creates.length - 25}`);
  for (const item of plan.ambiguous.slice(0, 25)) console.log(`${line(item.brand, item.sku, item.name)} — ${item.reason}`);
  if (plan.ambiguous.length > 25) console.log(`  … и ещё ${plan.ambiguous.length - 25}`);

  if (!apply) {
    console.log("\nDry-run. Для записи: $env:APPLY=1; npm run sync:stones");
    return;
  }

  let updated = 0;
  for (const item of plan.updates) {
    await payload.update({
      collection: "materials",
      id: item.id,
      data: item.patch,
      depth: 0,
      overrideAccess: true,
      context: { [SKIP_REVALIDATE_CONTEXT]: true }
    });
    updated += 1;
    if (updated % 100 === 0) console.log(`Обновлено ${updated} из ${plan.updates.length}`);
  }

  let created = 0;
  for (const item of plan.creates) {
    await payload.create({
      collection: "materials",
      data: item,
      overrideAccess: true,
      context: { [SKIP_REVALIDATE_CONTEXT]: true }
    });
    created += 1;
    if (created % 50 === 0) console.log(`Создано ${created} из ${plan.creates.length}`);
  }

  console.log(`\nЗаписано. Обновлено: ${updated}. Создано: ${created}.`);
  console.log(updated + created > 0 ? await flushSiteCache() : "Изменений не было — кэш не трогаем.");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
