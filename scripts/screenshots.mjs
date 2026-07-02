/**
 * Снимает скриншоты публичных страниц в трёх разрешениях.
 * Требуется запущенный сервер (`npm run dev` или `npm run start`).
 *
 *   SCREENSHOTS_BASE_URL=http://localhost:3000 npm run screenshots
 *
 * Результат: reports/screenshots/<viewport>/<page>.png
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "reports", "screenshots");

const BASE = (process.env.SCREENSHOTS_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PATHS = [
  "/",
  "/about",
  "/catalog",
  "/catalog-kamnya",
  "/catalog-kamnya/brands/avant",
  "/catalog/countertops",
  "/catalog/countertops/stoleshnitsa-calacatta-vision",
  "/portfolio",
  "/contacts",
  "/faq",
  "/privacy",
  "/thank-you",
];

const VIEWPORTS = [
  { name: "mobile",  width: 375,  height: 812,  deviceScaleFactor: 2 },
  { name: "tablet",  width: 768,  height: 1024, deviceScaleFactor: 1 },
  { name: "desktop", width: 1440, height: 900,  deviceScaleFactor: 1 },
];

function slugFromPath(p) {
  if (p === "/" || p === "") return "home";
  return p.replace(/^\//, "").replace(/\//g, "__");
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
      for (const p of PATHS) {
        const page = await browser.newPage();
        await page.setViewport({
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.deviceScaleFactor,
        });

        const url = `${BASE}${p}`;
        const slug = slugFromPath(p);
        const file = path.join(OUT, vp.name, `${slug}.png`);

        process.stderr.write(`→ [${vp.name}] ${url}\n`);

        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));
          await page.screenshot({ path: file, fullPage: true });
          results.push({ viewport: vp.name, path: p, file, ok: true });
        } catch (err) {
          process.stderr.write(`  ОШИБКА: ${err.message}\n`);
          results.push({ viewport: vp.name, path: p, file, ok: false, error: err.message });
        } finally {
          await page.close().catch(() => {});
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n=== Скриншоты ===\n");
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
