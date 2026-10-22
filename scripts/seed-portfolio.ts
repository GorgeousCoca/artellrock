/**
 * Переносит кадры портфолио из `src/content/portfolio-cases.ts` и `src/content/works.ts`
 * в коллекцию Payload `projects`. Страница /portfolio читает уже оттуда.
 *
 * Повторный запуск не затирает правки в админке: существующий slug пропускается.
 *   npm run seed:portfolio
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { portfolioGroup, portfolioSourceWorks } from "../src/lib/portfolio";
import { SKIP_REVALIDATE_CONTEXT } from "../src/payload/hooks/revalidate";

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

async function main() {
  loadEnv();

  const payload = await getPayload({ config });
  const works = portfolioSourceWorks();
  let created = 0;
  let skipped = 0;

  for (const [index, work] of works.entries()) {
    const existing = await payload.find({
      collection: "projects",
      where: { slug: { equals: work.id } },
      limit: 1,
      depth: 0,
      pagination: false
    });

    if (existing.docs[0]) {
      skipped += 1;
      continue;
    }

    await payload.create({
      collection: "projects",
      context: { [SKIP_REVALIDATE_CONTEXT]: true },
      data: {
        slug: work.id,
        title: work.title ?? work.label,
        category: portfolioGroup(work.label),
        summary: work.text,
        afterImage: work.image,
        sortOrder: index
      }
    });
    created += 1;
  }

  console.log(`Портфолио: создано ${created}, уже было ${skipped}, всего в файлах ${works.length}.`);
  process.exit(0);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
