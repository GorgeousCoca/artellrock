/**
 * Разбор текстового прайса камней («цены на камни.txt») в строки `{ бренд, название, цена }`.
 *
 * Чистая функция без ввода-вывода: файл читает скрипт импорта (`scripts/import-material-prices.ts`).
 * Прайс — это ДАННЫЕ для импорта в БД, а не константы приложения: цен в коде нет, владелец заменяет файл и
 * перезапускает импорт.
 *
 * Формат:
 *   ### N. [Бренд]
 *   * <Артикул и название> — от <цена> ₽/м²
 * Цена — целое, разделитель тысяч пробел (обычный, неразрывный или узкий неразрывный). Пустые строки, разделители
 * `---` и вводный текст ДО первого заголовка бренда игнорируются. Всё остальное, что не удалось разобрать, —
 * ошибка с номером строки: строки молча не пропускаются.
 */

export type PriceRow = {
  brand: string;
  /** Артикул и название как в файле, например «BQ 5260 Beton (5мм) (Мат)». */
  title: string;
  /** Целые рубли за м². Может быть 0 (такая позиция в калькулятор не включается). */
  price: number;
  /** Номер строки в файле, с 1. */
  line: number;
  /** Строка файла целиком (для отчётов). */
  raw: string;
};

export type PriceList = {
  /** Бренды в порядке файла. */
  brands: string[];
  rows: PriceRow[];
};

export class PriceListError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly text: string
  ) {
    super(`Строка ${line}: ${message}\n  ${JSON.stringify(text)}`);
    this.name = "PriceListError";
  }
}

const HEADING = /^###\s+(\d+)\.\s+\[(.+)\]\s*$/;
const SEPARATOR = /^-{3,}$/;
// Название лениво, затем « — от <цена> ₽/м²». Тире: длинное, среднее или дефис, но только отделённые пробелами
// (дефис внутри названия, как в «Сен-Мало», разделителем не считается).
const ITEM = /^\*\s+(.+?)\s+[—–-]\s+от\s+(\d{1,3}(?:[ \u00A0\u202F]\d{3})+|\d+)\s*₽\s*\/\s*м²\s*$/;

export function parsePriceList(source: string): PriceList {
  const brands: string[] = [];
  const rows: PriceRow[] = [];
  let brand: string | null = null;

  // Вырезаем BOM, если файл сохранён с ним; переводы строк любые.
  const lines = source.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);

  lines.forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trim();
    if (text === "" || SEPARATOR.test(text)) return;

    const heading = HEADING.exec(text);
    if (heading) {
      const name = heading[2].trim();
      if (brands.includes(name)) throw new PriceListError(`бренд «${name}» объявлен дважды`, line, raw);
      brands.push(name);
      brand = name;
      return;
    }

    // Вводный текст до первого бренда («Ниже представлен…») — не данные.
    if (brand === null) {
      if (text.startsWith("*")) throw new PriceListError("позиция до заголовка бренда", line, raw);
      return;
    }

    const item = ITEM.exec(text);
    if (!item) throw new PriceListError("строка не распознана (ожидается «* Название — от 12 345 ₽/м²»)", line, raw);

    const title = item[1].trim();
    const price = Number(item[2].replace(/[ \u00A0\u202F]/g, ""));
    if (!title) throw new PriceListError("пустое название", line, raw);
    if (!Number.isSafeInteger(price)) throw new PriceListError("некорректная цена", line, raw);

    rows.push({ brand, title, price, line, raw: text });
  });

  return { brands, rows };
}
