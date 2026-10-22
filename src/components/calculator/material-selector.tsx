"use client";

/**
 * Шаг 2 «Материал»: каталог декоров с фильтрами.
 *
 * Данные: один запрос к `/api/calculator/materials` (лёгкие записи из Payload через кэш с тегами) при первом
 * открытии шага. Дальше отбор идёт на клиенте: бренд слева, поиск и характеристики сверху. Легенда и варианты
 * фильтров — только то, что реально есть у камней текущего бренда. Цена на карточке — справочная; стоимость
 * заказа считает сервер. Выбор камня живёт в состоянии мастера и не сбрасывается, если карточка ушла из выборки.
 */
import { useEffect, useId, useMemo, useState } from "react";

import { Photo } from "@/components/site/photo";
import { formatRub } from "@/lib/calculator/format";
import {
  collectStoneFilterOptions,
  EMPTY_STONE_FILTERS,
  hasActiveStoneFilters,
  matchesStoneFilters,
  type StoneFilters
} from "@/lib/calculator/material-filters";
import { formatLegendLabel, STONE_FINISHES, STONE_FORMATS, type StoneFinish, type StoneFormat } from "@/lib/calculator/taxonomy";
import type { MaterialCard } from "@/lib/calculator/types";

import { useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";
import { useFocusVisibleKey } from "./focus-visible";

type Load =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; materials: MaterialCard[] };

type FocusKey = ReturnType<typeof useFocusVisibleKey>;

/** Один запрос на сессию страницы: повторный вход на шаг не перекачивает каталог. */
let catalogRequest: Promise<MaterialCard[]> | null = null;

function loadMaterials(): Promise<MaterialCard[]> {
  catalogRequest ??= fetch("/api/calculator/materials")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<{ materials: MaterialCard[] }>;
    })
    .then((data) => data.materials)
    .catch((error) => {
      catalogRequest = null; // следующая попытка пойдёт заново
      throw error;
    });
  return catalogRequest;
}

const PAGE_SIZE = 36;
const collator = new Intl.Collator("ru");
const FORMAT_ORDER = STONE_FORMATS.map((item) => item.value);

/** «Полированный» / «Матовый» — подпись фактуры поверхности на карточке и в фильтре. */
function finishLabel(finish: StoneFinish): string {
  const label = STONE_FINISHES.find((item) => item.value === finish)?.label ?? finish;
  return label.charAt(0).toLocaleUpperCase("ru") + label.slice(1);
}

function orderedFormats(formats: readonly StoneFormat[]): StoneFormat[] {
  return FORMAT_ORDER.filter((value) => formats.includes(value));
}

/** Толщины одной строкой («20/30 мм»), дальше только заполненные оттенок, полировка и фактура. */
function specChips(material: MaterialCard): string[] {
  const chips: string[] = [];
  if (material.thicknessesMm.length > 0) {
    const thicknesses = [...new Set(material.thicknessesMm)].sort((a, b) => a - b);
    chips.push(`${thicknesses.join("/")} мм`);
  }
  for (const shade of material.shades) chips.push(shade);
  if (material.finish) chips.push(finishLabel(material.finish));
  for (const texture of material.textures) chips.push(texture);
  return chips;
}

/**
 * Выбранное значение, которого нет у камней текущего бренда, не применяется (как раньше оттенок и фактура),
 * но остаётся в состоянии: возврат к бренду, где оно есть, снова сузит список.
 */
function applicableFilters(
  filters: StoneFilters,
  options: ReturnType<typeof collectStoneFilterOptions>
): StoneFilters {
  return {
    format: filters.format !== null && options.formats.includes(filters.format) ? filters.format : null,
    thicknessMm:
      filters.thicknessMm !== null && options.thicknessesMm.includes(filters.thicknessMm) ? filters.thicknessMm : null,
    shade: filters.shade !== null && options.shades.includes(filters.shade) ? filters.shade : null,
    finish: filters.finish !== null && options.finishes.includes(filters.finish) ? filters.finish : null,
    texture: filters.texture !== null && options.textures.includes(filters.texture) ? filters.texture : null
  };
}

