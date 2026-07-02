"use client";

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange: (v: number) => void;
};

function StarRating({ value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} звезда`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px",
            fontSize: "1.5rem",
            color: star <= (hover || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s ease"
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      author: fd.get("author"),
      role: fd.get("role"),
      quote: fd.get("quote"),
      rating,
      website: fd.get("website") // honeypot
    };

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as { ok: boolean; error?: string; message?: string };

      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Ошибка отправки");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Ошибка соединения. Попробуйте позже.");
    }
  }

  if (status === "success") {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>✓</div>
        <h3 style={{ margin: "0 0 8px" }}>Спасибо за отзыв!</h3>
        <p style={{ margin: 0 }}>Он будет опубликован после проверки.</p>
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <h3 style={{ margin: 0 }}>Оставьте отзыв о нашей работе</h3>

      {/* honeypot — hidden */}
      <input name="website" type="text" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

      <div className="form-group">
        <label className="form-label" htmlFor="review-author">Ваше имя *</label>
        <input
          id="review-author"
          name="author"
          type="text"
          className="form-input"
          placeholder="Иван Иванов"
          required
          minLength={2}
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="review-role">Кем являетесь</label>
        <input
          id="review-role"
          name="role"
          type="text"
          className="form-input"
          placeholder="Например: владелец квартиры"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Оценка</label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="review-quote">Ваш отзыв *</label>
        <textarea
          id="review-quote"
          name="quote"
          className="form-textarea"
          placeholder="Расскажите о вашем опыте работы с нами..."
          required
          minLength={10}
          rows={5}
        />
      </div>

      {status === "error" ? (
        <p className="form-error" role="alert">{errorMsg}</p>
      ) : null}

      <button className="button" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Отправляем…" : "Отправить отзыв"}
      </button>
    </form>
  );
}
