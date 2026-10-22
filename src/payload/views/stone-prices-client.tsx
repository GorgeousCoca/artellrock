"use client";

/**
 * «Цены на камни»: таблица камней выбранного бренда с ценой за м², переключателем «Показывать в калькуляторе»,
 * поиском, пакетными действиями и сводкой перед сохранением.
 *
 * Принципы:
 *  - правки хранятся как черновики и НЕ уходят на сервер, пока человек не подтвердит сводку;
 *  - пакетные действия («±N%», «округлить») меняют только черновики в таблице;
 *  - сохранение — один запрос `POST /api/materials/bulk-prices`: всё или ничего, чужая правка (updatedAt) —
 *    ошибка у строки, а не молчаливая перезапись; логика и проверки — в `lib/calculator/stone-prices.ts`.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { formatRub } from "../../lib/calculator/format";
import {
  parsePercent,
  parsePriceAmount,
  parsePriceInput,
  PERCENT_MAX,
  PERCENT_MIN,
  priceInputError,
  roundPrice,
  ROUND_STEPS,
  scalePrice,
  summarizeChanges,
  type PriceEdit,
  type RoundStep
} from "../../lib/calculator/stone-prices";
import styles from "./stone-prices.module.scss";

type Row = {
  id: number;
  brand: string;
  sku: string;
  name: string;
  sortOrder: number;
  pricePerSqm: number;
  isActive: boolean;
  updatedAt: string;
};

/** Правка строки: текст цены (пока человек печатает, он может быть неполным) и переключатель. */
type Draft = { price: string; active: boolean };

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };
type Banner = { kind: "success" | "error" | "info"; text: string } | null;

const COLLATOR = new Intl.Collator("ru");
const SELECT = ["brand", "sku", "name", "sortOrder", "pricePerSqm", "isActive", "updatedAt"]
  .map((field) => `select[${field}]=true`)
  .join("&");

async function fetchRows(): Promise<Row[]> {
  const response = await fetch(`/api/materials?limit=2000&depth=0&${SELECT}`, { credentials: "same-origin" });
  if (response.status === 401 || response.status === 403) throw new Error("Нужно войти в админку.");
  if (!response.ok) throw new Error(`Сервер ответил ${response.status}.`);
  const data = (await response.json()) as { docs: Array<Partial<Row> & { id: number }> };
  return data.docs.map((doc) => ({
    id: doc.id,
    brand: doc.brand ?? "",
    sku: doc.sku ?? "",
    name: doc.name ?? "",
    sortOrder: doc.sortOrder ?? 0,
    pricePerSqm: doc.pricePerSqm ?? 0,
    isActive: Boolean(doc.isActive),
    updatedAt: doc.updatedAt ?? ""
  }));
}

const labelOf = (row: Pick<Row, "sku" | "name">) => [row.sku, row.name].filter(Boolean).join(" ");

/** «у 1 позиции», «у 2 позиций»: родительный падеж после «у». */
const positions = (count: number) => (count % 10 === 1 && count % 100 !== 11 ? "позиции" : "позиций");

const formatPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;

/** Итоговое состояние строки с учётом черновика. */
function resolve(row: Row, draft: Draft | undefined) {
  const text = draft?.price ?? String(row.pricePerSqm);
  const price = parsePriceInput(text);
  const toggle = draft?.active ?? row.isActive;
  const active = price !== null && price > 0 && toggle;
  const dirty = draft !== undefined && (price === null || price !== row.pricePerSqm || active !== row.isActive);
  return { text, price, toggle, active, dirty, invalid: price === null };
}

