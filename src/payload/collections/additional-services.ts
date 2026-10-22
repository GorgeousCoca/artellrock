import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";

import {
  QUANTITY_MODES,
  SERVICE_CATEGORIES,
  SERVICE_UNITS,
  unitForMode,
  type QuantityMode,
  type ServiceUnit
} from "../../lib/calculator/taxonomy";
import { anyone, isAuthenticated } from "../access";
import { isActiveField, priceField, sortOrderField } from "../fields/catalog";
import { revalidateHooks } from "../hooks/revalidate";

type ServiceData = { quantityMode?: QuantityMode; unit?: ServiceUnit; autoApply?: boolean };

/**
 * Единица измерения диктуется режимом количества (площадь -> м², периметр -> м.п., …).
 * Выбирает её администратор только для режима «Указывает клиент». Так нельзя получить «м.п.» у услуги по площади.
 */
const syncUnitWithMode: CollectionBeforeValidateHook = ({ data }) => {
  const doc = data as ServiceData | undefined;
  if (!doc?.quantityMode) return data;

  const forced = unitForMode(doc.quantityMode);
  if (forced) doc.unit = forced;
  return data;
};

/**
 * Дополнительные услуги (шаг 5) и автоматические позиции сметы (раскрой, базовая обработка).
 * Количество считает сервер по режиму `quantityMode`; клиент влияет на него только в режиме «Указывает клиент».
 */
export const AdditionalServices: CollectionConfig = {
  slug: "additional-services",
  labels: { singular: "Услуга", plural: "Дополнительные услуги" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "price", "unit", "quantityMode", "autoApply", "isActive"],
    group: "Калькулятор",
    description:
      "Замер, доставка, вырезы, монтаж и т. п. Позиция с галочкой «Добавлять в смету автоматически» (например, раскрой) попадает в каждую смету без выбора клиента."
  },
  defaultSort: "sortOrder",
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: {
    ...revalidateHooks("additional-services"),
    beforeValidate: [syncUnitWithMode]
  },
  fields: [
    { name: "name", type: "text", label: "Название", required: true },
    {
      name: "category",
      type: "select",
      label: "Категория",
      required: true,
      index: true,
      defaultValue: "processing",
      options: SERVICE_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))
    },
    priceField("price", "Цена за единицу, ₽"),
    {
      name: "quantityMode",
      type: "select",
      label: "Как считается количество",
      required: true,
      defaultValue: "user",
      options: QUANTITY_MODES.map((m) => ({ label: m.label, value: m.value })),
      admin: { description: "Всё, кроме «Указывает клиент», сервер считает по чертежу — клиент подменить количество не может." }
    },
    {
      name: "unit",
      type: "select",
      label: "Единица",
      required: true,
      defaultValue: "piece",
      options: SERVICE_UNITS.map((u) => ({ label: u.label, value: u.value })),
      admin: { condition: (data) => (data as ServiceData | undefined)?.quantityMode === "user" }
    },
    {
      name: "autoApply",
      type: "checkbox",
      label: "Добавлять в смету автоматически",
      defaultValue: false,
      validate: (value: boolean | null | undefined, { siblingData }: { siblingData: unknown }) => {
        const mode = (siblingData as ServiceData | undefined)?.quantityMode;
        if (value && mode === "user") {
          return "Автоматической услуге нужен расчётный режим количества (не «Указывает клиент»).";
        }
        return true;
      }
    },
    {
      name: "hint",
      type: "textarea",
      label: "Подсказка клиенту",
      admin: { description: "Короткое пояснение к услуге в списке." }
    },
    sortOrderField,
    isActiveField
  ]
};
