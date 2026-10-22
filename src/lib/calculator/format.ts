/** Форматирование чисел для сметы. Изоморфное: сервер и клиент выводят одинаково (без рассинхрона гидратации). */

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const quantity = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatRub(value: number): string {
  return rub.format(value);
}

export function formatQuantity(value: number): string {
  return quantity.format(value);
}

/** Миллиметры -> «1 200 мм». */
export function formatMm(value: number): string {
  return `${quantity.format(Math.round(value))} мм`;
}
