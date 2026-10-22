import path from "node:path";

import type { CollectionConfig } from "payload";

import { anyone, isAuthenticated } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Файл", plural: "Медиа" },
  admin: {
    useAsTitle: "filename",
    group: "Система",
    description:
      "Загрузите файл здесь, затем скопируйте его URL (поле «URL») в нужное поле изображения у товара, проекта и т.д."
  },
  access: {
    read: anyone,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  upload: {
    staticDir: path.resolve(process.cwd(), "public", "uploads"),
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
  },
  fields: [{ name: "alt", type: "text", label: "Alt-текст" }]
};
