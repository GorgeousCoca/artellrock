/**
 * Импорт характеристик камней из `scripts/data/material-specs.txt` в коллекцию `materials`.
 *
 * Запуск:
 *   npm run import:specs                              — ТОЛЬКО отчёт (dry-run), в БД ничего не пишется;
 *   $env:APPLY=1; npm run import:specs                 — записать, если не найдено = 0 и неоднозначно = 0;
 *   $env:ALLOW_UNMATCHED=1; npm run import:specs       — dry-run, несопоставленные не блокируют;
 *   $env:APPLY=1; $env:ALLOW_UNMATCHED=1; npm run import:specs
 *       — записать сопоставленные и пропустить несопоставленные (они остаются без характеристик).
 *
 * Правила:
 *  - файл разбирает `parseSpecList`, сопоставляет `matchSpecs`; путь можно подменить: `SPECS_FILE`;
 *  - обновляются только `formats`, `thicknessesMm`, `finish`, `shade`, `texture` у сопоставленных материалов;
 *    цены, активность и всё остальное не трогаются; материалов без строки в файле скрипт не меняет;
 *    несопоставленные строки не угадываются и не склеиваются — поля этих камней пустые;
 *  - `thicknessesMm` в Payload хранится строками select hasMany;
 *  - оттенки и фактуры пишутся через « / » в порядке файла; повторно массив сравнивается как множество;
 *  - неоднозначность блокирует запись всегда;
 *  - несопоставленные блокируют запись, пока нет `ALLOW_UNMATCHED=1` (`specImportBlocked`).
 *    С этой переменной полный список несопоставленных всё равно печатается, а перед записью —
 *    «ВНИМАНИЕ: N строк файла не сопоставлены и пропущены».
 *
 * Кэш сайта сбрасывает `flushSiteCache`. Если не получилось — сообщение печатается, молча не глотается.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { materialKey, type MaterialLike } from "../src/lib/catalog/identity";
import { isPriceStepMultiple } from "../src/lib/calculator/price-rounding";
import { matchSpecs, specImportBlocked, type SpecProblem } from "../src/lib/import/spec-match";
import { parseSpecList, SpecListError, type SpecRow } from "../src/lib/import/spec-list";
import { splitTags, type StoneFinish, type StoneFormat } from "../src/lib/calculator/taxonomy";
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

type ThicknessCode = "12" | "15" | "20" | "30";

type DbMaterial = MaterialLike & {
  pricePerSqm: number;
  isActive: boolean;
  formats: string[];
  thicknessesMm: string[];
  finish: string | null;
  shade: string | null;
  texture: string | null;
};

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const a = new Set(left);
  const b = new Set(right);
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function thicknessCodes(values: readonly number[]): ThicknessCode[] {
  return values.map((value) => {
    const text = String(value);
    if (text !== "12" && text !== "15" && text !== "20" && text !== "30") {
      throw new Error(`Толщина ${value} мм не из словаря Payload`);
    }
    return text;
  });
}

function hasSpecs(material: DbMaterial): boolean {
  return (
    material.formats.length > 0 ||
    material.thicknessesMm.length > 0 ||
    Boolean(material.finish) ||
    splitTags(material.shade).length > 0 ||
    splitTags(material.texture).length > 0
  );
}

function unchanged(material: DbMaterial, row: SpecRow): boolean {
  return (
    sameSet(material.formats, row.formats) &&
    sameSet(material.thicknessesMm, row.thicknessesMm.map(String)) &&
    (material.finish ?? null) === row.finish &&
    sameSet(splitTags(material.shade), row.shades) &&
    sameSet(splitTags(material.texture), row.textures)
  );
}

function materialLabel(material: MaterialLike): string {
  const name = [material.sku, material.name].filter(Boolean).join(" ");
  return `#${material.id} ${name} [${materialKey(material)}]`;
}

function printProblem(problem: SpecProblem) {
  console.log(`  строка ${problem.row.line} [${problem.row.brand}] ${problem.row.title} — ${problem.reason}`);
  if (problem.candidates.length > 0) {
    console.log(`      кандидаты: ${problem.candidates.map(materialLabel).join("; ")}`);
  }
  const polish = problem.row.finish === "matte" ? "матовый" : problem.row.finish === "polished" ? "полированный" : "не указана";
  if (problem.polishHints.length > 0) {
    console.log(`      по полировке «${polish}» (только справка): ${problem.polishHints.map(materialLabel).join("; ")}`);
  }
}

function distinct(rows: readonly SpecRow[]): string {
  const formats = new Set<StoneFormat>();
  const thicknesses = new Set<number>();
  const finishes = new Set<StoneFinish>();
  const shades = new Set<string>();
  const textures = new Set<string>();
  for (const row of rows) {
    for (const format of row.formats) formats.add(format);
    for (const mm of row.thicknessesMm) thicknesses.add(mm);
    if (row.finish) finishes.add(row.finish);
    for (const shade of row.shades) shades.add(shade);
    for (const texture of row.textures) textures.add(texture);
  }
  const join = (values: Iterable<string | number>) => [...values].join(", ") || "—";
  return [
    `  форматы: ${join(formats)}`,
    `  толщины, мм: ${join([...thicknesses].sort((a, b) => a - b))}`,
    `  полировка: ${join(finishes)}`,
    `  оттенки: ${join([...shades].sort((a, b) => a.localeCompare(b, "ru")))}`,
    `  фактуры: ${join([...textures].sort((a, b) => a.localeCompare(b, "ru")))}`
  ].join("\n");
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const file = path.resolve(process.cwd(), process.env.SPECS_FILE ?? "scripts/data/material-specs.txt");

  let list;
  try {
    list = parseSpecList(readFileSync(file, "utf8"));
  } catch (error) {
    if (error instanceof SpecListError) {
      console.error(`Файл характеристик не разобран, остановка.\n${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  const payload = await getPayload({ config });
  const found = await payload.find({
    collection: "materials",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true
  });
  const materials: DbMaterial[] = found.docs.map((doc) => ({
    id: doc.id,
    brand: doc.brand,
    name: doc.name,
    sku: doc.sku,
    pricePerSqm: doc.pricePerSqm ?? 0,
    isActive: Boolean(doc.isActive),
    formats: asStrings(doc.formats),
    thicknessesMm: asStrings(doc.thicknessesMm),
    finish: typeof doc.finish === "string" ? doc.finish : null,
    shade: doc.shade ?? null,
    texture: doc.texture ?? null
  }));
  const dbById = new Map(materials.map((material) => [String(material.id), material]));

  const match = matchSpecs(list.rows, materials);
  const matchedIds = new Set(match.matched.map((hit) => String(hit.material.id)));

  console.log(`Режим: ${apply ? "ЗАПИСЬ (APPLY=1)" : "dry-run (в БД ничего не пишется)"}`);
  console.log(`Файл: ${file}`);
  console.log(`Материалов в БД: ${materials.length}; строк в файле: ${list.rows.length}`);
  console.log(
    `Активных: ${materials.filter((material) => material.isActive).length}; цен не кратных 250: ${
      materials.filter((material) => !isPriceStepMultiple(material.pricePerSqm)).length
    }`
  );
  console.log(`Уже с какими-либо характеристиками: ${materials.filter(hasSpecs).length}\n`);

  console.log("По брендам (файл | сопоставлено | в БД всего | с характеристиками после импорта):");
  for (const brand of list.brands) {
    const total = list.rows.filter((row) => row.brand === brand).length;
    const ok = match.matched.filter((hit) => hit.row.brand === brand).length;
    const inDb = materials.filter((material) => material.brand === brand);
    const withSpecs = inDb.filter((material) => matchedIds.has(String(material.id)) || hasSpecs(material)).length;
    console.log(
      `  ${brand.padEnd(16)} файл ${String(total).padStart(3)} | сопоставлено ${String(ok).padStart(3)} | в БД ${String(inDb.length).padStart(3)} | с характеристиками ${String(withSpecs).padStart(3)}`
    );
  }

  const via = (kind: "key" | "sku" | "article") => match.matched.filter((hit) => hit.via === kind).length;
  console.log(`\nВсего строк: ${list.rows.length}`);
  console.log(`Сопоставлено: ${match.matched.length} (по названию ${via("key")}, по артикулу кириллица/транслит ${via("sku")}, по голому артикулу ${via("article")})`);
  console.log(`Не найдено: ${match.notFound.length}`);
  console.log(`Неоднозначно: ${match.ambiguous.length}`);

  const warnings = list.rows.filter((row) => row.warnings.length > 0);
  console.log(`\nПредупреждения парсера: ${warnings.length}`);
  for (const row of warnings) {
    for (const warning of row.warnings) console.log(`  строка ${row.line} [${row.brand}] ${row.title}: ${warning}`);
  }

  console.log(`\nНесопоставленные (${match.notFound.length}):`);
  for (const problem of match.notFound) printProblem(problem);
  console.log(`\nНеоднозначные (${match.ambiguous.length}):`);
  for (const problem of match.ambiguous) printProblem(problem);

  const withoutSpecs = materials.filter((material) => !matchedIds.has(String(material.id)) && !hasSpecs(material)).length;
  console.log(`\nМатериалов без характеристик после импорта: ${withoutSpecs}`);
  console.log("Различные значения в файле:");
  console.log(distinct(list.rows));

  const changes = match.matched.filter((hit) => {
    const db = dbById.get(String(hit.material.id));
    return db ? !unchanged(db, hit.row) : true;
  });
  console.log(`\nК изменению: ${changes.length} из ${match.matched.length} (остальные уже совпадают)`);

  const finishGap = match.matched.filter((hit) => {
    const db = dbById.get(String(hit.material.id));
    if (!db) return false;
    const nameHasMat = materialKey(db).split(" ").includes("mat");
    return (hit.row.finish === "matte") !== nameHasMat;
  });
  console.log(`Сопоставлено, но полировка файла и мат-токен названия в БД расходятся: ${finishGap.length}`);
  for (const hit of finishGap) {
    console.log(`  строка ${hit.row.line} [${hit.row.brand}] ${hit.row.title} → ${materialLabel(hit.material)} | полировка ${hit.row.finish}`);
  }

  const allowUnmatched = process.env.ALLOW_UNMATCHED === "1";
  if (specImportBlocked(match.notFound.length, match.ambiguous.length, allowUnmatched)) {
    const tail =
      match.ambiguous.length > 0
        ? "Неоднозначность блокирует запись всегда, ALLOW_UNMATCHED это не снимает."
        : "Чтобы пропустить несопоставленные и записать остальные: $env:ALLOW_UNMATCHED=1";
    console.error(
      `\nОСТАНОВКА: не найдено ${match.notFound.length}, неоднозначно ${match.ambiguous.length}. Запись не выполняется. ${tail}`
    );
    process.exit(1);
  }

  if (!apply) {
    console.log(
      match.notFound.length > 0
        ? `\nDry-run завершён. Несопоставленные (${match.notFound.length}) при записи с ALLOW_UNMATCHED=1 будут пропущены.`
        : "\nDry-run завершён, всё сопоставилось. Для записи: $env:APPLY=1; npm run import:specs"
    );
    return;
  }

  if (match.notFound.length > 0) {
    console.log(`\nВНИМАНИЕ: ${match.notFound.length} строк файла не сопоставлены и пропущены`);
  }

  let updated = 0;
  for (const hit of changes) {
    if (!hit.row.finish) throw new Error(`Строка ${hit.row.line}: нет полировки, запись остановлена`);
    const db = dbById.get(String(hit.material.id));
    if (!db) throw new Error(`Материал #${hit.material.id} пропал перед записью`);
    await payload.update({
      collection: "materials",
      id: db.id,
      data: {
        formats: hit.row.formats,
        thicknessesMm: thicknessCodes(hit.row.thicknessesMm),
        finish: hit.row.finish,
        shade: hit.row.shades.join(" / "),
        texture: hit.row.textures.join(" / ")
      },
      depth: 0,
      overrideAccess: true,
      context: { [SKIP_REVALIDATE_CONTEXT]: true }
    });
    updated += 1;
  }
  console.log(`\nЗаписано: ${updated}; без изменений: ${match.matched.length - updated}.`);
  console.log(updated > 0 ? await flushSiteCache() : "Изменений не было — кэш не трогаем.");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
