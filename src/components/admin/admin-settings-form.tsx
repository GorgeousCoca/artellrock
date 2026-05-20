"use client";

import { useState } from "react";

import type { CompanySettings } from "@/types/content";

export function AdminSettingsForm({ initialSettings }: { initialSettings: CompanySettings }) {
  const [status, setStatus] = useState("idle");

  return (
    <form
      className="card stack"
      action={async (formData) => {
        setStatus("saving");

        const payload = {
          ...initialSettings,
          companyName: String(formData.get("companyName") ?? ""),
          legalName: String(formData.get("legalName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          address: String(formData.get("address") ?? ""),
          metro: String(formData.get("metro") ?? ""),
          inn: String(formData.get("inn") ?? ""),
          ogrn: String(formData.get("ogrn") ?? ""),
          mapEmbedUrl: String(formData.get("mapEmbedUrl") ?? ""),
          heroTitle: String(formData.get("heroTitle") ?? ""),
          heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
          primaryCta: String(formData.get("primaryCta") ?? ""),
          seoDefaultTitle: String(formData.get("seoDefaultTitle") ?? ""),
          seoDescription: String(formData.get("seoDescription") ?? "")
        };

        try {
          // fetch без try/catch: обрыв сети → необработанное отклонение в action формы.
          const response = await fetch("/api/admin/settings", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          setStatus(response.ok ? "saved" : "error");
        } catch {
          // Сеть / таймаут: не оставляем форму без реакции и не даём Promise «вылететь» в консоль.
          setStatus("error");
        }
      }}
    >
      <h1>Настройки сайта</h1>
      <div className="form-grid">
        <input className="field" defaultValue={initialSettings.companyName} name="companyName" placeholder="Название компании" />
        <input className="field" defaultValue={initialSettings.legalName} name="legalName" placeholder="Юридическое лицо" />
        <input className="field" defaultValue={initialSettings.phone} name="phone" placeholder="Телефон" />
        <input className="field" defaultValue={initialSettings.email} name="email" placeholder="Email" />
        <input className="field" defaultValue={initialSettings.address} name="address" placeholder="Адрес" />
        <input className="field" defaultValue={initialSettings.metro} name="metro" placeholder="Метро" />
        <input className="field" defaultValue={initialSettings.inn} name="inn" placeholder="ИНН" />
        <input className="field" defaultValue={initialSettings.ogrn} name="ogrn" placeholder="ОГРН" />
      </div>
      <input className="field" defaultValue={initialSettings.mapEmbedUrl} name="mapEmbedUrl" placeholder="Ссылка на карту" />
      <input className="field" defaultValue={initialSettings.heroTitle} name="heroTitle" placeholder="Hero title" />
      <textarea className="textarea" defaultValue={initialSettings.heroSubtitle} name="heroSubtitle" placeholder="Hero subtitle" />
      <input className="field" defaultValue={initialSettings.primaryCta} name="primaryCta" placeholder="CTA" />
      <input className="field" defaultValue={initialSettings.seoDefaultTitle} name="seoDefaultTitle" placeholder="SEO title" />
      <textarea className="textarea" defaultValue={initialSettings.seoDescription} name="seoDescription" placeholder="SEO description" />
      <div className="btn-row">
        <button className="button" type="submit">
          Сохранить
        </button>
        <span className="form-note">
          {status === "saving"
            ? "Сохранение..."
            : status === "saved"
              ? "Изменения сохранены"
              : status === "error"
                ? "Не удалось сохранить"
                : "Глобальные настройки применяются ко всему публичному сайту."}
        </span>
      </div>
    </form>
  );
}
