"use client";

import Link from "next/link";
import { useState } from "react";

import { directions, leadForm } from "@/content/artellrock";

type LeadFormProps = {
  /** Откуда отправлена заявка — попадает в поле source записи. */
  source: string;
  /** Префикс id полей: на странице две формы, id не должны совпадать. */
  idPrefix: string;
};

type Status = "idle" | "sending" | "done" | "error";

export function LeadForm({ source, idPrefix }: LeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          product: String(data.get("product") ?? ""),
          website: String(data.get("website") ?? ""),
          consent: data.get("consent") === "on",
          source
        })
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="lead-form lead-form__done" role="status">
        <p className="t-tagline">{leadForm.success}</p>
      </div>
    );
  }

  const listId = `${idPrefix}-products`;

  return (
    <form className="lead-form" onSubmit={handleSubmit} aria-busy={status === "sending"}>
      <div className="lead-form__fields">
        <div className="field">
          <label htmlFor={`${idPrefix}-name`}>{leadForm.fields.name}</label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-phone`}>{leadForm.fields.phone}</label>
          <input
            id={`${idPrefix}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            required
            minLength={6}
            maxLength={40}
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-product`}>{leadForm.fields.product}</label>
          <input
            id={`${idPrefix}-product`}
            name="product"
            type="text"
            list={listId}
            autoComplete="off"
            maxLength={300}
          />
          <datalist id={listId}>
            {directions.map((direction) => (
              <option key={direction.slug} value={direction.title} />
            ))}
          </datalist>
        </div>

        {/* Скрытая приманка для ботов: человек её не видит и не заполняет. */}
        <div className="field field--trap" aria-hidden="true">
          <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </div>

      <div className="consent">
        <input id={`${idPrefix}-consent`} name="consent" type="checkbox" required />
        <label htmlFor={`${idPrefix}-consent`}>
          {leadForm.consentLead} <Link href="/politika">{leadForm.consentPolicy}</Link> {leadForm.consentMiddle}{" "}
          <Link href="/soglasie">{leadForm.consentConsent}</Link>
        </label>
      </div>

      <button className="btn btn--primary btn--block lead-form__submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? leadForm.sending : leadForm.submit}
      </button>

      <p className="lead-form__status" role="alert">
        {status === "error" ? leadForm.error : ""}
      </p>
    </form>
  );
}
