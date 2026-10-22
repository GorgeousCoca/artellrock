import type { CollectionConfig } from "payload";

import { EDGE_KINDS } from "../../lib/calculator/taxonomy";
import { anyone, isAuthenticated } from "../access";
import { imageUrlField, isActiveField, priceField, sortOrderField } from "../fields/catalog";
import { revalidateHooks } from "../hooks/revalidate";

/**
 * Кромка. Две независимые группы выбора на шаге 3, обе оплачиваются за метр погонный по сторонам,
 * которые клиент отметил на чертеже: «толщина» (сплошной лист, сэндвич…) и «профиль» (прямая, радиус, фаска…).
 */
export const Edges: CollectionConfig = {
  slug: "edges",
  labels: { singular: "Кромка", plural: "Кромки" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "kind", "pricePerMeter", "isActive"],
    group: "Калькулятор",
    description: "Толщины и профили кромки (шаг 3 калькулятора). Цена — за метр погонный."
  },
  defaultSort: "sortOrder",
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: revalidateHooks("edges"),
  fields: [
    {
      name: "kind",
      type: "select",
      label: "Что это",
      required: true,
      index: true,
      defaultValue: "profile",
      options: EDGE_KINDS.map((k) => ({ label: k.label, value: k.value }))
    },
    { name: "name", type: "text", label: "Название", required: true },
    {
      name: "thicknessMm",
      type: "number",
      label: "Толщина, мм",
      min: 0,
      admin: {
        description: "Показывается в карточке.",
        condition: (data) => data?.kind === "thickness"
      }
    },
    priceField("pricePerMeter", "Цена за м.п., ₽", "0 — входит в стоимость (например, сплошной лист)."),
    imageUrlField,
    sortOrderField,
    isActiveField
  ]
};
