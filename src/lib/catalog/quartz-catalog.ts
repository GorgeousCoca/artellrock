/**
 * Каталог кварца на сервере: единственный интерфейс витрины `/catalog-kvarca`.
 *
 * Внутри соединяются три источника, страницы о них не знают:
 *  - бренды и старые декоры — статический `content/quartz-decors.ts`;
 *  - страницы камней, фото и описания — `content/stone-catalog.json`;
 *  - цены и характеристики — коллекция `materials` (через `getAllMaterials`, тот же тег кэша, что у калькулятора).
 *
 * На витрине остаются только декоры с ценой: активный материал и `pricePerSqm` больше 0. Калькулятор берёт тот же
 * отбор. Правка в админке и `revalidateTag` сбрасывают оба кэша.
 *
 * Модуль только для серверных страниц: внутри Payload и `unstable_cache`.
 */
import { cache } from "react";

import { quartzBrands, type QuartzBrand, type QuartzDecor } from "@/content/quartz-decors";
import {
  brandCatalogRefs,
  catalogRefForStone,
  getStone,
  stoneCatalog,
  stonesForBrand,
  type StoneRecord
} from "@/content/stone-catalog";
import { getAllMaterials, type CatalogMaterial } from "@/lib/calculator/server";

import {
  brandPriceSpan,
  indexQuartzMaterials,
  joinBrandDecors,
  type BrandPriceSpan,
  type QuartzCatalogDecor,
  type QuartzMaterialIndex
} from "./quartz-match";

export type { BrandPriceSpan, CatalogMaterial, QuartzCatalogDecor };
export { stoneDescriptionText } from "@/content/stone-catalog";
export type { StoneRecord } from "@/content/stone-catalog";

/** Материалы и индекс по ним: один раз на запрос. */
const loadMaterialIndex = cache(async (): Promise<{ materials: CatalogMaterial[]; index: QuartzMaterialIndex }> => {
  const materials = await getAllMaterials();
  return { materials, index: indexQuartzMaterials(materials) };
});

/** Все материалы (для таблицы цен по текстурам). */
export async function getCatalogMaterials(): Promise<CatalogMaterial[]> {
  return (await loadMaterialIndex()).materials;
}

function withPrice(decors: QuartzCatalogDecor[]): QuartzCatalogDecor[] {
  return decors.filter((decor) => decor.price != null && decor.price > 0);
}

function pricedDecors(brand: QuartzBrand, index: QuartzMaterialIndex): QuartzCatalogDecor[] {
  return withPrice(joinBrandDecors(brand.name, brandCatalogRefs(brand), index));
}

// ---------------------------------------------------------------------------------------------
// Без БД: маршруты, число брендов, лента камней
// ---------------------------------------------------------------------------------------------

export function brandCount(): number {
  return quartzBrands.length;
}

export function catalogBrandSlugs(): string[] {
  return quartzBrands.map((brand) => brand.slug);
}

/** Страницы камней для `generateStaticParams` и sitemap. */
export function catalogStoneRoutes(): Array<{ brandSlug: string; slug: string }> {
  return stoneCatalog.map((stone) => ({ brandSlug: stone.brandSlug, slug: stone.slug }));
}

export type ReelSlide = {
  brandSlug: string;
  brandName: string;
  slug: string;
  name: string;
  image: string;
};

/** Пять камней бренда, равномерно по списку, чтобы в ленту не попали только соседние декоры. */
function pickFive(stones: readonly StoneRecord[]): StoneRecord[] {
  const withPhoto = stones.filter((stone) => stone.images.length > 0);
  if (withPhoto.length <= 5) return withPhoto;

  return Array.from({ length: 5 }, (_, index) => withPhoto[Math.round((index * (withPhoto.length - 1)) / 4)]);
}

/** Камни для бегущей ленты каталога: по пять на бренд. */
export function reelSlides(): ReelSlide[] {
  return quartzBrands.flatMap((brand) =>
    pickFive(stonesForBrand(brand.slug)).map((stone) => ({
      brandSlug: brand.slug,
      brandName: brand.name,
      slug: stone.slug,
      name: stone.name,
      image: stone.images[0]
    }))
  );
}

// ---------------------------------------------------------------------------------------------
// С ценами из БД
// ---------------------------------------------------------------------------------------------

export type BrandCard = {
  slug: string;
  name: string;
  /** Диапазон цен камней бренда; `null`, если ни у одного нет цены. */
  span: BrandPriceSpan | null;
  /** До четырёх образцов, равномерно по списку: превью карточки бренда. */
  preview: Array<Pick<QuartzDecor, "name" | "image">>;
};

function pickPreview(decors: readonly Pick<QuartzDecor, "name" | "image">[]) {
  const count = Math.min(4, decors.length);
  const picked = new Map<string, Pick<QuartzDecor, "name" | "image">>();
  for (let i = 0; i < count; i += 1) {
    const decor = decors[Math.floor((i * decors.length) / count)];
    picked.set(decor.image, { name: decor.name, image: decor.image });
  }
  return [...picked.values()];
}

/** Карточки брендов для индекса каталога. Диапазон цен считается тем же правилом, что на странице бренда. */
export async function listBrandCards(): Promise<BrandCard[]> {
  const { index } = await loadMaterialIndex();

  return quartzBrands.map((brand) => {
    const priced = pricedDecors(brand, index);
    return {
      slug: brand.slug,
      name: brand.name,
      span: brandPriceSpan(priced),
      preview: pickPreview(priced.length > 0 ? priced : brand.decors)
    };
  });
}

export type BrandCatalog = {
  brand: Pick<QuartzBrand, "name" | "slug"> & { firstImage?: string };
  decors: QuartzCatalogDecor[];
  span: BrandPriceSpan | null;
  /** Число декоров с ценой. */
  pricedCount: number;
};

/** Страница бренда: декоры с ценой и диапазон. `null`, если такого бренда нет. */
export async function getBrandCatalog(brandSlug: string): Promise<BrandCatalog | null> {
  const brand = quartzBrands.find((item) => item.slug === brandSlug);
  if (!brand) return null;

  const { index } = await loadMaterialIndex();
  const decors = pricedDecors(brand, index);

  return {
    brand: { name: brand.name, slug: brand.slug, firstImage: brand.decors[0]?.image },
    decors,
    span: brandPriceSpan(decors),
    pricedCount: decors.length
  };
}

/** Страница камня: запись каталога и карточка с ценой (цена `null`, если материала нет). */
export async function getStoneCatalogDecor(brandSlug: string, slug: string) {
  const brand = quartzBrands.find((item) => item.slug === brandSlug);
  const stone = getStone(brandSlug, slug);
  if (!brand || !stone) return null;

  const { index } = await loadMaterialIndex();
  const [decor] = joinBrandDecors(brand.name, [catalogRefForStone(stone, brand.decors)], index);
  return { brand: { name: brand.name, slug: brand.slug }, stone, decor };
}
