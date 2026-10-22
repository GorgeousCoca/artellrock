import { normalizeTitle } from "@/lib/catalog/identity";
import { STONE_FORMATS, STONE_SHADES, type StoneFinish, type StoneFormat } from "@/lib/calculator/taxonomy";
import type { QuartzDecorRef } from "@/lib/catalog/quartz-match";

import stones from "./stone-catalog.json";
import decorLinks from "./stone-decor-links.json";

/**
 * Камень → старый декор из `quartz-decors.ts`, к которому в базе привязана цена.
 * Файл собирает `scripts/link-stone-decors.ts`, ключ — `{бренд}/{slug}`.
 */
const stoneDecorLinks = decorLinks as Record<string, { image: string; name: string }>;

export type StoneCharacteristic = {
  title: string;
  value: string;
};

export type StoneRecord = {
  brandSlug: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  characteristics: StoneCharacteristic[];
  images: string[];
};

export const stoneCatalog = stones as StoneRecord[];

const byBrand = new Map<string, StoneRecord[]>();
const byKey = new Map<string, StoneRecord>();

for (const stone of stoneCatalog) {
  const list = byBrand.get(stone.brandSlug);
  if (list) list.push(stone);
  else byBrand.set(stone.brandSlug, [stone]);
  byKey.set(`${stone.brandSlug}/${stone.slug}`, stone);
}

export function stonesForBrand(brandSlug: string): StoneRecord[] {
  return byBrand.get(brandSlug) ?? [];
}

export function getStone(brandSlug: string, slug: string): StoneRecord | undefined {
  return byKey.get(`${brandSlug}/${slug}`);
}

function nameKeys(stone: StoneRecord): string[] {
  const keys = [stone.name];
  if (stone.sku) keys.push(`${stone.sku} ${stone.name}`);
  return keys;
}

/** Склеивает переносы строк внутри абзаца, чтобы фраза не обрывалась на полуслове. */
export function stoneDescriptionText(description: string): string {
  return description.replace(/\s*\n\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim();
}

function characteristic(stone: StoneRecord, title: string): string {
  return stone.characteristics.find((item) => item.title === title)?.value.trim() ?? "";
}

const SHADE_SET = new Set<string>(STONE_SHADES);

function listedThicknesses(value: string): number[] {
  const found: number[] = [];
  for (const match of value.matchAll(/(\d{1,2})/g)) {
    const mm = Number(match[1]);
    if (mm >= 5 && mm <= 40 && !found.includes(mm)) found.push(mm);
  }
  return found;
}

function listedFinish(value: string): StoneFinish | undefined {
  const text = value.toLowerCase();
  if (text.includes("матов")) return "matte";
  if (text.includes("глян") || text.includes("полир")) return "polished";
  return undefined;
}

function listedFormats(value: string): StoneFormat[] {
  const numbers = [...value.matchAll(/(\d{3,4})/g)].map((match) => Number(match[1]));
  if (numbers.length < 2) return [];
  const [length, width] = numbers;
  const hit = STONE_FORMATS.find(
    (format) =>
      (format.lengthMm === length && format.widthMm === width) ||
      (format.lengthMm === width && format.widthMm === length)
  );
  return hit ? [hit.value] : [];
}

function listedShades(value: string): string[] {
  const shades: string[] = [];
  for (const part of value.split(/[/|,;]+/)) {
    const shade = part.trim().toLowerCase();
    if (!SHADE_SET.has(shade) || shades.includes(shade)) continue;
    shades.push(shade);
  }
  return shades;
}

/** Карточка каталога: фото и названия, по которым ищется цена в базе материалов. */
export function catalogRefForStone(
  stone: StoneRecord,
  decors: readonly { name: string; image: string }[],
  options: { withDecorLink?: boolean } = {}
): QuartzDecorRef {
  const keys = new Set(nameKeys(stone).map((name) => normalizeTitle(name)));
  const matchNames = nameKeys(stone);
  const matchImages: string[] = [];

  for (const decor of decors) {
    if (!keys.has(normalizeTitle(decor.name))) continue;
    matchNames.push(decor.name);
    matchImages.push(decor.image);
  }

  const link = options.withDecorLink === false ? undefined : stoneDecorLinks[`${stone.brandSlug}/${stone.slug}`];
  if (link) {
    if (!matchNames.includes(link.name)) matchNames.push(link.name);
    if (!matchImages.includes(link.image)) matchImages.push(link.image);
  }

  const finish = listedFinish(characteristic(stone, "Поверхность"));
  const sku = stone.sku.trim();

  return {
    name: stone.name,
    image: stone.images[0] || matchImages[0] || "/images/calculator/stone-texture.jpg",
    slug: stone.slug,
    ...(sku ? { sku } : {}),
    matchNames,
    matchImages,
    formats: listedFormats(characteristic(stone, "Размер слэба")),
    thicknessesMm: listedThicknesses(characteristic(stone, "Толщина материала")),
    ...(finish ? { finish } : {}),
    shades: listedShades(characteristic(stone, "Цвет"))
  };
}

/**
 * Карточки бренда для витрины: страницы камней из stone-catalog.json, затем «остаточные» декоры
 * из quartz-decors.ts, чью картинку не занял ни один камень. Единое правило для сайта и скриптов аудита.
 */
export function brandCatalogRefs(brand: { slug: string; decors: readonly { name: string; image: string }[] }): QuartzDecorRef[] {
  const stones = stonesForBrand(brand.slug);
  if (stones.length === 0) return [...brand.decors];

  const fromStones = stones.map((stone) => catalogRefForStone(stone, brand.decors));
  const covered = new Set(fromStones.flatMap((decor) => decor.matchImages ?? []));
  const leftovers = brand.decors.filter((decor) => !covered.has(decor.image));

  return [...fromStones, ...leftovers];
}
