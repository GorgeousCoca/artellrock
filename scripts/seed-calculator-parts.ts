/**
 * Настоящие кромки, бортики и мойки калькулятора из `scripts/data/calculator-parts.json`.
 *
 * Запуск:
 *   npm run seed:calculator-parts              — только отчёт (dry-run), в БД ничего не пишется;
 *   $env:APPLY=1; npm run seed:calculator-parts — создать или обновить записи.
 *
 * Цены в файле сырые (как на прайсе). Перед записью округляются до 250 ₽ (`roundToPriceStep`),
 * в отчёте видно, что именно округлилось. В коде цен нет.
 *
 * Ключ записи: коллекция + kind/type + название. Повторный запуск с тем же файлом ничего не меняет.
 * Демо-позиции («[ДЕМО]») этот скрипт не создаёт и не удаляет: их снимает
 * `SEED_CLEAN=edges,backsplashes,sinks` у `scripts/seed-calculator-demo.ts`.
 *
 * Профили без картинок (2G, LZ, LR, составной) в файле не хранятся. Если такая запись ещё есть в БД
 * и её нет в файле, APPLY=1 удаляет её. Повторный запуск этих записей уже не находит.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import { roundToPriceStep } from "../src/lib/calculator/price-rounding";
import { EDGE_KINDS, SINK_TYPES, type EdgeKind, type SinkType } from "../src/lib/calculator/taxonomy";
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

const EDGE_KIND_SET = new Set<string>(EDGE_KINDS.map((kind) => kind.value));
const SINK_TYPE_SET = new Set<string>(SINK_TYPES.map((type) => type.value));
const DEMO_PREFIX = "[ДЕМО]";

/** Ключ `kind|name`. Удаляем только эти профили и только если их уже нет в файле. */
const RETIRED_EDGE_KEYS = new Set([
  "profile|2G (2 радиуса)",
  "profile|LZ (выкружка+скос)",
  "profile|LR (выкружка+радиус)",
  "profile|Составной индивидуальный"
]);

type EdgePart = {
  slug: string;
  name: string;
  kind: EdgeKind;
  thicknessMm?: number;
  price: number;
  image?: string;
  sortOrder: number;
};

type BacksplashPart = {
  slug: string;
  name: string;
  price: number;
  image?: string;
  sortOrder: number;
};

type SinkPart = {
  slug: string;
  name: string;
  type: SinkType;
  description?: string;
  price: number;
  image?: string;
  sortOrder: number;
};

type PartsFile = {
  edges: EdgePart[];
  backsplashes: BacksplashPart[];
  sinks: SinkPart[];
};

type Rounded = { where: string; name: string; from: number; to: number };

