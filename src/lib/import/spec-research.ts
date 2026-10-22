/**
 * Разбор исследовательских JSON с характеристиками камней.
 *
 * Модуль чистый: файл и БД читает скрипт `scripts/import-material-specs-research.ts`.
 * Проверка ручная, без «тихого» отбрасывания: значение вне словаря попадает в список проблем,
 * и такая запись целиком не идёт в патч. Пустой массив и `null` — это «не знаем», не ошибка.
 *
 * Поля `inferred`, `confidence`, `sources`, `notes` в БД не пишутся и запись из-за них не бракуется.
 */
import {
  STONE_FINISHES,
  STONE_FORMATS,
  STONE_SHADES,
  STONE_TEXTURES,
  STONE_THICKNESSES_MM,
  splitTags,
  type StoneFinish,
  type StoneFormat
} from "@/lib/calculator/taxonomy";

const FORMAT_VALUES = new Set<string>(STONE_FORMATS.map((item) => item.value));
const SHADE_VALUES = new Set<string>(STONE_SHADES);
const TEXTURE_VALUES = new Set<string>(STONE_TEXTURES);
const THICKNESS_VALUES = new Set<number>(STONE_THICKNESSES_MM);
const FINISH_VALUES = new Set<string>(STONE_FINISHES.map((item) => item.value));

export type ThicknessCode = "12" | "15" | "20" | "30";
export type ThicknessMm = (typeof STONE_THICKNESSES_MM)[number];

/** Одна проверенная запись. В патч из неё попадают только непустые поля. */
export type ResearchRecord = {
  file: string;
  /** Номер в массиве файла, с 1. */
  index: number;
  id: string;
  brand: string;
  sku: string;
  name: string;
  formats: StoneFormat[];
  thicknessesMm: ThicknessMm[];
  finish: StoneFinish | null;
  shades: string[];
  textures: string[];
};

/** Запись, которую нельзя писать. `messages` называет каждое чужое значение. */
export type ResearchProblem = {
  file: string;
  index: number;
  id: string;
  brand: string;
  name: string;
  messages: string[];
};

/**
 * Фрагмент для `payload.update`. Ключа нет — поле в БД не трогаем.
 * Цены и `isActive` здесь отсутствуют сознательно.
 */
export type MaterialSpecPatch = {
  formats?: StoneFormat[];
  thicknessesMm?: ThicknessCode[];
  finish?: StoneFinish;
  shade?: string;
  texture?: string;
};

/** Как характеристика лежит в карточке сейчас. Цен в этом типе нет. */
export type StoredMaterial = {
  id: number | string;
  brand: string;
  formats: readonly string[];
  thicknessesMm: readonly string[];
  finish: string | null;
  shade: string | null;
  texture: string | null;
};

export type PlannedUpdate = {
  file: string;
  index: number;
  id: string;
  dbId: number | string;
  brand: string;
  sku: string;
  name: string;
  patch: MaterialSpecPatch;
};

export type ResearchSkipReason = "empty" | "problem" | "filled" | "missing";

export type PlannedSkip = {
  reason: ResearchSkipReason;
  file: string;
  index: number;
  id: string;
  brand: string;
  name: string;
  messages: string[];
};

export type ResearchPlan = {
  updates: PlannedUpdate[];
  skips: PlannedSkip[];
};

export type BrandResearchTally = {
  brand: string;
  total: number;
  change: number;
  empty: number;
  problem: number;
  filled: number;
  missing: number;
};

export type ResearchSummary = {
  total: number;
  change: number;
  empty: number;
  problem: number;
  filled: number;
  missing: number;
  byBrand: BrandResearchTally[];
};

function describe(value: unknown): string {
  const kind = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  let text: string;
  if (typeof value === "string") text = value;
  else if (value === null || value === undefined) text = value === null ? "null" : "нет поля";
  else if (typeof value === "number" || typeof value === "boolean") text = String(value);
  else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = kind;
    }
  }
  if (text.length > 80) text = `${text.slice(0, 80)}…`;
  return `«${text}» (${kind})`;
}

