import { NextResponse } from "next/server";

import { getMaterials } from "@/lib/calculator/server";
import type { MaterialCard } from "@/lib/calculator/types";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

/**
 * Каталог материалов для шага 2. Данные берутся из Payload через кэш с тегами (сбрасывается при правке в админке).
 * Отдаём лёгкие записи одним запросом. Характеристики — массивы (пустые, если в карточке их ещё нет).
 */
export const GET = withApiErrorHandling(async () => {
  const records = await getMaterials();

  const materials: MaterialCard[] = records.map((m) => ({
    id: m.id,
    brand: m.brand,
    name: m.name,
    sku: m.sku,
    formats: m.formats,
    thicknessesMm: m.thicknessesMm,
    shades: m.shades,
    finish: m.finish,
    textures: m.textures,
    pricePerSqm: m.pricePerSqm,
    image: m.image
  }));

  return NextResponse.json({ materials });
});
