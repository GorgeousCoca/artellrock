/**
 * Соединение статического декора кварца с материалом из БД. Чистые функции, без Next и Payload.
 *
 * Сначала совпадение по `image` (кадр из каталога камня или старый путь, с которым материал засеян).
 * Если картинка не одна — оставляем запись того же бренда, когда она единственная.
 * Если картинка не сопоставилась — запасной ключ: нормализованные «бренд + артикул + название»
 * (`normalizeTitle` и `materialKey`). Несколько кандидатов на ключ не угадываем:
 * декор остаётся без цены и характеристик.
 *
 * Неактивный материал и материал с ценой 0 отдают характеристики, но цену `null`.
 */
import { materialKey, normalizeTitle, sameBrandName, type MaterialLike } from "@/lib/catalog/identity";
import type { StoneFinish, StoneFormat } from "@/lib/calculator/taxonomy";

export type QuartzDecorRef = {
  name: string;
  image: string;
  /** Страница камня: /catalog-kvarca/{бренд}/{slug}. */
  slug?: string;
  /** Артикул из каталога, если в базе материалов его нет. */
  sku?: string;
  /** Дополнительные картинки для связи с материалом в БД. */
  matchImages?: readonly string[];
  /** Дополнительные названия для связи с материалом в БД. */
  matchNames?: readonly string[];
  /** Характеристики каталога. Подставляются, только если материал в базе не нашёлся. */
  formats?: readonly StoneFormat[];
  thicknessesMm?: readonly number[];
  finish?: StoneFinish;
  shades?: readonly string[];
  textures?: readonly string[];
};

export type QuartzMaterialRef = MaterialLike & {
  image?: string | null;
  isActive: boolean;
  /** Уже кратно 250 (нормализация на чтении в `toMaterial`). 0 — цены нет. */
  pricePerSqm: number;
  formats: StoneFormat[];
  thicknessesMm: number[];
  finish?: StoneFinish;
  shades: string[];
  textures: string[];
};

export type QuartzCatalogDecor = {
  name: string;
  image: string;
  price: number | null;
  sku?: string;
  /** Если есть, карточка ведёт на страницу этого декора. */
  slug?: string;
  formats: StoneFormat[];
  thicknessesMm: number[];
  finish?: StoneFinish;
  shades: string[];
  textures: string[];
};

export type BrandPriceSpan = { min: number; max: number };

/** Запасной ключ декора: бренд и полное название (артикул уже внутри названия). */
export function quartzDecorKey(brandName: string, decorName: string): string {
  return normalizeTitle(`${brandName} ${decorName}`);
}

/** Запасной ключ материала: бренд + артикул + название. */
export function quartzMaterialKey(material: MaterialLike): string {
  return normalizeTitle(`${material.brand} ${materialKey(material)}`);
}

function push(map: Map<string, QuartzMaterialRef[]>, key: string, material: QuartzMaterialRef) {
  const group = map.get(key);
  if (group) group.push(material);
  else map.set(key, [material]);
}

function sameBrand(material: QuartzMaterialRef, brandName: string) {
  return sameBrandName(material.brand, brandName);
}

/** Одна запись, либо единственная запись этого бренда среди нескольких с той же картинкой. */
function pickByImage(candidates: readonly QuartzMaterialRef[], brandName: string): QuartzMaterialRef | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  const own = candidates.filter((item) => sameBrand(item, brandName));
  return own.length === 1 ? own[0] : undefined;
}

function pickByKey(candidates: readonly QuartzMaterialRef[]): QuartzMaterialRef | undefined {
  return candidates.length === 1 ? candidates[0] : undefined;
}

