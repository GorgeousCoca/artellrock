/**
 * Раскладка HTML-слоя поверх чертежа: поля размеров на размерных линиях и чекбоксы «R» у углов.
 *
 * Чистая функция без DOM. Поля и чекбоксы имеют фиксированный размер в CSS-пикселях, а чертёж масштабируется,
 * поэтому на узких фигурах и мелком масштабе они могут налезть друг на друга. Правила разрешения такие:
 *  1. Поле сдвигается вдоль СВОЕЙ линии (центр не уходит с линии), пока не перестанет пересекаться с соседями.
 *  2. Если места нет, чекбоксы «R» уходят в список под чертежом (на чертеже остаются номера углов).
 *  3. Если и без чекбоксов поля не помещаются, поля уходят в список под чертежом (на линиях остаются подписи).
 * Поле важнее чекбокса: сначала жертвуем чекбоксами.
 */
import type { DimensionLine, Point } from "./geometry";

export type Size = { w: number; h: number };

/**
 * Зона нажатия чекбокса «R», CSS px: не меньше 44×44 (WCAG 2.5.5 / рекомендации для касаний).
 * Видимый значок меньше (см. `.cornerCheck span` в стилях), но зона нажатия — вся эта площадь, поэтому
 * раскладка проверяет непересечение именно этих зон. Значение должно совпадать со стилями `.cornerCheck`.
 */
export const CORNER_HIT_SIZE: Size = { w: 44, h: 44 };

export type LayoutInput = {
  /** Видимая область чертежа в единицах чертежа. */
  view: { x: number; y: number; width: number; height: number };
  /** Ширина отрисованного чертежа в CSS-пикселях. */
  widthPx: number;
  lines: DimensionLine[];
  /** Точки чекбоксов (уже внутри фигуры, см. cornerAnchors) и размер зоны нажатия. */
  corners: Array<{ id: string; point: Point }>;
  cornerSize: Size;
  fieldSize: Size;
  /** false — поля заведомо идут списком (узкий экран), на линиях ничего не ставим. */
  fieldsAllowed: boolean;
};

export type LayoutResult = {
  /** Центры полей в единицах чертежа (по id размерной линии). */
  fields: Record<string, Point>;
  fieldsInline: boolean;
  cornersInline: boolean;
};

type Box = { cx: number; cy: number; w: number; h: number };

/** Шаг поиска свободного места вдоль линии, px. */
const SLIDE_STEP_PX = 4;
/** Зазор между соседними элементами, px. */
const GAP_PX = 2;

export function boxesOverlap(p: Box, q: Box, gap = GAP_PX): boolean {
  return Math.abs(p.cx - q.cx) < (p.w + q.w) / 2 + gap && Math.abs(p.cy - q.cy) < (p.h + q.h) / 2 + gap;
}

export function layoutOverlays(input: LayoutInput): LayoutResult {
  const { view, widthPx, lines, corners, cornerSize, fieldSize, fieldsAllowed } = input;
  const scale = widthPx / view.width;
  const toPx = (p: Point): Point => ({ x: (p.x - view.x) * scale, y: (p.y - view.y) * scale });
  const toUnits = (x: number, y: number): Point => ({ x: x / scale + view.x, y: y / scale + view.y });

  const cornerBoxes: Box[] = corners.map((corner) => {
    const at = toPx(corner.point);
    return { cx: at.x, cy: at.y, w: cornerSize.w, h: cornerSize.h };
  });
  let cornersInline = !cornerBoxes.some((box, i) => cornerBoxes.slice(i + 1).some((other) => boxesOverlap(box, other)));

  /** Ставит поля по очереди; каждое — на ближайшее к середине свободное место своей линии. */
  const place = (obstacles: Box[]) => {
    const placed: Box[] = [...obstacles];
    const centers: Record<string, Point> = {};
    let ok = true;

    for (const line of lines) {
      const mid = toPx(line.mid);
      // Поле нельзя уводить с линии: центр остаётся на отрезке. Дугу не сдвигаем.
      const reach = line.kind === "linear" ? (line.length * scale) / 2 : 0;
      let chosen: Box | null = null;

      for (let k = 0; k * SLIDE_STEP_PX <= reach + 1e-6 && !chosen; k += 1) {
        for (const sign of k === 0 ? [1] : [1, -1]) {
          const s = k * SLIDE_STEP_PX * sign;
          const box: Box = {
            cx: mid.x + line.direction.x * s,
            cy: mid.y + line.direction.y * s,
            w: fieldSize.w,
            h: fieldSize.h
          };
          if (!placed.some((other) => boxesOverlap(box, other))) {
            chosen = box;
            break;
          }
        }
      }

      if (!chosen) {
        ok = false;
        chosen = { cx: mid.x, cy: mid.y, w: fieldSize.w, h: fieldSize.h };
      }
      placed.push(chosen);
      centers[line.id] = toUnits(chosen.cx, chosen.cy);
    }

    return { ok, centers };
  };

  const mids = Object.fromEntries(lines.map((line) => [line.id, line.mid]));
  if (!fieldsAllowed) return { fields: mids, fieldsInline: false, cornersInline };

  const withCorners = place(cornersInline ? cornerBoxes : []);
  if (withCorners.ok) return { fields: withCorners.centers, fieldsInline: true, cornersInline };

  if (cornersInline) {
    const withoutCorners = place([]);
    if (withoutCorners.ok) return { fields: withoutCorners.centers, fieldsInline: true, cornersInline: false };
  }
  return { fields: mids, fieldsInline: false, cornersInline };
}
