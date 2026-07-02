/**
 * Прогон Lighthouse только по категории «Доступность» по списку публичных URL.
 * Требуется запущенный сервер (например `npm run dev` или `npm run start`).
 *
 *   LIGHTHOUSE_BASE_URL=http://localhost:3000 npm run a11y:lighthouse
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REPORTS = path.join(ROOT, "reports");

const BASE = (process.env.LIGHTHOUSE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PATHS = [
  "/",
  "/catalog-kamnya",
  "/catalog-kamnya/brands/avant",
  "/catalog/countertops",
  "/catalog/countertops/stoleshnitsa-calacatta-vision",
  "/blog",
  "/blog/kak-vybrat-stoleshnitsu-iz-iskusstvennogo-kamnya",
  "/portfolio",
  "/contacts",
  "/about",
  "/privacy",
  "/thank-you"
];

function slugFromPath(p) {
  if (p === "/" || p === "") return "home";
  return p.replace(/^\//, "").replace(/\//g, "__");
}

function collectFailedAudits(lhr) {
  const refs = lhr.categories?.accessibility?.auditRefs ?? [];
  const failed = [];
  for (const ref of refs) {
    const audit = lhr.audits?.[ref.id];
    if (!audit) continue;
    if (audit.scoreDisplayMode === "manual" || audit.scoreDisplayMode === "notApplicable") continue;
    if (audit.score !== null && audit.score < 1) {
      failed.push({
        id: audit.id,
        title: audit.title,
        description: audit.description
      });
    }
  }
  return failed;
}

async function main() {
  fs.mkdirSync(REPORTS, { recursive: true });

  const chrome = await launchChrome({
    chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
  });

  const summary = [];

  try {
    for (const p of PATHS) {
      const url = `${BASE}${p}`;
      process.stderr.write(`→ ${url}\n`);

      const runnerResult = await lighthouse(url, {
        logLevel: "error",
        output: "json",
        onlyCategories: ["accessibility"],
        port: chrome.port,
        settings: {
          formFactor: "desktop",
          screenEmulation: { disabled: true }
        }
      });

      const lhr = runnerResult.lhr;
      const score = Math.round((lhr.categories?.accessibility?.score ?? 0) * 100);
      const failed = collectFailedAudits(lhr);

      summary.push({ path: p, url, score, failed });

      const outFile = path.join(REPORTS, `lighthouse-a11y__${slugFromPath(p)}.json`);
      fs.writeFileSync(outFile, runnerResult.report ?? JSON.stringify(lhr, null, 2));
    }
  } finally {
    await chrome.kill();
  }

  const summaryPath = path.join(REPORTS, "lighthouse-a11y-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log("\n=== Lighthouse: доступность (0–100) ===\n");
  for (const row of summary) {
    console.log(`${String(row.score).padStart(3)}  ${row.url}`);
    for (const f of row.failed.slice(0, 12)) {
      console.log(`      · ${f.id}: ${f.title}`);
    }
    if (row.failed.length > 12) {
      console.log(`      … ещё ${row.failed.length - 12} проверок`);
    }
  }
  console.log(`\nСводка: ${summaryPath}`);
  console.log(`Полные JSON: ${REPORTS}/lighthouse-a11y__*.json\n`);

  const worst = summary.filter((r) => r.score < 90);
  if (worst.length) {
    console.log(`Страницы со score < 90: ${worst.map((w) => w.path).join(", ")}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