function isFormat(value: unknown): value is StoneFormat {
  return typeof value === "string" && FORMAT_VALUES.has(value);
}

function isThickness(value: unknown): value is ThicknessMm {
  return typeof value === "number" && Number.isInteger(value) && THICKNESS_VALUES.has(value);
}

function isShade(value: unknown): value is string {
  return typeof value === "string" && SHADE_VALUES.has(value);
}

function isTexture(value: unknown): value is string {
  return typeof value === "string" && TEXTURE_VALUES.has(value);
}

function readItems<T extends string | number>(
  value: unknown,
  field: string,
  accept: (item: unknown) => item is T,
  dictionaryName: string,
  messages: string[]
): T[] {
  if (!Array.isArray(value)) {
    messages.push(`${field}: ожидается массив, получено ${describe(value)}`);
    return [];
  }
  const accepted: T[] = [];
  for (const item of value) {
    if (accept(item)) accepted.push(item);
    else messages.push(`${field}: ${describe(item)} нет в словаре ${dictionaryName}`);
  }
  return accepted;
}

/**
 * Артикул и название в БД этим импортом не пишутся.
 * `null` значит «в исследовании артикула нет» — запись из-за этого не бракуется.
 */
function optionalText(value: unknown, field: string, messages: string[]): string {
  if (value === null) return "";
  if (typeof value !== "string") {
    messages.push(`${field}: ожидается строка или null, получено ${describe(value)}`);
    return "";
  }
  return value;
}

/**
 * Проверяет одну запись. При любой проблеме запись не возвращается:
 * годные соседние поля этой же записи тоже не пишутся.
 */
export function parseResearchEntries(entries: readonly unknown[], file = ""): {
  records: ResearchRecord[];
  problems: ResearchProblem[];
} {
  const draft: ResearchRecord[] = [];
  const problems: ResearchProblem[] = [];

  entries.forEach((entry, offset) => {
    const index = offset + 1;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      problems.push({ file, index, id: "", brand: "", name: "", messages: [`запись не объект, получено ${describe(entry)}`] });
      return;
    }
    const raw = entry as Record<string, unknown>;
    const messages: string[] = [];
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (typeof raw.id !== "string" || id.length === 0) {
      messages.push(`id: ожидается непустая строка, получено ${describe(raw.id)}`);
    }
    const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
    if (typeof raw.brand !== "string" || brand.length === 0) {
      messages.push(`brand: ожидается непустая строка, получено ${describe(raw.brand)}`);
    }
    const sku = optionalText(raw.sku, "sku", messages);
    const name = optionalText(raw.name, "name", messages);
    const formats = readItems(raw.formats, "formats", isFormat, "форматов", messages);
    const thicknessesMm = readItems(raw.thicknessesMm, "thicknessesMm", isThickness, "толщин", messages);
    let finish: StoneFinish | null = null;
    if (raw.finish === null) finish = null;
    else if (typeof raw.finish === "string" && FINISH_VALUES.has(raw.finish)) finish = raw.finish as StoneFinish;
    else messages.push(`finish: ${describe(raw.finish)} нет в {polished, matte, null}`);
    const shades = readItems(raw.shades, "shades", isShade, "оттенков", messages);
    const textures = readItems(raw.textures, "textures", isTexture, "фактур", messages);

    if (messages.length > 0) {
      problems.push({
        file,
        index,
        id,
        brand,
        name: typeof raw.name === "string" ? raw.name : "",
        messages
      });
      return;
    }

    draft.push({ file, index, id, brand, sku, name, formats, thicknessesMm, finish, shades, textures });
  });

  const counts = new Map<string, number>();
  for (const record of draft) counts.set(record.id, (counts.get(record.id) ?? 0) + 1);

  const records: ResearchRecord[] = [];
  for (const record of draft) {
    if ((counts.get(record.id) ?? 0) < 2) {
      records.push(record);
      continue;
    }
    problems.push({
      file,
      index: record.index,
      id: record.id,
      brand: record.brand,
      name: record.name,
      messages: [`id «${record.id}» повторяется`]
    });
  }

  problems.sort((left, right) => left.index - right.index);
  return { records, problems };
}

