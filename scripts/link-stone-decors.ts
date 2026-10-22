/**
 * Связывает страницы камней (`stone-catalog.json`) со старыми карточками `quartz-decors.ts`,
 * к которым в базе привязана цена. База не меняется, пишется только файл со связями.
 *
 * Запуск:
 *   npm run link:stone-decors                  — отчёт;
 *   $env:APPLY=1; npm run link:stone-decors    — записать src/content/stone-decor-links.json.
 *
 * Зачем: цена ищется по картинке или названию («бренд + артикул + название»). Камень «A0001 Perfecta»
 * и декор «0001 Perfecta» не совпадают, цена уходит на старую карточку без страницы.
 * Связь добавляет картинку и название декора к карточке камня (`catalogRefForStone`).
 * Файл каждый раз собирается заново; записи с "manual": true (add-stones-from-export.py) сохраняются.
 *
 * Правила (по бренду, берём декоры, которые ещё не покрыты камнем):
 *   1. Кандидаты — камни с общим числовым кодом (0001 = A0001, BQ 8583 = 8583).
 *      Если кандидатов несколько, сужаем по общему слову названия.
 *   2. Если декор претендует на камень один — связь возможна. «Матовость» не сверяем:
 *      поле «Поверхность» в выгрузке местами врёт.
 *   3. Если на камень претендуют два декора (глянец и мат с одним кодом), камень достаётся тому,
 *      чья матовость совпадает с «Поверхностью» камня. Второй идёт в отчёт: ему нужна своя страница.
 *   4. Проверка по базе. Камень уже получает цену от другого материала — не трогаем.
 *      После связи камень обязан получить цену именно материала этого декора — иначе связь не пишем.
 * Бренды из SKIP не трогаем.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";
import { catalogRefForStone, stonesForBrand, type StoneRecord } from "../src/content/stone-catalog";
import {
  indexQuartzMaterials,
  matchQuartzMaterial,
  type QuartzMaterialIndex,
  type QuartzMaterialRef
} from "../src/lib/catalog/quartz-match";
import type { Material } from "../src/payload-types";

const SKIP = new Set(["radianz"]);
const OUT = path.resolve(process.cwd(), "src/content/stone-decor-links.json");

/** `manual` — связь из scripts/add-stones-from-export.py; её этот скрипт сохраняет как есть. */
type Link = { image: string; name: string; manual?: boolean };

const MAT = /\b(mat|matt|matte|matovyy|matovyi|matovaya)\b/i;
const NOISE = new Set(["mat", "matt", "matte", "matovyy", "print", "seta", "honed", "quartz", "stone"]);

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

function codes(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\d{2,}/g)) found.add(String(Number(match[0])));
  return [...found];
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((word) => !NOISE.has(word));
}

function stoneIsMat(stone: StoneRecord): boolean {
  const surface = stone.characteristics.find((item) => item.title === "Поверхность")?.value ?? "";
  return MAT.test(`${stone.name} ${stone.slug}`) || /матов/i.test(surface);
}

