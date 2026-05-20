"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";

import type { Testimonial } from "@/types/content";

export function TestimonialsSlider({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  if (!items.length) {
    return null;
  }

  // Клампим при чтении, без useEffect+setState (линтер) и без рассинхрона: кнопки ниже тоже считают от «безопасного» индекса.
  const safeIndex = Math.min(Math.max(0, index), items.length - 1);
  const current = items[safeIndex];
  const starCount = Math.max(0, Math.min(5, Math.floor(Number.isFinite(current.rating) ? current.rating : 0)));
  // Некорректный rating из CMS не должен давать NaN в Array.from (пустые звёзды / странное поведение).

  return (
    <div className="slider card stack" role="region" aria-label="Отзывы клиентов">
      <div className="pill-list" aria-hidden="true">
        {Array.from({ length: starCount }, (_, starIndex) => (
          <Star key={starIndex} size={18} fill="currentColor" />
        ))}
      </div>
      <p aria-live="polite">{current.quote}</p>
      <div className="stack" style={{ gap: 4 }}>
        <strong>{current.author}</strong>
        <span className="muted">{current.role}</span>
      </div>
      <div className="slider__controls">
        <button
          className="slider__button"
          type="button"
          onClick={() =>
            setIndex((value) => {
              const base = Math.min(Math.max(0, value), items.length - 1);
              return (base - 1 + items.length) % items.length;
            })
          }
          aria-label="Предыдущий отзыв"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="slider__button"
          type="button"
          onClick={() =>
            setIndex((value) => {
              const base = Math.min(Math.max(0, value), items.length - 1);
              return (base + 1) % items.length;
            })
          }
          aria-label="Следующий отзыв"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
