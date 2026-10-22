import { ValidationError, type CollectionBeforeValidateHook, type Where } from "payload";

import { materialKey } from "../../lib/catalog/identity";

/**
 * Уникальность материала в бренде по ключу «артикул + название» без учёта регистра и написания матовости
 * («Mat» = «Matt» = «Matovyy»), БЕЗ уникального индекса в БД (индекс потребовал бы миграцию).
 *
 * Зачем: повторный запуск `seed-materials` или ручное создание дают дубли вроде «Bq 8926 …» и «BQ 8926 …». Это
 * тот же ключ, по которому прайс сопоставляется с БД (`price-match.ts`), поэтому дубль сделал бы сопоставление
 * неоднозначным. Хук — предохранитель на уровне приложения; от гонки двух одновременных создателей он не защищает
 * (для этого нужен индекс), но ручное создание и повторный сид ловит.
 *
 * Проверка идёт только при создании и при смене бренда/артикула/названия: массовое изменение цен
 * (`/api/materials/bulk-prices`) этих полей не трогает и лишних запросов не делает.
 */
export const ensureUniqueMaterial: CollectionBeforeValidateHook = async ({ data, originalDoc, operation, req }) => {
  if (!data) return data;

  const changed = (["brand", "sku", "name"] as const).some((field) => field in data && data[field] !== originalDoc?.[field]);
  if (operation !== "create" && !changed) return data;

  const pick = (field: "brand" | "sku" | "name"): string => String(data[field] ?? originalDoc?.[field] ?? "").trim();
  const brand = pick("brand");
  const name = pick("name");
  const sku = pick("sku");
  // Пустые обязательные поля обрабатывает собственная валидация полей.
  if (!brand || !name) return data;

  const key = materialKey({ id: 0, brand, name, sku });
  // `like` — «содержит» без учёта регистра: берём кандидатов бренда и сверяем точно уже здесь.
  const where: Where = { brand: { like: brand } };
  const result = await req.payload.find({
    collection: "materials",
    where,
    limit: 0,
    pagination: false,
    depth: 0,
    select: { brand: true, sku: true, name: true },
    req,
    overrideAccess: true
  });

  const duplicate = result.docs.find(
    (doc) =>
      String(doc.id) !== String(originalDoc?.id ?? "") &&
      doc.brand.trim().toLowerCase() === brand.toLowerCase() &&
      materialKey(doc) === key
  );
  if (!duplicate) return data;

  throw new ValidationError(
    {
      collection: "materials",
      errors: [
        {
          path: "name",
          message: `В бренде «${brand}» уже есть такой материал (id ${duplicate.id}): «${[duplicate.sku, duplicate.name].filter(Boolean).join(" ")}». Регистр и написание «мат/Mat/Matt» не различаются.`
        }
      ]
    },
    req.t
  );
};
