/**
 * Импорт характеристик из исследовательских JSON (`scripts/data/specs-research/*.json`).
 *
 * Запуск:
 *   npm run import:specs:research                  — только отчёт (dry-run), в БД ничего не пишется;
 *   $env:APPLY=1; npm run import:specs:research    — записать.
 *
 * Правила:
 *  - материал ищется по id; если бренд карточки другой — проблема, запись пропускается;
 *  - пишутся только карточки, где сейчас пусты formats, thicknessesMm, finish, shade и texture
 *    (данные владельца и любые уже записанные характеристики не перезаписываются);
 *  - в патч входят только непустые поля записи; пустой массив и null означают «не знаем»;
 *  - цены, isActive и остальные поля не меняются;
 *  - повторный запуск после записи даёт «0 к изменению».
 *
 * Кэш сайта сбрасывает `flushSiteCache`. Если сброс не удался (в том числе вход с 401),
 * скрипт логинится временным `tmp-verify@example.test` и сразу удаляет его.
 * Учётную запись `admin@artellrock.local` скрипт не создаёт, не меняет и не удаляет.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import { isPriceStepMultiple } from "../src/lib/calculator/price-rounding";
import {
  collectResearch,
  materialHasSpecs,
  planResearchImport,
  storedMatchesPatch,
  summarizeResearchPlan,
  type MaterialSpecPatch,
  type PlannedSkip,
  type PlannedUpdate,
  type ResearchSummary,
  type StoredMaterial
} from "../src/lib/import/spec-research";
import { SKIP_REVALIDATE_CONTEXT } from "../src/payload/hooks/revalidate";
import { flushSiteCache } from "./lib/site-cache";

const REAL_ADMIN_EMAIL = "admin@artellrock.local";
const TEMP_ADMIN_EMAIL = "tmp-verify@example.test";

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

type DbMaterial = StoredMaterial & {
  name: string;
  sku: string;
  pricePerSqm: number;
  isActive: boolean;
};

type PriceMark = { pricePerSqm: number; isActive: boolean };

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function loadResearchFiles(dir: string): { file: string; data: unknown }[] {
  if (!existsSync(dir)) throw new Error(`Нет папки с исследованием: ${dir}`);
  const names = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, "en"));
  if (names.length === 0) throw new Error(`В ${dir} нет json-файлов`);
  return names.map((name) => {
    const text = readFileSync(path.join(dir, name), "utf8").replace(/^\uFEFF/, "");
    try {
      return { file: name, data: JSON.parse(text) as unknown };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Не разобран ${name}: ${reason}`);
    }
  });
}

function toStored(doc: {
  id: number | string;
  brand?: string | null;
  name?: string | null;
  sku?: string | null;
  pricePerSqm?: number | null;
  isActive?: boolean | null;
  formats?: unknown;
  thicknessesMm?: unknown;
  finish?: string | null;
  shade?: string | null;
  texture?: string | null;
}): DbMaterial {
  return {
    id: doc.id,
    brand: doc.brand ?? "",
    name: doc.name ?? "",
    sku: doc.sku ?? "",
    pricePerSqm: typeof doc.pricePerSqm === "number" ? doc.pricePerSqm : Number.NaN,
    isActive: Boolean(doc.isActive),
    formats: asStrings(doc.formats),
    thicknessesMm: asStrings(doc.thicknessesMm),
    finish: typeof doc.finish === "string" && doc.finish.length > 0 ? doc.finish : null,
    shade: doc.shade ?? null,
    texture: doc.texture ?? null
  };
}

async function loadMaterials(payload: Payload): Promise<DbMaterial[]> {
  const found = await payload.find({
    collection: "materials",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true
  });
  const materials = found.docs.map((doc) => toStored(doc));
  const seen = new Set<string>();
  for (const material of materials) {
    const key = String(material.id);
    if (seen.has(key)) throw new Error(`Два материала с id ${key}`);
    seen.add(key);
  }
  return materials;
}

function indexMaterials(materials: readonly DbMaterial[]): Map<string, DbMaterial> {
  return new Map(materials.map((material) => [String(material.id), material]));
}

function printDbStats(title: string, materials: readonly DbMaterial[]) {
  const withSpecs = materials.filter((material) => materialHasSpecs(material)).length;
  const active = materials.filter((material) => material.isActive).length;
  const badPrices = materials.filter((material) => !isPriceStepMultiple(material.pricePerSqm)).length;
  console.log(
    `${title}: материалов ${materials.length}; с характеристиками ${withSpecs}; активных ${active}; цен не кратных 250: ${badPrices}`
  );
}

function printSummary(title: string, summary: ResearchSummary) {
  console.log(`\n${title}`);
  console.log(`Всего записей: ${summary.total}`);
  console.log(`К изменению: ${summary.change}`);
  console.log(
    `Пропущено: пусто ${summary.empty}, проблема ${summary.problem}, уже заполнен ${summary.filled}, не найден id ${summary.missing}`
  );
  console.log("По брендам (всего | к изменению | пусто | проблема | уже заполнен | не найден):");
  for (const row of summary.byBrand) {
    const cells = [row.total, row.change, row.empty, row.problem, row.filled, row.missing].map((value) =>
      String(value).padStart(3)
    );
    console.log(`  ${row.brand.padEnd(16)} ${cells.join(" | ")}`);
  }
}

function printSkips(title: string, skips: readonly PlannedSkip[]) {
  console.log(`\n${title} (${skips.length}):`);
  if (skips.length === 0) {
    console.log("  нет");
    return;
  }
  for (const skip of skips) {
    const place = skip.index > 0 ? `запись ${skip.index}` : "файл";
    console.log(
      `  ${skip.file || "—"} ${place} #${skip.id || "—"} [${skip.brand || "—"}] ${skip.name} — ${skip.messages.join("; ")}`
    );
  }
}

function formatPatch(patch: MaterialSpecPatch): string {
  const parts: string[] = [];
  if (patch.formats) parts.push(`форматы ${patch.formats.join(", ")}`);
  if (patch.thicknessesMm) parts.push(`толщины ${patch.thicknessesMm.join(", ")}`);
  if (patch.finish) parts.push(`полировка ${patch.finish}`);
  if (patch.shade) parts.push(`оттенок ${patch.shade}`);
  if (patch.texture) parts.push(`фактура ${patch.texture}`);
  return parts.join("; ") || "пусто";
}

function formatStored(material: DbMaterial | undefined): string {
  if (!material) return "в БД нет";
  const finish = material.finish ?? "—";
  const shade = material.shade?.trim() || "—";
  const texture = material.texture?.trim() || "—";
  return `форматы ${material.formats.join(", ") || "—"}; толщины ${material.thicknessesMm.join(", ") || "—"}; полировка ${finish}; оттенок ${shade}; фактура ${texture}`;
}

function printSamples(title: string, updates: readonly PlannedUpdate[], materials: ReadonlyMap<string, DbMaterial>, checkStored: boolean) {
  const byBrand = new Map<string, PlannedUpdate[]>();
  for (const update of updates) {
    const list = byBrand.get(update.brand) ?? [];
    list.push(update);
    byBrand.set(update.brand, list);
  }
  console.log(`\n${title}`);
  const mismatches: string[] = [];
  const brands = [...byBrand.keys()].sort((left, right) => left.localeCompare(right, "ru"));
  for (const brand of brands) {
    const sample = (byBrand.get(brand) ?? [])
      .slice()
      .sort((left, right) => Number(left.id) - Number(right.id))
      .slice(0, 2);
    for (const update of sample) {
      const stored = materials.get(update.id);
      const name = stored && stored.name !== update.name ? `${stored.name} (в файле «${update.name}»)` : update.name;
      if (!checkStored) {
        console.log(`  ${brand} / ${name} (${update.sku}) #${update.id} → ${formatPatch(update.patch)}`);
        continue;
      }
      const matches = stored ? storedMatchesPatch(stored, update.patch) : false;
      if (!matches) mismatches.push(`${brand} #${update.id}`);
      console.log(`  ${brand} / ${name} (${update.sku}) #${update.id} → ${formatStored(stored)} — ${matches ? "совпадает" : "РАСХОЖДЕНИЕ"}`);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Записанные характеристики не совпали с исследованием: ${mismatches.join(", ")}`);
  }
}

function printRemaining(materials: readonly DbMaterial[]) {
  const groups = new Map<string, number>();
  for (const material of materials) {
    if (materialHasSpecs(material)) continue;
    groups.set(material.brand || "—", (groups.get(material.brand || "—") ?? 0) + 1);
  }
  const rows = [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0], "ru"));
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  console.log(`\nВсё ещё без характеристик: ${total}`);
  for (const [brand, count] of rows) console.log(`  ${brand}: ${count}`);
}

function fingerprint(materials: readonly DbMaterial[]): Map<string, PriceMark> {
  return new Map(materials.map((material) => [String(material.id), { pricePerSqm: material.pricePerSqm, isActive: material.isActive }]));
}

function priceDrift(before: ReadonlyMap<string, PriceMark>, after: readonly DbMaterial[]): string[] {
  const messages: string[] = [];
  if (after.length !== before.size) messages.push(`число материалов было ${before.size}, стало ${after.length}`);
  const seen = new Set<string>();
  for (const material of after) {
    const key = String(material.id);
    seen.add(key);
    const prev = before.get(key);
    if (!prev) {
      messages.push(`#${key} появился после импорта`);
      continue;
    }
    if (prev.pricePerSqm !== material.pricePerSqm || prev.isActive !== material.isActive) {
      messages.push(
        `#${key} цена ${prev.pricePerSqm} → ${material.pricePerSqm}, активен ${String(prev.isActive)} → ${String(material.isActive)}`
      );
    }
  }
  for (const key of before.keys()) {
    if (!seen.has(key)) messages.push(`#${key} пропал после импорта`);
  }
  return messages;
}

async function deleteTempAdmin(payload: Payload) {
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: TEMP_ADMIN_EMAIL } },
    limit: 20,
    depth: 0,
    overrideAccess: true
  });
  for (const user of found.docs) {
    if (user.email === REAL_ADMIN_EMAIL || user.email !== TEMP_ADMIN_EMAIL) {
      throw new Error(`Отказ: нельзя удалять «${user.email}». Разрешён только ${TEMP_ADMIN_EMAIL}.`);
    }
    await payload.delete({ collection: "users", id: user.id, overrideAccess: true });
  }
}

async function assertTempAdminGone(payload: Payload) {
  const left = await payload.find({
    collection: "users",
    where: { email: { equals: TEMP_ADMIN_EMAIL } },
    limit: 1,
    depth: 0,
    overrideAccess: true
  });
  if (left.docs.some((user) => user.email === TEMP_ADMIN_EMAIL)) {
    throw new Error(`Временный пользователь ${TEMP_ADMIN_EMAIL} остался в БД после удаления.`);
  }
}

/** Реальный администратор не создаётся и не удаляется, даже если константы когда-нибудь совпадут. */
function assertNotRealAdmin(email: string) {
  if (email === REAL_ADMIN_EMAIL) {
    throw new Error(`Отказ: нельзя создавать или удалять ${REAL_ADMIN_EMAIL}.`);
  }
}

