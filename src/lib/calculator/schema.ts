/**
 * Схема входных данных калькулятора (zod). Изоморфная: одно и то же описание проверяет ввод и на сервере
 * (Server Action — граница доверия), и в интерфейсе.
 *
 * Ключевой принцип: клиент передаёт ТОЛЬКО идентификаторы и геометрию. Ни цен, ни сумм, ни названий в
 * схеме нет — всё это сервер читает из БД сам. Поэтому подменить стоимость в запросе невозможно.
 */
import { z } from "zod";

import { pickDimensions, SHAPE_KINDS, unknownDimensionKeys, validateItem } from "./geometry";

export const MAX_ITEMS = 20;
export const MAX_SERVICES = 60;
export const MAX_SERVICE_QUANTITY = 1000;

/**
 * Идентификатор документа Payload (Postgres: числовой, приходит строкой).
 * Без ведущих нулей («007» — не тот же id, что «7») и не длиннее 9 цифр: 10+ цифр не помещаются в
 * Postgres `integer` (запрос упал бы ошибкой вместо «не найдено»), а 16+ цифр ещё и теряют точность в `Number()`.
 */
export const CATALOG_ID_PATTERN = /^[1-9]\d{0,8}$/;
export const isCatalogId = (value: string) => CATALOG_ID_PATTERN.test(value);
const catalogId = z.string().regex(CATALOG_ID_PATTERN, "Некорректный идентификатор");

/**
 * Размеры как пришли: объект с конечными числами. Не `z.record`: он молча выбрасывает собственный ключ
 * `__proto__` (из JSON.parse), и проверить «лишних ключей нет» после разбора уже нельзя. Какие ключи допустимы,
 * зависит от формы, поэтому это решает `superRefine` изделия.
 */
const rawDimensions = z.custom<Record<string, number>>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getOwnPropertyNames(value).every((key) => Number.isFinite((value as Record<string, unknown>)[key])),
  "Некорректные размеры"
);

export const itemSchema = z
  .object({
    id: z.string().min(1).max(64),
    shape: z.enum(SHAPE_KINDS),
    /** Ключи проверяются вместе с формой (см. superRefine) и в результат попадают только допустимые. */
    dims: rawDimensions,
    /** Один радиус (мм) для всех отмеченных углов. */
    cornerRadius: z.number(),
    /** Идентификаторы отмеченных углов (`c0`…); существование и повторы проверяет validateItem. */
    roundedCorners: z.array(z.string().max(16)).max(8),
    edgeSides: z.array(z.string().max(16)).max(8),
    backsplashSides: z.array(z.string().max(16)).max(8)
  })
  .superRefine((item, ctx) => {
    // Лишние ключи размеров (в том числе `__proto__`) — ошибка: иначе они попали бы в снимок заявки.
    for (const key of unknownDimensionKeys(item.shape, item.dims)) {
      ctx.addIssue({ code: "custom", message: "Лишний размер для этой формы", path: ["dims", key] });
    }
    for (const [field, message] of Object.entries(validateItem(item))) {
      ctx.addIssue({ code: "custom", message, path: [field] });
    }
  })
  // Дальше по цепочке идёт только очищенный объект размеров: ключи формы и ничего больше.
  .transform((item) => ({ ...item, dims: pickDimensions(item.shape, item.dims) }));

export const serviceSelectionSchema = z.object({
  serviceId: catalogId,
  quantity: z.number().positive().max(MAX_SERVICE_QUANTITY)
});

/** Базовый объект без refine: от него наследуется схема отправки заявки (zod 4 не позволяет extend после refine). */
const baseShape = z.object({
  items: z.array(itemSchema).min(1).max(MAX_ITEMS),
  materialId: catalogId.optional(),
  thicknessId: catalogId.optional(),
  profileId: catalogId.optional(),
  backsplashId: catalogId.optional(),
  sinkId: catalogId.optional(),
  services: z.array(serviceSelectionSchema).max(MAX_SERVICES)
});

type BaseInput = z.infer<typeof baseShape>;

function refineUnique(input: BaseInput, ctx: z.RefinementCtx) {
  const itemIds = new Set<string>();
  input.items.forEach((item, index) => {
    if (itemIds.has(item.id)) ctx.addIssue({ code: "custom", message: "Дубликат изделия", path: ["items", index, "id"] });
    itemIds.add(item.id);
  });

  const serviceIds = new Set<string>();
  input.services.forEach((service, index) => {
    if (serviceIds.has(service.serviceId)) {
      ctx.addIssue({ code: "custom", message: "Дубликат услуги", path: ["services", index, "serviceId"] });
    }
    serviceIds.add(service.serviceId);
  });
}

/** Вход для расчёта (материал необязателен: смета достраивается по мере выбора). */
export const calculatorInputSchema = baseShape.superRefine(refineUnique);
export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
export type CalculatorItem = CalculatorInput["items"][number];

/** Отправка заявки: материал обязателен, добавляются контакты, согласие и скрытое поле-приманка. */
export const submitSchema = baseShape
  .extend({
    materialId: catalogId,
    name: z.string().trim().min(2, "Укажите имя").max(120),
    phone: z.string().trim().min(6, "Укажите телефон").max(40),
    consent: z.literal(true, { error: "Нужно согласие на обработку данных" }),
    /** Скрытое поле: у человека пустое, бот его заполняет. */
    website: z.string().max(0).optional().default("")
  })
  .superRefine(refineUnique);
export type SubmitInput = z.infer<typeof submitSchema>;
