import { NextRequest, NextResponse } from "next/server";

import { createItem } from "@/lib/cms/store";
import type { Testimonial } from "@/types/content";

// Rate limit: 3 reviews per IP per 10 minutes
const rateMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const hits = (rateMap.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= 3) return true;
  rateMap.set(ip, [...hits, now]);
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
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
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Некорректная оценка" }, { status: 422 });
  }

  const reviewData: Omit<Testimonial, "id"> = {
    author,
    role: role || "Клиент",
    quote,
    rating,
    status: "pending",
    source: "site",
    createdAt: new Date().toISOString()
  };

  try {
    await createItem("testimonials", reviewData);
    return NextResponse.json(
      { ok: true, message: "Спасибо! Ваш отзыв будет опубликован после проверки." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
