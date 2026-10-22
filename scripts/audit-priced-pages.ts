/**
 * Аудит (только чтение): у каждого камня с ценой на витрине бренда есть своя страница?
 *
 * Запуск: npm run audit:priced-pages
 * Список камней без страницы в JSON: $env:AUDIT_JSON="путь\файл.json"; npm run audit:priced-pages
 *
 * Повторяет отбор `getBrandCatalog` (src/lib/catalog/quartz-catalog.ts) без кэша Next:
 * камни из `stone-catalog.json` + «остаточные» декоры бренда, затем цена из `materials`.
 * Карточка ведёт на страницу, только если у неё есть `slug` (камень из stone-catalog.json).
 * Дополнительно: материалы с ценой, которым не нашлось ни одной карточки на витрине.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";
import { brandCatalogRefs } from "../src/content/stone-catalog";
import { indexQuartzMaterials, joinBrandDecors, matchQuartzMaterial, type QuartzMaterialRef } from "../src/lib/catalog/quartz-match";
import type { Material } from "../src/payload-types";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // переменные уже заданы окружением
    }
  }
}

function asRef(doc: Material): QuartzMaterialRef {
  return {
    id: doc.id,
    brand: doc.brand,
    name: doc.name,
    sku: doc.sku ?? undefined,
    image: typeof doc.image === "string" ? doc.image : null,
    isActive: doc.isActive === true,
    pricePerSqm: typeof doc.pricePerSqm === "number" && doc.pricePerSqm > 0 ? doc.pricePerSqm : 0,
    formats: [],
    thicknessesMm: [],
    shades: [],
    textures: []
  };
}

function publicFileExists(urlPath: string): boolean {
  if (!urlPath.startsWith("/")) return false;
  return existsSync(path.join(process.cwd(), "public", ...urlPath.replace(/^\//, "").split("/")));
}

async function main() {
  loadEnv();
  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "materials", limit: 0, pagination: false, depth: 0 });
  const materials = found.docs.map(asRef);
  const index = indexQuartzMaterials(materials);

  let totalPriced = 0;
  let totalWithPage = 0;
  const noPage: string[] = [];
  const noPageRows: Array<{ brand: string; sku: string; name: string; price: number; image: string }> = [];
  const badImages: string[] = [];
  const usedMaterialIds = new Set<string | number>();

  for (const brand of quartzBrands) {
    const refs = brandCatalogRefs(brand);
    const joined = joinBrandDecors(brand.name, refs, index);

    joined.forEach((decor, i) => {
      const match = matchQuartzMaterial(brand.name, refs[i], index);
      if (match.status === "matched") usedMaterialIds.add(match.material.id);
      if (!(decor.price != null && decor.price > 0)) return;
      totalPriced += 1;
      if (decor.slug) {
        totalWithPage += 1;
        if (!publicFileExists(decor.image)) badImages.push(`${brand.slug}/${decor.slug}: нет файла ${decor.image}`);
      } else {
        noPage.push(`[${brand.slug}] ${decor.sku ? `${decor.sku} ` : ""}${decor.name} — ${decor.price} ₽ (${decor.image})`);
        noPageRows.push({ brand: brand.slug, sku: decor.sku ?? "", name: decor.name, price: decor.price, image: decor.image });
      }
    });
  }

  if (process.env.AUDIT_JSON) writeFileSync(process.env.AUDIT_JSON, JSON.stringify(noPageRows, null, 2), "utf8");

  const orphans = materials.filter((m) => m.isActive && m.pricePerSqm > 0 && !usedMaterialIds.has(m.id));

  console.log(`Витрина: камней с ценой ${totalPriced}, со своей страницей ${totalWithPage}, БЕЗ страницы ${noPage.length}`);
  console.log(`\n=== Цена есть, страницы нет (${noPage.length}) ===`);
  for (const line of noPage) console.log(line);
  console.log(`\n=== Страница есть, но нет файла главной картинки (${badImages.length}) ===`);
  for (const line of badImages) console.log(line);
  console.log(`\n=== Активные материалы с ценой, не попавшие ни в одну карточку витрины (${orphans.length}) ===`);
  for (const m of orphans) console.log(`[${m.brand}] ${m.sku ?? ""} ${m.name} — ${m.pricePerSqm} ₽`);
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
