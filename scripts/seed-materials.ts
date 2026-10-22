/**
 * Перенос декоров кварца из `src/content/quartz-decors.ts` в коллекцию `materials` (калькулятор).
 *
 * Запуск: `npm run seed:materials` (нужны DATABASE_URI и PAYLOAD_SECRET в окружении или .env).
 *
 * Что делает:
 *  - создаёт материалы с брендом, названием, артикулом и картинкой;
 *  - НЕ задаёт цен: `pricePerSqm = 0`, `isActive = false`. В калькуляторе материал появится, когда владелец
 *    укажет цену и включит «Показывать в калькуляторе» (в списке админки можно править пачкой).
 *  - идемпотентен: уже существующие (бренд + артикул + название) пропускаются.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";

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

/**
 * «A100 Clear Quartz» -> артикул «A100», название «Clear Quartz»;
 * «EQAC 036 Antica Grey» -> «EQAC 036» + «Antica Grey»; «Antracite» -> без артикула.
 */
function splitDecorName(full: string): { sku?: string; name: string } {
  const tokens = full.trim().split(/\s+/);
  const hasDigit = (t: string) => /\d/.test(t);

  if (tokens.length > 1 && hasDigit(tokens[0])) {
    return { sku: tokens[0], name: tokens.slice(1).join(" ") };
  }
  if (tokens.length > 2 && /^[A-Za-z]{1,5}$/.test(tokens[0]) && /^\d+$/.test(tokens[1])) {
    return { sku: `${tokens[0]} ${tokens[1]}`, name: tokens.slice(2).join(" ") };
  }
  return { name: full.trim() };
}

async function main() {
  loadEnv();
  const payload = await getPayload({ config });

  const existing = await payload.find({ collection: "materials", limit: 0, pagination: false, depth: 0 });
  const seen = new Set(existing.docs.map((doc) => `${doc.brand}|${doc.sku ?? ""}|${doc.name}`));

  let created = 0;
  let skipped = 0;

  for (const brand of quartzBrands) {
    for (const [index, decor] of brand.decors.entries()) {
      const { sku, name } = splitDecorName(decor.name);
      const key = `${brand.name}|${sku ?? ""}|${name}`;

      if (seen.has(key)) {
        skipped += 1;
        continue;
      }

      await payload.create({
        collection: "materials",
        data: {
          brand: brand.name,
          name,
          sku,
          image: decor.image,
          pricePerSqm: 0,
          isActive: false,
          sortOrder: index * 10
        }
      });
      seen.add(key);
      created += 1;
    }
    console.log(`${brand.name}: ${brand.decors.length}`);
  }

  console.log(`Готово. Создано: ${created}, пропущено (уже есть): ${skipped}.`);
  console.log("Материалы неактивны и без цены: укажите цену и включите «Показывать в калькуляторе» в /admin.");
  process.exit(0);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
