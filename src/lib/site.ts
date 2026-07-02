import { cache } from "react";

import { quartzBrandStones } from "@/content/quartz-brand-stones";
import { listCollection, getBySlug, getCompanySettings, readStore } from "@/lib/cms/store";
import { manufacturerToSlug } from "@/lib/stone/brands";
import type { ProductType, StoneSample, StoneType } from "@/types/content";

export const getProducts = cache(async () => listCollection("products"));
export const getStoneSamples = cache(async () => {
  const fromStore = await listCollection("stoneSamples");
  /** Id из эталонного каталога кварца: строки CMS с тем же id не должны затирать каталог (иначе пропадают бренды вроде Avarus в сетке). */
  const quartzIds = new Set(quartzBrandStones.map((item) => item.id));
  /** Slug: при совпадении с эталоном карточка только из quartz-brand-stones.ts. */
  const quartzSlugs = new Set(quartzBrandStones.map((item) => item.slug));
  /** Бренды эталонного кварца: любые CMS-образцы с тем же брендом и типом quartz скрываем (у них часто другой slug и старые цены). */
  const catalogQuartzBrandSlugs = new Set(
    quartzBrandStones.map((item) => manufacturerToSlug(item.manufacturer))
  );

  const storeFiltered = fromStore.filter((item) => {
    if (quartzIds.has(item.id)) return false;
    if (quartzSlugs.has(item.slug)) return false;
    if (
      item.stoneType === "quartz" &&
      catalogQuartzBrandSlugs.has(manufacturerToSlug(item.manufacturer))
    ) {
      return false;
    }
    return true;
  });

  return [...storeFiltered, ...quartzBrandStones];
});
export const getProjects = cache(async () => listCollection("projects"));
export const getTestimonials = cache(async () => listCollection("testimonials"));
export const getApprovedTestimonials = cache(async () => {
  const all = await listCollection("testimonials");
  return all.filter((t) => t.status === "approved").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});
export const getTeamMembers = cache(async () => listCollection("teamMembers"));
export const getFaqItems = cache(async () => {
  const items = await listCollection("faqItems");
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
});
export const getCertificates = cache(async () => listCollection("certificates"));
export const getContactRequests = cache(async () => listCollection("contactRequests"));
export const getSettings = cache(async () => getCompanySettings());

export const getProductBySlug = cache(async (slug: string) => getBySlug("products", slug));
export const getStoneBySlug = cache(async (slug: string) => {
  const stones = await getStoneSamples();
  return stones.find((item) => item.slug === slug) ?? null;
});
export const getProjectBySlug = cache(async (slug: string) => getBySlug("projects", slug));

/** Только избранные товары для главной — без тяжёлого merge каталога камня (`getStoneSamples`). */
export const getHomeFeaturedProducts = cache(async () => {
  const store = await readStore();
  return store.products.filter((item) => item.isFeatured).slice(0, 4);
});

export async function getProductsByType(type: ProductType) {
  const products = await getProducts();
  return products.filter((item) => item.type === type);
}

export async function getStoneByType(type: StoneType) {
  const stones = await getStoneSamples();
  return stones.filter((item) => item.stoneType === type);
}
