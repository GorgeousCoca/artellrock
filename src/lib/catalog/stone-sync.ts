/**
 * План сверки каталога камня (`stone-catalog.json`) с коллекцией `materials`.
 *
 * Каталог — источник кадра и пустых характеристик. База — источник цены и флага
 * «Показывать в калькуляторе»: план эти поля не меняет и ничего не удаляет.
 * Неоднозначное сопоставление не угадывается. Демо-записи («[ДЕМО]») в план не входят.
 */
import { materialKey, normalizeTitle, SKU_MATCHED_BRANDS } from "@/lib/catalog/identity";
import { STONE_THICKNESSES_MM, type StoneFinish, type StoneFormat } from "@/lib/calculator/taxonomy";

import {
  indexQuartzMaterials,
  matchQuartzMaterial,
  type QuartzDecorRef,
  type QuartzMaterialRef
} from "./quartz-match";

const DEMO_PREFIX = "[ДЕМО]";
const THICKNESS_VALUES = new Set<string>(STONE_THICKNESSES_MM.map((mm) => String(mm)));

export type ThicknessValue = "12" | "15" | "20" | "30";

export type SyncMaterial = {
  id: number | string;
  brand: string;
  name: string;
  sku?: string | null;
  image?: string | null;
  shade?: string | null;
  finish?: string | null;
  formats?: readonly string[] | null;
  thicknessesMm?: readonly string[] | null;
  sheetLengthMm?: number | null;
  sheetWidthMm?: number | null;
};

/** Камень каталога, уже приведённый к полям материала. */
export type SyncStone = {
  brandName: string;
  name: string;
  sku: string;
  slug: string;
  sortOrder: number;
  /** Первый кадр витрины. Пишем в базу только путь `/images/stones/…`, который есть на диске. */
  hero: string;
  heroReady: boolean;
  formats: readonly StoneFormat[];
  thicknessesMm: readonly number[];
  finish?: StoneFinish;
  shades: readonly string[];
  sheetLengthMm?: number;
  sheetWidthMm?: number;
  ref: QuartzDecorRef;
};

export type MaterialPatch = {
  image?: string;
  shade?: string;
  finish?: StoneFinish;
  formats?: StoneFormat[];
  thicknessesMm?: ThicknessValue[];
  sheetLengthMm?: number;
  sheetWidthMm?: number;
};

export type SyncUpdate = {
  id: number | string;
  brand: string;
  name: string;
  patch: MaterialPatch;
};

export type SyncCreate = {
  brand: string;
  name: string;
  sku?: string;
  image?: string;
  shade?: string;
  finish?: StoneFinish;
  formats?: StoneFormat[];
  thicknessesMm?: ThicknessValue[];
  sheetLengthMm?: number;
  sheetWidthMm?: number;
  pricePerSqm: 0;
  isActive: false;
  sortOrder: number;
};

export type SyncGap = {
  brand: string;
  name: string;
  sku: string;
  reason: string;
};

export type SyncPlan = {
  updates: SyncUpdate[];
  creates: SyncCreate[];
  ambiguous: SyncGap[];
  /** Материалы без демо, которым не нашёлся камень. Не удаляются. */
  unused: Array<Pick<SyncMaterial, "id" | "brand" | "name">>;
  ignoredDemo: number;
};

const idOf = (id: number | string) => String(id);

function asRef(material: SyncMaterial): QuartzMaterialRef {
  return {
    id: material.id,
    brand: material.brand,
    name: material.name,
    sku: material.sku,
    image: material.image,
    isActive: true,
    pricePerSqm: 0,
    formats: [],
    thicknessesMm: [],
    shades: [],
    textures: []
  };
}

function thicknessValues(mms: readonly number[]): ThicknessValue[] {
  const out: ThicknessValue[] = [];
  for (const mm of mms) {
    const value = String(mm);
    if (!THICKNESS_VALUES.has(value) || out.includes(value as ThicknessValue)) continue;
    out.push(value as ThicknessValue);
  }
  return out;
}

function shadeText(shades: readonly string[]): string | undefined {
  const text = shades.map((shade) => shade.trim()).filter(Boolean).join(" / ");
  return text || undefined;
}

