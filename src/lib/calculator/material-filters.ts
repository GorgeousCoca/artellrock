/**
 * Общие чистые фильтры характеристик камня. Их используют и калькулятор, и каталог кварца:
 * один и тот же камень проходит или не проходит одинаково на обеих страницах.
 *
 * Между выбранными критериями — И. Внутри многозначного поля (форматы, толщины, оттенки, фактуры) — ИЛИ:
 * камню достаточно одного совпадения. Критерий `null` не фильтрует. Если по выбранному критерию у камня
 * данных нет, он не подходит.
 */
import type { MaterialCard } from "./types";
import { STONE_FINISHES, STONE_FORMATS, STONE_SHADES, STONE_TEXTURES, STONE_THICKNESSES_MM, type StoneFinish, type StoneFormat } from "./taxonomy";

export type StoneFilters = {
  format: StoneFormat | null;
  thicknessMm: number | null;
  shade: string | null;
  finish: StoneFinish | null;
  texture: string | null;
};

export const EMPTY_STONE_FILTERS: StoneFilters = {
  format: null,
  thicknessMm: null,
  shade: null,
  finish: null,
  texture: null
};

export type StoneSpecs = Pick<MaterialCard, "formats" | "thicknessesMm" | "shades" | "finish" | "textures">;

export function matchesStoneFilters(specs: StoneSpecs, filters: StoneFilters): boolean {
  if (filters.format !== null && !specs.formats.includes(filters.format)) return false;
  if (filters.thicknessMm !== null && !specs.thicknessesMm.includes(filters.thicknessMm)) return false;
  if (filters.shade !== null && !specs.shades.includes(filters.shade)) return false;
  if (filters.finish !== null && specs.finish !== filters.finish) return false;
  if (filters.texture !== null && !specs.textures.includes(filters.texture)) return false;
  return true;
}

function inDictionaryOrder<T>(order: readonly T[], present: ReadonlySet<T>): T[] {
  return order.filter((value) => present.has(value));
}

/** Значения, которые реально есть у переданных камней, в порядке словарей `taxonomy.ts`. */
export function collectStoneFilterOptions(items: readonly StoneSpecs[]): {
  formats: StoneFormat[];
  thicknessesMm: number[];
  shades: string[];
  finishes: StoneFinish[];
  textures: string[];
} {
  const formats = new Set<StoneFormat>();
  const thicknessesMm = new Set<number>();
  const shades = new Set<string>();
  const finishes = new Set<StoneFinish>();
  const textures = new Set<string>();

  for (const item of items) {
    for (const value of item.formats) formats.add(value);
    for (const value of item.thicknessesMm) thicknessesMm.add(value);
    for (const value of item.shades) shades.add(value);
    if (item.finish) finishes.add(item.finish);
    for (const value of item.textures) textures.add(value);
  }

  return {
    formats: inDictionaryOrder(
      STONE_FORMATS.map((format) => format.value),
      formats
    ),
    thicknessesMm: inDictionaryOrder(STONE_THICKNESSES_MM, thicknessesMm),
    shades: inDictionaryOrder(STONE_SHADES, shades),
    finishes: inDictionaryOrder(
      STONE_FINISHES.map((finish) => finish.value),
      finishes
    ),
    textures: inDictionaryOrder(STONE_TEXTURES, textures)
  };
}

export function hasActiveStoneFilters(filters: StoneFilters): boolean {
  return filters.format !== null || filters.thicknessMm !== null || filters.shade !== null || filters.finish !== null || filters.texture !== null;
}
