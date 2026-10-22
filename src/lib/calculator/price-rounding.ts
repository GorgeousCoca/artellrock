/**
 * Общий шаг цены: 250 ₽. Изоморфный модуль (без Payload и React).
 *
 * Ближайшее кратное, половина вверх: `Math.round(value / 250) * 250`.
 * Так 125 → 250, 124 → 0, 17 771 → 17 750.
 * Отрицательные и нечисла на чтении не валят расчёт: становятся 0. Запись в БД их всё равно не примет.
 */
import { formatRub } from "./format";

export const PRICE_STEP = 250;

/** Короткая формулировка правила. Полный текст с ближайшим значением — `priceStepError`. */
export const PRICE_STEP_MESSAGE = "Цена должна быть кратна 250 ₽.";

/** Ближайшее неотрицательное кратное 250. NaN и отрицательные → 0. */
export function roundToPriceStep(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value / PRICE_STEP) * PRICE_STEP;
}

/** Конечное неотрицательное число, кратное 250 (0 подходит). */
export function isPriceStepMultiple(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  const steps = value / PRICE_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/**
 * Текст ошибки для цены, которая не кратна 250. `null`, если значение уже подходит.
 * Ближайшее число форматируется так же, как цены на сайте (`formatRub`).
 */
export function priceStepError(value: number): string | null {
  if (isPriceStepMultiple(value)) return null;
  const nearest = roundToPriceStep(value);
  return `${PRICE_STEP_MESSAGE} Ближайшее значение: ${formatRub(nearest)}`;
}
