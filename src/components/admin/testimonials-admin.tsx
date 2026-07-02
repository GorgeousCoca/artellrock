"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Testimonial, TestimonialSource, TestimonialStatus } from "@/types/content";

type Props = { testimonials: Testimonial[] };

const SOURCE_LABELS: Record<TestimonialSource, string> = {
  site: "💬 Сайт",
  vk: "VK",
  avito: "Авито",
  manual: "Вручную"
};

const STATUS_TABS: { key: TestimonialStatus | "all"; label: string }[] = [
  { key: "pending", label: "Ожидают" },
  { key: "approved", label: "Одобрённые" },
  { key: "rejected", label: "Отклонённые" }
];

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b" }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export function TestimonialsAdmin({ testimonials }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TestimonialStatus>("pending");
  const [showAddForm, setShowAddForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addRating, setAddRating] = useState(5);

  const filtered = testimonials.filter((t) => t.status === tab);
  const pending = testimonials.filter((t) => t.status === "pending").length;

  async function changeStatus(id: string, status: TestimonialStatus) {
    setBusy(id);
    await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setBusy(null);
    router.refresh();
  }

  async function deleteItem(id: string) {
    if (!confirm("Удалить отзыв?")) return;
    setBusy(id);
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  async function handleAddManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      author: fd.get("author"),
      role: fd.get("role") || "Клиент",
      quote: fd.get("quote"),
      rating: addRating,
      source: fd.get("source") as TestimonialSource,
      sourceUrl: fd.get("sourceUrl") || undefined,
      status: "approved" as TestimonialStatus,
      createdAt: new Date().toISOString()
    };
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setShowAddForm(false);
    router.refresh();
  }

  return (
    <div className="stack">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Отзывы</h1>
        <button className="button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Отмена" : "+ Добавить вручную"}
        </button>
      </div>

      {showAddForm ? (
        <form className="admin-card stack" onSubmit={handleAddManual}>
          <h3 style={{ margin: 0 }}>Новый отзыв (ВКонтакте / Авито / вручную)</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Имя *</label>
              <input name="author" className="form-input" required minLength={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <input name="role" className="form-input" placeholder="Клиент" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Текст отзыва *</label>
            <textarea name="quote" className="form-textarea" required minLength={10} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Оценка</label>
              <select
                className="form-select"
                value={addRating}
                onChange={(e) => setAddRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} звезд{n === 1 ? "а" : n < 5 ? "ы" : ""}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Источник</label>
              <select name="source" className="form-select">
                <option value="manual">Вручную</option>
                <option value="vk">ВКонтакте</option>
                <option value="avito">Авито</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Ссылка на оригинал</label>
            <input name="sourceUrl" type="url" className="form-input" placeholder="https://..." />
          </div>
          <button className="button" type="submit">Сохранить (опубликовать сразу)</button>
        </form>
      ) : null}

      <div style={{ display: "flex", gap: 4 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as TestimonialStatus)}
            className={tab === t.key ? "button" : "button-secondary"}
            style={{ position: "relative" }}
          >
            {t.label}
            {t.key === "pending" && pending > 0 ? (
              <span
                style={{
                  marginLeft: 6,
                  background: "#dc2626",
                  color: "#fff",
                  borderRadius: "100px",
                  padding: "1px 7px",
                  fontSize: "0.75rem",
                  fontWeight: 700
                }}
              >
                {pending}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", color: "var(--foreground-soft)" }}>
          Отзывов нет
        </div>
      ) : (
        <div className="stack">
          {filtered.map((t) => (
            <div key={t.id} className="admin-card" style={{ opacity: busy === t.id ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div className="stack stack--sm" style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <strong>{t.author}</strong>
                    {t.role ? <span style={{ color: "var(--foreground-soft)", fontSize: "0.85rem" }}>{t.role}</span> : null}
                    <span style={{ fontSize: "0.75rem", color: "var(--foreground-soft)" }}>
                      {SOURCE_LABELS[t.source]}
                    </span>
                    <Stars n={t.rating} />
                  </div>
                  <p style={{ margin: 0 }}>{t.quote}</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--foreground-soft)" }}>
                    {new Date(t.createdAt).toLocaleDateString("ru-RU")}
                    {t.sourceUrl ? (
                      <> · <a href={t.sourceUrl} target="_blank" rel="noreferrer">источник</a></>
                    ) : null}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {t.status !== "approved" ? (
                    <button
                      className="button"
                      style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                      onClick={() => changeStatus(t.id, "approved")}
                      disabled={busy === t.id}
                    >
                      Одобрить
                    </button>
                  ) : null}
                  {t.status !== "rejected" ? (
                    <button
                      className="button-secondary"
                      style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                      onClick={() => changeStatus(t.id, "rejected")}
                      disabled={busy === t.id}
                    >
                      Отклонить
                    </button>
                  ) : null}
                  <button
                    className="button-ghost"
                    style={{ padding: "6px 12px", fontSize: "0.85rem", color: "#dc2626" }}
                    onClick={() => deleteItem(t.id)}
                    disabled={busy === t.id}
                    aria-label="Удалить отзыв"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