/** Запасной сброс: временный админ через Local API, HTTP-сброс, затем удаление. Реальный админ не трогается. */
async function flushWithTempAdmin(payload: Payload): Promise<string> {
  assertNotRealAdmin(TEMP_ADMIN_EMAIL);
  const base = (process.env.IMPORT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const password = randomBytes(24).toString("base64url");
  try {
    await deleteTempAdmin(payload);
    const created = await payload.create({
      collection: "users",
      data: { email: TEMP_ADMIN_EMAIL, password },
      overrideAccess: true
    });
    if (created.email !== TEMP_ADMIN_EMAIL) {
      throw new Error(`Создан пользователь «${created.email}», ожидался ${TEMP_ADMIN_EMAIL}.`);
    }

    const login = await fetch(`${base}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEMP_ADMIN_EMAIL, password })
    });
    const loginBody = (await login.json().catch(() => ({}))) as { token?: string };
    if (login.status === 401) {
      return `Повторный сброс не удался: вход временного пользователя вернул 401 (${base}). Кэш сайта не сброшен.`;
    }
    if (!login.ok || !loginBody.token) {
      return `Повторный сброс не удался: вход временного пользователя вернул ${login.status} (${base}). Кэш сайта не сброшен.`;
    }

    const flush = await fetch(`${base}/api/materials/revalidate-cache`, {
      method: "POST",
      headers: { Authorization: `JWT ${loginBody.token}` }
    });
    await flush.text().catch(() => "");
    if (!flush.ok) {
      return `Повторный сброс не удался: /api/materials/revalidate-cache вернул ${flush.status} (${base}). Кэш сайта не сброшен.`;
    }
    return `Кэш сайта сброшен через ${base} временным пользователем ${TEMP_ADMIN_EMAIL}. Пользователь удалён.`;
  } finally {
    await deleteTempAdmin(payload);
    await assertTempAdminGone(payload);
  }
}

async function flushCache(payload: Payload) {
  const first = await flushSiteCache();
  console.log(first);
  if (first.startsWith("Кэш сайта сброшен")) return;
  if (first.includes("401")) {
    console.log(
      "Вход в API вернул 401: сервер не принял учётные данные из окружения. Сбрасываю кэш временным пользователем и сразу удаляю его."
    );
  } else {
    console.log("Первый сброс кэша не удался. Повторяю через временного пользователя и сразу удаляю его.");
  }
  const second = await flushWithTempAdmin(payload);
  console.log(second);
  if (!second.startsWith("Кэш сайта сброшен")) throw new Error(second);
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const dir = path.resolve(process.cwd(), "scripts/data/specs-research");
  const files = loadResearchFiles(dir);
  const collected = collectResearch(files);

  const payload = await getPayload({ config });
  const materials = await loadMaterials(payload);
  const plan = planResearchImport(collected.records, collected.problems, indexMaterials(materials));
  const summary = summarizeResearchPlan(plan);

  console.log(`Режим: ${apply ? "ЗАПИСЬ (APPLY=1)" : "dry-run (в БД ничего не пишется)"}`);
  console.log(`Папка: ${dir}`);
  console.log(`Файлов: ${files.length}`);
  printDbStats("Сейчас в БД", materials);
  printSummary("Сводка (до записи)", summary);
  printSkips(
    "Проблемы",
    plan.skips.filter((skip) => skip.reason === "problem")
  );
  printSkips(
    "Пусто",
    plan.skips.filter((skip) => skip.reason === "empty")
  );
  printSkips(
    "Уже заполнен",
    plan.skips.filter((skip) => skip.reason === "filled")
  );
  printSkips(
    "Не найден id",
    plan.skips.filter((skip) => skip.reason === "missing")
  );
  printSamples("К изменению, по 2 камня на бренд", plan.updates, indexMaterials(materials), false);

  if (!apply) {
    printSummary("Сводка (после, БД не менялась)", summary);
    printRemaining(materials);
    console.log("\nDry-run завершён, кэш не трогаем. Для записи: $env:APPLY=1; npm run import:specs:research");
    return;
  }

  const beforePrices = fingerprint(materials);
  let updated = 0;
  for (const item of plan.updates) {
    await payload.update({
      collection: "materials",
      id: item.dbId,
      data: item.patch,
      depth: 0,
      overrideAccess: true,
      context: { [SKIP_REVALIDATE_CONTEXT]: true }
    });
    updated += 1;
  }
  console.log(`\nЗаписано: ${updated}.`);

  const after = await loadMaterials(payload);
  const drifted = priceDrift(beforePrices, after);
  if (drifted.length > 0) {
    console.error("Цены или активность изменились, это не должно было случиться:");
    for (const line of drifted) console.error(`  ${line}`);
    throw new Error("Импорт затронул цены или isActive");
  }
  console.log("Цены и активность не изменились.");

  const afterPlan = planResearchImport(collected.records, collected.problems, indexMaterials(after));
  printSummary("Сводка (после записи)", summarizeResearchPlan(afterPlan));
  printDbStats("После записи", after);
  printSamples("Проверка записи, по 2 камня на бренд", plan.updates, indexMaterials(after), true);
  printRemaining(after);

  if (updated > 0) await flushCache(payload);
  else console.log("Изменений не было — кэш не трогаем.");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
