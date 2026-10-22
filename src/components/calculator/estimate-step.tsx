"use client";

/**
 * Шаг 6 «Результат»: смета, которую посчитал СЕРВЕР, и форма заявки.
 *
 * Клиент ничего не считает: таблица — ответ `calculateEstimateAction`. При отправке заявки сервер снова
 * считает смету по идентификаторам (`submitEstimateAction`), поэтому сумму на экране нельзя подменить.
 */
import Link from "next/link";
import { useId, useState } from "react";

import { leadForm } from "@/content/artellrock";
import { submitEstimateAction } from "@/lib/calculator/actions";
import { formatQuantity, formatRub } from "@/lib/calculator/format";
import { UNIT_LABEL } from "@/lib/calculator/taxonomy";

import { LAST_STEP, STEPS, useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "error"; message: string; field?: string }
  | { status: "done"; total: number };

function LeadSection() {
  const { input } = useCalculator();
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const id = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submit.status === "sending") return;

    const data = new FormData(event.currentTarget);
    setSubmit({ status: "sending" });

    try {
      const result = await submitEstimateAction({
        ...input,
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        consent: data.get("consent") === "on",
        website: String(data.get("website") ?? "")
      });
      setSubmit(
        result.ok
          ? { status: "done", total: result.total }
          : { status: "error", message: result.error, field: result.field }
      );
    } catch {
      setSubmit({ status: "error", message: leadForm.error });
    }
  }

  if (submit.status === "done") {
    return (
      <div className={styles.leadDone} role="status">
        <p className="t-tagline">Заявка отправлена</p>
        <p>
          {submit.total > 0 ? `Сохранили расчёт на ${formatRub(submit.total)}. ` : ""}
          Свяжемся по указанному номеру, уточним детали и договоримся о бесплатном замере.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.leadForm} onSubmit={handleSubmit} aria-busy={submit.status === "sending"}>
      <h3 className="t-tagline">Отправить расчёт мастеру</h3>
      <p className={styles.stepLead}>Расчёт предварительный. Оставьте контакт — уточним детали и договоримся о бесплатном замере.</p>

      <div className={styles.leadFields}>
        <div className="field">
          <label htmlFor={`${id}-name`}>{leadForm.fields.name}</label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            aria-invalid={submit.status === "error" && submit.field === "name" ? true : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-phone`}>{leadForm.fields.phone}</label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            required
            minLength={6}
            maxLength={40}
            aria-invalid={submit.status === "error" && submit.field === "phone" ? true : undefined}
          />
        </div>
        {/* Скрытая приманка для ботов: человек её не видит и не заполняет. */}
        <div className="field field--trap" aria-hidden="true">
          <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </div>

      <div className="consent">
        <input id={`${id}-consent`} name="consent" type="checkbox" required />
        <label htmlFor={`${id}-consent`}>
          {leadForm.consentLead} <Link href="/politika">{leadForm.consentPolicy}</Link> {leadForm.consentMiddle}{" "}
          <Link href="/soglasie">{leadForm.consentConsent}</Link>
        </label>
      </div>

      <button className="btn btn--primary" type="submit" disabled={submit.status === "sending"}>
        {submit.status === "sending" ? leadForm.sending : "Отправить расчёт"}
      </button>

      <p className="lead-form__status" role="alert">
        {submit.status === "error" ? submit.message : ""}
      </p>
    </form>
  );
}

export function EstimateStep() {
  const { live, refresh, dispatch, blockedStep, blockReason } = useCalculator();
  const groupId = useId();
  const { estimate } = live;

  // Вкладками можно прийти сюда раньше времени. Смету без материала или с неверными размерами
  // не показываем (она была бы неполной) и ведём на шаг, где чего-то не хватает.
  const missing = blockedStep !== null && blockedStep < LAST_STEP ? blockReason(blockedStep) : null;
  if (blockedStep !== null && missing) {
    return (
      <section className={styles.step} aria-labelledby={`${groupId}-title`}>
        <h2 id={`${groupId}-title`} className="t-tagline">
          Результат расчёта
        </h2>
        <div className={styles.notice} role="status">
          <p>Чтобы получить смету, заполните шаг «{STEPS[blockedStep]}». {missing}</p>
          <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: "go", step: blockedStep })}>
            Перейти к шагу «{STEPS[blockedStep]}»
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.step} aria-labelledby={`${groupId}-title`}>
      <h2 id={`${groupId}-title`} className="t-tagline">
        Результат расчёта
      </h2>

      {live.status === "error" ? (
        <div className={styles.notice} role="alert">
          <p>{live.error}</p>
          <button type="button" className="btn btn--secondary" onClick={() => void refresh()}>
            Повторить расчёт
          </button>
        </div>
      ) : null}

      {!estimate && live.status !== "error" ? (
        <p className={styles.notice} role="status">
          Считаем…
        </p>
      ) : null}

      {estimate ? (
        <div aria-busy={live.status === "loading"}>
          <dl className={styles.estimateFacts}>
            <div>
              <dt>Изделий</dt>
              <dd>{estimate.totals.itemCount}</dd>
            </div>
            <div>
              <dt>Площадь</dt>
              <dd>{formatQuantity(estimate.totals.areaSqm)} м²</dd>
            </div>
            {estimate.sheets !== null ? (
              <div>
                <dt>Листов (ориентировочно)</dt>
                <dd>{formatQuantity(estimate.sheets)}</dd>
              </div>
            ) : null}
          </dl>

          <table className={styles.estimateTable}>
            <caption className="visually-hidden">Смета</caption>
            <thead>
              <tr>
                <th scope="col">Наименование</th>
                <th scope="col">Кол-во</th>
                <th scope="col">Ед. изм.</th>
                <th scope="col">Цена</th>
                <th scope="col">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {estimate.lines.map((line) => (
                <tr key={line.key}>
                  <th scope="row" data-label="Наименование">
                    {line.name}
                  </th>
                  <td data-label="Кол-во">{formatQuantity(line.quantity)}</td>
                  <td data-label="Ед. изм.">{UNIT_LABEL[line.unit]}</td>
                  <td data-label="Цена">{formatRub(line.unitPrice)}</td>
                  <td data-label="Сумма">{formatRub(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={4}>
                  Итоговая стоимость
                </th>
                <td>{formatRub(estimate.total)}</td>
              </tr>
            </tfoot>
          </table>

          {estimate.warnings.length > 0 ? (
            <ul className={styles.warnings}>
              {estimate.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <p className={styles.disclaimer}>
            Расчёт предварительный и не является офертой. Итог уточняется после бесплатного замера.
          </p>
        </div>
      ) : null}

      {estimate ? <LeadSection /> : null}
    </section>
  );
}