function toDecor(decor: QuartzDecorRef, material: QuartzMaterialRef | undefined): QuartzCatalogDecor {
  const catalogSku = decor.sku?.trim();

  if (!material) {
    return {
      name: decor.name,
      image: decor.image,
      price: null,
      ...(catalogSku ? { sku: catalogSku } : {}),
      formats: [...(decor.formats ?? [])],
      thicknessesMm: [...(decor.thicknessesMm ?? [])],
      ...(decor.finish ? { finish: decor.finish } : {}),
      shades: [...(decor.shades ?? [])],
      textures: [...(decor.textures ?? [])]
    };
  }

  const sku = material.sku?.trim() || catalogSku;
  const priced = material.isActive && material.pricePerSqm > 0;

  return {
    name: decor.name,
    image: decor.image,
    price: priced ? material.pricePerSqm : null,
    ...(sku ? { sku } : {}),
    formats: material.formats,
    thicknessesMm: material.thicknessesMm,
    finish: material.finish,
    shades: material.shades,
    textures: material.textures
  };
}

export type QuartzMaterialIndex = {
  byImage: Map<string, QuartzMaterialRef[]>;
  byKey: Map<string, QuartzMaterialRef[]>;
};

/** Один проход по материалам. Каталог брендов переиспользует индекс, а не строит его заново. */
export function indexQuartzMaterials(materials: readonly QuartzMaterialRef[]): QuartzMaterialIndex {
  const byImage = new Map<string, QuartzMaterialRef[]>();
  const byKey = new Map<string, QuartzMaterialRef[]>();

  for (const material of materials) {
    const image = material.image?.trim();
    if (image) push(byImage, image, material);
    const key = quartzMaterialKey(material);
    if (key) push(byKey, key, material);
  }

  return { byImage, byKey };
}

export type QuartzMatch =
  | { status: "matched"; material: QuartzMaterialRef }
  | { status: "none" }
  | { status: "ambiguous" };

/**
 * Та же связь, что у карточки каталога. `none` — кандидата нет, запись можно создать.
 * `ambiguous` — кандидатов несколько, угадывать нельзя.
 */
export function matchQuartzMaterial(
  brandName: string,
  decor: QuartzDecorRef,
  index: QuartzMaterialIndex
): QuartzMatch {
  let sawAmbiguous = false;

  for (const image of [decor.image, ...(decor.matchImages ?? [])]) {
    const candidates = index.byImage.get(image) ?? [];
    const material = pickByImage(candidates, brandName);
    if (material) return { status: "matched", material };
    if (candidates.length > 1) sawAmbiguous = true;
  }

  for (const name of [decor.name, ...(decor.matchNames ?? [])]) {
    const candidates = index.byKey.get(quartzDecorKey(brandName, name)) ?? [];
    const material = pickByKey(candidates);
    if (material) return { status: "matched", material };
    if (candidates.length > 1) sawAmbiguous = true;
  }

  return sawAmbiguous ? { status: "ambiguous" } : { status: "none" };
}

export function findQuartzMaterial(
  brandName: string,
  decor: QuartzDecorRef,
  index: QuartzMaterialIndex
): QuartzMaterialRef | undefined {
  const match = matchQuartzMaterial(brandName, decor, index);
  return match.status === "matched" ? match.material : undefined;
}

export function joinBrandDecors(
  brandName: string,
  decors: readonly QuartzDecorRef[],
  materials: readonly QuartzMaterialRef[] | QuartzMaterialIndex
): QuartzCatalogDecor[] {
  const index = "byImage" in materials ? materials : indexQuartzMaterials(materials);

  return decors.map((decor) => {
    const card = toDecor(decor, findQuartzMaterial(brandName, decor, index));
    return decor.slug ? { ...card, slug: decor.slug } : card;
  });
}

/** Мин и макс цен камней, у которых цена есть. Камни без цены в диапазон не входят. */
export function brandPriceSpan(decors: readonly Pick<QuartzCatalogDecor, "price">[]): BrandPriceSpan | null {
  let min = Infinity;
  let max = -Infinity;

  for (const decor of decors) {
    const price = decor.price;
    if (price == null || price <= 0) continue;
    if (price < min) min = price;
    if (price > max) max = price;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}
