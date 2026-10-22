import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { inspectLeadAttachment } from "@/lib/leads/attachment-rules";
import { acceptLead } from "@/lib/leads/record-lead";
import { normalizePhone, PHONE_PATTERN } from "@/lib/leads/phone";
import { normalizeTelegram } from "@/lib/leads/telegram";
import { getClientIp } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

/** Имя -> name, телефон -> phone, изделие -> message в коллекции contact-requests. */
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  product: z.string().trim().max(300).optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(80).optional().default("site"),
  consent: z.literal(true),
  /** Скрытое поле-приманка: у человека всегда пустое. */
  website: z.string().max(0).optional().default("")
});

const drawingSchema = z.object({
  kind: z.literal("drawing"),
  telegram: z.string().trim().max(64).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
  delivery: z.boolean().optional().default(false),
  install: z.boolean().optional().default(false),
  source: z.string().trim().max(80).optional().default("Загрузка чертежа"),
  consent: z.literal(true),
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
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let body: unknown;
  let file: File | null = null;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const entry = form.get("file");
      file = entry instanceof File && entry.size > 0 ? entry : null;
      const kind = form.get("kind");
      body =
        kind === "drawing"
          ? {
              kind: "drawing",
              telegram: form.get("telegram") ?? "",
              phone: form.get("phone") ?? "",
              note: form.get("note") ?? "",
              delivery: form.get("delivery") === "on",
              install: form.get("install") === "on",
              source: form.get("source") ?? "Загрузка чертежа",
              consent: form.get("consent") === "true" || form.get("consent") === "on",
              website: form.get("website") ?? ""
            }
          : {
              name: form.get("name"),
              phone: form.get("phone"),
              product: form.get("product") ?? "",
              note: form.get("note") ?? "",
              source: form.get("source") ?? "site",
              consent: form.get("consent") === "true" || form.get("consent") === "on",
              website: form.get("website") ?? ""
            };
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Бот заполнил скрытое поле: отвечаем «успешно», но ничего не сохраняем.
  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { website?: unknown }).website === "string" &&
    (body as { website: string }).website.length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (file) {
    const problem = inspectLeadAttachment(file);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }
  }

  const isDrawing =
    typeof body === "object" && body !== null && (body as { kind?: unknown }).kind === "drawing";

  let name = "";
  let phone = "";
  let telegram = "";
  let product = "";
  let note = "";
  let source = "site";

  if (isDrawing) {
    const parsed = drawingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const normalizedTelegram = normalizeTelegram(parsed.data.telegram);
    if (normalizedTelegram == null) {
      return NextResponse.json({ error: "invalid-telegram" }, { status: 400 });
    }

    const rawPhone = parsed.data.phone.replace(/\D/g, "");
    const phoneDigits = rawPhone.startsWith("7") || rawPhone.startsWith("8") ? rawPhone.slice(1) : rawPhone;
    if (phoneDigits.length > 0) {
      phone = normalizePhone(parsed.data.phone);
      if (!PHONE_PATTERN.test(phone)) {
        return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
      }
    }

    if (!normalizedTelegram && !phone) {
      return NextResponse.json({ error: "contact-required" }, { status: 400 });
    }

    telegram = normalizedTelegram;
    note = parsed.data.note;
    source = parsed.data.source;
    const options = [
      parsed.data.delivery ? "Доставка" : "",
      parsed.data.install ? "Установка под ключ" : ""
    ].filter((item) => item.length > 0);
    product = options.join("\n");
    name = telegram || phone;
  } else {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const data: LeadPayload = parsed.data;
    phone = normalizePhone(data.phone);
    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    name = data.name;
    product = data.product;
    note = data.note;
    source = data.source;
  }

  const dedupKey = [phone, telegram.toLowerCase(), product.toLowerCase(), note.toLowerCase(), file?.name ?? "", String(file?.size ?? 0)].join("|");
  if (isDuplicateLead(dedupKey, 2 * 60 * 1000)) {
    // Повторная отправка тех же данных: заявка уже принята, клиенту показываем успех.
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  const message = [product, note].filter((part) => part.length > 0).join("\n\n");
  const { id, delivered } = await acceptLead(
    { name, phone, telegram, source, message, mail: { product, note } },
    file
  );

  // Заявка сохранена в админке в любом случае; письмо — дополнительное уведомление.
  return NextResponse.json({ ok: true, id, delivered }, { status: 201 });
});