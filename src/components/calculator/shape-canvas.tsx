"use client";

/**
 * SVG-чертёж изделия. Чисто «презентационный»: рисует контур из состояния и сообщает о действиях наружу.
 *
 *  - режим `dimensions` (шаг 1): вокруг фигуры размерные линии со стрелками и выносными линиями, а поля ввода
 *    размеров стоят прямо на линиях (HTML-слой поверх SVG). У каждого угла — чекбокс «R». Размеры меняются только
 *    вводом чисел, перетаскивания точек нет (границы значений — в lib/calculator/geometry.ts);
 *  - режим `sides` (шаг 3): клик по стороне переключает её роль — кромка / бортик / без обработки.
 *
 * Доступность: сам чертёж — картинка с текстовым описанием (`role="img"`). Поля и чекбоксы — настоящие
 * элементы формы в отдельном слое, поэтому они не спрятаны внутри `role="img"` и работают с клавиатуры.
 *
 * Если на экране мало места (узкий чертёж, фигура 6000×100), поля и чекбоксы уходят в списки под чертежом,
 * а на чертеже остаются подписи значений и номера углов (правила — lib/calculator/overlay-layout.ts).
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject
} from "react";

import {
  buildOutline,
  clampDimensions,
  cornerAnchors,
  cornerPositionLabel,
  DIMENSIONS,
  dimensionBounds,
  dimensionLines,
  dimensionViewBox,
  shapeLabel,
  viewBoxFor,
  type Point
} from "@/lib/calculator/geometry";
import { formatMm } from "@/lib/calculator/format";
import { CORNER_HIT_SIZE, layoutOverlays, type Size } from "@/lib/calculator/overlay-layout";

import type { CalcItem, SideRole } from "./calculator-context";
import styles from "./calculator.module.scss";
import { useFocusVisibleKey } from "./focus-visible";
import { NumberField } from "./number-field";
import { bboxArea, StonePattern, svgSafeId } from "./stone-pattern";

type ShapeCanvasProps = {
  item: CalcItem;
  mode: "dimensions" | "sides";
  /** Ошибки изделия по ключам (`a`…`e`, `cornerRadius`, …), только для режима `dimensions`. */
  errors?: Record<string, string>;
  onDimensionChange?: (key: string, value: number) => void;
  onCornerToggle?: (cornerId: string) => void;
  onSideCycle?: (sideId: string, next: SideRole) => void;
};

export function sideRole(item: Pick<CalcItem, "edgeSides" | "backsplashSides">, sideId: string): SideRole {
  if (item.edgeSides.includes(sideId)) return "edge";
  if (item.backsplashSides.includes(sideId)) return "backsplash";
  return "none";
}

/** Порядок переключения по клику на сторону: кромка → бортик → без обработки → кромка. */
export function nextRole(role: SideRole): SideRole {
  return role === "edge" ? "backsplash" : role === "backsplash" ? "none" : "edge";
}

export function ShapeCanvas(props: ShapeCanvasProps) {
  return props.mode === "dimensions" ? <DimensionsCanvas {...props} /> : <SidesCanvas {...props} />;
}

// ---------------------------------------------------------------------------------------------
// Шаг 3: стороны
// ---------------------------------------------------------------------------------------------