function StoneCard({
  material,
  selected,
  focus,
  onSelect
}: {
  material: MaterialCard;
  selected: boolean;
  focus: FocusKey;
  onSelect: () => void;
}) {
  const formats = orderedFormats(material.formats);
  const chips = specChips(material);

  return (
    <li>
      <label className={styles.materialCard} data-selected={selected ? "true" : undefined} data-focus-visible={focus.attr(material.id)}>
        <input
          type="radio"
          name="material"
          className="visually-hidden"
          checked={selected}
          onChange={onSelect}
          {...focus.handlers(material.id)}
        />
        <span className={styles.materialMedia}>
          {material.image ? (
            <Photo src={material.image} alt="" sizes="(max-width: 570px) 46vw, (max-width: 1000px) 22vw, 180px" />
          ) : null}
          <span className={styles.check} aria-hidden="true" />
        </span>
        <span className={styles.materialBrand}>{material.brand}</span>
        <span className={styles.materialName}>{material.name}</span>
        {material.sku ? <span className={styles.materialSku}>арт. {material.sku}</span> : null}
        <span className={styles.materialPrice}>{formatRub(material.pricePerSqm)} / м²</span>
        {formats.length > 0 ? (
          <ul className={styles.formatTags} aria-label="Форматы">
            {formats.map((format) => (
              <li key={format}>[{format}]</li>
            ))}
          </ul>
        ) : null}
        {chips.length > 0 ? (
          <ul className={styles.specChips}>
            {chips.map((chip, index) => (
              <li key={`${index}-${chip}`}>{chip}</li>
            ))}
          </ul>
        ) : null}
      </label>
    </li>
  );
}

