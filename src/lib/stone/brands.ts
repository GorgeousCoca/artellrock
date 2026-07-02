import { quartzBrandStones } from "@/content/quartz-brand-stones";
import { brandPageDescriptionSummary } from "@/lib/stone/brand-page-copy";
import type { StoneSample } from "@/types/content";

export type StoneBrand = {
  slug: string;
  name: string;
  description: string;
  count: number;
};

export function manufacturerToSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/quartz/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function brandCatalogHref(slug: string) {
  return `/catalog-kamnya/brands/${slug}`;
}

/** `public/images/{folder}` → manufacturer slug for catalog brand pages */
const IMAGE_FOLDER_TO_MANUFACTURER: Record<string, string> = {
  Aleph_Stone: "Aleph Stone",
  Asterum: "Asterum",
  Avant_Quartz: "Avant Quartz",
  Avarus: "Avarus",
  Belenco: "Belenco",
  Caesarstone: "Caesarstone",
  Etna_Quartz: "Etna Quartz",
  Noblle_Quartz: "Noblle Quartz",
  Primax: "Primax",
  Quantra_Quartz: "Quantra Quartz",
  Radianz_Quartz: "Radianz",
  Smart_Quartz: "Smart Quartz",
  Still_Stone: "Still Stone",
  Technistone: "Technistone",
  Vicostone: "Vicostone"
};

export function stoneBrandFolderToSlug(folder: string) {
  const manufacturer = IMAGE_FOLDER_TO_MANUFACTURER[folder] ?? folder.replace(/_/g, " ");
  return manufacturerToSlug(manufacturer);
}

export function getStoneBrands(stones: StoneSample[]): StoneBrand[] {
  const groups = new Map<string, { name: string; count: number }>();

  for (const stone of stones) {
    const slug = manufacturerToSlug(stone.manufacturer);
    const existing = groups.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(slug, { name: stone.manufacturer, count: 1 });
    }
  }

  /** Эталонный каталог кварца: бренд всегда в списке, число декоров не ниже чем в каталоге. */
  const quartzBySlug = new Map<string, { name: string; count: number }>();
  for (const stone of quartzBrandStones) {
    const slug = manufacturerToSlug(stone.manufacturer);
    const row = quartzBySlug.get(slug);
    if (row) {
      row.count += 1;
    } else {
      quartzBySlug.set(slug, { name: stone.manufacturer, count: 1 });
    }
  }
  for (const [slug, { name, count: catalogCount }] of quartzBySlug) {
    const existing = groups.get(slug);
    if (!existing) {
      groups.set(slug, { name, count: catalogCount });
    } else {
      existing.count = Math.max(existing.count, catalogCount);
      if (!existing.name.trim()) {
        existing.name = name;
      }
    }
  }

  return [...groups.entries()]
    .map(([slug, value]) => ({
      slug,
      name: value.name,
      count: value.count,
      description: brandPageDescriptionSummary(slug, value.name)
    }))
    .sort((a, b) => b.count - a.count);
}
