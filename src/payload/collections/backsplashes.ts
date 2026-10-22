import type { CollectionConfig } from "payload";

import { anyone, isAuthenticated } from "../access";
import { imageUrlField, isActiveField, priceField, sortOrderField } from "../fields/catalog";
import { revalidateHooks } from "../hooks/revalidate";

/** Бортики (накладной, литой…). Вариант «без бортика» — это отсутствие выбора, отдельной записи не нужно. */
export const Backsplashes: CollectionConfig = {
  slug: "backsplashes",
  labels: { singular: "Бортик", plural: "Бортики" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "heightMm", "pricePerMeter", "isActive"],
    group: "Калькулятор",
    description: "Типы бортика (шаг 3 калькулятора). Цена — за метр погонный по сторонам, отмеченным клиентом."
  },
  defaultSort: "sortOrder",
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: revalidateHooks("backsplashes"),
  fields: [
    { name: "name", type: "text", label: "Название", required: true },
    { name: "heightMm", type: "number", label: "Высота, мм", min: 0, admin: { description: "Показывается в карточке." } },
    priceField("pricePerMeter", "Цена за м.п., ₽"),
    imageUrlField,
    sortOrderField,
    isActiveField
  ]
};
