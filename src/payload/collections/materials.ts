import type { Access, CollectionConfig } from "payload";

import { priceStepError } from "../../lib/calculator/price-rounding";
import { formatLegendLabel, splitTags, STONE_FINISHES, STONE_FORMATS, STONE_SHADES, STONE_TEXTURES, STONE_THICKNESSES_MM } from "../../lib/calculator/taxonomy";
import { isAuthenticated } from "../access";
import { materialsEndpoints } from "../endpoints/bulk-prices";
import { imageUrlField, isActiveField, sortOrderField } from "../fields/catalog";
import { revalidateHooks } from "../hooks/revalidate";
import { ensureUniqueMaterial } from "../hooks/material-unique";

/**
 * Чтение: вошедший пользователь (админка) видит всё, аноним — только включённые позиции. Раньше было `anyone`, и
 * публичный REST `/api/materials` отдавал без входа все записи, включая скрытые, с ценами. Серверный код сайта
 * (`getMaterials`, расчёт сметы) работает через Local API и этим условием не ограничен.
 */
const readPublishedOrAdmin: Access = ({ req }) => (req.user ? true : { isActive: { equals: true } });

/**
 * Материалы калькулятора (кварцевый агломерат). Цена за м² — единственный источник стоимости камня:
 * расчёт читает её отсюда на сервере, в коде и в клиенте цен нет.
 *
 * Страницы `/catalog-kvarca` берут кадр и название из `stone-catalog.json`.
 * Цена и характеристики на карточке каталога читаются отсюда — тот же кэш, что у калькулятора.
 * Связь: поле `image` (кадр каталога; старый путь из сида тоже подходит), запасной ключ —
 * нормализованные бренд, артикул и название. Кадры сверяет `npm run sync:stones`.
 * Переименование камня в админке само по себе подпись в каталоге не меняет.
 *
 * Цена за м² точная (без пометки «от») и кратна 250 ₽: так она показывается в каталоге, на карточке и в смете.
 */

const SHADE_VALUES: readonly string[] = STONE_SHADES;
const TEXTURE_VALUES: readonly string[] = STONE_TEXTURES;

/** Каждый фрагмент через « / » должен быть из словаря. Пустое поле допустимо. */
function validateTagList(value: unknown, allowed: readonly string[], title: string): true | string {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return `Укажите ${title} текстом`;
  const unknown = splitTags(value).filter((tag) => !allowed.includes(tag));
  if (unknown.length === 0) return true;
  return `Недопустимые значения (${title}): ${unknown.join(", ")}. Допустимо: ${allowed.join(", ")}.`;
}
export const Materials: CollectionConfig = {
  slug: "materials",
  labels: { singular: "Материал", plural: "Материалы калькулятора" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["brand", "sku", "name", "pricePerSqm", "isActive"],
    listSearchableFields: ["name", "brand", "sku"],
    // Группировка списка по бренду: в списке выберите «Группировать по» → «Бренд».
    groupBy: true,
    group: "Калькулятор",
    description:
      "Декоры, которые клиент выбирает на шаге 2. Материал без цены в калькулятор не попадёт: активировать можно только с ценой больше 0. Цены удобно менять по брендам на странице «Цены на камни» (боковое меню)."
  },
  defaultSort: "brand",
  access: {
    read: readPublishedOrAdmin,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: { ...revalidateHooks("materials"), beforeValidate: [ensureUniqueMaterial] },
  endpoints: materialsEndpoints,
  fields: [
    { name: "brand", type: "text", label: "Бренд", required: true, index: true },
    { name: "name", type: "text", label: "Название декора", required: true },
    { name: "sku", type: "text", label: "Артикул", index: true },
    {
      name: "shade",
      type: "text",
      label: "Оттенок",
      index: true,
      admin: { description: "Одно или несколько значений через « / ». Каждое — из словаря оттенков." },
      validate: (value: unknown) => validateTagList(value, SHADE_VALUES, "оттенок")
    },
    {
      name: "texture",
      type: "text",
      label: "Фактура",
      index: true,
      admin: { description: "Одно или несколько значений через « / ». Каждое — из словаря фактур." },
      validate: (value: unknown) => validateTagList(value, TEXTURE_VALUES, "фактура")
    },
    {
      name: "formats",
      type: "select",
      label: "Форматы плит",
      hasMany: true,
      options: STONE_FORMATS.map((format) => ({ label: formatLegendLabel(format.value), value: format.value })),
      admin: { description: "Можно несколько. Пусто — камень не попадёт в фильтр по формату." }
    },
    {
      name: "thicknessesMm",
      type: "select",
      label: "Толщина, мм",
      hasMany: true,
      options: STONE_THICKNESSES_MM.map((mm) => ({ label: `${mm} мм`, value: String(mm) })),
      admin: { description: "Можно несколько. Пусто — камень не попадёт в фильтр по толщине." }
    },
    {
      name: "finish",
      type: "select",
      label: "Полировка",
      options: STONE_FINISHES.map((finish) => ({ label: finish.label, value: finish.value }))
    },
    {
      name: "pricePerSqm",
      type: "number",
      label: "Цена за м², ₽",
      required: true,
      min: 0,
      defaultValue: 0,
      admin: {
        // Встроенное «Редактировать выбранные» ставит ОДНО значение всем выбранным камням: для цены это ловушка
        // (выделил бренд — перезаписал все цены одним числом). Поле из массового редактирования убрано.
        disableBulkEdit: true,
        description:
          "Точная цена, целые рубли, кратно 250. Для изменения цен у многих камней используйте страницу «Цены на камни»: там видно, что было и что станет."
      },
      validate: (value: number | null | undefined, { siblingData }: { siblingData: unknown }) => {
        if (typeof value !== "number" || Number.isNaN(value)) return "Укажите цену";
        if (value < 0) return "Цена не может быть отрицательной";
        const isActive = (siblingData as { isActive?: boolean } | undefined)?.isActive;
        if (isActive && value <= 0) return "У показываемого в калькуляторе материала цена должна быть больше 0";
        return priceStepError(value) ?? true;
      }
    },
    {
      type: "row",
      fields: [
        {
          name: "sheetLengthMm",
          type: "number",
          label: "Длина листа, мм",
          min: 0,
          admin: { description: "Нужно только для ориентировочного числа листов в смете." }
        },
        { name: "sheetWidthMm", type: "number", label: "Ширина листа, мм", min: 0 }
      ]
    },
    imageUrlField,
    sortOrderField,
    isActiveField
  ]
};
