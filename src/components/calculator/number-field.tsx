"use client";

import { useId, useState } from "react";

import styles from "./calculator.module.scss";

type CommonProps = {
  suffix: string;
  value: number;
  step: number;
  onCommit: (value: number) => void;
};

type FormProps = CommonProps & {
  variant?: "form";
  label: string;
  title: string;
  error?: string;
  hint?: string;
};

type LineProps = CommonProps & {
  /** Поле на размерной линии чертежа: без видимой подписи, ошибка показана в другом месте (см. `errorId`). */
  variant: "line";
  /** Доступное имя поля, например «A Длина, мм». */
  ariaLabel: string;
  invalid?: boolean;
  /** id элемента с текстом ошибки, он есть в DOM только при ошибке. */
  errorId?: string;
};

export type NumberFieldProps = FormProps | LineProps;

/**
 * Числовое поле с черновиком: пока человек печатает («1», «12», «120»), в состояние уходят только
 * корректные числа, а пустое поле не превращается в 0. Ошибка диапазона показывается рядом, не мешая вводу.
 */
export function NumberField(props: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const { suffix, value, step, onCommit } = props;

  const field = (extra: { describedBy?: string; invalid: boolean; ariaLabel?: string }) => (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      step={step}
      value={draft ?? String(value)}
      aria-label={extra.ariaLabel}
      aria-invalid={extra.invalid ? true : undefined}
      aria-describedby={extra.describedBy}
      onChange={(event) => {
        setDraft(event.target.value);
        const parsed = event.target.valueAsNumber;
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      onBlur={() => setDraft(null)}
      // Колёсико над сфокусированным number-полем меняет значение: прокручивая страницу, можно незаметно испортить размер.
      // Снимаем фокус до действия по умолчанию: прокрутка уходит странице, а клавиатура и стрелки работают как прежде.
      onWheel={(event) => event.currentTarget.blur()}
    />
  );

  if (props.variant === "line") {
    return (
      <div className={styles.lineField} data-invalid={props.invalid ? "true" : undefined}>
        {field({ describedBy: props.invalid ? props.errorId : undefined, invalid: Boolean(props.invalid), ariaLabel: props.ariaLabel })}
        <span aria-hidden="true">{suffix}</span>
      </div>
    );
  }

  const { label, title, error, hint } = props;
  const note = error || hint;

  return (
    <div className={styles.numberField} data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>
        <span className={styles.numberFieldLetter}>{label}</span> {title}
      </label>
      <div className={styles.numberFieldControl}>
        {field({ describedBy: note ? `${id}-note` : undefined, invalid: Boolean(error) })}
        <span aria-hidden="true">{suffix}</span>
      </div>
      <p id={`${id}-note`} className={error ? styles.fieldError : styles.fieldHint}>
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}
