/**
 * Разбор файла характеристик камней (`scripts/data/material-specs.txt`).
 *
 * Чистая функция без ввода-вывода: файл читает скрипт импорта (`scripts/import-material-specs.ts`).
 * Характеристики — данные владельца, в коде их нет.
 *
 * Формат:
 *   преамбула с легендой форматов `[N]` / `[N+]` / `[J]` / `[J+]` (сверяется со словарём `STONE_FORMATS`);
 *   ### N. Бренд
 *   * **Название** — Формат: `[N]`, `[J]` | Толщина: 20 мм, 30 мм | Оттенок: … | Полировка: … | Фактура: …
 *
 * Пустые строки и разделители `---` игнорируются. Вводный текст до первого бренда тоже, кроме легенды.
 * Строка камня (`* **` внутри секции бренда), которую не удалось разобрать, — ошибка с номером строки:
 * такие строки молча не пропускаются. Значение вне словаря `taxonomy.ts` — тоже ошибка.
 *
 * Единственная починка битой строки: если метка поля («Формат», «Толщина», «Оттенок», «Полировка»,
 * «Фактура») встречается дважды, берётся последнее вхождение, а в `warnings` пишется, что поле продублировано.
 */

import {
  STONE_FINISHES,
  STONE_FORMATS,
  STONE_SHADES,
  STONE_TEXTURES,
  STONE_THICKNESSES_MM,
  type StoneFinish,
  type StoneFormat
} from "@/lib/calculator/taxonomy";

const SHADES: readonly string[] = STONE_SHADES;
const TEXTURES: readonly string[] = STONE_TEXTURES;
const THICKNESSES: readonly number[] = STONE_THICKNESSES_MM;
const FORMAT_VALUES = new Set<string>(STONE_FORMATS.map((item) => item.value));

const FIELD_LABELS = ["Формат", "Толщина", "Оттенок", "Полировка", "Фактура"] as const;
type FieldLabel = (typeof FIELD_LABELS)[number];

export type SpecRow = {
  brand: string;
  title: string;
  formats: StoneFormat[];
  thicknessesMm: number[];
  shades: string[];
  finish: StoneFinish | null;
  textures: string[];
  /** Номер строки в файле, с 1. */
  line: number;
  warnings: string[];
};

export type SpecList = {
  /** Бренды в порядке файла. */
  brands: string[];
  rows: SpecRow[];
};

export class SpecListError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly text: string
  ) {
    super(`Строка ${line}: ${message}\n  ${JSON.stringify(text)}`);
    this.name = "SpecListError";
  }
}

const HEADING = /^###\s+(\d+)\.\s+(.+?)\s*$/;
const SEPARATOR = /^-{3,}$/;
// Легенда: `* **`[N]` (NORMAL)** — 3040 × 1440 мм`. Знак умножения — U+00D7, как в словаре.
const LEGEND =
  /^\*\s+\*\*`\[([^\]]+)\]`\s+\(([^)]+)\)\*\*\s+[—–-]\s+(\d+)\s+\u00D7\s+(\d+)\s+мм\s*$/;
const ITEM = /^\*\s+\*\*(.+?)\*\*\s+[—–-]\s+(.+)$/;
const FIELD_MARK = /(Формат|Толщина|Оттенок|Полировка|Фактура)\s*:/g;