function catalogFields(stone: SyncStone): MaterialPatch {
  const patch: MaterialPatch = {};
  const shade = shadeText(stone.shades);
  const thicknesses = thicknessValues(stone.thicknessesMm);
  if (shade) patch.shade = shade;
  if (stone.finish) patch.finish = stone.finish;
  if (stone.formats.length > 0) patch.formats = [...stone.formats];
  if (thicknesses.length > 0) patch.thicknessesMm = thicknesses;
  if (stone.sheetLengthMm) patch.sheetLengthMm = stone.sheetLengthMm;
  if (stone.sheetWidthMm) patch.sheetWidthMm = stone.sheetWidthMm;
  if (stone.heroReady && stone.hero.startsWith("/images/stones/")) patch.image = stone.hero;
  return patch;
}

/** Дописывает только пустые характеристики. Цена и активность сюда не входят. */
export function patchForMaterial(material: SyncMaterial, stone: SyncStone): MaterialPatch {
  const incoming = catalogFields(stone);
  const patch: MaterialPatch = {};

  if (incoming.image && incoming.image !== (material.image ?? "").trim()) patch.image = incoming.image;
  if (incoming.shade && !(material.shade ?? "").trim()) patch.shade = incoming.shade;
  if (incoming.finish && !(material.finish ?? "").trim()) patch.finish = incoming.finish;
  if (incoming.formats && !(material.formats ?? []).length) patch.formats = incoming.formats;
  if (incoming.thicknessesMm && !(material.thicknessesMm ?? []).length) patch.thicknessesMm = incoming.thicknessesMm;
  if (incoming.sheetLengthMm != null && material.sheetLengthMm == null) patch.sheetLengthMm = incoming.sheetLengthMm;
  if (incoming.sheetWidthMm != null && material.sheetWidthMm == null) patch.sheetWidthMm = incoming.sheetWidthMm;

  return patch;
}

function createFrom(stone: SyncStone): SyncCreate {
  const fields = catalogFields(stone);
  const sku = stone.sku.trim();
  return {
    brand: stone.brandName,
    name: stone.name,
    ...(sku ? { sku } : {}),
    ...fields,
    pricePerSqm: 0,
    isActive: false,
    sortOrder: stone.sortOrder
  };
}

function gap(stone: SyncStone, reason: string): SyncGap {
  return { brand: stone.brandName, name: stone.name, sku: stone.sku, reason };
}

const MAT_TOKEN = "mat";
const SKU_BRANDS = new Set<string>(SKU_MATCHED_BRANDS);

function words(text: string): string[] {
  return normalizeTitle(text).split(" ").filter(Boolean);
}

function sorted(tokens: readonly string[]): string {
  return tokens.filter(Boolean).slice().sort().join(" ");
}

/** Короткий чисто цифровой ключ не используем: «100» само по себе ничего не отличает. */
function remember(keys: Set<string>, prefix: string, tokens: readonly string[]) {
  const value = sorted(tokens);
  if (value.length < 4) return;
  if (!value.includes(" ") && /^\d+$/.test(value)) return;
  keys.add(`${prefix}${value}`);
}

/** «AC 711» и «G 2807» — тот же артикул, что «AC711» и «G2807». */
function foldJoin(tokens: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const next = tokens[i + 1];
    if (next && /^[a-z]{1,5}$/.test(tokens[i]) && /^\d{2,4}$/.test(next)) {
      out.push(tokens[i] + next);
      i += 1;
    } else {
      out.push(tokens[i]);
    }
  }
  return out;
}

/** В каталоге Asterum артикул «A0001» или «А5108» (кириллическая А), в базе — «0001» и «5108». */
function stripSkuA(tokens: readonly string[]): string[] {
  return tokens.map((token) => (/^[aа]\d{3,4}$/.test(token) ? token.slice(1) : token));
}

function variants(tokens: readonly string[]): string[][] {
  const lists = [tokens, foldJoin(tokens), stripSkuA(tokens), stripSkuA(foldJoin(tokens))];
  const unique: string[][] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    const mark = list.join(" ");
    if (seen.has(mark)) continue;
    seen.add(mark);
    unique.push([...list]);
  }
  return unique;
}

function addIdentity(keys: Set<string>, text: string) {
  for (const list of variants(words(text))) {
    remember(keys, "t:", list);
    remember(keys, "tm:", list.filter((token) => token !== MAT_TOKEN));
  }
}

function stripBrand(brandName: string, name: string): string {
  let tokens = words(name);
  const brand = words(brandName);
  if (brand.length > 0 && tokens.slice(0, brand.length).join(" ") === brand.join(" ")) tokens = tokens.slice(brand.length);
  if (tokens[0] === "quartz") tokens = tokens.slice(1);
  return tokens.join(" ");
}

