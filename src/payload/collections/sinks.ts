import type { CollectionConfig } from "payload";

import { SINK_TYPES } from "../../lib/calculator/taxonomy";
import { anyone, isAuthenticated } from "../access";
import { imageUrlField, isActiveField, priceField, sortOrderField } from "../fields/catalog";
import { revalidateHooks } from "../hooks/revalidate";

/**
 * Мойки (шаг 4). Клиент сначала выбирает тип установки, затем — модель.
 * Если у типа одна запись (например, «Вырез для мойки»), она выбирается сразу; если несколько
 * (модели интегрированной мойки) — показывается сетка моделей. Вариант «без выреза» — отсутствие выбора.
 */
export const Sinks: CollectionConfig = {
  slug: "sinks",
  labels: { singular: "Мойка", plural: "Мойки и вырезы" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "price", "isActive"],
    group: "Калькулятор",
    description: "Вырезы под мойку и модели интегрированных моек (шаг 4 калькулятора)."
  },
  defaultSort: "sortOrder",
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: revalidateHooks("sinks"),
  fields: [
    {
      name: "type",
      type: "select",
      label: "Тип установки",
      required: true,
      index: true,
      options: SINK_TYPES.map((t) => ({ label: t.label, value: t.value }))
    },
    { name: "name", type: "text", label: "Название", required: true },
    {
      name: "description",
      type: "text",
      label: "Описание / размеры",
      admin: { description: "Показывается в карточке мойки, например «X=150–450, Y=150–600 мм»." }
    },
    priceField("price", "Цена, ₽", "Стоимость выреза или готовой мойки за штуку."),
    imageUrlField,
    sortOrderField,
    isActiveField
  ]
};
