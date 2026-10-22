import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Администратор", plural: "Администраторы" },
  auth: {
    tokenExpiration: 60 * 60 * 8
  },
  admin: {
    useAsTitle: "email",
    group: "Система"
  },
  fields: []
};
