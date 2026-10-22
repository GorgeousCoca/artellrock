import type { Field } from "payload";

/** Плоские SEO-поля (совпадают с `SeoFields` из `src/types/content.ts`). */
export const seoFields: Field = {
  type: "collapsible",
  label: "SEO",
  admin: { initCollapsed: true },
  fields: [
    { name: "metaTitle", type: "text", label: "Meta title" },
    { name: "metaDescription", type: "textarea", label: "Meta description" },
    {
      name: "ogImage",
      type: "text",
      label: "OG image (URL)",
      admin: { description: "Путь вида /images/... или URL файла из раздела «Медиа»." }
    },
    { name: "noIndex", type: "checkbox", label: "Не индексировать", defaultValue: false }
  ]
};
