"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./review-form.module.scss";

type Status = "idle" | "sending" | "done" | "error";

const RATINGS = [
  { value: 5, label: "5 — отлично" },
  { value: 4, label: "4 — хорошо" },
  { value: 3, label: "3 — нормально" },
  { value: 2, label: "2 — плохо" },
  { value: 1, label: "1 — очень плохо" }
] as const;

/** Форма отзыва. Отправляет в /api/reviews, отзыв попадает на модерацию и не виден до одобрения. */
export function ReviewForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: String(data.get("author") ?? ""),
          quote: String(data.get("quote") ?? ""),
          rating: Number(data.get("rating") ?? 5),
          website: String(data.get("website") ?? "")
        })
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !result?.ok) {
        setMessage(result?.error ?? "Не получилось отправить. Попробуйте ещё раз или позвоните нам.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("done");
    } catch {
      setMessage("Нет связи с сервером. Попробуйте ещё раз чуть позже.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className={styles.done} role="status">
        <p className="t-tagline">Спасибо! Отзыв отправлен и появится на странице после проверки.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-busy={status === "sending"}>
      <div className={styles.row}>
        <div className="field">
          <label htmlFor="review-author">Ваше имя</label>
          <input id="review-author" name="author" type="text" autoComplete="given-name" required minLength={2} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="review-rating">Оценка</label>
          <select id="review-rating" name="rating" className={styles.select} defaultValue="5">
            {RATINGS.map((rating) => (
              <option key={rating.value} value={rating.value}>
                {rating.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="review-quote">Ваш отзыв</label>
        <textarea
          id="review-quote"
          name="quote"
          className={styles.area}
          required
          minLength={10}
          maxLength={3000}
          placeholder="Что заказывали, как прошли замер и монтаж, всё ли понравилось"
        />
      </div>

      {/* Скрытая приманка для ботов: человек её не видит и не заполняет. */}
      <div className="field field--trap" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="consent">
        <input id="review-consent" name="consent" type="checkbox" required />
        <label htmlFor="review-consent">
          Согласен на публикацию отзыва с именем и на обработку данных по{" "}
          <Link href="/politika">политике конфиденциальности</Link>
        </label>
      </div>

      <button className="btn btn--primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Отправляем…" : "Отправить отзыв"}
      </button>

      <p className={styles.status} role="alert">
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}
