import { NextRequest, NextResponse } from "next/server";

import { createTestimonial } from "@/lib/cms/store";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import type { Testimonial } from "@/types/content";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Лимит: 3 отзыва с одного IP за 10 минут.
  const limit = checkRateLimit({
    key: `reviews:${getClientIp(req)}`,
    maxRequests: 3,
    windowMs: 10 * 60 * 1000
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  // Honeypot
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const author = String(body.author ?? "").trim();
  const quote = String(body.quote ?? "").trim();
  const role = String(body.role ?? "").trim();
  const rating = Number(body.rating ?? 5);

  if (author.length < 2) {
    return NextResponse.json({ ok: false, error: "Укажите имя (минимум 2 символа)" }, { status: 422 });
  }
  if (quote.length < 10) {
    return NextResponse.json({ ok: false, error: "Отзыв слишком короткий (минимум 10 символов)" }, { status: 422 });
  }
  if (author.length > 120 || role.length > 120 || quote.length > 3000) {
    return NextResponse.json({ ok: false, error: "Слишком длинный текст" }, { status: 422 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Некорректная оценка" }, { status: 422 });
  }

  const reviewData: Omit<Testimonial, "id" | "createdAt"> = {
    author,
    role: role || "Клиент",
    quote,
    rating,
    status: "pending",
    source: "site"
  };

  try {
    await createTestimonial(reviewData);
    return NextResponse.json(
      { ok: true, message: "Спасибо! Ваш отзыв будет опубликован после проверки." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