function blank(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function same(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") return a === b;
  return blank(a) === blank(b);
}

function requirePrice(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}: цена должна быть неотрицательным числом, получено ${JSON.stringify(value)}`);
  }
  return value;
}

function requireName(value: unknown, label: string): string {
  const name = blank(value);
  if (!name) throw new Error(`${label}: пустое название`);
  if (name.startsWith(DEMO_PREFIX)) throw new Error(`${label}: название не должно начинаться с «${DEMO_PREFIX}»`);
  return name;
}

function loadParts(file: string): PartsFile {
  const raw = JSON.parse(readFileSync(file, "utf8")) as PartsFile;
  if (!raw || !Array.isArray(raw.edges) || !Array.isArray(raw.backsplashes) || !Array.isArray(raw.sinks)) {
    throw new Error("В файле нужны массивы edges, backsplashes и sinks.");
  }

  const slugs = new Set<string>();
  const takeSlug = (slug: unknown, label: string) => {
    const value = blank(slug);
    if (!value || !/^[a-z0-9-]+$/.test(value)) throw new Error(`${label}: slug должен быть из латиницы, цифр и дефиса`);
    if (slugs.has(value)) throw new Error(`Повторяющийся slug «${value}»`);
    slugs.add(value);
    return value;
  };

  const edgeKeys = new Set<string>();
  const edges: EdgePart[] = raw.edges.map((item, index) => {
    const label = `edges[${index}]`;
    const kind = blank(item.kind);
    if (!kind || !EDGE_KIND_SET.has(kind)) throw new Error(`${label}: неизвестный kind «${item.kind}»`);
    const name = requireName(item.name, label);
    const key = `${kind}|${name}`;
    if (edgeKeys.has(key)) throw new Error(`${label}: повтор «${kind}» + «${name}»`);
    edgeKeys.add(key);
    const thicknessMm = item.thicknessMm;
    if (thicknessMm != null && (typeof thicknessMm !== "number" || thicknessMm <= 0)) {
      throw new Error(`${label}: thicknessMm должен быть положительным числом`);
    }
    return {
      slug: takeSlug(item.slug, label),
      name,
      kind: kind as EdgeKind,
      thicknessMm: thicknessMm ?? undefined,
      price: requirePrice(item.price, label),
      image: blank(item.image) ?? undefined,
      sortOrder: item.sortOrder
    };
  });

  const backKeys = new Set<string>();
  const backsplashes: BacksplashPart[] = raw.backsplashes.map((item, index) => {
    const label = `backsplashes[${index}]`;
    const name = requireName(item.name, label);
    if (backKeys.has(name)) throw new Error(`${label}: повтор названия «${name}»`);
    backKeys.add(name);
    return {
      slug: takeSlug(item.slug, label),
      name,
      price: requirePrice(item.price, label),
      image: blank(item.image) ?? undefined,
      sortOrder: item.sortOrder
    };
  });

  const sinkKeys = new Set<string>();
  const sinks: SinkPart[] = raw.sinks.map((item, index) => {
    const label = `sinks[${index}]`;
    const type = blank(item.type);
    if (!type || !SINK_TYPE_SET.has(type)) throw new Error(`${label}: неизвестный type «${item.type}»`);
    const name = requireName(item.name, label);
    const key = `${type}|${name}`;
    if (sinkKeys.has(key)) throw new Error(`${label}: повтор «${type}» + «${name}»`);
    sinkKeys.add(key);
    return {
      slug: takeSlug(item.slug, label),
      name,
      type: type as SinkType,
      description: blank(item.description) ?? undefined,
      price: requirePrice(item.price, label),
      image: blank(item.image) ?? undefined,
      sortOrder: item.sortOrder
    };
  });

  for (const item of [...edges, ...backsplashes, ...sinks]) {
    if (typeof item.sortOrder !== "number" || !Number.isInteger(item.sortOrder)) {
      throw new Error(`«${item.name}»: sortOrder должен быть целым числом`);
    }
  }

  return { edges, backsplashes, sinks };
}

type DbDoc = {
  id: number;
  name?: string | null;
  kind?: string | null;
  type?: string | null;
  thicknessMm?: number | null;
  heightMm?: number | null;
  description?: string | null;
  pricePerMeter?: number | null;
  price?: number | null;
  image?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

function indexBy(docs: DbDoc[], keyOf: (doc: DbDoc) => string): Map<string, DbDoc[]> {
  const map = new Map<string, DbDoc[]>();
  for (const doc of docs) {
    const key = keyOf(doc);
    const list = map.get(key);
    if (list) list.push(doc);
    else map.set(key, [doc]);
  }
  return map;
}

type Plan = { action: "create" | "update" | "same"; name: string; changes: string[] };

function planLine(action: Plan["action"], name: string, changes: string[]): Plan {
  return { action, name, changes };
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const file = path.resolve(process.cwd(), "scripts/data/calculator-parts.json");
  const parts = loadParts(file);

  const rounded: Rounded[] = [];
  const roundPrice = (where: string, name: string, price: number) => {
    const next = roundToPriceStep(price);
    if (next !== price) rounded.push({ where, name, from: price, to: next });
    return next;
  };

  const maxDelta = () => rounded.reduce((max, item) => Math.max(max, Math.abs(item.to - item.from)), 0);
  const totalRows = parts.edges.length + parts.backsplashes.length + parts.sinks.length;

  console.log(`Режим: ${apply ? "ЗАПИСЬ (APPLY=1)" : "dry-run (в БД ничего не пишется)"}`);
  console.log(`Файл: ${file}`);
  console.log(`Позиций в файле: кромки ${parts.edges.length}, бортики ${parts.backsplashes.length}, мойки ${parts.sinks.length}`);

  const payload = await getPayload({ config });
  const [edgeDocs, backDocs, sinkDocs] = await Promise.all([
    payload.find({ collection: "edges", limit: 0, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: "backsplashes", limit: 0, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: "sinks", limit: 0, pagination: false, depth: 0, overrideAccess: true })
  ]);

  const edgesByKey = indexBy(edgeDocs.docs as DbDoc[], (doc) => `${doc.kind}|${doc.name}`);
  const backsByName = indexBy(backDocs.docs as DbDoc[], (doc) => String(doc.name));
  const sinksByKey = indexBy(sinkDocs.docs as DbDoc[], (doc) => `${doc.type}|${doc.name}`);

  const edgePlans: Plan[] = [];
  const backPlans: Plan[] = [];
  const sinkPlans: Plan[] = [];
  const blockers: string[] = [];

  const takeOne = (list: DbDoc[] | undefined, label: string) => {
    if (!list || list.length === 0) return null;
    if (list.length > 1) {
      blockers.push(`${label}: в БД ${list.length} записей, обновлять нечего однозначного`);
      return list[0];
    }
    return list[0];
  };

  for (const item of parts.edges) {
    const price = roundPrice("кромка", item.name, item.price);
    const current = takeOne(edgesByKey.get(`${item.kind}|${item.name}`), `кромка «${item.name}»`);
    const next = {
      kind: item.kind,
      name: item.name,
      thicknessMm: item.thicknessMm ?? null,
      pricePerMeter: price,
      image: item.image ?? null,
      sortOrder: item.sortOrder,
      isActive: true
    };
    if (!current) {
      edgePlans.push(planLine("create", item.name, [`${item.kind}, ${fmt(price)}`]));
      continue;
    }
    const changes: string[] = [];
    if (!same(current.kind, next.kind)) changes.push(`kind ${current.kind} → ${next.kind}`);
    if (!same(current.thicknessMm, next.thicknessMm)) changes.push(`толщина ${current.thicknessMm ?? "—"} → ${next.thicknessMm ?? "—"}`);
    if (!same(current.pricePerMeter, next.pricePerMeter)) changes.push(`цена ${fmt(current.pricePerMeter ?? 0)} → ${fmt(next.pricePerMeter)}`);
    if (!same(current.image, next.image)) changes.push("картинка");
    if (!same(current.sortOrder, next.sortOrder)) changes.push(`порядок ${current.sortOrder ?? "—"} → ${next.sortOrder}`);
    if (current.isActive !== true) changes.push("включить");
    edgePlans.push(planLine(changes.length > 0 ? "update" : "same", item.name, changes));
  }

  for (const item of parts.backsplashes) {
    const price = roundPrice("бортик", item.name, item.price);
    const current = takeOne(backsByName.get(item.name), `бортик «${item.name}»`);
    const next = {
      name: item.name,
      heightMm: null,
      pricePerMeter: price,
      image: item.image ?? null,
      sortOrder: item.sortOrder,
      isActive: true
    };
    if (!current) {
      backPlans.push(planLine("create", item.name, [fmt(price)]));
      continue;
    }
    const changes: string[] = [];
    if (!same(current.heightMm, next.heightMm)) changes.push(`высота ${current.heightMm ?? "—"} → —`);
    if (!same(current.pricePerMeter, next.pricePerMeter)) changes.push(`цена ${fmt(current.pricePerMeter ?? 0)} → ${fmt(next.pricePerMeter)}`);
    if (!same(current.image, next.image)) changes.push("картинка");
    if (!same(current.sortOrder, next.sortOrder)) changes.push(`порядок ${current.sortOrder ?? "—"} → ${next.sortOrder}`);
    if (current.isActive !== true) changes.push("включить");
    backPlans.push(planLine(changes.length > 0 ? "update" : "same", item.name, changes));
  }

  for (const item of parts.sinks) {
    const price = roundPrice("мойка", item.name, item.price);
    const current = takeOne(sinksByKey.get(`${item.type}|${item.name}`), `мойка «${item.name}»`);
    const next = {
      type: item.type,
      name: item.name,
      description: item.description ?? null,
      price,
      image: item.image ?? null,
      sortOrder: item.sortOrder,
      isActive: true
    };
    if (!current) {
      sinkPlans.push(planLine("create", item.name, [`${item.type}, ${fmt(price)}`]));
      continue;
    }
    const changes: string[] = [];
    if (!same(current.type, next.type)) changes.push(`type ${current.type} → ${next.type}`);
    if (!same(current.description, next.description)) changes.push("описание");
    if (!same(current.price, next.price)) changes.push(`цена ${fmt(current.price ?? 0)} → ${fmt(next.price)}`);
    if (!same(current.image, next.image)) changes.push("картинка");
    if (!same(current.sortOrder, next.sortOrder)) changes.push(`порядок ${current.sortOrder ?? "—"} → ${next.sortOrder}`);
    if (current.isActive !== true) changes.push("включить");
    sinkPlans.push(planLine(changes.length > 0 ? "update" : "same", item.name, changes));
  }

  const fileEdgeKeys = new Set(parts.edges.map((item) => `${item.kind}|${item.name}`));
  const edgeRemovals = (edgeDocs.docs as DbDoc[]).filter((doc) => {
    const key = `${doc.kind}|${doc.name}`;
    return RETIRED_EDGE_KEYS.has(key) && !fileEdgeKeys.has(key);
  });

  console.log("");
  console.log(`Округлено до 250 ₽: ${rounded.length} из ${totalRows}`);
  console.log(`Максимальное отклонение: ${fmt(maxDelta())}`);
  if (rounded.length > 0) {
    for (const item of rounded) console.log(`  ${item.where} «${item.name}»: ${fmt(item.from)} → ${fmt(item.to)}`);
  }

  const printPlans = (title: string, plans: Plan[]) => {
    const created = plans.filter((plan) => plan.action === "create");
    const updated = plans.filter((plan) => plan.action === "update");
    const sameCount = plans.filter((plan) => plan.action === "same").length;
    console.log(`\n${title}: создать ${created.length}, обновить ${updated.length}, без изменений ${sameCount}`);
    for (const plan of [...created, ...updated]) {
      const verb = plan.action === "create" ? "создать" : "обновить";
      console.log(`  ${verb} «${plan.name}»${plan.changes.length ? ` (${plan.changes.join("; ")})` : ""}`);
    }
  };

  printPlans("Кромки", edgePlans);
  printPlans("Бортики", backPlans);
  printPlans("Мойки", sinkPlans);

  console.log(`\nПрофили без картинок: удалить ${edgeRemovals.length}`);
  for (const doc of edgeRemovals) console.log(`  удалить «${doc.name}»`);

  if (blockers.length > 0) {
    console.error("\nОСТАНОВКА: неоднозначные записи в БД.");
    for (const line of blockers) console.error(`  ${line}`);
    process.exit(1);
  }

  const writes = [...edgePlans, ...backPlans, ...sinkPlans].filter((plan) => plan.action !== "same");
  const changeCount = writes.length + edgeRemovals.length;
  if (!apply) {
    console.log(changeCount === 0 ? "\nDry-run: ничего не меняется." : "\nDry-run завершён. Для записи: $env:APPLY=1; npm run seed:calculator-parts");
    return;
  }

  if (changeCount === 0) {
    console.log("\nЗапись не нужна: все позиции уже совпадают с файлом. Кэш не трогаем.");
    return;
  }

  const context = { [SKIP_REVALIDATE_CONTEXT]: true };
  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const doc of edgeRemovals) {
    await payload.delete({ collection: "edges", id: doc.id, overrideAccess: true, context });
    removed += 1;
  }

  const writeEdges = async (db: Payload) => {
    for (const [index, item] of parts.edges.entries()) {
      const plan = edgePlans[index];
      if (plan.action === "same") continue;
      const price = roundToPriceStep(item.price);
      const data = {
        kind: item.kind,
        name: item.name,
        thicknessMm: item.thicknessMm ?? null,
        pricePerMeter: price,
        image: item.image ?? null,
        sortOrder: item.sortOrder,
        isActive: true
      };
      if (plan.action === "create") {
        await db.create({ collection: "edges", data, overrideAccess: true, context });
        created += 1;
      } else {
        const current = edgesByKey.get(`${item.kind}|${item.name}`)?.[0];
        if (!current) throw new Error(`Кромка «${item.name}» пропала между отчётом и записью`);
        await db.update({ collection: "edges", id: current.id, data, overrideAccess: true, context });
        updated += 1;
      }
    }
  };

  const writeBacksplashes = async (db: Payload) => {
    for (const [index, item] of parts.backsplashes.entries()) {
      const plan = backPlans[index];
      if (plan.action === "same") continue;
      const data = {
        name: item.name,
        heightMm: null,
        pricePerMeter: roundToPriceStep(item.price),
        image: item.image ?? null,
        sortOrder: item.sortOrder,
        isActive: true
      };
      if (plan.action === "create") {
        await db.create({ collection: "backsplashes", data, overrideAccess: true, context });
        created += 1;
      } else {
        const current = backsByName.get(item.name)?.[0];
        if (!current) throw new Error(`Бортик «${item.name}» пропал между отчётом и записью`);
        await db.update({ collection: "backsplashes", id: current.id, data, overrideAccess: true, context });
        updated += 1;
      }
    }
  };

  const writeSinks = async (db: Payload) => {
    for (const [index, item] of parts.sinks.entries()) {
      const plan = sinkPlans[index];
      if (plan.action === "same") continue;
      const data = {
        type: item.type,
        name: item.name,
        description: item.description ?? null,
        price: roundToPriceStep(item.price),
        image: item.image ?? null,
        sortOrder: item.sortOrder,
        isActive: true
      };
      if (plan.action === "create") {
        await db.create({ collection: "sinks", data, overrideAccess: true, context });
        created += 1;
      } else {
        const current = sinksByKey.get(`${item.type}|${item.name}`)?.[0];
        if (!current) throw new Error(`Мойка «${item.name}» пропала между отчётом и записью`);
        await db.update({ collection: "sinks", id: current.id, data, overrideAccess: true, context });
        updated += 1;
      }
    }
  };

  await writeEdges(payload);
  await writeBacksplashes(payload);
  await writeSinks(payload);

  console.log(`\nЗаписано: создано ${created}, обновлено ${updated}, удалено ${removed}.`);
  console.log(await flushSiteCache());
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
