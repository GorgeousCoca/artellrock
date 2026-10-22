"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { leadForm } from "@/content/artellrock";
import { inspectLeadAttachment } from "@/lib/leads/attachment-rules";
import { normalizeTelegram } from "@/lib/leads/telegram";

const PHONE_MASK_EMPTY = "+7 (___) ___-__-__";

function localDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("7") || digits.startsWith("8")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

function formatPhoneMask(local: string) {
  const chars = local.slice(0, 10).split("");
  const slot = (index: number) => chars[index] ?? "_";
  return `+7 (${slot(0)}${slot(1)}${slot(2)}) ${slot(3)}${slot(4)}${slot(5)}-${slot(6)}${slot(7)}-${slot(8)}${slot(9)}`;
}

/** Курсор сразу после последней введённой цифры, не заходя в «+7 ». */
function caretAfter(localLength: number) {
  const slots = [4, 5, 6, 9, 10, 11, 13, 14, 16, 17];
  if (localLength <= 0) return 4;
  return (slots[Math.min(localLength, 10) - 1] ?? 17) + 1;
}

type Status = "idle" | "sending" | "done" | "error";

const FILE_ERRORS: Record<string, string> = {
  "file-type": "Можно приложить jpg, png, gif, doc или xls.",
  "file-too-large": "Файл больше 8 МБ."
};

type OrderCallButtonProps = {
  className: string;
  /** Текст на карточке: «Заказать» или «Загрузить». */
  label: string;
  /** Подпись источника в заявке Payload. */
  source: string;
  idPrefix: string;
  /** «call» — обратный звонок, «drawing» — загрузка чертежа. */
  variant?: "call" | "drawing";
};

