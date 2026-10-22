"use client";

/**
 * Шаг 5 «Дополнительные работы». Чек-лист услуг из БД, сгруппированный по категориям.
 * Для услуг, количество которых считается по чертежу, показываем ожидаемое количество (справочно,
 * его всё равно пересчитает сервер); для остальных — поле ввода.
 */
import { useId } from "react";

import { measureInput, serviceQuantity } from "@/lib/calculator/estimate";
import { formatQuantity, formatRub } from "@/lib/calculator/format";
import { SERVICE_CATEGORIES, UNIT_LABEL } from "@/lib/calculator/taxonomy";
import type { ServiceRecord } from "@/lib/calculator/types";

import { useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";

function ServiceRow({ service }: { service: ServiceRecord }) {
  const { state, dispatch, geometryValid } = useCalculator();
  const id = useId();
  const checked = service.id in state.services;
  const unit = UNIT_LABEL[service.unit];
  const computedHere = service.quantityMode !== "user";

  const computed =
    checked && computedHere && geometryValid
      ? serviceQuantity(service, measureInput(state.items))
      : null;

  return (
    <li className={styles.serviceRow} data-checked={checked ? "true" : undefined}>
      <div className={styles.serviceMain}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={() => dispatch({ type: "service/toggle", id: service.id })}
        />
        <label htmlFor={id}>
          {service.name}
          {service.hint ? <small>{service.hint}</small> : null}
        </label>
        <span className={styles.servicePrice}>
          {formatRub(service.price)} / {unit}
        </span>
      </div>

      {checked && service.quantityMode === "user" ? (
        <div className={styles.serviceQuantity}>
          <label htmlFor={`${id}-qty`}>Количество</label>
          <input
            id={`${id}-qty`}
            type="number"
            inputMode="decimal"
            min={service.unit === "piece" ? 1 : 0.01}
            step={service.unit === "piece" ? 1 : 0.1}
            defaultValue={state.services[service.id]}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value) && value > 0) dispatch({ type: "service/quantity", id: service.id, value });
            }}
          />
          <span>{unit}</span>
        </div>
      ) : null}

      {computed !== null ? (
        <p className={styles.serviceComputed}>
          По чертежу: {formatQuantity(computed)} {unit}
          {computed === 0 ? " — для ваших изделий не потребуется" : ""}
        </p>
      ) : null}
    </li>
  );
}

export function ServicesStep() {
  const { catalog } = useCalculator();
  const groupId = useId();

  const groups = SERVICE_CATEGORIES.map((category) => ({
    category,
    services: catalog.services.filter((service) => service.category === category.value)
  })).filter((group) => group.services.length > 0);

  return (
    <section className={styles.step} aria-labelledby={`${groupId}-title`}>
      <h2 id={`${groupId}-title`} className="t-tagline">
        Дополнительные работы
      </h2>
      <p className={styles.stepLead}>Отметьте то, что нужно. Раскрой и базовая обработка материала уже входят в смету.</p>

      {groups.length === 0 ? (
        <p className={styles.notice}>Дополнительные услуги пока не добавлены.</p>
      ) : (
        groups.map(({ category, services }) => (
          <fieldset key={category.value} className={styles.optionGroup}>
            <legend className="t-body-strong">{category.label}</legend>
            <ul className={styles.serviceList}>
              {services.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))}
            </ul>
          </fieldset>
        ))
      )}
    </section>
  );
}
