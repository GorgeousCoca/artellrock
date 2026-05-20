/**
 * Переименовывает файлы в `public/`, в имени которых есть кириллица: транслит + slug (ASCII).
 * Запуск: `npm run rename:ascii-media`
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decorImageAsciiStem } from "../src/lib/stone/decor-image-ascii-stem";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");

const MEDIA_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm", ".svg"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function needsAsciiRename(basename: string): boolean {
  return /[\u0400-\u04FF]/.test(basename);
}

function main() {
  const files = walk(pub);
  type Plan = { full: string; dir: string; ext: string; oldStem: string; newStem: string };
  const plans: Plan[] = [];

  for (const full of files) {
    const ext = path.extname(full);
    if (!MEDIA_EXT.has(ext.toLowerCase())) continue;
    const base = path.basename(full);
    if (!needsAsciiRename(base)) continue;
    const stem = path.basename(full, ext);
    const newStem = decorImageAsciiStem(stem);
    if (newStem + ext === base) continue;
    plans.push({ full, dir: path.dirname(full), ext, oldStem: stem, newStem });
  }

  const usedInDir = new Map<string, Set<string>>();
  const finalStem = new Map<string, string>();

  for (const p of plans) {
    const set = usedInDir.get(p.dir) ?? new Set<string>();
    usedInDir.set(p.dir, set);
    let stem = p.newStem;
    let n = 0;
    while (set.has(stem)) {
      n += 1;
      stem = `${p.newStem}-${n}`;
    }
    set.add(stem);
    finalStem.set(p.full, stem);
  }

  const temps = new Map<string, string>();
  for (const p of plans) {
    const tmp = path.join(p.dir, `.__ascii_tmp_${crypto.randomUUID()}__`);
    fs.renameSync(p.full, tmp);
    temps.set(p.full, tmp);
  }

  for (const p of plans) {
    const tmp = temps.get(p.full)!;
    const stem = finalStem.get(p.full)!;
    const finalPath = path.join(p.dir, stem + p.ext);
    fs.renameSync(tmp, finalPath);
  }

  console.log(`Переименовано файлов: ${plans.length}`);
}

main();