export function OrderCallButton({ className, label, source, idPrefix, variant = "call" }: OrderCallButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [phone, setPhone] = useState(PHONE_MASK_EMPTY);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [contactError, setContactError] = useState("");
  const titleId = `${idPrefix}-title`;

  useEffect(() => {
    const digits = localDigits(phone);
    const incomplete = digits.length > 0 && digits.length < 10;
    const missing = variant === "call" && digits.length !== 10;
    phoneRef.current?.setCustomValidity(incomplete || missing ? "Введите номер полностью" : "");
  }, [phone, variant]);

  useLayoutEffect(() => {
    const input = phoneRef.current;
    const caret = caretRef.current;
    if (!input || caret == null) return;
    input.setSelectionRange(caret, caret);
  }, [phone]);

  function openDialog() {
    caretRef.current = null;
    setStatus("idle");
    setPhone(PHONE_MASK_EMPTY);
    setFileName("");
    setFileError("");
    setContactError("");
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>(`#${idPrefix}-name`)?.focus();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function commitPhone(local: string) {
    caretRef.current = caretAfter(local.length);
    setPhone(formatPhoneMask(local));
  }

  function onPhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    commitPhone(localDigits(event.currentTarget.value));
  }

  function onPhoneKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    if (event.key !== "Backspace" || start !== end) return;
    if (start <= 4) {
      event.preventDefault();
      return;
    }
    if (!/\d/.test(phone[start - 1] ?? "")) {
      event.preventDefault();
      commitPhone(localDigits(phone).slice(0, -1));
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setFileName("");
      setFileError("");
      return;
    }

    const problem = inspectLeadAttachment(file);
    setFileName(file.name);
    setFileError(problem ? FILE_ERRORS[problem] : "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const note = String(data.get("note") ?? "").trim();
    const noteField = form.querySelector<HTMLTextAreaElement>("[name=note]");
    noteField?.setCustomValidity("");
    data.set("note", note);

    if (variant === "call" && !note) {
      noteField?.setCustomValidity("Заполните это поле");
      noteField?.reportValidity();
      return;
    }

    if (variant === "drawing") {
      const telegram = normalizeTelegram(String(data.get("telegram") ?? ""));
      const digits = localDigits(phone);
      if (digits.length > 0 && digits.length < 10) {
        phoneRef.current?.reportValidity();
        return;
      }
      if (telegram == null) {
        setContactError("Укажите Telegram в виде @username");
        return;
      }
      if (!telegram && digits.length !== 10) {
        setContactError("Укажите Telegram или телефон");
        return;
      }
      data.set("kind", "drawing");
      data.set("telegram", telegram);
      setContactError("");
    }

    const file = data.get("file");
    if (file instanceof File && file.size > 0) {
      const problem = inspectLeadAttachment(file);
      if (problem) {
        setFileError(FILE_ERRORS[problem]);
        return;
      }
    } else {
      data.delete("file");
    }

    data.set("source", source);
    setStatus("sending");
    setFileError("");

    try {
      const response = await fetch("/api/contact", { method: "POST", body: data });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error && FILE_ERRORS[payload.error]) {
          setFileError(FILE_ERRORS[payload.error]);
          setStatus("idle");
          return;
        }
        if (payload?.error === "invalid-telegram") {
          setContactError("Укажите Telegram в виде @username");
          setStatus("idle");
          return;
        }
        if (payload?.error === "contact-required") {
          setContactError("Укажите Telegram или телефон");
          setStatus("idle");
          return;
        }
        setStatus("error");
        return;
      }

      form.reset();
      setPhone(PHONE_MASK_EMPTY);
      setFileName("");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button className={className} type="button" onClick={openDialog}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className={
          status === "done"
            ? "callback-dialog callback-dialog--thanks"
            : `callback-dialog callback-dialog--${variant}`
        }
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        onClose={() => {
          setStatus("idle");
          setPhone(PHONE_MASK_EMPTY);
          setFileName("");
          setFileError("");
          setContactError("");
        }}
      >
        <button className="callback-dialog__close" type="button" aria-label="Закрыть" onClick={closeDialog}>
          ×
        </button>
        {status === "done" ? (
          <div className="callback-dialog__thanks" role="status">
            <h2 id={titleId}>Спасибо!</h2>
            <p>
              Ваш заказ принят в обработку.
              <br />
              Мы свяжемся с вами в ближайшее время
            </p>
          </div>
        ) : (
          <form className="callback-dialog__form" onSubmit={handleSubmit}>
            {variant === "drawing" ? (
              <>
                <h2 id={titleId}>Загрузить чертёж для расчёта</h2>
                <p className="callback-dialog__legend">Загрузите Эскиз</p>
                <p className="callback-dialog__hint">Можете приложить эскиз jpg, png, gif, doc или xls</p>
                <label className="callback-dialog__pick" htmlFor={`${idPrefix}-file`}>
                  <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
                  Выберите файлы
                </label>
                <input
                  id={`${idPrefix}-file`}
                  className="visually-hidden"
                  name="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/gif"
                  onChange={onFileChange}
                />
                {fileName ? <p className="callback-dialog__filename">{fileName}</p> : null}

                <label className="callback-dialog__option">
                  <input name="delivery" type="checkbox" />
                  Доставка
                </label>
                <label className="callback-dialog__option">
                  <input name="install" type="checkbox" />
                  Установка под ключ
                </label>

                <label htmlFor={`${idPrefix}-note`}>Дополнительная информация</label>
                <textarea id={`${idPrefix}-note`} name="note" rows={2} maxLength={2000} />

                <p className="callback-dialog__legend">Укажите Telegram или телефон</p>
                <label className="callback-dialog__quiet" htmlFor={`${idPrefix}-telegram`}>
                  Telegram
                </label>
                <input
                  id={`${idPrefix}-telegram`}
                  name="telegram"
                  type="text"
                  autoComplete="off"
                  maxLength={64}
                  onChange={() => setContactError("")}
                />
                <label className="callback-dialog__quiet" htmlFor={`${idPrefix}-phone`}>
                  Телефон
                </label>
                <input
                  ref={phoneRef}
                  id={`${idPrefix}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  title="Введите номер полностью"
                  value={phone}
                  onChange={onPhoneChange}
                  onKeyDown={onPhoneKeyDown}
                />
              </>
            ) : (
              <>
                <h2 id={titleId}>Заказать обратный звонок</h2>
                <label htmlFor={`${idPrefix}-name`}>
                  Имя <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${idPrefix}-name`}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                />

                <label htmlFor={`${idPrefix}-phone`}>
                  Телефон <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={phoneRef}
                  id={`${idPrefix}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  pattern="\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}"
                  title="Введите номер полностью"
                  value={phone}
                  onChange={onPhoneChange}
                  onKeyDown={onPhoneKeyDown}
                />

                <p className="callback-dialog__legend">Эскиз</p>
                <p className="callback-dialog__hint">jpg, png, gif, doc или xls</p>
                <label className="callback-dialog__pick" htmlFor={`${idPrefix}-file`}>
                  <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
                  Выберите файлы
                </label>
                <input
                  id={`${idPrefix}-file`}
                  className="visually-hidden"
                  name="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/gif"
                  onChange={onFileChange}
                />
                {fileName ? <p className="callback-dialog__filename">{fileName}</p> : null}

                <label htmlFor={`${idPrefix}-note`}>
                  Дополнительная информация <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id={`${idPrefix}-note`}
                  name="note"
                  rows={1}
                  required
                  maxLength={2000}
                  onChange={(event) => event.currentTarget.setCustomValidity("")}
                />
              </>
            )}

            <div className="field field--trap" aria-hidden="true">
              <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            {variant === "drawing" ? (
              <button className="callback-dialog__submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? leadForm.sending : "Получить расчёт"}
              </button>
            ) : null}

            <div className="consent">
              <input id={`${idPrefix}-consent`} name="consent" type="checkbox" required />
              <label htmlFor={`${idPrefix}-consent`}>
                Нажимая на кнопку, вы даете{" "}
                <Link href="/soglasie">согласие на обработку персональных данных</Link>
              </label>
            </div>

            {variant === "call" ? (
              <button className="callback-dialog__submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? leadForm.sending : "Жду звонка"}
              </button>
            ) : null}
            <p className="callback-dialog__error" role="alert">
              {contactError || fileError || (status === "error" ? leadForm.error : "")}
            </p>
          </form>
        )}
      </dialog>
    </>
  );
}
