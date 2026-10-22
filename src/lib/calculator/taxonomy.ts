/**
 * Справочники калькулятора: подписи и допустимые значения.
 *
 * Здесь НЕТ цен. Файл изоморфный (без React/Payload): его используют и схемы коллекций Payload
 * (options select-полей), и клиентский интерфейс (подписи), и серверный расчёт.
 */

/** Тип записи в коллекции `edges`: толщина кромки или её профиль оплачиваются отдельно (₽ за м.п.). */
export const EDGE_KINDS = [
  { value: "thickness", label: "Толщина кромки" },
  { value: "profile", label: "Профиль кромки" }
] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number]["value"];

/** Способы установки мойки. «integrated» — каменная мойка, у неё несколько моделей. */
export const SINK_TYPES = [
  { value: "cutout", label: "Вырез для мойки" },
  { value: "overmount", label: "Вырез под накладную мойку" },
  { value: "undermount", label: "Вырез под столешницу" },
  { value: "integrated", label: "Интегрированная мойка из камня" }
] as const;
export type SinkType = (typeof SINK_TYPES)[number]["value"];

/**
 * Картинки типов установки мойки. Это оформление карточки на шаге 4, не цена и не запись в БД:
 * у типа с одной записью картинка совпадает с картинкой этой записи, у интегрированной — общий кадр,
 * а модели ниже идут со своими фото.
 */
export const SINK_TYPE_IMAGES: Record<SinkType, string> = {
  cutout: "/images/calculator/sinks/sink-type-cutout.jpg",
  overmount: "/images/calculator/sinks/sink-type-overmount.jpg",
  undermount: "/images/calculator/sinks/sink-type-undermount.jpg",
  integrated: "/images/calculator/sinks/sink-type-integrated.jpg"
};

/** Карточка «Без выреза»: отсутствие выбора, отдельной записи мойки нет. */
export const SINK_NONE_IMAGE = "/images/calculator/sinks/sink-type-none.jpg";

export const SERVICE_CATEGORIES = [
  { value: "processing", label: "Обработка и вырезы" },
  { value: "measure", label: "Замер" },
  { value: "delivery", label: "Доставка" },
  { value: "installation", label: "Монтаж" },
  { value: "other", label: "Прочее" }
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["value"];

export const SERVICE_UNITS = [
  { value: "piece", label: "шт" },
  { value: "meter", label: "м.п." },
  { value: "sqm", label: "м²" }
] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number]["value"];

/**
 * Откуда берётся количество услуги. Все режимы, кроме `user`, считаются сервером из геометрии,
 * поэтому клиент не может повлиять на количество.
 */
export const QUANTITY_MODES = [
  { value: "user", label: "Указывает клиент", unit: null },
  { value: "once", label: "Один раз на заказ", unit: "piece" },
  { value: "area", label: "По общей площади изделий", unit: "sqm" },
  { value: "perimeter", label: "По общему периметру изделий", unit: "meter" },
  { value: "edge", label: "По длине обрабатываемой кромки", unit: "meter" },
  { value: "backsplash", label: "По длине бортика", unit: "meter" },
  { value: "rounded-corners", label: "По числу скруглённых углов", unit: "piece" }
] as const;
export type QuantityMode = (typeof QUANTITY_MODES)[number]["value"];

export const UNIT_LABEL: Record<ServiceUnit, string> = {
  piece: "шт",
  meter: "м.п.",
  sqm: "м²"
};

export const SINK_TYPE_LABEL = Object.fromEntries(SINK_TYPES.map((t) => [t.value, t.label])) as Record<
  SinkType,
  string
>;

export const SERVICE_CATEGORY_LABEL = Object.fromEntries(
  SERVICE_CATEGORIES.map((c) => [c.value, c.label])
) as Record<ServiceCategory, string>;

/** Единица измерения, которую диктует режим количества (или null, если выбирает администратор). */
export function unitForMode(mode: QuantityMode): ServiceUnit | null {
  return (QUANTITY_MODES.find((m) => m.value === mode)?.unit ?? null) as ServiceUnit | null;
}

// ---------------------------------------------------------------------------------------------
// Характеристики кварца (фильтры калькулятора и каталога). Цен здесь нет.
// ---------------------------------------------------------------------------------------------

/** Форматы плит. `label` — короткий код, длинная подпись — `formatLegendLabel`. */
export const STONE_FORMATS = [
  { value: "N", label: "N", name: "NORMAL", lengthMm: 3040, widthMm: 1440 },
  { value: "N+", label: "N+", name: "NORMAL+", lengthMm: 3100, widthMm: 1520 },
  { value: "J", label: "J", name: "JUMBO", lengthMm: 3200, widthMm: 1600 },
  { value: "J+", label: "J+", name: "JUMBO+", lengthMm: 3300, widthMm: 1650 }
] as const;
export type StoneFormat = (typeof STONE_FORMATS)[number]["value"];

/** Толщины слэба, мм. В select Payload хранятся строками, наружу отдаём числами. */
export const STONE_THICKNESSES_MM = [12, 15, 20, 30] as const;

export const STONE_FINISHES = [
  { value: "polished", label: "полированный" },
  { value: "matte", label: "матовый" }
] as const;
export type StoneFinish = (typeof STONE_FINISHES)[number]["value"];

/**
 * Оттенки. Первые шесть — сетка из шапки файла характеристик. Дальше — значения, которые реально
 * встречаются в строках «Оттенок:» (через « / »): голубой, зеленоватый, разноцветный, розовый.
 */
export const STONE_SHADES = [
  "белый",
  "светлосерый",
  "серый",
  "бежевый",
  "коричневый",
  "чёрный",
  "голубой",
  "зеленоватый",
  "разноцветный",
  "розовый"
] as const;

/**
 * Фактуры. Первые пять — сетка из шапки файла. Дальше — отдельные формулировки из строк «Фактура:»:
 * «вкрапления (terrazzo)» и «крупные вкрапления» (это не то же самое, что «вкрапления»).
 */
export const STONE_TEXTURES = [
  "монотонный",
  "вкрапления",
  "вкрапления (terrazzo)",
  "крупные вкрапления",
  "разводы",
  "мелкие жилы",
  "крупные жилы"
] as const;

/** «[N] — плита NORMAL 3040 × 1440 мм». */
export function formatLegendLabel(format: StoneFormat): string {
  const entry = STONE_FORMATS.find((item) => item.value === format);
  if (!entry) return format;
  return `[${entry.value}] — плита ${entry.name} ${entry.lengthMm} × ${entry.widthMm} мм`;
}

/**
 * Несколько значений в одном текстовом поле: разделитель «/», пробелы по краям снимаются,
 * пустые куски и повторы отбрасываются, порядок сохраняется.
 */
export function splitTags(text?: string | null): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of text.split("/")) {
    const tag = part.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}