export function StonePricesClient() {
  const ids = useId();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [brand, setBrand] = useState("");
  const [query, setQuery] = useState("");
  const [percent, setPercent] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRows()
      .then((loaded) => {
        if (cancelled) return;
        setRows(loaded);
        setLoad({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoad({ status: "error", message: error instanceof Error ? error.message : "Не удалось загрузить." });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Модальное окно сводки — нативный <dialog>: фокус внутри, Esc закрывает, фон недоступен.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const byBrand = useMemo(() => {
    const groups = new Map<string, Row[]>();
    for (const row of rows) groups.set(row.brand, [...(groups.get(row.brand) ?? []), row]);
    for (const list of groups.values()) list.sort((a, b) => a.sortOrder - b.sortOrder || COLLATOR.compare(a.name, b.name));
    return new Map([...groups.entries()].sort((a, b) => COLLATOR.compare(a[0], b[0])));
  }, [rows]);

  const brands = [...byBrand.keys()];
  const activeBrand = byBrand.has(brand) ? brand : (brands[0] ?? "");
  const brandRows = useMemo(() => byBrand.get(activeBrand) ?? [], [byBrand, activeBrand]);

  const needle = query.trim().toLowerCase();
  const visible = needle ? brandRows.filter((row) => `${row.sku} ${row.name}`.toLowerCase().includes(needle)) : brandRows;

  // Все правки по всем брендам: переключение бренда их не теряет.
  const dirtyRows = useMemo(() => rows.filter((row) => resolve(row, drafts[row.id]).dirty), [rows, drafts]);
  const invalidRows = dirtyRows.filter((row) => resolve(row, drafts[row.id]).invalid);
  const dirtyByBrand = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of dirtyRows) counts.set(row.brand, (counts.get(row.brand) ?? 0) + 1);
    return counts;
  }, [dirtyRows]);

  const edits: PriceEdit[] = useMemo(
    () =>
      dirtyRows.flatMap((row) => {
        const state = resolve(row, drafts[row.id]);
        return state.price === null
          ? []
          : [{ id: row.id, label: `${row.brand} ${labelOf(row)}`, oldPrice: row.pricePerSqm, newPrice: state.price, oldActive: row.isActive, newActive: state.toggle }];
      }),
    [dirtyRows, drafts]
  );
  const summary = useMemo(() => summarizeChanges(edits), [edits]);
  const needsAcknowledgement = summary.large.length > 0 || summary.zeroed.length > 0;

  // Незакрытые правки: браузер предупредит при закрытии вкладки.
  useEffect(() => {
    if (dirtyRows.length === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyRows.length]);

  function editRow(row: Row, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const current = prev[row.id] ?? { price: String(row.pricePerSqm), active: row.isActive };
      return { ...prev, [row.id]: { ...current, ...patch } };
    });
    // Ошибка строки (например, конфликт) относится к старому значению: после правки её убираем.
    setRowErrors((prev) => (row.id in prev ? Object.fromEntries(Object.entries(prev).filter(([id]) => Number(id) !== row.id)) : prev));
    setBanner(null);
  }

  /** Пакетное действие над ВСЕМИ камнями выбранного бренда (не только найденными поиском). */
  function applyToBrand(label: string, operation: (price: number) => number) {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of brandRows) {
        const state = resolve(row, prev[row.id]);
        const base = state.price ?? parsePriceAmount(state.text) ?? row.pricePerSqm;
        next[row.id] = { price: String(operation(base)), active: state.toggle };
      }
      return next;
    });
    setBanner({
      kind: "info",
      text: `${label}: бренд «${activeBrand}». Значения в таблице изменены, но ещё не сохранены. Проверьте их и нажмите «Сохранить».`
    });
  }

  const percentValue = parsePercent(percent);

  function discard() {
    setDrafts({});
    setRowErrors({});
    setBanner({ kind: "info", text: "Несохранённые правки отменены." });
  }

  function reload() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  async function save() {
    setSaving(true);
    setBanner(null);
    try {
      const response = await fetch("/api/materials/bulk-prices", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: dirtyRows.map((row) => {
            const state = resolve(row, drafts[row.id]);
            return { id: row.id, pricePerSqm: state.price, isActive: state.toggle, updatedAt: row.updatedAt };
          })
        })
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        summary?: { updated: number; deactivated: number };
        rows?: Array<{ id: number; pricePerSqm: number; isActive: boolean; updatedAt: string }>;
        errors?: Array<{ id: number; message: string }>;
      };

      if (response.ok && data.ok) {
        const saved = new Map((data.rows ?? []).map((row) => [row.id, row]));
        setRows((prev) => prev.map((row) => ({ ...row, ...(saved.get(row.id) ?? {}) })));
        setDrafts({});
        setRowErrors({});
        setConfirmOpen(false);
        setBanner({
          kind: "success",
          text: `Сохранено: ${data.summary?.updated ?? saved.size}. ${
            data.summary?.deactivated ? `Выключено из калькулятора (цена 0): ${data.summary.deactivated}. ` : ""
          }Каталог калькулятора на сайте уже обновлён.`
        });
        return;
      }

      setConfirmOpen(false);
      if (response.status === 401) {
        setBanner({ kind: "error", text: "Сессия истекла. Войдите в админку заново; несохранённые правки останутся на странице, пока вы её не закроете." });
      } else if (data.errors?.length) {
        setRowErrors(Object.fromEntries(data.errors.map((error) => [error.id, error.message])));
        setBanner({ kind: "error", text: `${data.error ?? "Не удалось сохранить."} Строки с ошибками отмечены в таблице.` });
        // Бренд первой проблемной строки — чтобы ошибка была видна сразу.
        const first = rows.find((row) => row.id === data.errors?.[0]?.id);
        if (first) setBrand(first.brand);
      } else {
        setBanner({ kind: "error", text: data.error ?? `Не удалось сохранить (ответ сервера ${response.status}).` });
      }
    } catch {
      setConfirmOpen(false);
      setBanner({ kind: "error", text: "Нет связи с сервером. Ничего не сохранено, повторите позже." });
    } finally {
      setSaving(false);
    }
  }

  /** После конфликта: подтянуть актуальные данные, сохранив правки в строках без конфликта. */
  function refreshAfterConflict() {
    setDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !(Number(id) in rowErrors))));
    setRowErrors({});
    setBanner(null);
    reload();
  }

  const hasRowErrors = Object.keys(rowErrors).length > 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Цены на камни</h1>
      <p className={styles.lead}>
        Цена за м² — единственный источник стоимости камня в калькуляторе: клиенту показывается эта точная цена.
        Цена кратна 250 ₽. Изменения вступают в силу только после «Сохранить» и подтверждения сводки. Цена 0 выключает камень из калькулятора.
      </p>

      {load.status === "loading" ? <p role="status">Загружаем материалы…</p> : null}
      {load.status === "error" ? (
        <div role="alert" className={styles.banner} data-kind="error">
          <p>Не удалось загрузить материалы. {load.message}</p>
          <button type="button" className={styles.button} onClick={reload}>
            Повторить
          </button>
        </div>
      ) : null}

      {load.status === "ready" ? (
        <>
          <nav aria-label="Бренды" className={styles.brands}>
            {brands.map((name) => {
              const dirty = dirtyByBrand.get(name) ?? 0;
              return (
                <button
                  key={name}
                  type="button"
                  className={styles.brandButton}
                  aria-pressed={name === activeBrand}
                  onClick={() => {
                    setBrand(name);
                    setQuery("");
                  }}
                >
                  {name} <small>{byBrand.get(name)?.length}</small>
                  {dirty > 0 ? (
                    <span className={styles.dot} title={`Несохранённых правок: ${dirty}`}>
                      <span className={styles.srOnly}>, несохранённых правок: {dirty}</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className={styles.toolbar} role="group" aria-label={`Пакетные действия для бренда ${activeBrand}`}>
            <div className={styles.field}>
              <label htmlFor={`${ids}-search`}>Поиск по артикулу и названию</label>
              <input
                id={`${ids}-search`}
                type="search"
                value={query}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={`${ids}-percent`}>Изменить все цены бренда на, %</label>
              <div className={styles.inline}>
                <input
                  id={`${ids}-percent`}
                  type="text"
                  inputMode="decimal"
                  placeholder="например 5 или -3,5"
                  value={percent}
                  aria-invalid={percent !== "" && percentValue === null ? true : undefined}
                  aria-describedby={`${ids}-percent-note`}
                  onChange={(event) => setPercent(event.target.value)}
                />
                <button
                  type="button"
                  className={styles.button}
                  disabled={percentValue === null || percentValue === 0}
                  onClick={() => percentValue !== null && applyToBrand(`Цены изменены на ${formatPercent(percentValue)}`, (price) => scalePrice(price, percentValue))}
                >
                  Применить
                </button>
              </div>
              <small id={`${ids}-percent-note`} className={percent !== "" && percentValue === null ? styles.errorText : styles.note}>
                {percent !== "" && percentValue === null
                  ? `Число от ${PERCENT_MIN} до ${PERCENT_MAX}`
                  : "Результат округляется до 250 ₽. В таблице, не на сервере."}
              </small>
            </div>

            <div className={styles.field}>
              <span id={`${ids}-round`}>Округлить все цены бренда</span>
              <div className={styles.inline} role="group" aria-labelledby={`${ids}-round`}>
                {ROUND_STEPS.map((step: RoundStep) => (
                  <button
                    key={step}
                    type="button"
                    className={styles.button}
                    onClick={() => applyToBrand(`Цены округлены до ${step.toLocaleString("ru-RU")} ₽`, (price) => roundPrice(price, step))}
                  >
                    до {step.toLocaleString("ru-RU")} ₽
                  </button>
                ))}
              </div>
            </div>
          </div>

          {banner ? (
            <div role={banner.kind === "error" ? "alert" : "status"} className={styles.banner} data-kind={banner.kind}>
              {banner.text}
              {hasRowErrors ? (
                <>
                  {" "}
                  <button type="button" className={styles.button} onClick={refreshAfterConflict}>
                    Загрузить актуальные данные
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          <div className={styles.actions}>
            <p className={styles.dirtyState} role="status" data-dirty={dirtyRows.length > 0 ? "true" : undefined}>
              {dirtyRows.length > 0 ? `Несохранённые правки: ${dirtyRows.length}` : "Несохранённых правок нет"}
              {invalidRows.length > 0 ? ` (с ошибками: ${invalidRows.length})` : ""}
            </p>
            <button type="button" className={styles.button} disabled={dirtyRows.length === 0 || saving} onClick={discard}>
              Отменить правки
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={dirtyRows.length === 0 || invalidRows.length > 0 || saving}
              onClick={() => {
                setAcknowledged(false);
                setConfirmOpen(true);
              }}
            >
              Сохранить{dirtyRows.length > 0 ? ` (${dirtyRows.length})` : ""}
            </button>
          </div>

          <p className={styles.count} role="status" aria-live="polite">
            Бренд «{activeBrand}»: показано {visible.length} из {brandRows.length}
          </p>

          {visible.length === 0 ? (
            <p>По запросу ничего не найдено.</p>
          ) : (
            <table className={styles.table}>
              <caption className={styles.srOnly}>Цены камней бренда {activeBrand}</caption>
              <thead>
                <tr>
                  <th scope="col">Артикул</th>
                  <th scope="col">Название</th>
                  <th scope="col">Цена, ₽/м²</th>
                  <th scope="col">Показывать в калькуляторе</th>
                  <th scope="col">Изменение</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const state = resolve(row, drafts[row.id]);
                  const serverError = rowErrors[row.id];
                  const errorId = `${ids}-error-${row.id}`;
                  const hasError = state.invalid || Boolean(serverError);
                  const delta = state.price !== null && state.price !== row.pricePerSqm ? state.price - row.pricePerSqm : null;
                  const pct = state.price !== null && row.pricePerSqm > 0 && delta !== null ? (delta / row.pricePerSqm) * 100 : null;
                  return (
                    <tr key={row.id} data-changed={state.dirty ? "true" : undefined} data-error={hasError ? "true" : undefined}>
                      <td>{row.sku || "—"}</td>
                      <th scope="row" className={styles.nameCell}>
                        {row.name}
                      </th>
                      <td>
                        <input
                          className={styles.priceInput}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label={`Цена за м², ₽: ${labelOf(row)}`}
                          aria-invalid={hasError ? true : undefined}
                          aria-describedby={hasError ? errorId : undefined}
                          value={state.text}
                          onChange={(event) => editRow(row, { price: event.target.value })}
                        />
                        {hasError ? (
                          <span id={errorId} className={styles.errorText}>
                            {serverError ?? priceInputError(state.text)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={state.active}
                            disabled={state.price === 0}
                            onChange={(event) => editRow(row, { active: event.target.checked })}
                          />
                          <span className={styles.srOnly}>Показывать в калькуляторе: {labelOf(row)}</span>
                          <span aria-hidden="true">{state.price === 0 ? "выкл (цена 0)" : state.active ? "да" : "нет"}</span>
                        </label>
                      </td>
                      <td className={styles.deltaCell}>
                        {state.dirty ? (
                          <>
                            <span className={styles.srOnly}>Изменено. </span>
                            {delta !== null ? (
                              <>
                                было {formatRub(row.pricePerSqm)}
                                {pct !== null ? ` (${formatPercent(pct)})` : ""}
                              </>
                            ) : row.isActive !== state.active ? (
                              state.active ? "будет показываться" : "будет скрыт"
                            ) : (
                              "изменено"
                            )}
                          </>
                        ) : (
                          <span className={styles.srOnly}>Без изменений</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={`${ids}-dialog-title`}
        onClose={() => setConfirmOpen(false)}
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        <h2 id={`${ids}-dialog-title`}>Сохранить изменения цен?</h2>
        <ul className={styles.summaryList}>
          <li>Цен изменится: {summary.priceChanges}</li>
          {summary.activeOnlyChanges > 0 ? <li>Только переключатель: {summary.activeOnlyChanges}</li> : null}
          {summary.willShow.length > 0 ? <li>Начнут показываться в калькуляторе: {summary.willShow.length}</li> : null}
          {summary.willHide.length > 0 ? <li>Перестанут показываться в калькуляторе: {summary.willHide.length}</li> : null}
        </ul>

        {summary.biggest.length > 0 ? (
          <>
            <h3>Самые большие изменения</h3>
            <ul className={styles.summaryList}>
              {summary.biggest.map((entry) => (
                <li key={entry.id}>
                  {entry.label}: {formatRub(entry.oldPrice)} → {formatRub(entry.newPrice)}
                  {entry.percent !== null ? ` (${formatPercent(entry.percent)})` : " (новая цена)"}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {summary.large.length > 0 ? (
          <p className={styles.warning} role="alert">
            Внимание: у {summary.large.length} {positions(summary.large.length)} цена меняется больше чем на 30%. Проверьте, что это не опечатка.
          </p>
        ) : null}
        {summary.zeroed.length > 0 ? (
          <p className={styles.warning} role="alert">
            Внимание: у {summary.zeroed.length} {positions(summary.zeroed.length)} цена станет 0 — они автоматически исчезнут из калькулятора:{" "}
            {summary.zeroed
              .slice(0, 5)
              .map((entry) => entry.label)
              .join(", ")}
            {summary.zeroed.length > 5 ? " и др." : ""}.
          </p>
        ) : null}

        {needsAcknowledgement ? (
          <label className={styles.acknowledge}>
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
            Я проверил(а) большие изменения и нули — сохранить
          </label>
        ) : null}

        <div className={styles.dialogActions}>
          <button type="button" className={styles.button} disabled={saving} onClick={() => setConfirmOpen(false)}>
            Назад
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={saving || (needsAcknowledgement && !acknowledged)}
            aria-busy={saving || undefined}
            onClick={save}
          >
            {saving ? "Сохраняем…" : "Сохранить цены"}
          </button>
        </div>
      </dialog>
    </div>
  );
}