function pricedMatch(brandName: string, ref: Parameters<typeof matchQuartzMaterial>[1], index: QuartzMaterialIndex) {
  const match = matchQuartzMaterial(brandName, ref, index);
  if (match.status !== "matched") return null;
  return match.material.isActive && match.material.pricePerSqm > 0 ? match.material : null;
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === "1";
  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "materials", limit: 0, pagination: false, depth: 0 });
  const index = indexQuartzMaterials(found.docs.map(asRef));

  const previous: Record<string, Link> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const manual = Object.fromEntries(Object.entries(previous).filter(([, link]) => link.manual === true));
  const manualImages = new Set(Object.values(manual).map((link) => link.image));
  const links: Record<string, Link> = {};
  const ambiguous: string[] = [];
  const variants: string[] = [];
  const alreadyPriced: string[] = [];
  const ineffective: string[] = [];
  const noStone: string[] = [];
  let duplicates = 0;

  for (const brand of quartzBrands) {
    if (SKIP.has(brand.slug)) continue;
    const stones = stonesForBrand(brand.slug);
    if (stones.length === 0) continue;

    const baseRefs = new Map(stones.map((stone) => [stone.slug, catalogRefForStone(stone, brand.decors, { withDecorLink: false })]));
    const covered = new Set([...baseRefs.values()].flatMap((ref) => ref.matchImages ?? []));
    const leftovers = brand.decors.filter((decor) => !covered.has(decor.image) && !manualImages.has(decor.image));

    const chosen = new Map<string, StoneRecord | null>();
    for (const decor of leftovers) {
      const decorCodes = codes(decor.name);
      let candidates = decorCodes.length
        ? stones.filter((stone) => codes(`${stone.sku} ${stone.name}`).some((code) => decorCodes.includes(code)))
        : [];
      if (candidates.length > 1) {
        const decorWords = words(decor.name);
        const narrowed = candidates.filter((stone) => {
          const stoneWords = new Set(words(`${stone.name} ${stone.slug.replace(/-/g, " ")}`));
          return decorWords.some((word) => stoneWords.has(word));
        });
        if (narrowed.length >= 1) candidates = narrowed;
      }
      if (candidates.length === 0) {
        noStone.push(`  - [${brand.slug}] ${decor.name}`);
        chosen.set(decor.image, null);
      } else if (candidates.length > 1) {
        ambiguous.push(`  ? [${brand.slug}] ${decor.name} → ${candidates.map((stone) => stone.slug).join(", ")}`);
        chosen.set(decor.image, null);
      } else {
        chosen.set(decor.image, candidates[0]);
      }
    }

    const claims = new Map<string, typeof leftovers>();
    for (const decor of leftovers) {
      const stone = chosen.get(decor.image);
      if (!stone) continue;
      const list = claims.get(stone.slug);
      if (list) list.push(decor);
      else claims.set(stone.slug, [decor]);
    }

    for (const [slug, claimants] of claims) {
      const stone = stones.find((item) => item.slug === slug)!;
      const baseRef = baseRefs.get(slug)!;
      let winner = claimants.length === 1 ? claimants[0] : undefined;
      if (!winner) {
        // Сначала тот декор, чей материал камень уже берёт сейчас (его цена на странице не изменится).
        const currentId = pricedMatch(brand.name, baseRef, index)?.id;
        const byPrice =
          currentId == null
            ? []
            : claimants.filter(
                (decor) => pricedMatch(brand.name, { name: decor.name, image: decor.image }, index)?.id === currentId
              );
        if (byPrice.length === 1) winner = byPrice[0];
      }
      if (!winner) {
        const sameMat = claimants.filter((decor) => MAT.test(decor.name) === stoneIsMat(stone));
        if (sameMat.length === 1) winner = sameMat[0];
      }
      if (!winner) {
        ambiguous.push(`  ? [${brand.slug}] ${slug} ← ${claimants.map((decor) => decor.name).join(" | ")}`);
        continue;
      }
      for (const decor of claimants) {
        if (decor !== winner) variants.push(`  = [${brand.slug}] ${decor.name} (страницу ${slug} занял «${winner.name}»)`);
      }

      const ownMaterial = pricedMatch(brand.name, { name: winner.name, image: winner.image }, index);
      if (!ownMaterial) continue; // декор без цены на витрине не показывается, связь не нужна

      // Камень уже получает цену от другого материала, чем декор: это разные позиции, не склеиваем.
      // Тот же материал — карточка декора дублирует страницу, связь её убирает.
      const current = pricedMatch(brand.name, baseRef, index);
      if (current && current.id !== ownMaterial.id) {
        alreadyPriced.push(
          `  = [${brand.slug}] ${winner.name}: камень ${slug} берёт цену у «${current.name}» (другая позиция), декору нужна своя страница`
        );
        continue;
      }

      const linked = {
        ...baseRef,
        matchNames: [...(baseRef.matchNames ?? []), winner.name],
        matchImages: [...(baseRef.matchImages ?? []), winner.image]
      };
      const afterMaterial = pricedMatch(brand.name, linked, index);
      if (!afterMaterial || afterMaterial.id !== ownMaterial.id) {
        ineffective.push(`  ! [${brand.slug}] ${winner.name} → ${slug}: цена после связи не та (или её нет)`);
        continue;
      }
      if (current) duplicates += 1;
      links[`${brand.slug}/${slug}`] = { image: winner.image, name: winner.name };
    }
  }

  const keys = Object.keys(links);
  const perBrand = new Map<string, number>();
  for (const key of keys) perBrand.set(key.split("/")[0], (perBrand.get(key.split("/")[0]) ?? 0) + 1);
  console.log(`Связей к записи: ${keys.length} (из них дубли: карточка декора и страница камня берут один материал — ${duplicates})`);
  console.log([...perBrand.entries()].map(([brand, count]) => `${brand}: ${count}`).join(", "));
  console.log(`\nНеоднозначно (${ambiguous.length}):\n${ambiguous.join("\n") || "  —"}`);
  console.log(`\nУ камня уже есть цена от другого материала (${alreadyPriced.length}):\n${alreadyPriced.join("\n") || "  —"}`);
  console.log(`\nВторой вариант того же камня (${variants.length}):\n${variants.join("\n") || "  —"}`);
  console.log(`\nСвязь не даёт нужной цены (${ineffective.length}):\n${ineffective.join("\n") || "  —"}`);
  console.log(`\nДекоры без камня в stone-catalog.json (${noStone.length}):\n${noStone.join("\n") || "  —"}`);

  if (!apply) {
    console.log("\nDry-run. Для записи: $env:APPLY=1");
    return;
  }

  const merged = { ...links, ...manual };
  const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  console.log(
    `\nЗаписано ${Object.keys(sorted).length} связей (ручных: ${Object.keys(manual).length}) в ${path.relative(process.cwd(), OUT)}`
  );
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
