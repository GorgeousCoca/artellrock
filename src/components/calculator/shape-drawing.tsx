"use client";

/**
 * Шаг 1 «Размер»: форма изделия, размеры на чертеже, скругление углов и список изделий.
 *
 * Двусторонняя связь с состоянием формы:
 *  - поля на размерных линиях, ручки на чертеже и общее поле «R» пишут в один и тот же редьюсер;
 *  - чертёж всегда рисуется из состояния, поэтому «разъехаться» с полями он не может.
 */
import { useId } from "react";

import { formatQuantity } from "@/lib/calculator/format";
import {
  buildOutline,
  defaultDimensions,
  maxCornerRadius,
  SHAPES,
  shapeLabel,
  viewBoxFor,
  type ShapeKind
} from "@/lib/calculator/geometry";
import { measureInput } from "@/lib/calculator/estimate";
import { MAX_ITEMS } from "@/lib/calculator/schema";

import { useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";
import { useFocusVisibleKey } from "./focus-visible";
import { NumberField } from "./number-field";
import { ShapeCanvas } from "./shape-canvas";
import { bboxArea, StonePattern, svgSafeId } from "./stone-pattern";

/** Превью формы по размерам по умолчанию — из той же геометрии, что и чертёж, с каменной заливкой. */
function ShapePreview({ shape }: { shape: ShapeKind }) {
  const patternId = svgSafeId(useId());
  const outline = buildOutline(shape, defaultDimensions(shape));
  const view = viewBoxFor(outline.bbox, 0.06);
  const unit = Math.max(view.width, view.height) / 100;

  return (
    <svg
      className={styles.shapePreview}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <StonePattern id={patternId} area={bboxArea(outline.bbox)} />
      </defs>
      <path d={outline.path} fill={`url(#${patternId})`} strokeWidth={0.8 * unit} />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShapeDrawing() {
  const { state, dispatch, itemErrors, geometryValid } = useCalculator();
  const groupId = useId();
  const focus = useFocusVisibleKey();

  const item = state.items.find((i) => i.id === state.activeId) ?? state.items[0];
  const itemNumber = state.items.indexOf(item) + 1;
  const errors = itemErrors[item.id] ?? {};
  const itemValid = Object.keys(errors).length === 0;
  // Площадь считаем только для корректной геометрии: при ошибке в поле формулам верить нельзя.
  const totalArea = geometryValid ? measureInput(state.items).areaSqm : null;
  const itemArea = itemValid ? measureInput([item]).areaSqm : null;

  // Радиус ограничен самым тесным из отмеченных углов; пока ничего не отмечено — самым тесным из всех.
  const selectedCount = item.roundedCorners.length;
  const dimsValid = Object.keys(errors).every((key) => key === "cornerRadius" || key === "roundedCorners" || key === "sides");
  const maxRadius = dimsValid
    ? maxCornerRadius(item.shape, item.dims, selectedCount > 0 ? item.roundedCorners : undefined)
    : 0;
  const radiusHint =
    selectedCount === 0
      ? "Отметьте углы «R» на чертеже — скруглятся только они"
      : `Отмечено углов: ${selectedCount}${maxRadius > 0 ? `, радиус до ${maxRadius} мм` : ""}`;

  return (
    <section className={styles.step} aria-labelledby={`${groupId}-title`}>
      <h2 id={`${groupId}-title`} className="t-tagline">
        Нарисуйте изделие
      </h2>
      <p className={styles.stepLead}>
        Выберите форму и впишите размеры в миллиметрах прямо на чертеже. Отметьте «R» у тех углов, которые нужно скруглить.
      </p>

      <div className={styles.itemsBar} role="group" aria-label="Изделия в заказе">
        {state.items.map((entry, index) => {
          const invalid = Object.keys(itemErrors[entry.id] ?? {}).length > 0;
          return (
            <button
              key={entry.id}
              type="button"
              className={styles.itemTab}
              aria-pressed={entry.id === item.id}
              data-invalid={invalid ? "true" : undefined}
              onClick={() => dispatch({ type: "item/select", id: entry.id })}
            >
              Изделие №{index + 1}
              <small>{shapeLabel(entry.shape)}</small>
            </button>
          );
        })}
        <button
          type="button"
          className={`btn btn--secondary ${styles.addItem}`}
          disabled={state.items.length >= MAX_ITEMS}
          onClick={() => dispatch({ type: "item/add" })}
        >
          + Добавить изделие
        </button>
      </div>

      <div className={styles.shapeLayout}>
        <fieldset className={styles.shapePicker}>
          <legend className="visually-hidden">Форма изделия</legend>
          {SHAPES.map((shape) => (
            <label
              key={shape.kind}
              className={styles.shapeOption}
              data-checked={item.shape === shape.kind ? "true" : undefined}
              data-focus-visible={focus.attr(shape.kind)}
            >
              <input
                type="radio"
                name={`${groupId}-shape`}
                value={shape.kind}
                checked={item.shape === shape.kind}
                onChange={() => dispatch({ type: "item/shape", id: item.id, shape: shape.kind })}
                {...focus.handlers(shape.kind)}
              />
              <span className={styles.shapeHead}>
                <span className={styles.shapeMark} aria-hidden="true" />
                <span>{shape.label}</span>
              </span>
              <ShapePreview shape={shape.kind} />
            </label>
          ))}
        </fieldset>

        <div className={styles.drawingColumn}>
          <div className={styles.itemHead}>
            <h3 className={styles.itemTitle}>Изделие №{itemNumber}</h3>
            <button
              type="button"
              className={styles.trashButton}
              aria-label={`Удалить изделие ${itemNumber}`}
              title="Удалить изделие"
              disabled={state.items.length <= 1}
              onClick={() => dispatch({ type: "item/remove", id: item.id })}
            >
              <TrashIcon />
            </button>
          </div>

          <div className={styles.drawing}>
            <ShapeCanvas
              item={item}
              mode="dimensions"
              errors={errors}
              onDimensionChange={(key, value) => dispatch({ type: "item/dim", id: item.id, key, value })}
              onCornerToggle={(corner) => dispatch({ type: "item/corner", id: item.id, corner })}
            />
          </div>

          <div className={styles.radiusRow}>
            <NumberField
              key={`${item.id}-radius`}
              label="R"
              title="Радиус скругления отмеченных углов"
              suffix="мм"
              step={10}
              value={item.cornerRadius}
              error={errors.cornerRadius ?? errors.roundedCorners}
              hint={radiusHint}
              onCommit={(value) => dispatch({ type: "item/radius", id: item.id, value })}
            />
          </div>
        </div>
      </div>

      <div className={styles.itemFooter}>
        <p aria-live="polite">
          <strong>Изделие №{itemNumber}:</strong> {itemArea !== null ? `${formatQuantity(itemArea)} м²` : "проверьте размеры"}
          {state.items.length > 1 && totalArea !== null ? (
            <>
              {" · "}
              <strong>Всего:</strong> {formatQuantity(totalArea)} м²
            </>
          ) : null}
        </p>
        <div className={styles.itemActions}>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={state.items.length >= MAX_ITEMS}
            onClick={() => dispatch({ type: "item/clone", id: item.id })}
          >
            Копировать
          </button>
        </div>
      </div>
    </section>
  );
}
