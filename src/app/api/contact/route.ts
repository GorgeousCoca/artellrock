import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createContactRequest } from "@/lib/cms/store";
import { sendContactMail } from "@/lib/email";
import { getClientIp } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.email(),
  source: z.string().min(2),
  productType: z.string().min(2),
  dimensions: z.string().min(2),
  comment: z.string().min(2),
  botCheck: z.literal(true),
  website: z.string().max(0).optional().default("")
});

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

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON в запросе" }, { status: 400 });
  }
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

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте корректность полей формы." }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: "Телефон указан в неверном формате." }, { status: 400 });
  }

  const dedupKey = [
    normalizedPhone.toLowerCase(),
    parsed.data.email.trim().toLowerCase(),
    parsed.data.comment.trim().toLowerCase()
  ].join("|");
  if (isDuplicateLead(dedupKey, 2 * 60 * 1000)) {
    return NextResponse.json({ error: "Похожая заявка уже отправлена. Подождите 1-2 минуты." }, { status: 409 });
  }

  const record = await createContactRequest({
    name: parsed.data.name,
    phone: normalizedPhone,
    email: parsed.data.email,
    source: parsed.data.source,
    message: [
      `Тип изделия: ${parsed.data.productType}`,
      `Материал: Кварцевый агломерат`,
      `Размеры: ${parsed.data.dimensions}`,
      `Комментарий: ${parsed.data.comment}`
    ].join("\n")
  });

  let mailStatus: { delivered: boolean; reason?: string };
  try {
    mailStatus = await sendContactMail(parsed.data);
  } catch {
    mailStatus = { delivered: false, reason: "mail-send-error" };
  }

  if (!mailStatus.delivered) {
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

  return NextResponse.json({ ok: true, record, mailStatus }, { status: 201 });
});
