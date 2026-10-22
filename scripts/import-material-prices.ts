/**
 * Импорт цен камней из прайса (`scripts/data/material-prices.txt`) в коллекцию `materials`.
 *
 * Запуск:
 *   npm run import:prices              — ТОЛЬКО отчёт (dry-run), в БД ничего не пишется;
 *   $env:APPLY=1; npm run import:prices — записать цены.
 *
 * Правила:
 *  - цены берутся из файла парсером (`parsePriceList`), в коде их нет; файл можно подменить: `PRICES_FILE=путь`;
 *  - перед сравнением и записью цена файла округляется до 250 ₽ (`roundToPriceStep`); в отчёте — сколько
 *    округлено, максимальное отклонение и топ-5;
 *  - создаёт и удаляет НИЧЕГО: обновляются только существующие материалы (`pricePerSqm`, `isActive`);
 *  - цена > 0 → `isActive = true`; цена 0 → материал выключается (в калькулятор не попадает);
 *  - сопоставление — `price-match.ts` (регистр, «мат»/«matt», «(5мм)» = «5mm», Avant Quartz и Avarus — по артикулу);
 *    любая неоднозначность или несопоставленная строка — ошибка, запись не начинается;
 *  - идемпотентен: если цена и активность уже совпадают, строка не трогается.
 *
 * Кэш сайта сбрасывает `flushSiteCache` (`scripts/lib/site-cache.ts`): логин и `POST /api/materials/revalidate-cache`.
 * Если не получилось — скрипт честно пишет об этом: калькулятор обновится сам не позже чем через час.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { materialKey, normalizeTitle, type MaterialLike } from "../src/lib/catalog/identity";
import { matchPrices } from "../src/lib/import/price-match";
import { parsePriceList, PriceListError, type PriceRow } from "../src/lib/import/price-list";
import { roundToPriceStep } from "../src/lib/calculator/price-rounding";
import { changePercent, LARGE_CHANGE_PERCENT } from "../src/lib/calculator/stone-prices";
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

type DbMaterial = MaterialLike & { pricePerSqm: number; isActive: boolean };

function roundRows(rows: PriceRow[]): { rows: PriceRow[]; rounded: Array<{ row: PriceRow; from: number; to: number }> } {
  const rounded: Array<{ row: PriceRow; from: number; to: number }> = [];
  const next = rows.map((row) => {
    const price = roundToPriceStep(row.price);
    if (price === row.price) return row;
    const updated = { ...row, price };
    rounded.push({ row: updated, from: row.price, to: price });
    return updated;
  });
  return { rows: next, rounded };
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const file = path.resolve(process.cwd(), process.env.PRICES_FILE ?? "scripts/data/material-prices.txt");

  let list;
  try {
    list = parsePriceList(readFileSync(file, "utf8"));
  } catch (error) {
    if (error instanceof PriceListError) {
      console.error(`Прайс не разобран, остановка.\n${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  const { rows, rounded } = roundRows(list.rows);
  const maxDelta = rounded.reduce((max, item) => Math.max(max, Math.abs(item.to - item.from)), 0);
  console.log(`Округлено до 250 ₽: ${rounded.length} из ${rows.length}`);
  console.log(`Максимальное отклонение: ${fmt(maxDelta)}`);
  const top = [...rounded].sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from) || a.row.line - b.row.line).slice(0, 5);
  if (top.length > 0) {
    console.log("Топ-5 отклонений:");
    for (const item of top) {
      console.log(`  строка ${item.row.line} [${item.row.brand}] ${item.row.title}: ${fmt(item.from)} → ${fmt(item.to)}`);
    }
  }
  console.log("");

  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "materials", limit: 0, pagination: false, depth: 0, overrideAccess: true });
  const materials: DbMaterial[] = found.docs.map((doc) => ({
    id: doc.id,
    brand: doc.brand,
    name: doc.name,
    sku: doc.sku,
    pricePerSqm: doc.pricePerSqm ?? 0,
    isActive: Boolean(doc.isActive)
  }));
  const dbById = new Map(materials.map((material) => [material.id, material]));

  const match = matchPrices(rows, materials);

  // ---- отчёт ----
  console.log(`Режим: ${apply ? "ЗАПИСЬ (APPLY=1)" : "dry-run (в БД ничего не пишется)"}`);
  console.log(`Файл: ${file}`);
  console.log(`Материалов в БД: ${materials.length}; строк в прайсе: ${list.rows.length}\n`);

  console.log("Строк в прайсе по брендам:");
  for (const brand of list.brands) {
    const total = rows.filter((row) => row.brand === brand).length;
    const ok = match.matched.filter((entry) => entry.row.brand === brand).length;
    const inDb = materials.filter((material) => material.brand === brand).length;
    console.log(`  ${brand.padEnd(18)} прайс ${String(total).padStart(3)} | сопоставлено ${String(ok).padStart(3)} | в БД ${String(inDb).padStart(3)}`);
  }

  console.log(`\nСопоставлено: ${match.matched.length}/${rows.length}`);
  console.log(`Не найдено: ${match.notFound.length}`);
  console.log(`Неоднозначно: ${match.ambiguous.length}`);
  console.log(`Бренды прайса, которых нет в БД: ${match.missingBrands.length}${match.missingBrands.length ? ` (${match.missingBrands.join(", ")})` : ""}`);
  console.log(`Материалы в БД без строки в прайсе: ${match.unusedMaterials.length}`);

  const describe = (problem: (typeof match.notFound)[number]) =>
    `  строка ${problem.row.line} [${problem.row.brand}] ${problem.row.title} — ${problem.reason}` +
    (problem.candidates.length ? `\n      кандидаты: ${problem.candidates.map((c) => `#${c.id} ${[c.sku, c.name].filter(Boolean).join(" ")}`).join("; ")}` : "");
  for (const problem of match.notFound) console.log(describe(problem));
  for (const problem of match.ambiguous) console.log(describe(problem));
  for (const material of match.unusedMaterials) {
    console.log(`  нет в прайсе: #${material.id} [${material.brand}] ${[material.sku, material.name].filter(Boolean).join(" ")}`);
  }

  // Расхождения: при совпадении по артикулу название в прайсе и в БД может отличаться — покажем, не гадая.
  const discrepancies = match.matched.filter((entry) => entry.via === "sku" && materialKey(entry.material) !== normalizeTitle(entry.row.title));
  console.log(`\nСопоставлено по артикулу (Avant Quartz, Avarus): ${match.matched.filter((entry) => entry.via === "sku").length}`);
  console.log(`  из них название в прайсе отличается от БД: ${discrepancies.length}`);
  for (const entry of discrepancies.slice(0, 5)) {
    console.log(`    прайс «${entry.row.title}» ↔ БД «${[entry.material.sku, entry.material.name].filter(Boolean).join(" ")}»`);
  }

  const prices = rows.map((row) => row.price);
  const positive = prices.filter((price) => price > 0);
  console.log(`\nЦены в прайсе: мин ${positive.length ? fmt(Math.min(...positive)) : "—"}, макс ${prices.length ? fmt(Math.max(...prices)) : "—"}; нулевых: ${prices.length - positive.length}`);

  // Изменения относительно БД.
  const changes = match.matched
    .map(({ row, material }) => {
      const db = dbById.get(material.id)!;
      const newActive = row.price > 0;
      return { row, db, newActive, changed: db.pricePerSqm !== row.price || db.isActive !== newActive };
    })
    .filter((entry) => entry.changed);
  const large = changes.filter((entry) => {
    const percent = changePercent(entry.db.pricePerSqm, entry.row.price);
    return percent !== null && Math.abs(percent) > LARGE_CHANGE_PERCENT;
  });
  console.log(`К изменению: ${changes.length} из ${match.matched.length} (остальные уже совпадают)`);
  console.log(`Изменения цены больше ${LARGE_CHANGE_PERCENT}% относительно БД: ${large.length}`);
  for (const entry of large.slice(0, 20)) {
    console.log(`  [${entry.row.brand}] ${entry.row.title}: ${fmt(entry.db.pricePerSqm)} → ${fmt(entry.row.price)}`);
  }

  const blockers = match.notFound.length + match.ambiguous.length + match.missingBrands.length + match.unusedMaterials.length;
  if (blockers > 0) {
    console.error(`\nОСТАНОВКА: есть несопоставленные/неоднозначные позиции (${blockers}). Запись невозможна, пока их нет — исправьте прайс или данные.`);
    process.exit(1);
  }

  if (!apply) {
    console.log("\nDry-run завершён, всё сопоставилось. Для записи: $env:APPLY=1; npm run import:prices");
    return;
  }

  // ---- запись ----
  let updated = 0;
  for (const entry of changes) {
    await payload.update({
      collection: "materials",
      id: entry.db.id,
      data: { pricePerSqm: entry.row.price, isActive: entry.newActive },
      depth: 0,
      overrideAccess: true,
      context: { [SKIP_REVALIDATE_CONTEXT]: true }
    });
    updated += 1;
  }
  console.log(`\nЗаписано: ${updated}; без изменений: ${match.matched.length - updated}.`);
  console.log(updated > 0 ? await flushSiteCache() : "Изменений не было — кэш не трогаем.");
}

// `payload run` завершает процесс сразу после импорта модуля — ждём выполнения через top-level await.
try {
  await main();
  // Без process.exit(0): на Windows он после fetch иногда роняет Node (libuv assertion); payload run завершит процесс сам.
} catch (error) {
  console.error(error);
  process.exit(1);
}
