/**
 * Загружает отзывы с Авито из `src/content/reviews-avito.ts` в коллекцию Payload `testimonials`
 * со статусом «Одобрен». Дальше их можно править и скрывать в админке.
 *
 * Повторный запуск не затирает правки: отзыв с тем же автором и той же датой пропускается.
 *   npm run seed:reviews
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { AVITO_ROLE, avitoReviews } from "../src/content/reviews-avito";
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
  let created = 0;
  let skipped = 0;

  for (const review of avitoReviews) {
    // Полдень по Москве: дата не уезжает на соседний день при любом часовом поясе.
    const createdAt = new Date(`${review.date}T12:00:00+03:00`).toISOString();

    const existing = await payload.find({
      collection: "testimonials",
      where: { and: [{ author: { equals: review.author } }, { createdAt: { equals: createdAt } }] },
      limit: 1,
      depth: 0,
      pagination: false
    });

    if (existing.docs[0]) {
      skipped += 1;
      continue;
    }

    await payload.create({
      collection: "testimonials",
      context: { [SKIP_REVALIDATE_CONTEXT]: true },
      data: {
        author: review.author,
        role: AVITO_ROLE,
        quote: review.quote,
        rating: 5,
        status: "approved",
        source: "avito",
        createdAt
      }
    });
    created += 1;
  }

  console.log(`Отзывы Авито: создано ${created}, уже было ${skipped}, всего в файле ${avitoReviews.length}.`);
  process.exit(0);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