/** Склеивает файлы. Повторы id (и внутри файла, и между файлами) — проблема, в запись не идут. */
export function collectResearch(sources: readonly { file: string; data: unknown }[]): {
  records: ResearchRecord[];
  problems: ResearchProblem[];
} {
  const records: ResearchRecord[] = [];
  const problems: ResearchProblem[] = [];

  for (const source of sources) {
    if (!Array.isArray(source.data)) {
      problems.push({
        file: source.file,
        index: 0,
        id: "",
        brand: "",
        name: "",
        messages: ["файл не является массивом записей"]
      });
      continue;
    }
    const parsed = parseResearchEntries(source.data, source.file);
    records.push(...parsed.records);
    problems.push(...parsed.problems);
  }

  const counts = new Map<string, ResearchRecord[]>();
  for (const record of records) {
    const group = counts.get(record.id) ?? [];
    group.push(record);
    counts.set(record.id, group);
  }

  const unique: ResearchRecord[] = [];
  for (const record of records) {
    const group = counts.get(record.id) ?? [];
    if (group.length < 2) {
      unique.push(record);
      continue;
    }
    const files = group.map((item) => item.file || "без файла").join(", ");
    problems.push({
      file: record.file,
      index: record.index,
      id: record.id,
      brand: record.brand,
      name: record.name,
      messages: [`id «${record.id}» повторяется в файлах: ${files}`]
    });
  }

  problems.sort((left, right) => left.file.localeCompare(right.file, "en") || left.index - right.index);
  return { records: unique, problems };
}

function uniqueValues<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

/** Теги через « / », порядок первого вхождения, повторы снимаются. */
export function joinTags(tags: readonly string[]): string {
  return uniqueValues(tags).join(" / ");
}

function thicknessCode(mm: ThicknessMm): ThicknessCode {
  const text = String(mm);
  if (text === "12" || text === "15" || text === "20" || text === "30") return text;
  throw new Error(`Толщина ${mm} мм не из словаря Payload`);
}

/** Пустой патч значит «писать нечего»: все поля записи пустые. */
export function buildSpecPatch(record: ResearchRecord): MaterialSpecPatch {
  const patch: MaterialSpecPatch = {};
  const formats = uniqueValues(record.formats);
  if (formats.length > 0) patch.formats = formats;
  const thicknessesMm = uniqueValues(record.thicknessesMm).map(thicknessCode);
  if (thicknessesMm.length > 0) patch.thicknessesMm = thicknessesMm;
  if (record.finish) patch.finish = record.finish;
  const shade = joinTags(record.shades);
  if (shade) patch.shade = shade;
  const texture = joinTags(record.textures);
  if (texture) patch.texture = texture;
  return patch;
}

/** Карточка уже содержит хоть одну характеристику. Пустые строки характеристикой не считаются. */
export function materialHasSpecs(material: Pick<StoredMaterial, "formats" | "thicknessesMm" | "finish" | "shade" | "texture">): boolean {
  return (
    material.formats.some((item) => item.length > 0) ||
    material.thicknessesMm.some((item) => item.length > 0) ||
    Boolean(material.finish) ||
    splitTags(material.shade).length > 0 ||
    splitTags(material.texture).length > 0
  );
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right);
  if (new Set(left).size !== rightSet.size) return false;
  return left.every((item) => rightSet.has(item));
}

/**
 * Сверяет карточку с патчем. Поля, которых в патче нет, должны остаться пустыми:
 * патч строится только для карточек, где характеристик не было.
 */
