/**
 * Доступность толщины кромки для выбранного камня. Чистая функция: без React и без БД.
 *
 * Пустой список толщин камня значит «данные неизвестны» — продажу не блокируем, доступны все карточки.
 * Сплошной слэб 20 или 30 мм доступен только если такая толщина есть у камня.
 * Сэндвич и «в ус» собираются из слэба, поэтому им нужны 20 или 30 мм. Если в карточке камня толщины
 * указаны, но нет ни 20, ни 30, собирать не из чего — эти карточки тоже недоступны.
 *
 * Сплошными считаем ровно 20 и 30 мм: так они заведены в справочнике кромок.
 * Остальные (40 и 70 мм «в ус», сэндвич без числа) — сборные.
 */

/** Короткая пометка на серой карточке. */
export const THICKNESS_UNAVAILABLE_NOTE = "нет у этого камня";

/** Сообщение, когда смена камня сбрасывает уже выбранную толщину. */
export const THICKNESS_RESET_MESSAGE = "Выбранная толщина недоступна для этого камня — выберите другую";

export type ThicknessChoice = {
  /** Миллиметры карточки толщины. Нет числа — сборная толщина (сэндвич). */
  thicknessMm?: number;
};

const isSolidSlab = (mm: number | undefined): mm is 20 | 30 => mm === 20 || mm === 30;

export function isThicknessAvailable(choice: ThicknessChoice, stoneThicknessesMm: readonly number[]): boolean {
  if (stoneThicknessesMm.length === 0) return true;
  if (isSolidSlab(choice.thicknessMm)) return stoneThicknessesMm.includes(choice.thicknessMm);
  return stoneThicknessesMm.some((value) => value === 20 || value === 30);
}

/**
 * Текст отказа для серверного расчёта.
 * `undefined` у толщин камня — материала в запросе нет, проверку не делаем.
 * Пустой массив — толщины неизвестны, выбранная толщина кромки допустима.
 */
export function unavailableThicknessMessage(
  choice: ThicknessChoice | undefined,
  stoneThicknessesMm: readonly number[] | undefined
): string | null {
  if (!choice || stoneThicknessesMm === undefined) return null;
  return isThicknessAvailable(choice, stoneThicknessesMm) ? null : THICKNESS_RESET_MESSAGE;
}
