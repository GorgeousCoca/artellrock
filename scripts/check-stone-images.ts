/**
 * Сверяет каталог кварца (`src/content/quartz-brand-stones.ts`) с файлами в `public/images/`.
 *
 * Запуск: `npm run check:stone-images` или `tsx scripts/check-stone-images.ts [--orphans]`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decorImageAsciiStem } from "../src/lib/stone/decor-image-ascii-stem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tsPath = path.join(root, "src/content/quartz-brand-stones.ts");
const ts = fs.readFileSync(tsPath, "utf8");

const showOrphans = process.argv.includes("--orphans");

function extractMap() {
  const m = ts.match(/const IMAGE_FOLDER_MAP[^=]*=\s*\{([^}]+)\}/);
  if (!m) throw new Error("IMAGE_FOLDER_MAP not found");
  const obj: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    const mm = t.match(/^"([^"]+)":\s*"([^"]+)"|^([A-Za-z]+):\s*"([^"]+)"/);
    if (mm) {
      obj[mm[1] ?? mm[3]!] = mm[2] ?? mm[4]!;
    }
  }
  return obj;
}

function extractPrices() {
  const fullSlice = ts.slice(ts.indexOf("const STONE_PRICES_BY_BRAND"));
  const endMarker = "\n};\n\nconst CATALOG_BRAND_ORDER";
  const endIdx = fullSlice.indexOf(endMarker);
  const slice = endIdx === -1 ? fullSlice : fullSlice.slice(0, endIdx);
  const brands: Record<string, string[]> = {};
  const re = /\n  (?:"([^"]+)"|([A-Za-z]+)):\s*\{/g;
  const positions: { name: string; idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) {
    positions.push({ name: m[1] ?? m[2]!, idx: m.index });
  }
  for (let i = 0; i < positions.length; i++) {
    const { name, idx } = positions[i]!;
    const block = slice.slice(idx, positions[i + 1]?.idx ?? slice.length);
    const titles: string[] = [];
    const tl = /"([^"]+)":\s*\d+/g;
    let tm: RegExpExecArray | null;
    while ((tm = tl.exec(block)) !== null) {
      titles.push(tm[1]!);
    }
    brands[name] = titles;
  }
  return brands;
}

function parseOverridesRobust(): Record<string, string> {
  const marker = "const STONE_IMAGE_FILENAME_OVERRIDES";
  const start = ts.indexOf(marker);
  if (start === -1) return {};
  const eq = ts.indexOf("=", start);
  let pos = eq + 1;
  while (pos < ts.length && /\s/.test(ts[pos]!)) pos++;
  if (ts[pos] !== "{") return {};
  const brace = pos;
  let depth = 0;
  let i = brace;
  for (; i < ts.length; i++) {
    const c = ts[i]!;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const inner = ts.slice(brace + 1, i - 1);
  const out: Record<string, string> = {};
  const entry = /"((?:[^"\\]|\\.)+)"\s*:\s*"((?:[^"\\]|\\.)+)"/g;
  let lm: RegExpExecArray | null;
  while ((lm = entry.exec(inner)) !== null) {
    try {
      out[JSON.parse(`"${lm[1]}"`)] = JSON.parse(`"${lm[2]}"`);
    } catch {
      out[lm[1]!] = lm[2]!;
    }
  }
  return out;
}

const IMAGE_FOLDER_MAP = extractMap();
const STONE_PRICES_BY_BRAND = extractPrices();
const FILENAME_OVERRIDES = parseOverridesRobust();

function expectedStem(manufacturer: string, title: string): string {
  const key = `${manufacturer}::${title}`;
  return FILENAME_OVERRIDES[key] ?? decorImageAsciiStem(title);
}

function expectedFilename(manufacturer: string, title: string) {
  return `${expectedStem(manufacturer, title)}.webp`;
}

function findCaseCollisions(files: string[]) {
  const webp = files.filter((f) => f.endsWith(".webp"));
  const byLower = new Map<string, string[]>();
  for (const f of webp) {
    const stem = f.slice(0, -".webp".length);
    const k = stem.toLowerCase();
    if (!byLower.has(k)) byLower.set(k, []);
    byLower.get(k)!.push(f);
  }
  const collisions: string[][] = [];
  for (const [, arr] of byLower) {
    const unique = [...new Set(arr)];
    if (unique.length > 1) collisions.push(unique);
  }
  return collisions;
}

let missingTotal = 0;
let orphanTotal = 0;

console.log("Каталог кварца ↔ public/images (все бренды из IMAGE_FOLDER_MAP)\n");

for (const [brand, titles] of Object.entries(STONE_PRICES_BY_BRAND)) {
  const folder = IMAGE_FOLDER_MAP[brand];
  if (!folder) {
    console.log(`SKIP (нет папки в IMAGE_FOLDER_MAP): ${brand}`);
    continue;
  }

  const dir = path.join(root, "public", "images", folder);
  if (!fs.existsSync(dir)) {
    console.log(`\n## ${brand} (${folder}) — папка отсутствует (${titles.length} позиций в каталоге)`);
    missingTotal += titles.length;
    continue;
  }

  const files = fs.readdirSync(dir);
  const fileSet = new Set(files);
  const missing: { title: string; fn: string }[] = [];
  for (const title of titles) {
    const fn = expectedFilename(brand, title);
    if (!fileSet.has(fn)) missing.push({ title, fn });
  }

  const caseCols = findCaseCollisions(files);
  if (caseCols.length) {
    console.log(`\n## ${brand} (${folder}) — внимание: ${caseCols.length} групп имён, отличающихся только регистром:`);
    caseCols.slice(0, 8).forEach((g) => console.log("   ", g.join(" | ")));
    if (caseCols.length > 8) console.log(`   ... ещё ${caseCols.length - 8} групп`);
  }

  if (missing.length) {
    console.log(`\n## ${brand} (${folder}) — нет файла: ${missing.length} из ${titles.length}`);
    missing.slice(0, 60).forEach(({ fn }) => console.log(`   ожидается: ${fn}`));
    if (missing.length > 60) console.log(`   ... ещё ${missing.length - 60}`);
    missingTotal += missing.length;
  } else {
    console.log(`OK  ${brand.padEnd(22)} (${folder}) — ${titles.length} .webp`);
  }

  if (showOrphans) {
    const titleSet = new Set(titles.map((t) => expectedStem(brand, t)));
    const orphans = files.filter((f) => f.endsWith(".webp") && !titleSet.has(f.replace(/\.webp$/u, "")));
    if (orphans.length) {
      console.log(`   (лишние файлы, не в каталоге: ${orphans.length})`);
      orphans.slice(0, 25).forEach((f) => console.log("     +", f));
      if (orphans.length > 25) console.log(`     ... ещё ${orphans.length - 25}`);
      orphanTotal += orphans.length;
    }
  }
}

if (Object.keys(FILENAME_OVERRIDES).length) {
  console.log(`\nУчтены переопределения имён: ${Object.keys(FILENAME_OVERRIDES).length} шт.`);
}

if (missingTotal === 0) {
  console.log("\n✓ Все ожидаемые .webp на месте (с учётом переопределений).");
} else {
  console.log(`\n✗ Всего отсутствует файлов: ${missingTotal}`);
  process.exitCode = 1;
}

if (showOrphans && orphanTotal) {
  console.log(`\nВсего «лишних» .webp (не в каталоге): ${orphanTotal}`);
}