export function storedMatchesPatch(material: StoredMaterial, patch: MaterialSpecPatch): boolean {
  return (
    sameSet(material.formats, patch.formats ?? []) &&
    sameSet(material.thicknessesMm, patch.thicknessesMm ?? []) &&
    (material.finish ?? null) === (patch.finish ?? null) &&
    sameSet(splitTags(material.shade), patch.shade ? splitTags(patch.shade) : []) &&
    sameSet(splitTags(material.texture), patch.texture ? splitTags(patch.texture) : [])
  );
}

/**
 * План записи. Обновляются только карточки без характеристик.
 * Чужой бренд при том же id — проблема, карточка не трогается.
 * Записи с ошибками разбора в `records` попадать не должны: они приходят отдельно и только пропускаются.
 */
export function planResearchImport(
  records: readonly ResearchRecord[],
  problems: readonly ResearchProblem[],
  materials: ReadonlyMap<string, StoredMaterial>
): ResearchPlan {
  const skips: PlannedSkip[] = problems.map((problem) => ({
    reason: "problem",
    file: problem.file,
    index: problem.index,
    id: problem.id,
    brand: problem.brand,
    name: problem.name,
    messages: problem.messages
  }));
  const updates: PlannedUpdate[] = [];

  for (const record of records) {
    const material = materials.get(record.id);
    if (!material) {
      skips.push({
        reason: "missing",
        file: record.file,
        index: record.index,
        id: record.id,
        brand: record.brand,
        name: record.name,
        messages: [`не найден id ${record.id}`]
      });
      continue;
    }
    if (material.brand.trim() !== record.brand) {
      skips.push({
        reason: "problem",
        file: record.file,
        index: record.index,
        id: record.id,
        brand: record.brand,
        name: record.name,
        messages: [`бренд не совпадает: в файле «${record.brand}», в БД «${material.brand}»`]
      });
      continue;
    }
    if (materialHasSpecs(material)) {
      skips.push({
        reason: "filled",
        file: record.file,
        index: record.index,
        id: record.id,
        brand: record.brand,
        name: record.name,
        messages: ["уже заполнен"]
      });
      continue;
    }
    const patch = buildSpecPatch(record);
    if (Object.keys(patch).length === 0) {
      skips.push({
        reason: "empty",
        file: record.file,
        index: record.index,
        id: record.id,
        brand: record.brand,
        name: record.name,
        messages: ["пусто"]
      });
      continue;
    }
    updates.push({
      file: record.file,
      index: record.index,
      id: record.id,
      dbId: material.id,
      brand: record.brand,
      sku: record.sku,
      name: record.name,
      patch
    });
  }

  return { updates, skips };
}

function emptyTally(brand: string): BrandResearchTally {
  return { brand, total: 0, change: 0, empty: 0, problem: 0, filled: 0, missing: 0 };
}

/** Сводка для отчёта скрипта: всего, к изменению, пропуски и разбивка по брендам. */
export function summarizeResearchPlan(plan: ResearchPlan): ResearchSummary {
  const byBrand = new Map<string, BrandResearchTally>();
  const take = (brand: string) => {
    const key = brand || "—";
    const row = byBrand.get(key) ?? emptyTally(key);
    byBrand.set(key, row);
    return row;
  };

  for (const update of plan.updates) {
    const row = take(update.brand);
    row.total += 1;
    row.change += 1;
  }
  for (const skip of plan.skips) {
    const row = take(skip.brand);
    row.total += 1;
    if (skip.reason === "empty") row.empty += 1;
    else if (skip.reason === "problem") row.problem += 1;
    else if (skip.reason === "filled") row.filled += 1;
    else row.missing += 1;
  }

  const rows = [...byBrand.values()].sort((left, right) => left.brand.localeCompare(right.brand, "ru"));
  const summary: ResearchSummary = {
    total: 0,
    change: 0,
    empty: 0,
    problem: 0,
    filled: 0,
    missing: 0,
    byBrand: rows
  };
  for (const row of rows) {
    summary.total += row.total;
    summary.change += row.change;
    summary.empty += row.empty;
    summary.problem += row.problem;
    summary.filled += row.filled;
    summary.missing += row.missing;
  }
  return summary;
}
