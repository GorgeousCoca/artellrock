import { manufacturerToSlug } from "@/lib/stone/brands";

/** Порядок сетки: 5 + 5 + 3 (как в CATALOG_BRAND_ORDER) */
export type BrandIconEntry = {
  slug: string;
  name: string;
  iconSrc: string;
  /** Увеличение для логотипов с большими полями в исходном PNG */
  iconScale?: number;
};

const ICON_BASE = "/images/Brands_icon";

/** slug → файл в public/images/Brands_icon */
const ICON_FILES: { slug: string; name: string; file: string; iconScale?: number }[] = [
  { slug: manufacturerToSlug("Avant Quartz"), name: "Avant Quartz", file: "Avant.png" },
  { slug: manufacturerToSlug("Avarus"), name: "Avarus", file: "Avarus.png" },
  { slug: manufacturerToSlug("Smart Quartz"), name: "Smart Quartz", file: "Smart_Quartz.png" },
  { slug: manufacturerToSlug("Noblle Quartz"), name: "Noblle Quartz", file: "Noblle.png", iconScale: 11.7 },
  { slug: manufacturerToSlug("Etna Quartz"), name: "Etna Quartz", file: "Etna.png" },
  { slug: manufacturerToSlug("Caesarstone"), name: "Caesarstone", file: "Caesarstone.webp" },
  { slug: manufacturerToSlug("Technistone"), name: "Technistone", file: "TechniStone.png", iconScale: 6.6 },
  { slug: manufacturerToSlug("Belenco"), name: "Belenco", file: "Belenco.png", iconScale: 4.5 },
  { slug: manufacturerToSlug("Asterum"), name: "Asterum", file: "Asterum.png" },
  { slug: manufacturerToSlug("Radianz"), name: "Radianz", file: "Radianz_Quartz.png" },
  { slug: manufacturerToSlug("Vicostone"), name: "Vicostone", file: "Vicostone.png", iconScale: 11.8 },
  { slug: manufacturerToSlug("Quantra Quartz"), name: "Quantra Quartz", file: "Quantra_Quartz.png" },
  { slug: manufacturerToSlug("Primax"), name: "Primax", file: "Primax.png", iconScale: 9.2 }
];

export const BRAND_ICON_ENTRIES: BrandIconEntry[] = ICON_FILES.map((item) => ({
  slug: item.slug,
  name: item.name,
  iconSrc: `${ICON_BASE}/${item.file}`,
  iconScale: item.iconScale
}));

export function getBrandIconBySlug(slug: string) {
  return BRAND_ICON_ENTRIES.find((entry) => entry.slug === slug);
}
