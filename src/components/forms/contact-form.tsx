"use client";

import { Upload } from "lucide-react";
import { useId, useState } from "react";

import { getConfiguredBasePath } from "@/lib/utils";

import styles from "./contact-form.module.scss";

type ContactFormProps = {
  source: string;
  compact?: boolean;
  className?: string;
  variant?: "lead" | "callback" | "compact";
  bareSurface?: boolean;
  onSuccess?: () => void;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function goToThankYou() {
  const base = getConfiguredBasePath().replace(/\/$/, "");
  window.location.assign(`${base}/thank-you`);
}

export function ContactForm({
  source,
  compact = false,
  className,
  variant = "lead",
  bareSurface = false,
  onSuccess
}: ContactFormProps) {
  const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
  const isCallback = variant === "callback";
  const fileInputId = useId();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");

    const attachment = formData.get("attachment");
    const hasFile = attachment instanceof File && attachment.size > 0;
    const message = String(formData.get("message") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (isStaticDemo) {
      setStatus("success");
      await wait(350);
      onSuccess?.();
      try {
        goToThankYou();
      } catch {
        // ignore
      }
      return;
    }

    try {
      const submitData = new FormData();
      submitData.set("name", String(formData.get("name") ?? ""));
      submitData.set("phone", String(formData.get("phone") ?? ""));
      submitData.set("email", email || "не указан");
      submitData.set(
        "productType",
        String(formData.get("productType") ?? (isCallback ? "консультация" : "не указан"))
      );
      submitData.set(
        "dimensions",
        String(formData.get("dimensions") ?? (isCallback ? "не указаны" : "не указаны"))
      );
      submitData.set("comment", message || (isCallback ? "Запрос консультации" : "—"));
      submitData.set("message", message || (isCallback ? "Запрос консультации" : "—"));
      submitData.set("botCheck", "true");
      submitData.set("website", String(formData.get("website") ?? ""));
      submitData.set("source", source);
      if (hasFile) {
        submitData.set("attachment", attachment);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: submitData
      });

      if (response.ok) {
        setStatus("success");
        await wait(450);
        onSuccess?.();
        try {
          goToThankYou();
        } catch {
          // ignore
        }
        return;
      }
    } catch {
      // reflected in UI
    }

    setStatus("error");
  }

  const formClassName = [
    styles.form,
    isCallback ? styles.formCallback : styles.formLead,
    bareSurface && !isCallback ? styles.formBare : "",
    compact ? styles.formCompact : "",
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      className={formClassName}
      action={async (formData) => {
        await handleSubmit(formData);
      }}
    >
      {!isCallback ? (
        <header className={styles.header}>
          <span className="eyebrow">Заявка на консультацию</span>
          <strong className={styles.headerTitle}>Подберём материал и рассчитаем проект</strong>
          <p className={styles.headerLead}>Ответим в течение часа в рабочее время.</p>
        </header>
      ) : null}

      <div className={isCallback ? styles.callbackFields : styles.leadFields}>
        <div className="form-group">
          <label className={styles.label} htmlFor={`${source}-name`}>
            Имя <span className={styles.required} aria-hidden>*</span>
          </label>
          <input
            id={`${source}-name`}
            className="form-input"
            name="name"
            autoComplete="name"
            placeholder="Как к вам обращаться"
            required
          />
        </div>

        <div className="form-group">
          <label className={styles.label} htmlFor={`${source}-phone`}>
            Телефон <span className={styles.required} aria-hidden>*</span>
          </label>
          <input
            id={`${source}-phone`}
            className="form-input"
            name="phone"
            autoComplete="tel"
            placeholder="+7 …"
            required
          />
        </div>

        {!isCallback ? (
          <>
            <div className="form-group">
              <label className={styles.label} htmlFor={`${source}-email`}>
                Email
              </label>
              <input
                id={`${source}-email`}
                className="form-input"
                name="email"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className={styles.label} htmlFor={`${source}-product-type`}>
                Тип изделия
              </label>
              <select
                id={`${source}-product-type`}
                className="form-select"
                name="productType"
                defaultValue="countertop"
              >
                <option value="countertop">Столешница</option>
                <option value="window-sill">Подоконник</option>
                <option value="other">Другое изделие</option>
              </select>
            </div>
          </>
        ) : null}

        <div className={`form-group ${isCallback ? "" : styles.fullWidth}`}>
          <label className={styles.label} htmlFor={`${source}-message`}>
            {isCallback ? "Дополнительная информация" : "Комментарий к заявке"}
          </label>
          <textarea
            id={`${source}-message`}
            className={`form-textarea ${isCallback ? styles.textareaShort : ""}`}
            name="message"
            placeholder={
              isCallback
                ? "Кратко опишите задачу или удобное время для звонка"
                : compact
                  ? "Кратко опишите задачу"
                  : "Цвет, бренд камня, сроки монтажа и другие пожелания"
            }
            rows={isCallback ? 3 : 4}
          />
        </div>

        <div className={`form-group ${styles.fullWidth}`}>
          <span className={styles.label}>Эскиз</span>
          <span className={styles.fieldHint}>Вы можете прикрепить чертёж или фото</span>
          <label className={styles.fileTrigger} htmlFor={fileInputId}>
            <Upload size={18} aria-hidden />
            <span>{fileName ?? "Выберите файлы"}</span>
          </label>
          <input
            id={fileInputId}
            className={styles.fileInput}
            name="attachment"
            type="file"
            accept="image/*,.pdf,.dwg,.dxf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? null);
            }}
          />
        </div>
      </div>

      <input
        autoComplete="off"
        name="website"
        tabIndex={-1}
        type="text"
        aria-hidden="true"
        aria-label="Не заполнять (защита от спама)"
        className={styles.honeypot}
      />

      <div className={styles.actions}>
        <button className={`button ${styles.submit}`} disabled={status === "submitting"} type="submit">
          {status === "submitting"
            ? "Отправка…"
            : isCallback
              ? "Жду звонка"
              : "Отправить заявку"}
        </button>
        {(status !== "idle" || !isCallback) && (
          <p className={styles.privacy}>
            {status === "success"
              ? isStaticDemo
                ? "Демо-режим: форма проверена, отправка в CRM отключена."
                : "Заявка принята. Мы свяжемся с вами."
              : status === "error"
                ? "Не удалось отправить форму. Попробуйте ещё раз или позвоните нам."
                : "Мы не передаём вашу персональную информацию третьим лицам."}
          </p>
        )}
      </div>
    </form>
  );
}
