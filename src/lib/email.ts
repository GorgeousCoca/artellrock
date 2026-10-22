import nodemailer from "nodemailer";

export type ContactMailInput = {
  name: string;
  phone: string;
  product: string;
  source: string;
  note?: string;
  telegram?: string;
  attachment?: { filename: string; content: Buffer };
};

function toBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }
  return value === "true";
}

export async function sendContactMail(input: ContactMailInput) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = toBoolean(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const to = process.env.MAIL_TO ?? process.env.ADMIN_EMAIL;

  if (!host || !user || !pass || !to) {
    return { delivered: false, reason: "mail-config-missing" as const };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"ArtellRock сайт" <${user}>`,
    to,
    subject: "Новая заявка с сайта",
    text: [
      "Новая заявка с сайта ArtellRock",
      "",
      `Имя: ${input.name}`,
      `Телефон: ${input.phone || "не указан"}`,
      input.telegram ? `Telegram: ${input.telegram}` : "",
      `Какое изделие нужно: ${input.product || "не указано"}`,
      input.note ? `Дополнительно: ${input.note}` : "",
      input.attachment ? `Эскиз: ${input.attachment.filename}` : "",
      `Источник: ${input.source}`
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: input.attachment
      ? [{ filename: input.attachment.filename, content: input.attachment.content }]
      : undefined
  });

  return { delivered: true as const };
}
