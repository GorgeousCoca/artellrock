import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createContactRequest, patchContactRequest } from "@/lib/cms/store";
import { sendContactMail } from "@/lib/email";
import { saveLeadAttachment } from "@/lib/leads/save-attachment";
import { getClientIp } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().min(1),
  source: z.string().min(2),
  productType: z.string().min(1),
  dimensions: z.string().min(1),
  comment: z.string().min(1),
  botCheck: z.literal(true),
  website: z.string().max(0).optional().default("")
});

type LeadPayload = z.infer<typeof schema>;

type LeadDedupStore = {
  recent: Map<string, number>;
};

declare global {
  var __leadDedupStore__: LeadDedupStore | undefined;
}

function getLeadDedupStore() {
  if (!globalThis.__leadDedupStore__) {
    globalThis.__leadDedupStore__ = { recent: new Map() };
  }
  return globalThis.__leadDedupStore__;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  if (value.trim().startsWith("+")) {
    return value.trim();
  }
  return `+${digits}`;
}

function isDuplicateLead(key: string, windowMs: number) {
  const now = Date.now();
  const store = getLeadDedupStore();

  for (const [existingKey, timestamp] of store.recent.entries()) {
    if (timestamp < now - windowMs) {
      store.recent.delete(existingKey);
    }
  }

  const latestTimestamp = store.recent.get(key);
  if (latestTimestamp && latestTimestamp >= now - windowMs) {
    return true;
  }

  store.recent.set(key, now);
  return false;
}

function buildMessage(data: LeadPayload) {
  return [
    `Тип изделия: ${data.productType}`,
    `Материал: Кварцевый агломерат`,
    `Размеры: ${data.dimensions}`,
    `Комментарий: ${data.comment}`
  ].join("\n");
}

async function parseLeadPayload(request: NextRequest): Promise<
  | { ok: true; data: LeadPayload; attachment: File | null }
  | { ok: false; error: string }
> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const botRaw = formData.get("botCheck");
    const payload = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      source: String(formData.get("source") ?? ""),
      productType: String(formData.get("productType") ?? ""),
      dimensions: String(formData.get("dimensions") ?? ""),
      comment: String(formData.get("comment") ?? formData.get("message") ?? ""),
      botCheck: botRaw === "true",
      website: String(formData.get("website") ?? "")
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, error: "Проверьте корректность полей формы." };
    }
    const attachment = formData.get("attachment");
    const file = attachment instanceof File && attachment.size > 0 ? attachment : null;
    return { ok: true, data: parsed.data, attachment: file };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Некорректный JSON в запросе" };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Проверьте корректность полей формы." };
  }
  return { ok: true, data: parsed.data, attachment: null };
}

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const limit = checkRateLimit({
    key: `contact-form:${ip}`,
    maxRequests: 8,
    windowMs: 10 * 60 * 1000,
    blockMs: 20 * 60 * 1000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec)
        }
      }
    );
  }

  const parsedPayload = await parseLeadPayload(request);
  if (!parsedPayload.ok) {
    return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
  }

  const { data, attachment } = parsedPayload;

  const normalizedPhone = normalizePhone(data.phone);
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: "Телефон указан в неверном формате." }, { status: 400 });
  }

  const dedupKey = [
    normalizedPhone.toLowerCase(),
    data.email.trim().toLowerCase(),
    data.comment.trim().toLowerCase()
  ].join("|");
  if (isDuplicateLead(dedupKey, 2 * 60 * 1000)) {
    return NextResponse.json({ error: "Похожая заявка уже отправлена. Подождите 1-2 минуты." }, { status: 409 });
  }

  const record = await createContactRequest({
    name: data.name,
    phone: normalizedPhone,
    email: data.email,
    source: data.source,
    message: buildMessage(data)
  });

  if (attachment) {
    const saved = await saveLeadAttachment(record.id, attachment);
    if (saved) {
      await patchContactRequest(record.id, {
        attachmentUrl: saved.url,
        attachmentName: saved.name,
        attachmentSize: saved.size
      });
      record.attachmentUrl = saved.url;
      record.attachmentName = saved.name;
      record.attachmentSize = saved.size;
    }
  }

  let mailStatus: { delivered: boolean; reason?: string };
  try {
    mailStatus = await sendContactMail(data);
  } catch {
    mailStatus = { delivered: false, reason: "mail-send-error" };
  }

  if (!mailStatus.delivered) {
    await patchContactRequest(record.id, {
      deliveryStatus: "failed_mail",
      mailError: mailStatus.reason
    });
    const messageByReason: Record<string, string> = {
      "mail-config-missing":
        "SMTP не настроен. Заполните SMTP_HOST, SMTP_USER, SMTP_PASSWORD, MAIL_TO и перезапустите сервер.",
      "mail-auth-error":
        "SMTP авторизация не прошла. Проверьте SMTP_USER и пароль приложения SMTP_PASSWORD в Яндексе.",
      "mail-send-error":
        "Не удалось отправить письмо через SMTP. Проверьте настройки почтового сервера."
    };
    return NextResponse.json(
      {
        ok: true,
        warning:
          messageByReason[mailStatus.reason ?? ""] ??
          "Заявка сохранена, но письмо не отправилось. Проверьте SMTP-настройки.",
        record,
        mailStatus,
        persistedOnly: true
      },
      { status: 201 }
    );
  }

  await patchContactRequest(record.id, { deliveryStatus: "delivered" });

  return NextResponse.json({ ok: true, record, mailStatus }, { status: 201 });
});
