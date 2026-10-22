import type { Field } from "payload";

import { priceStepError } from "../../lib/calculator/price-rounding";

/**
 * Общие поля справочников калькулятора. Картинки хранятся тем же способом, что и в `products` / `stone-samples`
 * (путь `/images/...` или URL), чтобы не разводить два подхода и не переносить сотни декоров в «Медиа».
 */
export const imageUrlField: Field = {
  name: "image",
  type: "text",
  label: "Изображение (URL)",
  admin: { description: "Путь вида /images/... или URL файла из раздела «Медиа»." }
};

/** Порядок в списках калькулятора (меньше — выше). */
export const sortOrderField: Field = {
  name: "sortOrder",
  type: "number",
  label: "Порядок",
  defaultValue: 0,
  admin: { position: "sidebar", description: "Меньше — выше в списке." }
};

/** Скрыть позицию из калькулятора, не удаляя её. */
export const isActiveField: Field = {
  name: "isActive",
  type: "checkbox",
  label: "Показывать в калькуляторе",
  defaultValue: true,
  index: true,
  admin: { position: "sidebar" }
};

/** Цена: неотрицательное число (₽), кратное 250. Ноль допустим (позиция «входит в стоимость»). */
export function priceField(name: string, label: string, description?: string): Field {
  const stepNote = "Кратно 250 ₽.";
  return {
    name,
    type: "number",
    label,
    required: true,
    min: 0,
    defaultValue: 0,
    admin: { description: description ? `${description} ${stepNote}` : stepNote },
    validate: (value: number | null | undefined) => {
      if (typeof value !== "number" || Number.isNaN(value)) return "Укажите цену";
      if (value < 0) return "Цена не может быть отрицательной";
      return priceStepError(value) ?? true;
    }
  };
}
