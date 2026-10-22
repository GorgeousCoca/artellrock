/**
 * Читает ../PHOTOS.md (реестр своих файлов) и собирает два файла данных публичного сайта:
 *   src/content/quartz-decors.ts — образцы декора по брендам (страница «Каталог кварца»);
 *   src/content/works.ts         — свои фото готовых изделий (блок 8 и «Наши работы»).
 * Берутся только строки с «да». Цены не используются.
 *
 * Запуск: node scripts/generate-site-content.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photosPath = path.resolve(root, "..", "PHOTOS.md");
const lines = readFileSync(photosPath, "utf8").split(/\r?\n/);

const BRAND_LOGOS = {
  asterum: "Asterum.png",
  avant: "Avant.png",
  avarus: "Avarus.png",
  belenco: "Belenco.png",
  caesarstone: "Caesarstone.webp",
  etna: "Etna.png",
  noblle: "Noblle.png",
  primax: "Primax.png",
  quantra: "Quantra_Quartz.png",
  radianz: "Radianz_Quartz.png",
  smart: "Smart_Quartz.png",
  technistone: "TechniStone.png",
  vicostone: "Vicostone.png"
};

function brandSlug(name) {
  return name
    .toLowerCase()
    .replace(/quartz/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanize(stem) {
  if (/[A-Z\s]/.test(stem)) {
    return stem.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  }
  return stem
    .split(/[-_]+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[a-z]{1,3}\d+$/i.test(token)) return token.toUpperCase();
      if (/^\d+$/.test(token)) return token;
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(" ");
}

function upperFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const entries = [];
for (const raw of lines) {
  if (!raw.startsWith("public/images/")) continue;
  const parts = raw.split(" — ");
  if (parts.length < 3) continue;
  entries.push({ file: parts[0].trim(), what: parts[1].trim(), verdict: parts.slice(2).join(" — ").trim() });
}

// ---------- образцы декора ----------
const brands = new Map();
for (const entry of entries) {
  if (!entry.what.startsWith("образец декора ") || !entry.verdict.startsWith("да")) continue;
  const rest = entry.what.slice("образец декора ".length);
  const comma = rest.indexOf(",");
  const brandName = rest.slice(0, comma).trim();
  const slug = brandSlug(brandName);
  const stem = path.basename(entry.file).replace(/\.[^.]+$/, "");
  if (!brands.has(slug)) brands.set(slug, { slug, name: brandName, decors: [] });
  brands.get(slug).decors.push({ stem, name: humanize(stem), image: entry.file.replace(/^public/, "") });
}

for (const brand of brands.values()) {
  // Один файл на декор: «1000.webp» уходит, если рядом есть «1000-dizhon.webp».
  const codes = (stem) => stem.split(/[-_\s]+/)[0].toLowerCase();
  brand.decors = brand.decors.filter((decor) => {
    const isBareCode = !/[-_\s]/.test(decor.stem) && /\d/.test(decor.stem);
    if (!isBareCode) return true;
    return !brand.decors.some((other) => other !== decor && codes(other.stem) === decor.stem.toLowerCase());
  });
}

const brandList = [...brands.values()]
  .map((brand) => {
    const logoFile = BRAND_LOGOS[brand.slug];
    const logo = logoFile && existsSync(path.join(root, "public/images/Brands_icon", logoFile))
      ? `/images/Brands_icon/${logoFile}`
      : null;
    return {
      slug: brand.slug,
      name: brand.name,
      logo,
      decors: brand.decors.map(({ name, image }) => ({ name, image }))
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

for (const brand of brandList) {
  for (const decor of brand.decors) {
    if (!existsSync(path.join(root, "public", decor.image))) {
      console.warn("Нет файла:", decor.image);
    }
  }
}

writeFileSync(
  path.join(root, "src/content/quartz-decors.ts"),
  `/* Файл собран скриптом scripts/generate-site-content.mjs из PHOTOS.md. Вручную не правьте. */

export type QuartzDecor = {
  name: string;
  image: string;
};

export type QuartzBrand = {
  slug: string;
  name: string;
  logo: string | null;
  decors: QuartzDecor[];
};

export const quartzBrands: QuartzBrand[] = ${JSON.stringify(brandList, null, 2)};
`
);

// ---------- свои работы ----------
const OWN_FILES = new Set([
  "public/images/Avarus-Primer.webp",
  "public/images/podokonnik-01.webp",
  "public/images/podokonnik-02.webp",
  "public/images/podokonnik-03.webp"
]);

const works = [];
for (const entry of entries) {
  const isOwn = OWN_FILES.has(entry.file);
  const isPortfolio = entry.file.startsWith("public/images/portfolio-brands/");
  if (!isOwn && !isPortfolio) continue;
  if (!entry.verdict.startsWith("да")) continue;
  if (/дубль/.test(entry.verdict)) continue;
  const label = entry.verdict.replace(/^да,\s*/, "").split(/;/)[0].trim();
  works.push({
    id: path.basename(entry.file).replace(/\.[^.]+$/, ""),
    image: entry.file.replace(/^public/, ""),
    label: upperFirst(label)
  });
}

for (const work of works) {
  if (!existsSync(path.join(root, "public", work.image))) console.warn("Нет файла:", work.image);
}

writeFileSync(
  path.join(root, "src/content/works.ts"),
  `/* Файл собран скриптом scripts/generate-site-content.mjs из PHOTOS.md. Вручную не правьте. */

export type Work = {
  id: string;
  image: string;
  /** Тип изделия — ровно то, что написано у кадра в PHOTOS.md. */
  label: string;
};

export const works: Work[] = ${JSON.stringify(works, null, 2)};
`
);

console.log(`Брендов: ${brandList.length}, декоров: ${brandList.reduce((n, b) => n + b.decors.length, 0)}, работ: ${works.length}`);