function skuHints(name: string): string[] {
  const tokens = words(name);
  const hints: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const next = tokens[i + 1];
    if (next && /^[a-z]{1,5}$/.test(tokens[i]) && /^\d{2,4}$/.test(next)) {
      hints.push(tokens[i] + next);
      hints.push(`${tokens[i]} ${next}`);
      i += 1;
      continue;
    }
    if (/^\d{3,4}$/.test(tokens[i])) hints.push(tokens[i]);
  }
  return hints;
}

function withBrand(brand: string, keys: Set<string>): string[] {
  const prefix = `${normalizeTitle(brand)}|`;
  return [...keys].map((key) => prefix + key);
}

function stoneLooseKeys(stone: SyncStone): string[] {
  const keys = new Set<string>();
  const name = stripBrand(stone.brandName, stone.name);
  addIdentity(keys, name);
  if (stone.sku.trim()) addIdentity(keys, `${stone.sku} ${name}`);
  for (const list of variants(words(name))) remember(keys, "n:", list);
  if (SKU_BRANDS.has(stone.brandName)) {
    if (/^\d{3,4}$/.test(normalizeTitle(stone.sku))) keys.add(`s:${normalizeTitle(stone.sku)}`);
    for (const hint of skuHints(stone.name)) keys.add(`s:${normalizeTitle(hint)}`);
  }
  return withBrand(stone.brandName, keys);
}

function materialLooseKeys(material: SyncMaterial): string[] {
  const keys = new Set<string>();
  addIdentity(keys, `${material.sku ?? ""} ${material.name}`);
  for (const list of variants(words(material.name))) remember(keys, "n:", list);
  const sku = normalizeTitle(material.sku ?? "");
  if (sku) {
    keys.add(`s:${sku}`);
    keys.add(`s:${sku.replace(/\s+/g, "")}`);
  }
  return withBrand(material.brand, keys);
}

/**
 * Вторая связь: порядок слов, пробел в артикуле, лишняя «A» у Asterum, «мат» в одном из названий.
 * Avant Quartz и Avarus с кириллицей в каталоге связываются по числовому артикулу из названия.
 * Ключ, который указывает на разные записи, пропускается. Совпали разные записи — камень не угадываем.
 */
function linkLoose(
  pending: readonly SyncStone[],
  materials: readonly SyncMaterial[],
  linked: Map<string, SyncStone>,
  resolved: Set<SyncStone>,
  ambiguous: SyncGap[]
) {
  const free = materials.filter((material) => !linked.has(idOf(material.id)));
  const byKey = new Map<string, SyncMaterial[]>();
  for (const material of free) {
    for (const key of materialLooseKeys(material)) {
      const list = byKey.get(key) ?? [];
      list.push(material);
      byKey.set(key, list);
    }
  }

  const claims = new Map<string, SyncStone[]>();
  for (const stone of pending) {
    if (resolved.has(stone)) continue;
    const hits = new Map<string, SyncMaterial>();
    for (const key of stoneLooseKeys(stone)) {
      const list = byKey.get(key) ?? [];
      const ids = [...new Set(list.map((item) => idOf(item.id)))];
      if (ids.length !== 1) continue;
      hits.set(ids[0], list[0]);
    }
    if (hits.size !== 1) {
      if (hits.size > 1) {
        ambiguous.push(gap(stone, "несколько записей подходят по названию"));
        resolved.add(stone);
      }
      continue;
    }
    const id = [...hits.keys()][0];
    const list = claims.get(id) ?? [];
    list.push(stone);
    claims.set(id, list);
  }

  for (const [id, list] of claims) {
    if (list.length === 1) {
      linked.set(id, list[0]);
      resolved.add(list[0]);
      continue;
    }
    for (const stone of list) {
      ambiguous.push(gap(stone, "несколько камней каталога подошли к одной записи"));
      resolved.add(stone);
    }
  }
}

function skuAliases(sku: string): string[] {
  const key = normalizeTitle(sku).replace(/\s+/g, "");
  if (!key) return [];
  const aliases = [key];
  if (/^[aа]\d{3,4}$/.test(key)) aliases.push(key.slice(1));
  return aliases;
}

/**
 * Один артикул в бренде — одна запись, даже если название отличается на букву
 * («Lux» / «Luxe», «Cappuccino» / «Cappucino»). Повторяющийся артикул не угадываем:
 * у Belenco «5250» — это и глянец, и Seta.
 */
