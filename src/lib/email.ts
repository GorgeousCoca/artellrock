import nodemailer from "nodemailer";

type ContactMailInput = {
  name: string;
  phone: string;
  email: string;
  source: string;
  productType: string;
  dimensions: string;
  comment: string;
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
    subject: `Новая заявка с сайта (${input.productType})`,
    text: [
      "Новая заявка с сайта ArtellRock",
      "",
      `Имя: ${input.name}`,
      `Телефон: ${input.phone}`,
      `Email: ${input.email}`,
      `Источник: ${input.source}`,
      `Тип изделия: ${input.productType}`,
      `Размеры: ${input.dimensions}`,
      `Комментарий: ${input.comment}`
    ].join("\n")
  });

  return { delivered: true as const };
}
