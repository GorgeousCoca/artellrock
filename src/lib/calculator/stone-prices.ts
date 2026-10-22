/**
 * Чистая логика массового изменения цен камней: проверка запроса, план записи, сводка перед сохранением и
 * пакетные операции («±N%», «округлить»). Без Payload, БД и React: одну и ту же логику вызывают
 * эндпоинт `POST /api/materials/bulk-prices` (`src/payload/endpoints/bulk-prices.ts`) и страница админки
 * «Цены на камни», и покрывается она тестами без БД.
 *
 * Эндпоинт меняет цены в продаже, поэтому здесь всё строго: целые рубли, кратные 250, жёсткие границы,
 * защита от одновременной правки через `updatedAt`, цена 0 всегда выключает позицию из калькулятора.
 */
import { z } from "zod";

import { isPriceStepMultiple, priceStepError, roundToPriceStep } from "./price-rounding";

/** Верхняя граница цены за м², ₽. Намного выше любого реального камня: ловит опечатки вроде лишних нулей. */
export const MAX_PRICE_PER_SQM = 1_000_000;
/** Строк за один запрос: все 618 камней и небольшой запас. */
export const MAX_BULK_ROWS = 700;
/** Изменение цены больше этого числа процентов показывается предупреждением в сводке. */
export const LARGE_CHANGE_PERCENT = 30;

// ---------------------------------------------------------------------------------------------
// Запрос к эндпоинту
// ---------------------------------------------------------------------------------------------

const bulkRowSchema = z.object({
  /** Идентификатор Postgres (integer). */
  id: z.number().int().positive().max(2_147_483_647),
  pricePerSqm: z
    .number()
    .int("Только целые рубли")
    .min(0, "Цена не может быть отрицательной")
    .max(MAX_PRICE_PER_SQM, "Слишком большая цена")
    .refine((value) => isPriceStepMultiple(value), "Цена должна быть кратна 250 ₽."),
  isActive: z.boolean(),
  /** `updatedAt`, который клиент получил вместе со строкой: по нему обнаруживается чужая правка. */
  updatedAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), "Некорректная дата")
});

export const bulkPricesSchema = z
  .object({ rows: z.array(bulkRowSchema).min(1, "Нет строк для сохранения").max(MAX_BULK_ROWS, `Не больше ${MAX_BULK_ROWS} строк за раз`) })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.rows.forEach((row, index) => {
      if (seen.has(row.id)) ctx.addIssue({ code: "custom", message: "Одна и та же запись повторяется", path: ["rows", index, "id"] });
      seen.add(row.id);
    });
  });

export type BulkPriceRow = z.infer<typeof bulkRowSchema>;
export type BulkPricesRequest = z.infer<typeof bulkPricesSchema>;

// ---------------------------------------------------------------------------------------------
// План записи
// ---------------------------------------------------------------------------------------------

/** Что сейчас в БД. */
export type CurrentMaterial = { id: number; pricePerSqm: number; isActive: boolean; updatedAt: string };

export type RowError = { id: number; code: "not_found" | "conflict"; message: string };

export type RowPlan =
  | { id: number; status: "unchanged" }
  | { id: number; status: "update"; data: { pricePerSqm: number; isActive: boolean }; forcedInactive: boolean }
  | ({ status: "error" } & RowError);

/**
 * План по каждой строке запроса. Правила:
 *  - цена 0 не может быть у активной позиции (валидатор коллекции это запрещает), поэтому позиция с ценой 0
 *    выключается автоматически (`forcedInactive`);
 *  - если итоговое состояние уже совпадает с БД, строка `unchanged` — даже если запись в БД «новее» присланной;
 *  - иначе, если в БД запись изменили позже, чем клиент её получил (`updatedAt` в БД новее), строка отклоняется
 *    с понятной ошибкой, а не перезаписывается молча.
 */
export function planBulkUpdate(rows: readonly BulkPriceRow[], current: ReadonlyMap<number, CurrentMaterial>): RowPlan[] {
  return rows.map((row): RowPlan => {
    const stored = current.get(row.id);
    if (!stored) return { id: row.id, status: "error", code: "not_found", message: "Материал не найден: возможно, его удалили." };

    const isActive = row.isActive && row.pricePerSqm > 0;
    if (stored.pricePerSqm === row.pricePerSqm && stored.isActive === isActive) return { id: row.id, status: "unchanged" };

    if (Date.parse(stored.updatedAt) > Date.parse(row.updatedAt)) {
      return {
        id: row.id,
        status: "error",
        code: "conflict",
        message: "Запись уже изменил другой пользователь. Обновите страницу, чтобы увидеть актуальную цену."
      };
    }

    return {
      id: row.id,
      status: "update",
      data: { pricePerSqm: row.pricePerSqm, isActive },
      forcedInactive: row.isActive && !isActive
    };
  });
}

export type BulkSummary = {
  /** Записей изменено. */
  updated: number;
  /** Без изменений: итоговое состояние совпало с БД. */
  skipped: number;
  /** Из изменённых: выключены из калькулятора, потому что цена 0. */
  deactivated: number;
  /** Строк с ошибкой (если есть хоть одна, не записывается ничего). */
  failed: number;
};

export function summarizePlan(plan: readonly RowPlan[]): BulkSummary {
  return {
    updated: plan.filter((p) => p.status === "update").length,
    skipped: plan.filter((p) => p.status === "unchanged").length,
    deactivated: plan.filter((p) => p.status === "update" && p.forcedInactive).length,
    failed: plan.filter((p) => p.status === "error").length
  };
}

