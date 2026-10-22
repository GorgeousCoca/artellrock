"use client";

/**
 * Камни одного бренда: легенда форматов, фильтры и карточки.
 * Фильтры живут в состоянии страницы (не в searchParams), чтобы маршрут бренда оставался статическим.
 * Отбор — те же `matchesStoneFilters`, что у калькулятора: без фильтра камень виден всегда,
 * при активном критерии камень без этого поля не проходит.
 */
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { Photo } from "@/components/site/photo";
import { formatRub } from "@/lib/calculator/format";
import {
  collectStoneFilterOptions,
  EMPTY_STONE_FILTERS,
  hasActiveStoneFilters,
  matchesStoneFilters,
  type StoneFilters
} from "@/lib/calculator/material-filters";
import { formatLegendLabel, STONE_FINISHES, type StoneFinish } from "@/lib/calculator/taxonomy";
import type { QuartzCatalogDecor } from "@/lib/catalog/quartz-match";

import styles from "./quartz-brand-catalog.module.scss";

const FINISH_LABEL = Object.fromEntries(STONE_FINISHES.map((finish) => [finish.value, finish.label])) as Record<
  StoneFinish,
  string
>;

type QuartzBrandCatalogProps = {
  brandName: string;
  brandSlug: string;
  decors: QuartzCatalogDecor[];
};

function specChips(decor: QuartzCatalogDecor): string[] {
  const chips: string[] = [];
  for (const mm of decor.thicknessesMm) chips.push(`${mm} мм`);
  for (const shade of decor.shades) chips.push(shade);
  if (decor.finish) chips.push(FINISH_LABEL[decor.finish]);
  for (const texture of decor.textures) chips.push(texture);
  return chips;
}

export function QuartzBrandCatalog({ brandName, brandSlug, decors }: QuartzBrandCatalogProps) {
  const baseId = useId();
  const [filters, setFilters] = useState<StoneFilters>(EMPTY_STONE_FILTERS);

  const options = useMemo(() => collectStoneFilterOptions(decors), [decors]);
  const legend = options.formats.map((format) => formatLegendLabel(format));
  const filtered = useMemo(
    () => decors.filter((decor) => matchesStoneFilters(decor, filters)),
    [decors, filters]
  );
  const filtersOn = hasActiveStoneFilters(filters);

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
      value: filters.format ?? "",
      options: options.formats.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, format: options.formats.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-thickness`,
      label: "Толщина",
      anyLabel: "Любая",
      value: filters.thicknessMm == null ? "" : String(filters.thicknessMm),
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
      value: filters.shade ?? "",
      options: options.shades.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, shade: options.shades.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-finish`,
      label: "Полировка",
      anyLabel: "Любая",
      value: filters.finish ?? "",
      options: options.finishes.map((value) => ({ value, label: FINISH_LABEL[value] })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, finish: options.finishes.find((item) => item === value) ?? null }))
    },
    {
      id: `${baseId}-texture`,
      label: "Фактура",
      anyLabel: "Любая",
      value: filters.texture ?? "",
      options: options.textures.map((value) => ({ value, label: value })),
      onChange: (value) =>
        setFilters((prev) => ({ ...prev, texture: options.textures.find((item) => item === value) ?? null }))
    }
  ];

  return (
    <>
      <div className={styles.panel}>
        {legend.length > 0 ? (
          <ul className={styles.legend} aria-label="Форматы плит">
            {legend.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        <div className={styles.filters}>
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
          {filtersOn ? (
            <button type="button" className={styles.reset} onClick={() => setFilters(EMPTY_STONE_FILTERS)}>
              Сбросить фильтры
            </button>
          ) : null}
        </div>

        <p className={styles.count} role="status" aria-live="polite">
          Найдено: {filtered.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {decors.length === 0
            ? "В каталоге этого бренда нет декоров с ценой."
            : "По этим условиям ничего нет. Измените фильтры или сбросьте их."}
        </p>
      ) : (
        <ul className={`card-grid ${styles.grid}`}>
          {filtered.map((decor) => {
            const chips = specChips(decor);
            return (
              <li key={decor.slug ?? decor.image} className="card decor-card">
                <div className="card__media">
                  <Photo
                    src={decor.image}
                    alt={`${brandName} ${decor.name}`}
                    sizes="(max-width: 570px) 100vw, (max-width: 1000px) 50vw, 33vw"
                  />
                </div>
                <div className="card__body">
                  <h3 className="t-tagline">
                    {decor.slug ? (
                      <Link className="card__link" href={`/catalog-kvarca/${brandSlug}/${decor.slug}`}>
                        {brandName} {decor.name}
                      </Link>
                    ) : (
                      <>
                        {brandName} {decor.name}
                      </>
                    )}
                  </h3>
                  {decor.sku ? <p className={styles.sku}>Артикул {decor.sku}</p> : null}
                  <p className={styles.price}>
                    {decor.price != null ? `${formatRub(decor.price)} / м²` : "Цена по запросу"}
                  </p>
                  {decor.formats.length > 0 ? (
                    <ul className={styles.tags} aria-label="Форматы">
                      {decor.formats.map((format) => (
                        <li key={format}>[{format}]</li>
                      ))}
                    </ul>
                  ) : null}
                  {chips.length > 0 ? (
                    <ul className={styles.chips}>
                      {chips.map((chip, index) => (
                        <li key={`${index}-${chip}`}>{chip}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
