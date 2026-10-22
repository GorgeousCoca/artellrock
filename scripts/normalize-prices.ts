/**
 * Приводит цены справочников калькулятора к шагу 250 ₽.
 *
 * Запуск:
 *   npm run normalize:prices              — ТОЛЬКО отчёт (dry-run), в БД ничего не пишется;
 *   $env:APPLY=1; npm run normalize:prices — округлить и сбросить кэш сайта.
 *
 * Коллекции: materials (pricePerSqm), edges и backsplashes (pricePerMeter), sinks и additional-services (price).
 * Идемпотентен: повторный запуск ничего не меняет. Если у активного материала округление даёт 0,
 * материал выключается (активный материал с ценой 0 валидатор не примет).
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload, type CollectionSlug, type Payload } from "payload";

import config from "../src/payload.config";
import { isPriceStepMultiple, roundToPriceStep } from "../src/lib/calculator/price-rounding";
import { SKIP_REVALIDATE_CONTEXT } from "../src/payload/hooks/revalidate";
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

const rub = new Intl.NumberFormat("ru-RU");
const fmt = (value: number) => `${rub.format(value)} ₽`;

type Target = {
  collection: "materials" | "edges" | "backsplashes" | "sinks" | "additional-services";
  field: "pricePerSqm" | "pricePerMeter" | "price";
};

const TARGETS: Target[] = [
  { collection: "materials", field: "pricePerSqm" },
  { collection: "edges", field: "pricePerMeter" },
  { collection: "backsplashes", field: "pricePerMeter" },
  { collection: "sinks", field: "price" },
  { collection: "additional-services", field: "price" }
];

type Change = {
  collection: Target["collection"];
  id: number | string;
  title: string;
  from: number;
  to: number;
  deactivate: boolean;
};

function titleOf(doc: { name?: string | null; brand?: string | null; sku?: string | null }): string {
  return [doc.brand, doc.sku, doc.name].filter(Boolean).join(" ") || "(без названия)";
}

async function writeChange(payload: Payload, change: Change) {
  const context = { [SKIP_REVALIDATE_CONTEXT]: true };
  const base = { depth: 0 as const, overrideAccess: true as const, context };
  if (change.collection === "materials") {
    await payload.update({
      collection: "materials",
      id: change.id,
      data: change.deactivate ? { pricePerSqm: change.to, isActive: false } : { pricePerSqm: change.to },
      ...base
    });
    return;
  }
  if (change.collection === "edges") {
    await payload.update({ collection: "edges", id: change.id, data: { pricePerMeter: change.to }, ...base });
    return;
  }
  if (change.collection === "backsplashes") {
    await payload.update({ collection: "backsplashes", id: change.id, data: { pricePerMeter: change.to }, ...base });
    return;
  }
  if (change.collection === "sinks") {
    await payload.update({ collection: "sinks", id: change.id, data: { price: change.to }, ...base });
    return;
  }
  await payload.update({ collection: "additional-services", id: change.id, data: { price: change.to }, ...base });
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const payload = await getPayload({ config });

  console.log(`Режим: ${apply ? "ЗАПИСЬ (APPLY=1)" : "dry-run (в БД ничего не пишется)"}`);

  const changes: Change[] = [];
  for (const target of TARGETS) {
    const found = await payload.find({
      collection: target.collection as CollectionSlug,
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true
    });
    const rows: Change[] = [];
    for (const doc of found.docs) {
      const record = doc as { id: number | string; name?: string | null; brand?: string | null; sku?: string | null; isActive?: boolean | null };
      const raw = (doc as unknown as Record<string, unknown>)[target.field];
      const price = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(price) || isPriceStepMultiple(price)) continue;
      const next = roundToPriceStep(price);
      const deactivate = target.collection === "materials" && Boolean(record.isActive) && next === 0;
      rows.push({
        collection: target.collection,
        id: record.id,
        title: titleOf(record),
        from: price,
        to: next,
        deactivate
      });
    }
    changes.push(...rows);
    console.log(`\n${target.collection}: ${rows.length}`);
    for (const row of rows) {
      const note = row.deactivate ? "; выключен из калькулятора (цена округлилась до 0)" : "";
      console.log(`  #${row.id} ${row.title}: ${fmt(row.from)} → ${fmt(row.to)}${note}`);
    }
  }

  console.log(`\nИтого к изменению: ${changes.length}`);
  if (!apply) {
    console.log("Dry-run завершён. Для записи: $env:APPLY=1; npm run normalize:prices");
    return;
  }

  for (const change of changes) await writeChange(payload, change);
  console.log(`Записано: ${changes.length}.`);
  console.log(changes.length > 0 ? await flushSiteCache() : "Изменений не было — кэш не трогаем.");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
