/**
 * Снимает скриншоты сайта конкурента ecostonespb.ru для сравнительного анализа.
 * Результат: reports/screenshots-competitor/<viewport>/<page>.png
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "reports", "screenshots-competitor");

const BASE = "https://ecostonespb.ru";

const PATHS = [
  "/",
  "/katalog_kamnya/",
  "/izdeliya_iz_iskusstvennogo_kamnya/",
  "/o_kompanii/",
  "/kalkulyator/",
  "/kontakty/",
  "/akcii/",
];

const VIEWPORTS = [
  { name: "mobile",  width: 375,  height: 812,  deviceScaleFactor: 2 },
  { name: "desktop", width: 1440, height: 900,  deviceScaleFactor: 1 },
];

function slugFromPath(p) {
  if (p === "/" || p === "") return "home";
  return p.replace(/^\//, "").replace(/\//g, "__").replace(/_+$/, "") || "home";
}

async function main() {
  for (const vp of VIEWPORTS) {
    fs.mkdirSync(path.join(OUT, vp.name), { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
      });

      for (const p of PATHS) {
        const url = `${BASE}${p}`;
        const slug = slugFromPath(p);
        const file = path.join(OUT, vp.name, `${slug}.png`);

        process.stderr.write(`→ [${vp.name}] ${url}\n`);

        try {
          await page.goto(url, { waitUntil: "networkidle2", timeout: 45_000 });
          await new Promise((r) => setTimeout(r, 1500));
          await page.screenshot({ path: file, fullPage: true });
          results.push({ viewport: vp.name, path: p, file, ok: true });
        } catch (err) {
          process.stderr.write(`  ОШИБКА: ${err.message}\n`);
          results.push({ viewport: vp.name, path: p, file, ok: false, error: err.message });
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("\n=== Скриншоты конкурента ===\n");
  for (const vp of VIEWPORTS) {
    const rows = results.filter((r) => r.viewport === vp.name);
    const ok = rows.filter((r) => r.ok).length;
    console.log(`${vp.name} (${vp.width}×${vp.height}): ${ok}/${rows.length} страниц`);
    for (const r of rows.filter((r) => !r.ok)) {
      console.log(`  ОШИБКА ${r.path}: ${r.error}`);
    }
  }
  console.log(`\nПуть: ${OUT}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