function linkUniqueSku(
  pending: readonly SyncStone[],
  materials: readonly SyncMaterial[],
  linked: Map<string, SyncStone>,
  resolved: Set<SyncStone>,
  ambiguous: SyncGap[]
) {
  const free = materials.filter((material) => !linked.has(idOf(material.id)));
  const bySku = new Map<string, SyncMaterial[]>();
  for (const material of free) {
    const brand = normalizeTitle(material.brand);
    for (const alias of skuAliases(material.sku ?? "")) {
      const key = `${brand}|${alias}`;
      const list = bySku.get(key) ?? [];
      list.push(material);
      bySku.set(key, list);
    }
  }

  const claims = new Map<string, SyncStone[]>();
  for (const stone of pending) {
    if (resolved.has(stone)) continue;
    const brand = normalizeTitle(stone.brandName);
    const hits = new Map<string, SyncMaterial>();
    for (const alias of skuAliases(stone.sku)) {
      const list = bySku.get(`${brand}|${alias}`) ?? [];
      const ids = [...new Set(list.map((item) => idOf(item.id)))];
      if (ids.length !== 1) continue;
      hits.set(ids[0], list[0]);
    }
    if (hits.size !== 1) continue;
    const id = [...hits.keys()][0];
    const list = claims.get(id) ?? [];
    list.push(stone);
    claims.set(id, list);
  }

  for (const [id, list] of claims) {
    if (list.length === 1) {
      linked.set(id, list[0]);
      resolved.add(list[0]);
      continue;
    }
    for (const stone of list) {
      ambiguous.push(gap(stone, "несколько камней каталога подошли к одному артикулу"));
      resolved.add(stone);
    }
  }
}

/**
 * Сопоставление и список правок. Чистая функция: базу не читает.
 * Сначала точная связь каталога (кадр и ключ названия), затем по словам и по единственному артикулу.
 */
export function planStoneSync(stones: readonly SyncStone[], materials: readonly SyncMaterial[]): SyncPlan {
  const demo = materials.filter((material) => material.name.trim().startsWith(DEMO_PREFIX));
  const real = materials.filter((material) => !material.name.trim().startsWith(DEMO_PREFIX));
  const byId = new Map(real.map((material) => [idOf(material.id), material]));
  const index = indexQuartzMaterials(real.map(asRef));

  const claims = new Map<string, SyncStone[]>();
  const ambiguous: SyncGap[] = [];
  const pending: SyncStone[] = [];
  const resolved = new Set<SyncStone>();

  for (const stone of stones) {
    const match = matchQuartzMaterial(stone.brandName, stone.ref, index);
    if (match.status === "matched") {
      const id = idOf(match.material.id);
      const list = claims.get(id);
      if (list) list.push(stone);
      else claims.set(id, [stone]);
      continue;
    }
    if (match.status === "ambiguous") {
      ambiguous.push(gap(stone, "несколько записей в базе подходят одинаково"));
      resolved.add(stone);
      continue;
    }
    pending.push(stone);
  }

  const linked = new Map<string, SyncStone>();
  for (const [id, list] of claims) {
    if (list.length === 1) {
      linked.set(id, list[0]);
      resolved.add(list[0]);
      continue;
    }
    for (const stone of list) {
      ambiguous.push(gap(stone, "несколько камней каталога подошли к одной записи"));
      resolved.add(stone);
    }
  }

  linkLoose(pending, real, linked, resolved, ambiguous);
  linkUniqueSku(pending, real, linked, resolved, ambiguous);

  const updates: SyncUpdate[] = [];
  for (const [id, stone] of linked) {
    const material = byId.get(id);
    if (!material) continue;
    const patch = patchForMaterial(material, stone);
    if (Object.keys(patch).length === 0) continue;
    updates.push({ id: material.id, brand: material.brand, name: material.name, patch });
  }

  const creates: SyncCreate[] = [];
  for (const stone of pending) {
    if (resolved.has(stone)) continue;
    const key = materialKey({ id: 0, brand: stone.brandName, name: stone.name, sku: stone.sku });
    const sameKey = real.some(
      (material) => normalizeTitle(material.brand) === normalizeTitle(stone.brandName) && materialKey(material) === key
    );
    if (sameKey) {
      ambiguous.push(gap(stone, "такое название уже есть в базе, но связь неоднозначна"));
      continue;
    }
    creates.push(createFrom(stone));
  }

  const used = new Set(linked.keys());
  const unused = real
    .filter((material) => !used.has(idOf(material.id)))
    .map((material) => ({ id: material.id, brand: material.brand, name: material.name }));

  return { updates, creates, ambiguous, unused, ignoredDemo: demo.length };
}