export function MaterialSelector() {
  const { state, dispatch } = useCalculator();
  const focus = useFocusVisibleKey();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const [brand, setBrand] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<StoneFilters>(EMPTY_STONE_FILTERS);
  const [visible, setVisible] = useState({ signature: "", count: PAGE_SIZE });

  const baseId = useId();
  const searchId = `${baseId}-search`;

  useEffect(() => {
    let cancelled = false;
    loadMaterials()
      .then((materials) => !cancelled && setLoad({ status: "ready", materials }))
      .catch(() => !cancelled && setLoad({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const materials = useMemo(() => (load.status === "ready" ? load.materials : []), [load]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of materials) counts.set(m.brand, (counts.get(m.brand) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => collator.compare(a[0], b[0]));
  }, [materials]);

  const inBrand = useMemo(() => (brand ? materials.filter((m) => m.brand === brand) : materials), [brand, materials]);
  const options = useMemo(() => collectStoneFilterOptions(inBrand), [inBrand]);
  const activeFilters = useMemo(() => applicableFilters(filters, options), [filters, options]);
  const legend = options.formats.map((format) => formatLegendLabel(format));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inBrand.filter(
      (material) =>
        matchesStoneFilters(material, activeFilters) &&
        (!needle || `${material.name} ${material.sku ?? ""} ${material.brand}`.toLowerCase().includes(needle))
    );
  }, [activeFilters, inBrand, query]);

  // «Показать ещё» сбрасывается при смене фильтров без эффекта: счётчик привязан к подписи фильтров.
  const signature = `${brand}|${query}|${activeFilters.format ?? ""}|${activeFilters.thicknessMm ?? ""}|${activeFilters.shade ?? ""}|${activeFilters.finish ?? ""}|${activeFilters.texture ?? ""}`;
  const shown = visible.signature === signature ? visible.count : PAGE_SIZE;
  const specsOn = hasActiveStoneFilters(activeFilters);
  const selectedMaterial = state.material;
  const kept =
    selectedMaterial && !filtered.some((item) => item.id === selectedMaterial.id) ? selectedMaterial : null;

  function resetSpecs() {
    setFilters(EMPTY_STONE_FILTERS);
  }

  function resetResults() {
    setFilters(EMPTY_STONE_FILTERS);
    setQuery("");
  }

  function selectMaterial(material: MaterialCard) {
    dispatch({ type: "material/select", material });
  }

  const fields: Array<{
    id: string;
    label: string;
    anyLabel: string;
    value: string;
    options: ReadonlyArray<{ value: string; label: string }>;
    onChange: (value: string) => void;
  }> = [
    {
      id: `${baseId}-format`,
      label: "Формат",
      anyLabel: "Любой",
      value: activeFilters.format ?? "",
      options: options.formats.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, format: options.formats.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-thickness`,
      label: "Толщина",
      anyLabel: "Любая",
      value: activeFilters.thicknessMm === null ? "" : String(activeFilters.thicknessMm),
      options: options.thicknessesMm.map((mm) => ({ value: String(mm), label: `${mm} мм` })),
      onChange: (value) =>
        setFilters((prev) => ({
          ...prev,
          thicknessMm: options.thicknessesMm.find((mm) => String(mm) === value) ?? null
        }))
    },
    {
      id: `${baseId}-shade`,
      label: "Оттенок",
      anyLabel: "Любой",
      value: activeFilters.shade ?? "",
      options: options.shades.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, shade: options.shades.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-finish`,
      label: "Полировка",
      anyLabel: "Любая",
      value: activeFilters.finish ?? "",
      options: options.finishes.map((value) => ({ value, label: finishLabel(value) })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, finish: options.finishes.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-texture`,
      label: "Фактура",
      anyLabel: "Любая",
      value: activeFilters.texture ?? "",
      options: options.textures.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, texture: options.textures.find((item) => item === value) ?? null }))
    }
  ];

  return (
    <section className={styles.step} aria-labelledby="material-title">
      <h2 id="material-title" className="t-tagline">
        Выберите материал
      </h2>
      <p className={styles.stepLead}>Кварцевый агломерат. Цена указана за квадратный метр; итог рассчитывается по площади ваших изделий.</p>

      {load.status === "loading" ? (
        <p className={styles.notice} role="status">
          Загружаем каталог…
        </p>
      ) : null}

      {load.status === "error" ? (
        <div className={styles.notice} role="alert">
          <p>Не удалось загрузить каталог материалов.</p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setLoad({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Повторить
          </button>
        </div>
      ) : null}

      {load.status === "ready" && materials.length === 0 ? (
        <p className={styles.notice} role="status">
          Каталог материалов пока пуст. Оставьте заявку — подберём декор вместе.
        </p>
      ) : null}

      {materials.length > 0 ? (
        <div className={styles.materialLayout}>
          <nav className={styles.brandList} aria-label="Бренды">
            <button type="button" aria-pressed={brand === ""} onClick={() => setBrand("")}>
              Все бренды <small>{materials.length}</small>
            </button>
            {brands.map(([name, count]) => (
              <button key={name} type="button" aria-pressed={brand === name} onClick={() => setBrand(name)}>
                {name} <small>{count}</small>
              </button>
            ))}
          </nav>

          <div className={styles.materialMain}>
            <div className={styles.filters}>
              <div className={`${styles.filter} ${styles.filterSearch}`}>
                <label htmlFor={searchId}>Поиск</label>
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  placeholder="Название или артикул"
                  autoComplete="off"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            {legend.length > 0 ? (
              <ul className={styles.formatLegend} aria-label="Форматы плит">
                {legend.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}

            <div className={styles.filters} role="group" aria-label="Характеристики камня">
              {fields.map((field) => (
                <div key={field.id} className={styles.filter}>
                  <label htmlFor={field.id}>{field.label}</label>
                  <select id={field.id} value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                    <option value="">{field.anyLabel}</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {specsOn ? (
                <button type="button" className={`text-link ${styles.resetFilters}`} onClick={resetSpecs}>
                  Сбросить
                </button>
              ) : null}
            </div>

            <p className={styles.resultCount} role="status" aria-live="polite">
              Найдено: {filtered.length}
            </p>

            {kept ? (
              <div className={styles.keptSelection}>
                <p>Выбранный камень сохранён: его нет в этой выборке.</p>
                <ul className={styles.materialGrid}>
                  <StoneCard material={kept} selected focus={focus} onSelect={() => selectMaterial(kept)} />
                </ul>
              </div>
            ) : null}

            {filtered.length === 0 ? (
              <div className={styles.notice}>
                <p>По этим условиям ничего нет. Измените фильтры или сбросьте их.</p>
                <button type="button" className="btn btn--secondary" onClick={resetResults}>
                  Сбросить
                </button>
              </div>
            ) : (
              <ul className={styles.materialGrid}>
                {filtered.slice(0, shown).map((material) => (
                  <StoneCard
                    key={material.id}
                    material={material}
                    selected={selectedMaterial?.id === material.id}
                    focus={focus}
                    onSelect={() => selectMaterial(material)}
                  />
                ))}
              </ul>
            )}

            {filtered.length > shown ? (
              <button
                type="button"
                className={`btn btn--secondary ${styles.showMore}`}
                onClick={() => setVisible({ signature, count: shown + PAGE_SIZE })}
              >
                Показать ещё ({Math.min(PAGE_SIZE, filtered.length - shown)})
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
