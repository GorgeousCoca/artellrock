import type { CollectionConfig } from "payload";

import { isAuthenticated, nobody } from "../access";

export const ContactRequests: CollectionConfig = {
  slug: "contact-requests",
  labels: { singular: "Заявка", plural: "Заявки" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "phone", "telegram", "source", "message", "attachmentUrl", "createdAt"],
    group: "Заявки"
  },
  defaultSort: "-createdAt",
  access: {
    // Заявки создаёт только сервер (`/api/contact`) через Local API.
    create: nobody,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    { name: "name", type: "text", label: "Имя", required: true },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
      admin: { description: "Может быть пустым, если клиент оставил только Telegram в форме чертежа." }
    },
    { name: "telegram", type: "text", label: "Telegram" },
    { name: "email", type: "text", label: "Email" },
    { name: "message", type: "textarea", label: "Сообщение", admin: { description: "Комментарий клиента или изделие из формы на сайте." } },
    { name: "source", type: "text", label: "Источник" },
    {
      name: "deliveryStatus",
      type: "select",
      label: "Статус отправки email",
      defaultValue: "pending",
      options: [
        { label: "Ожидает", value: "pending" },
        { label: "Доставлено", value: "delivered" },
        { label: "Ошибка почты", value: "failed_mail" }
      ]
    },
    { name: "mailError", type: "textarea", label: "Ошибка почты" },
    {
      name: "attachmentUrl",
      type: "text",
      label: "Эскиз",
      admin: {
        readOnly: true,
        description: "Файл, который клиент приложил к заявке на странице стоимости.",
        components: {
          Description: "/payload/components/lead-attachment#LeadAttachmentDescription",
          Cell: "/payload/components/lead-attachment#LeadAttachmentCell"
        }
      }
    },
    { name: "attachmentName", type: "text", label: "Имя файла вложения" },
    { name: "attachmentSize", type: "number", label: "Размер вложения (байт)" },
    {
      name: "estimateTotal",
      type: "number",
      label: "Сумма расчёта, ₽",
      admin: { description: "Заполняется, если заявка пришла из калькулятора. Цены зафиксированы на момент заявки." }
    },
    {
      name: "estimate",
      type: "json",
      label: "Расчёт из калькулятора",
      admin: { description: "Снимок сметы и введённых размеров. Считается сервером, правке не подлежит." }
    }
  ]
};
