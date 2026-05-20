"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./contact-form.module.scss";

type ContactFormProps = {
  source: string;
  compact?: boolean;
  className?: string;
};

const submissionSteps = ["Проверяем данные", "Формируем заявку", "Отправляем на почту менеджеру"];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ContactForm({ source, compact = false, className }: ContactFormProps) {
  const router = useRouter();
  const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setActiveStep(1);
    setProgress(20);
    await wait(180);
    setActiveStep(2);
    setProgress(52);

    const payload = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      productType: String(formData.get("productType") ?? "не указан"),
      dimensions: String(formData.get("dimensions") ?? "не указаны"),
      comment: String(formData.get("message") ?? "без комментария"),
      botCheck: true,
      website: String(formData.get("website") ?? ""),
      source
    };

    if (isStaticDemo) {
      setActiveStep(3);
      setProgress(100);
      setStatus("success");
      await wait(350);
      try {
        // Редкий сбой навигации не должен оставлять необработанное отклонение после успешной «отправки» в демо.
        router.push("/thank-you");
        router.refresh();
      } catch {
        // Игнорируем: пользователь уже видит success.
      }
      return;
    }

    setActiveStep(3);
    setProgress(84);
    try {
      // Сеть / CORS / обрыв соединения дают отклонённый Promise без try/catch → «Unhandled rejection» в консоли.
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setProgress(100);
        setStatus("success");
        await wait(450);
        try {
          router.push("/thank-you");
          router.refresh();
        } catch {
          // Аналогично демо: навигация не должна превращать успешный ответ API в ошибку в консоли.
        }
        return;
      }
    } catch {
      // Ошибку уже отражаем в UI; не пробрасываем — иначе Next/React покажут необработанное отклонение в консоли.
    }

    setProgress(0);
    setActiveStep(0);
    setStatus("error");
  }

  return (
    <form
      className={`card stack ${className ?? ""}`.trim()}
      action={async (formData) => {
        await handleSubmit(formData);
      }}
    >
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Заявка на расчет</span>
        <strong>Получите расчет по вашим размерам</strong>
      </div>
      <div className="form-grid">
        <label className="stack">
          <span>Имя</span>
          <input className="field" name="name" autoComplete="name" placeholder="Как к вам обращаться" required />
        </label>
        <label className="stack">
          <span>Телефон</span>
          <input className="field" name="phone" autoComplete="tel" placeholder="+7 …" required />
        </label>
        <label className="stack">
          <span>Email</span>
          <input className="field" name="email" placeholder="name@example.com" type="email" autoComplete="email" required />
        </label>
      </div>
      <div className="form-grid">
        <label className="stack">
          <span>Тип изделия</span>
          <select className="select" name="productType" defaultValue="countertop" required>
            <option value="countertop">Столешница</option>
            <option value="window-sill">Подоконник</option>
            <option value="reception">Ресепшн / коммерческая поверхность</option>
            <option value="other">Другое изделие</option>
          </select>
        </label>
        <label className="stack">
          <span>Материал</span>
          <input className="field" name="material" value="Кварцевый агломерат" readOnly />
        </label>
        <label className="stack">
          <span>Размеры</span>
          <input
            className="field"
            name="dimensions"
            placeholder="Например 3000×600 мм"
            autoComplete="off"
            required
          />
        </label>
      </div>
      <label className="stack">
        <span>Комментарий к заявке</span>
        <textarea
          className="textarea"
          name="message"
          placeholder={
            compact ? "Кратко опишите задачу" : "Цвет, бренд камня, сроки монтажа и другие пожелания"
          }
          required
        />
      </label>
      <input
        autoComplete="off"
        name="website"
        tabIndex={-1}
        type="text"
        aria-hidden="true"
        aria-label="Не заполнять (защита от спама)"
        style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
      />
      <label className="stack">
        <span className="form-note">Эскиз или фото проекта (опционально)</span>
        <input className="field" name="attachment" type="file" />
      </label>
      <div className={styles.statusWrap}>
        <div className={styles.timeline}>
          {submissionSteps.map((step, index) => {
            const isActive = status === "submitting" && index < activeStep;
            return (
              <div key={step} className={`${styles.step} ${isActive ? styles.stepActive : ""}`}>
                <span className={styles.stepDot} />
                <span>{step}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%`, transition: "width 0.35s ease-out" }}
          />
        </div>
      </div>
      <div className="btn-row">
        <button className="button" disabled={status === "submitting"} type="submit">
          {status === "submitting" ? "Отправка..." : "Отправить заявку"}
        </button>
        <span className="form-note">
          {status === "success"
            ? isStaticDemo
              ? "Демо-режим: форма проверена, отправка в CRM отключена."
              : "Заявка принята. Мы свяжемся с вами."
            : status === "error"
              ? "Не удалось отправить форму. Попробуйте еще раз."
              : "Нажимая кнопку, вы соглашаетесь с обработкой персональных данных."}
        </span>
      </div>
    </form>
  );
}
