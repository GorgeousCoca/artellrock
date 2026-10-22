/**
 * ДЕМО-данные калькулятора для локальной проверки. НЕ запускать на production.
 *
 * Все позиции помечены префиксом «[ДЕМО]», а цены — условные круглые числа, не прайс компании.
 * Запуск:   npm run seed:calculator-demo
 * Удаление: SEED_CLEAN=1 npm run seed:calculator-demo   (PowerShell: $env:SEED_CLEAN="1"; npm run ...)
 *   SEED_CLEAN=1 удаляет демо сразу из ВСЕХ пяти коллекций, включая автоматические услуги («Раскрой», «Базовая
 *   обработка»): смета после этого резко упадёт. Чтобы убрать только часть, перечислите коллекции:
 *   SEED_CLEAN=materials   или   SEED_CLEAN=materials,sinks
 * Создание демо-данных при NODE_ENV=production запрещено (скрипт завершается с ошибкой); очистка разрешена.
 *
 * Настоящие цены владелец вносит в /admin → «Калькулятор». В коде приложения цен нет.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload, type CollectionSlug } from "payload";

import config from "../src/payload.config";
import { quartzBrands } from "../src/content/quartz-decors";
import { roundToPriceStep } from "../src/lib/calculator/price-rounding";

const PREFIX = "[ДЕМО] ";
const COLLECTIONS: CollectionSlug[] = ["materials", "edges", "backsplashes", "sinks", "additional-services"];

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

/** Что чистить: `1`/`all` — все коллекции, иначе список slug через запятую. Неизвестное значение — ошибка. */
function collectionsToClean(value: string): CollectionSlug[] {
  if (value === "1" || value === "all") return COLLECTIONS;
  const requested = value.split(",").map((part) => part.trim()).filter(Boolean);
  const unknown = requested.filter((slug) => !COLLECTIONS.includes(slug as CollectionSlug));
  if (requested.length === 0 || unknown.length > 0) {
    throw new Error(`SEED_CLEAN: неизвестные коллекции «${unknown.join(", ") || value}». Допустимо: 1, all, ${COLLECTIONS.join(", ")}.`);
  }
  return requested as CollectionSlug[];
}

async function clean(payload: Awaited<ReturnType<typeof getPayload>>, collections: CollectionSlug[]) {
  for (const collection of collections) {
    // Точное условие «название начинается с префикса»: оператор like в Payload ищет подстроку по словам.
    const found = await payload.find({ collection, limit: 0, pagination: false, depth: 0 });
    const ids = found.docs
      .filter((doc) => typeof (doc as { name?: unknown }).name === "string" && (doc as { name: string }).name.startsWith(PREFIX))
      .map((doc) => doc.id);
    if (ids.length > 0) await payload.delete({ collection, where: { id: { in: ids } } });
    console.log(`${collection}: удалено ${ids.length}`);
  }
}

async function seed(payload: Awaited<ReturnType<typeof getPayload>>) {
  const shades = ["белый", "серый", "бежевый", "чёрный"];
  const textures = ["монотонный", "вкрапления"];

  let n = 0;
  for (const brand of quartzBrands.slice(0, 4)) {
    for (const decor of brand.decors.slice(0, 5)) {
      await payload.create({
        collection: "materials",
        data: {
          brand: brand.name,
          name: `${PREFIX}${decor.name}`,
          sku: String(1000 + n),
          shade: shades[n % shades.length],
          texture: textures[n % textures.length],
          image: decor.image,
          pricePerSqm: roundToPriceStep(10000 + (n % 7) * 1500),
          sheetLengthMm: 3000,
          sheetWidthMm: 1400,
          sortOrder: n,
          isActive: true
        }
      });
      n += 1;
    }
  }

  const edges = [
    { kind: "thickness", name: "Сплошной лист 12 мм", thicknessMm: 12, pricePerMeter: 0 },
    { kind: "thickness", name: "Сэндвич 24 мм", thicknessMm: 24, pricePerMeter: 1500 },
    { kind: "thickness", name: "Сэндвич 36 мм", thicknessMm: 36, pricePerMeter: 3000 },
    { kind: "profile", name: "Прямая", pricePerMeter: 0 },
    { kind: "profile", name: "Радиус", pricePerMeter: 400 },
    { kind: "profile", name: "Фаска", pricePerMeter: 500 }
  ] as const;
  for (const [index, edge] of edges.entries()) {
    await payload.create({
      collection: "edges",
      data: { ...edge, name: PREFIX + edge.name, pricePerMeter: roundToPriceStep(edge.pricePerMeter), sortOrder: index }
    });
  }

  for (const [index, item] of [
    { name: "Накладной стандарт", heightMm: 60, pricePerMeter: 700 },
    { name: "Литой прямой", heightMm: 60, pricePerMeter: 1500 }
  ].entries()) {
    await payload.create({
      collection: "backsplashes",
      data: { ...item, name: PREFIX + item.name, pricePerMeter: roundToPriceStep(item.pricePerMeter), sortOrder: index }
    });
  }

  const sinks = [
    { type: "cutout", name: "Вырез для мойки", price: 2000 },
    { type: "undermount", name: "Вырез под мойку снизу", price: 5000 },
    { type: "integrated", name: "M1 (скруглённая)", price: 12000 },
    { type: "integrated", name: "M2 (прямоугольная)", price: 14000 },
    { type: "integrated", name: "M3 (круг)", price: 13000 }
  ] as const;
  for (const [index, sink] of sinks.entries()) {
    await payload.create({
      collection: "sinks",
      data: { ...sink, name: PREFIX + sink.name, price: roundToPriceStep(sink.price), sortOrder: index }
    });
  }

  const services = [
    { name: "Раскрой (прямолинейный рез)", category: "processing", price: 500, quantityMode: "perimeter", autoApply: true },
    { name: "Базовая обработка материала", category: "processing", price: 3000, quantityMode: "area", autoApply: true },
    { name: "Скругление углов", category: "processing", price: 300, quantityMode: "rounded-corners" },
    { name: "Вырез для варочной панели", category: "processing", price: 2500, quantityMode: "user", unit: "piece" },
    { name: "Проточки", category: "processing", price: 600, quantityMode: "user", unit: "piece", hint: "Сквозные и несквозные" },
    { name: "Замер", category: "measure", price: 1500, quantityMode: "once" },
    { name: "Доставка до подъезда", category: "delivery", price: 2000, quantityMode: "once" },
    { name: "Монтаж", category: "installation", price: 2500, quantityMode: "area" },
    { name: "Монтаж накладного борта", category: "installation", price: 400, quantityMode: "backsplash" }
  ] as const;
  for (const [index, service] of services.entries()) {
    await payload.create({
      collection: "additional-services",
      data: { unit: "piece", ...service, name: PREFIX + service.name, price: roundToPriceStep(service.price), sortOrder: index }
    });
  }

  console.log("Демо-данные созданы.");
}

async function main() {
  loadEnv();

  const cleanValue = process.env.SEED_CLEAN?.trim();
  // Условные цены в продакшене = товары «за 10 000 ₽» в живом калькуляторе. Проверка до подключения к БД.
  if (!cleanValue && process.env.NODE_ENV === "production") {
    throw new Error("Демо-данные нельзя создавать при NODE_ENV=production. Скрипт остановлен, БД не тронута.");
  }

  const collections = cleanValue ? collectionsToClean(cleanValue) : null;
  const payload = await getPayload({ config });

  if (collections) await clean(payload, collections);
  else await seed(payload);

  process.exit(0);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
