import type { CollectionConfig } from "payload";

import { revalidateHooks } from "../hooks/revalidate";
import { isAuthenticated } from "../access";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: { singular: "Отзыв", plural: "Отзывы" },
  admin: {
    useAsTitle: "author",
    defaultColumns: ["author", "rating", "status", "source", "createdAt"],
    group: "Контент",
    description: "Отзывы с сайта попадают сюда со статусом «На модерации». На сайте показываются только одобренные."
  },
  defaultSort: "-createdAt",
  access: {
    // Публично через REST/GraphQL видны только одобренные; сайт читает через Local API.
    read: ({ req }) => (req.user ? true : { status: { equals: "approved" } }),
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: revalidateHooks("testimonials"),
  fields: [
    { name: "author", type: "text", label: "Автор", required: true },
    { name: "role", type: "text", label: "Роль", defaultValue: "Клиент" },
    { name: "quote", type: "textarea", label: "Текст отзыва", required: true },
    { name: "rating", type: "number", label: "Рейтинг", min: 1, max: 5, defaultValue: 5, required: true },
    {
      name: "status",
      type: "select",
      label: "Статус",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "На модерации", value: "pending" },
        { label: "Одобрен", value: "approved" },
        { label: "Отклонён", value: "rejected" }
      ]
    },
    {
      name: "source",
      type: "select",
      label: "Источник",
      required: true,
      defaultValue: "manual",
      options: [
        { label: "Сайт", value: "site" },
        { label: "ВКонтакте", value: "vk" },
        { label: "Авито", value: "avito" },
        { label: "Вручную", value: "manual" }
      ]
    },
    { name: "sourceUrl", type: "text", label: "Ссылка на источник" }
  ]
};
