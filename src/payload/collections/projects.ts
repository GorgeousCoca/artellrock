import type { CollectionConfig } from "payload";

import { revalidateHooks } from "../hooks/revalidate";
import { anyone, isAuthenticated } from "../access";
import { seoFields } from "../fields/seo";

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Проект", plural: "Портфолио" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "sortOrder", "slug"],
    group: "Контент",
    description: "Карточки страницы «Наши работы». Название, раздел, подпись и фото карточки сразу попадают на /portfolio."
  },
  defaultSort: "sortOrder",
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  hooks: revalidateHooks("projects"),
  fields: [
    { name: "slug", type: "text", label: "Slug", required: true, unique: true, index: true },
    { name: "title", type: "text", label: "Название", required: true },
    {
      name: "category",
      type: "text",
      label: "Раздел",
      admin: {
        description:
          "Раздел на странице: Столешницы, Фартуки, Барные стойки, Острова, Подоконники, Стеновые панели, Столы, Полки."
      }
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок",
      defaultValue: 0,
      admin: { description: "Меньше — выше внутри своего раздела." }
    },
    { name: "location", type: "text", label: "Локация" },
    {
      name: "summary",
      type: "textarea",
      label: "Подпись",
      admin: { description: "Текст под названием на карточке." }
    },
    { name: "description", type: "textarea", label: "Описание" },
    { name: "beforeImage", type: "text", label: "Фото «до» (URL)" },
    {
      name: "afterImage",
      type: "text",
      label: "Фото карточки",
      admin: { description: "Путь из public, например /images/portfolio/case-bar-light.jpg" }
    },
    { name: "gallery", type: "text", label: "Галерея (URL)", hasMany: true },
    { name: "testimonial", type: "textarea", label: "Отзыв клиента" },
    {
      name: "productRefs",
      type: "text",
      label: "Связанные товары (slug)",
      hasMany: true,
      admin: { description: "Slug товаров из раздела «Изделия»." }
    },
    seoFields
  ]
};