// ---------------------------------------------------------------------------------------------
// Сводка изменений перед сохранением (клиент)
// ---------------------------------------------------------------------------------------------

export type PriceEdit = {
  id: number;
  /** Подпись строки: «A35 Bianco Marble». */
  label: string;
  oldPrice: number;
  newPrice: number;
  oldActive: boolean;
  newActive: boolean;
};

/** Изменение цены в процентах; `null`, если раньше цены не было (проценты от нуля не определены). */
export function changePercent(oldPrice: number, newPrice: number): number | null {
  return oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : null;
}

export type ChangeSummary = {
  /** Строк, у которых изменилась цена. */
  priceChanges: number;
  /** Строк, у которых изменился только переключатель (цена прежняя). */
  activeOnlyChanges: number;
  /** Самые большие изменения цены (по модулю процента, потом по рублям), не более `topN`. */
  biggest: Array<PriceEdit & { percent: number | null }>;
  /** Изменение цены больше 30%. */
  large: PriceEdit[];
  /** Цена станет 0: позиция выключится из калькулятора. */
  zeroed: PriceEdit[];
  /** Позиции, которые перестанут показываться в калькуляторе (включая цену 0). */
  willHide: PriceEdit[];
  /** Позиции, которые начнут показываться. */
  willShow: PriceEdit[];
};

/** Итоговое состояние переключателя: при цене 0 позиция всегда выключена. */
export const effectiveActive = (edit: Pick<PriceEdit, "newPrice" | "newActive">) => edit.newActive && edit.newPrice > 0;

export function summarizeChanges(edits: readonly PriceEdit[], topN = 5): ChangeSummary {
  const changed = edits.filter((e) => e.oldPrice !== e.newPrice || e.oldActive !== effectiveActive(e));
  const priced = changed.filter((e) => e.oldPrice !== e.newPrice);

  const withPercent = priced.map((e) => ({ ...e, percent: changePercent(e.oldPrice, e.newPrice) }));
  const biggest = [...withPercent]
    .sort((a, b) => Math.abs(b.percent ?? 0) - Math.abs(a.percent ?? 0) || Math.abs(b.newPrice - b.oldPrice) - Math.abs(a.newPrice - a.oldPrice))
    .slice(0, topN);

  return {
    priceChanges: priced.length,
    activeOnlyChanges: changed.length - priced.length,
    biggest,
    // Целочисленное сравнение, без дробей: ровно 30% — ещё не «больше 30%».
    large: withPercent.filter((e) => e.oldPrice > 0 && Math.abs(e.newPrice - e.oldPrice) * 100 > LARGE_CHANGE_PERCENT * e.oldPrice),
    zeroed: priced.filter((e) => e.newPrice === 0),
    willHide: changed.filter((e) => e.oldActive && !effectiveActive(e)),
    willShow: changed.filter((e) => !e.oldActive && effectiveActive(e))
  };
}

// ---------------------------------------------------------------------------------------------
// Пакетные операции над таблицей бренда (меняют значения в таблице, но не сохраняют их)
// ---------------------------------------------------------------------------------------------

export const PERCENT_MIN = -99;
export const PERCENT_MAX = 1000;

/** Число процентов из текста поля («5», «-7,5», «+10»). `null` — не число или вне допустимых границ. */
export function parsePercent(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return value >= PERCENT_MIN && value <= PERCENT_MAX ? value : null;
}

const clampPrice = (price: number) => Math.min(MAX_PRICE_PER_SQM, Math.max(0, price));

/** Цена ± N%, затем до ближайших 250 ₽. Цена 0 остаётся 0 (от нуля проценты не считаются). */
export function scalePrice(price: number, percent: number): number {
  return roundToPriceStep(clampPrice(Math.round(price * (1 + percent / 100))));
}

export const ROUND_STEPS = [250, 500, 1000] as const;
export type RoundStep = (typeof ROUND_STEPS)[number];

/** Округление до ближайших 250 / 500 / 1000 ₽ (половина — вверх). Результат кратен 250. */
export function roundPrice(price: number, step: RoundStep): number {
  return roundToPriceStep(clampPrice(Math.round(price / step) * step));
}

/** Целое в границах 0…максимум, без проверки шага 250. Пустое, дробное, отрицательное и слишком большое — `null`. */
export function parsePriceAmount(text: string): number | null {
  const normalized = text.replace(/[\s\u00A0\u202F]/g, "");
  if (!/^\d{1,7}$/.test(normalized)) return null;
  const value = Number(normalized);
  return value <= MAX_PRICE_PER_SQM ? value : null;
}

/** Целая цена из текста поля, кратная 250. Всё остальное — `null` (причина — в `priceInputError`). */
export function parsePriceInput(text: string): number | null {
  const value = parsePriceAmount(text);
  if (value === null || !isPriceStepMultiple(value)) return null;
  return value;
}

/**
 * Почему текст цены нельзя сохранить. `null` — текст уже годится.
 * Некратное 250 объясняет `priceStepError` (с ближайшим значением); прочий мусор — общая подсказка.
 */
export function priceInputError(text: string): string | null {
  const value = parsePriceAmount(text);
  if (value !== null && isPriceStepMultiple(value)) return null;
  if (value !== null) return priceStepError(value);
  return `Целое число от 0 до ${MAX_PRICE_PER_SQM.toLocaleString("ru-RU")}, кратное 250`;
}