function unique<T>(items: readonly T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function cleanValue(value: string): string {
  return value.replace(/\s*\|\s*$/g, "").trim();
}

function extractFields(
  body: string,
  line: number,
  raw: string
): { values: Record<FieldLabel, string>; warnings: string[] } {
  const hits: { label: FieldLabel; start: number; valueStart: number }[] = [];
  FIELD_MARK.lastIndex = 0;
  for (const match of body.matchAll(FIELD_MARK)) {
    const label = match[1] as FieldLabel;
    const start = match.index ?? 0;
    hits.push({ label, start, valueStart: start + match[0].length });
  }

  const warnings: string[] = [];
  const values = {} as Record<FieldLabel, string>;
  for (const label of FIELD_LABELS) {
    const occurrences = hits.filter((hit) => hit.label === label);
    if (occurrences.length === 0) {
      throw new SpecListError(`нет поля «${label}»`, line, raw);
    }
    if (occurrences.length > 1) {
      warnings.push(`поле ${label} продублировано, взято последнее значение`);
    }
    const last = occurrences[occurrences.length - 1];
    const next = hits.find((hit) => hit.start > last.start);
    const value = cleanValue(body.slice(last.valueStart, next ? next.start : body.length));
    if (!value) throw new SpecListError(`пустое поле «${label}»`, line, raw);
    values[label] = value;
  }
  return { values, warnings };
}

function parseFormats(value: string, line: number, raw: string): StoneFormat[] {
  const found = [...value.matchAll(/\[([^\]]+)\]/g)];
  if (found.length === 0) throw new SpecListError("пустое поле «Формат»", line, raw);
  // В файле код обёрнут в обратные кавычки markdown: `` `[N]`, `[J]` ``.
  const rest = value.replace(/\[[^\]]+\]/g, "").replace(/[`', ]/g, "");
  if (rest !== "") throw new SpecListError(`не разобран формат «${value}»`, line, raw);

  const formats: StoneFormat[] = [];
  for (const match of found) {
    const code = match[1];
    if (!FORMAT_VALUES.has(code)) throw new SpecListError(`недопустимый формат «${code}»`, line, raw);
    formats.push(code as StoneFormat);
  }
  return unique(formats);
}

function parseThicknesses(value: string, line: number, raw: string): number[] {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) throw new SpecListError("пустое поле «Толщина»", line, raw);
  const thicknesses: number[] = [];
  for (const part of parts) {
    const match = /^(\d+)\s*мм$/.exec(part);
    if (!match) throw new SpecListError(`не разобрана толщина «${part}»`, line, raw);
    const mm = Number(match[1]);
    if (!THICKNESSES.includes(mm)) throw new SpecListError(`недопустимая толщина «${mm}»`, line, raw);
    thicknesses.push(mm);
  }
  return unique(thicknesses);
}

function parseTags(value: string, allowed: readonly string[], label: FieldLabel, line: number, raw: string): string[] {
  const tags = value.split("/").map((part) => part.trim()).filter(Boolean);
  if (tags.length === 0) throw new SpecListError(`пустое поле «${label}»`, line, raw);
  for (const tag of tags) {
    if (!allowed.includes(tag)) throw new SpecListError(`недопустимое значение «${label}»: «${tag}»`, line, raw);
  }
  return unique(tags);
}

function parseFinish(value: string, line: number, raw: string): StoneFinish {
  const finish = STONE_FINISHES.find((item) => item.label === value);
  if (!finish) throw new SpecListError(`недопустимая полировка «${value}»`, line, raw);
  return finish.value;
}

function parseStone(brand: string, text: string, line: number, raw: string): SpecRow {
  const item = ITEM.exec(text);
  if (!item) throw new SpecListError("строка камня не распознана", line, raw);

  const title = item[1].trim();
  if (!title) throw new SpecListError("пустое название", line, raw);

  const { values, warnings } = extractFields(item[2], line, raw);
  return {
    brand,
    title,
    formats: parseFormats(values.Формат, line, raw),
    thicknessesMm: parseThicknesses(values.Толщина, line, raw),
    shades: parseTags(values.Оттенок, SHADES, "Оттенок", line, raw),
    finish: parseFinish(values.Полировка, line, raw),
    textures: parseTags(values.Фактура, TEXTURES, "Фактура", line, raw),
    line,
    warnings
  };
}

function recordLegend(text: string, line: number, raw: string, seen: Map<string, true>) {
  const legend = LEGEND.exec(text);
  if (!legend) return false;

  const code = legend[1];
  const name = legend[2].trim();
  const lengthMm = Number(legend[3]);
  const widthMm = Number(legend[4]);
  const entry = STONE_FORMATS.find((item) => item.value === code);
  if (!entry) throw new SpecListError(`в легенде формат «${code}», его нет в словаре`, line, raw);
  if (entry.name !== name || entry.lengthMm !== lengthMm || entry.widthMm !== widthMm) {
    throw new SpecListError(
      `легенда [${code}] не совпадает со словарём: в файле ${name} ${lengthMm}×${widthMm}, в словаре ${entry.name} ${entry.lengthMm}×${entry.widthMm}`,
      line,
      raw
    );
  }
  if (seen.has(code)) throw new SpecListError(`формат [${code}] в легенде указан дважды`, line, raw);
  seen.set(code, true);
  return true;
}

function assertLegend(seen: Map<string, true>, line: number, raw: string) {
  const missing = STONE_FORMATS.filter((item) => !seen.has(item.value));
  if (missing.length === 0) return;
  throw new SpecListError(
    `легенда форматов не совпадает со словарём: нет ${missing.map((item) => `[${item.value}]`).join(", ")}`,
    line,
    raw
  );
}

export function parseSpecList(source: string): SpecList {
  const brands: string[] = [];
  const rows: SpecRow[] = [];
  let brand: string | null = null;
  let legendChecked = false;
  const legendSeen = new Map<string, true>();

  const lines = source.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);

  const ensureLegend = (line: number, raw: string) => {
    if (legendChecked) return;
    legendChecked = true;
    assertLegend(legendSeen, line, raw);
  };

  lines.forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trim();
    if (text === "" || SEPARATOR.test(text)) return;

    const heading = HEADING.exec(text);
    if (heading) {
      ensureLegend(line, raw);
      const name = heading[2].trim();
      if (!name) throw new SpecListError("пустой заголовок бренда", line, raw);
      if (brands.includes(name)) throw new SpecListError(`бренд «${name}» объявлен дважды`, line, raw);
      brands.push(name);
      brand = name;
      return;
    }

    if (brand === null) {
      if (recordLegend(text, line, raw, legendSeen)) return;
      if (text.startsWith("* **") && ITEM.test(text)) {
        throw new SpecListError("позиция до заголовка бренда", line, raw);
      }
      return;
    }

    if (!text.startsWith("* **")) {
      throw new SpecListError("строка не распознана", line, raw);
    }
    rows.push(parseStone(brand, text, line, raw));
  });

  if (!legendChecked) ensureLegend(lines.length || 1, lines.at(-1) ?? "");
  return { brands, rows };
}