function SidesCanvas({ item, onSideCycle }: ShapeCanvasProps) {
  const titleId = useId();

  // Пока в поле введено неверное число, чертёж рисуем по ближайшим допустимым значениям.
  const dims = clampDimensions(item.shape, item.dims);
  const outline = buildOutline(item.shape, dims, item.cornerRadius, item.roundedCorners);
  const view = viewBoxFor(outline.bbox);
  /** 1% длинной стороны чертежа: размеры линий и подписей в единицах чертежа, чтобы масштаб не ломал вид. */
  const u = Math.max(view.width, view.height) / 100;

  const summary = `Стороны изделия: ${outline.sides.map((s) => `${s.index} — ${formatMm(s.lengthMm)}`).join(", ")}`;

  return (
    <svg
      className={styles.canvas}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      role="img"
      aria-labelledby={titleId}
      data-mode="sides"
    >
      <title id={titleId}>{summary}</title>

      <path className={styles.canvasBody} d={outline.path} strokeWidth={0.6 * u} />

      {outline.sides.map((side) => {
        const role = sideRole(item, side.id);
        return (
          <g key={side.id} aria-hidden="true">
            <path
              className={styles.sideLine}
              data-role={role}
              d={side.d}
              strokeWidth={(role === "none" ? 0.6 : 1.6) * u}
            />
            {/* Широкая невидимая область клика: попасть по тонкой линии на телефоне невозможно. */}
            <path
              className={styles.sideHit}
              d={side.d}
              strokeWidth={7 * u}
              onClick={() => onSideCycle?.(side.id, nextRole(role))}
            />
            <circle className={styles.sideBadge} data-role={role} cx={side.mid.x} cy={side.mid.y} r={3.4 * u} />
            <text className={styles.sideBadgeText} x={side.mid.x} y={side.mid.y} fontSize={3.8 * u}>
              {side.index}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Шаг 1: размерные линии, поля на линиях, чекбоксы «R»
// ---------------------------------------------------------------------------------------------

/** Размер поля на линии (input + «мм»), CSS px. Должен совпадать со стилями. Зона чекбокса «R» — `CORNER_HIT_SIZE`. */
const FIELD_SIZE: Size = { w: 98, h: 36 };
/** Чертёж уже этого — поля уходят в список под чертежом. */
const NARROW_PX = 620;
/** Ширина до первого замера (серверный рендер и первый кадр): раскладка одинакова на сервере и клиенте. */
const NOMINAL_WIDTH_PX = 640;

/** Ширина элемента в px. До первого замера — null; обновляется только из ResizeObserver. */
function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number | null] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

function Arrow({ tip, dir, u }: { tip: Point; dir: Point; u: number }) {
  const length = 2.6 * u;
  const half = 0.9 * u;
  const base = { x: tip.x - dir.x * length, y: tip.y - dir.y * length };
  const perp = { x: -dir.y * half, y: dir.x * half };
  const points = [tip, { x: base.x + perp.x, y: base.y + perp.y }, { x: base.x - perp.x, y: base.y - perp.y }];
  return <polygon className={styles.dimArrow} points={points.map((p) => `${p.x},${p.y}`).join(" ")} />;
}

function DimensionsCanvas({ item, errors = {}, onDimensionChange, onCornerToggle }: ShapeCanvasProps) {
  const titleId = useId();
  const uid = svgSafeId(useId());
  const [stageRef, stageWidth] = useElementWidth<HTMLDivElement>();
  const [boxRef, boxWidth] = useElementWidth<HTMLDivElement>();
  const focus = useFocusVisibleKey();

  // Пока в поле введено неверное число, чертёж рисуем по ближайшим допустимым значениям.
  const dims = clampDimensions(item.shape, item.dims);
  const outline = buildOutline(item.shape, dims, item.cornerRadius, item.roundedCorners);
  const view = dimensionViewBox(item.shape, dims);
  const lines = dimensionLines(item.shape, dims);
  const defs = DIMENSIONS[item.shape];
  const u = Math.max(view.width, view.height) / 100;

  // Раскладка слоя: мерим ширину самого чертежа, а решение «узко/широко» принимаем по внешней обёртке,
  // иначе смена полей вокруг чертежа меняла бы его ширину и раскладку по кругу.
  const narrow = stageWidth !== null && stageWidth < NARROW_PX;
  const cornerSize = CORNER_HIT_SIZE;
  const scale = (boxWidth ?? NOMINAL_WIDTH_PX) / view.width;
  const anchors = cornerAnchors(outline, ((cornerSize.w / 2 + 2) * Math.SQRT2) / scale);
  const layout = layoutOverlays({
    view,
    widthPx: boxWidth ?? NOMINAL_WIDTH_PX,
    lines,
    corners: anchors,
    cornerSize,
    fieldSize: FIELD_SIZE,
    fieldsAllowed: !narrow
  });

  const place = (p: Point): CSSProperties => ({
    left: `${((p.x - view.x) / view.width) * 100}%`,
    top: `${((p.y - view.y) / view.height) * 100}%`
  });

  const errorKeys = defs.filter((def) => errors[def.key]);
  const roundedCount = outline.corners.filter((corner) => item.roundedCorners.includes(corner.id)).length;

  const summary =
    `Чертёж: ${shapeLabel(item.shape).toLowerCase()} форма, площадь ${(outline.areaMm2 / 1e6).toFixed(2)} м²` +
    (roundedCount > 0 ? `, скруглено углов: ${roundedCount}` : "");

  const toggleCorner = (id: string) => onCornerToggle?.(id);

  return (
    <div className={styles.dimStage} ref={stageRef} data-narrow={narrow ? "true" : undefined}>
      <div className={styles.dimFrame}>
        <div className={styles.dimBox} ref={boxRef} style={{ "--ratio": view.width / view.height } as CSSProperties}>
          <svg
            className={styles.dimSvg}
            viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
            role="img"
            aria-labelledby={titleId}
            data-mode="dimensions"
          >
            <title id={titleId}>{summary}</title>
            <defs>
              <StonePattern id={uid} area={bboxArea(outline.bbox)} />
            </defs>

            <path className={styles.canvasStone} d={outline.path} fill={`url(#${uid})`} strokeWidth={0.5 * u} />

            {lines.map((line) => {
              const def = defs.find((d) => d.key === line.key);
              const unit = def?.unit === "deg" ? "°" : " мм";
              return (
                <g key={line.id} className={styles.dimLine} aria-hidden="true">
                  {line.extensions.map((ext, index) => (
                    <line
                      key={index}
                      x1={ext.from.x}
                      y1={ext.from.y}
                      x2={ext.to.x}
                      y2={ext.to.y}
                      strokeWidth={0.3 * u}
                    />
                  ))}
                  <path d={line.path} fill="none" strokeWidth={0.35 * u} />
                  <Arrow tip={line.from} dir={line.fromDir} u={u} />
                  <Arrow tip={line.to} dir={line.toDir} u={u} />
                  {/* Поля ушли в список: значение остаётся на линии как подпись. */}
                  {layout.fieldsInline ? null : (
                    <text
                      className={styles.dimText}
                      x={line.mid.x}
                      y={line.mid.y}
                      fontSize={3.6 * u}
                      strokeWidth={1.4 * u}
                    >
                      {line.value}
                      {unit}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Чекбоксы ушли в список: на чертеже остаются номера углов, чтобы список было с чем сверить. */}
            {layout.cornersInline
              ? null
              : anchors.map((anchor) => (
                  <g key={anchor.id} aria-hidden="true" className={styles.cornerBadge} data-checked={item.roundedCorners.includes(anchor.id) ? "true" : undefined}>
                    <circle cx={anchor.point.x} cy={anchor.point.y} r={3 * u} strokeWidth={0.4 * u} />
                    <text x={anchor.point.x} y={anchor.point.y} fontSize={3.4 * u}>
                      {anchor.index}
                    </text>
                  </g>
                ))}
          </svg>

          <div className={styles.overlay}>
            {layout.fieldsInline
              ? lines.map((line) => {
                  const def = defs.find((d) => d.key === line.key);
                  if (!def) return null;
                  const unit = def.unit === "deg" ? "°" : "мм";
                  const error = errors[def.key];
                  return (
                    <div key={line.id} className={styles.dimField} style={place(layout.fields[line.id])}>
                      <NumberField
                        key={`${item.id}-${item.shape}-${line.id}`}
                        variant="line"
                        ariaLabel={`${def.label} ${def.title}${line.mirror ? " (дубль справа)" : ""}, ${unit}`}
                        suffix={unit}
                        step={def.step}
                        value={item.dims[def.key] ?? def.default}
                        invalid={Boolean(error)}
                        errorId={`${uid}-error-${def.key}`}
                        onCommit={(value) => onDimensionChange?.(def.key, value)}
                      />
                    </div>
                  );
                })
              : null}

            {layout.cornersInline
              ? anchors.map((anchor) => (
                  <label
                    key={anchor.id}
                    className={styles.cornerCheck}
                    style={place(anchor.point)}
                    data-focus-visible={focus.attr(anchor.id)}
                  >
                    <input
                      type="checkbox"
                      checked={item.roundedCorners.includes(anchor.id)}
                      aria-label={`Скруглить угол ${anchor.index}: ${cornerPositionLabel(item.shape, anchor.id)}`}
                      onChange={() => toggleCorner(anchor.id)}
                      {...focus.handlers(anchor.id)}
                    />
                    <span aria-hidden="true">R</span>
                  </label>
                ))
              : null}
          </div>
        </div>
      </div>

      {layout.fieldsInline && errorKeys.length > 0 ? (
        <ul className={styles.dimErrors} aria-live="polite">
          {errorKeys.map((def) => (
            <li key={def.key} id={`${uid}-error-${def.key}`} className={styles.fieldError}>
              {def.label} {def.title}: {errors[def.key]}
            </li>
          ))}
        </ul>
      ) : null}

      {layout.fieldsInline ? null : (
        <div className={styles.fieldsGrid}>
          {defs.map((def) => {
            const { min, max } = dimensionBounds(item.shape, item.dims, def.key);
            const unit = def.unit === "deg" ? "°" : "мм";
            return (
              <NumberField
                key={`${item.id}-${item.shape}-${def.key}`}
                label={def.label}
                title={def.title}
                suffix={unit}
                step={def.step}
                value={item.dims[def.key] ?? def.default}
                error={errors[def.key]}
                hint={`${min}–${max} ${unit}`}
                onCommit={(value) => onDimensionChange?.(def.key, value)}
              />
            );
          })}
        </div>
      )}

      {layout.cornersInline ? null : (
        <fieldset className={styles.cornerList}>
          <legend>Скруглить углы</legend>
          {outline.corners.map((corner) => (
            <label
              key={corner.id}
              className={styles.cornerChip}
              data-checked={item.roundedCorners.includes(corner.id) ? "true" : undefined}
              data-focus-visible={focus.attr(corner.id)}
            >
              <input
                type="checkbox"
                checked={item.roundedCorners.includes(corner.id)}
                onChange={() => toggleCorner(corner.id)}
                {...focus.handlers(corner.id)}
              />
              {/* Видимый текст и есть имя чекбокса: номер совпадает с номером на чертеже, положение — словами. */}
              <span>
                Угол {corner.index}: {cornerPositionLabel(item.shape, corner.id)}
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
