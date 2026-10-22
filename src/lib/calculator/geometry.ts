/**
 * Геометрия изделий: форма -> контур, площадь, периметр, стороны, углы.
 *
 * Чистый изоморфный модуль без React, Payload и ввода-вывода. Это единственное место, где живут формулы,
 * и его вызывают ОДИНАКОВО и чертёж на клиенте (SVG), и серверный расчёт сметы. Расхождение между тем,
 * что нарисовано, и тем, что посчитано, невозможно по построению.
 *
 * Система координат: миллиметры, начало слева-сверху, ось Y вниз (как в SVG).
 * Все многоугольники обходятся ПО ЧАСОВОЙ СТРЕЛКЕ на экране: от этого зависит определение выпуклых углов.
 *
 * Идентификаторы: сторона `s{i}` идёт от вершины i к вершине i+1; угол `c{i}` — это вершина i, то есть
 * между стороной `s{i-1}` и стороной `s{i}`. У радиальной формы стороны названы словами, а углы — `c0…c3`.
 */

export const SHAPES = [
  { kind: "straight", label: "Прямая" },
  { kind: "l-shape", label: "Г-образная" },
  { kind: "u-shape", label: "П-образная" },
  { kind: "radial", label: "Радиальная" }
] as const;

export type ShapeKind = (typeof SHAPES)[number]["kind"];
export const SHAPE_KINDS = SHAPES.map((s) => s.kind) as [ShapeKind, ...ShapeKind[]];

export type Point = { x: number; y: number };
export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

/** Размеры изделия по ключам `a`, `b`, `c`, … (смысл ключа зависит от формы, см. DIMENSIONS). */
export type Dimensions = Record<string, number>;

/** Минимальная ширина «плеча» и любого линейного размера. Уже 100 мм — это уже не столешница. */
export const MIN_SIZE_MM = 100;
export const MAX_SIZE_MM = 6000;
export const MIN_ANGLE_DEG = 10;
export const MAX_ANGLE_DEG = 180;
export const MAX_CORNER_RADIUS_MM = 300;
/** Радиус по умолчанию. Это значение для показа: в расчёт попадают только отмеченные углы. */
export const DEFAULT_CORNER_RADIUS_MM = 50;

export type DimensionDef = {
  key: string;
  /** Буква на чертеже. */
  label: string;
  title: string;
  unit: "mm" | "deg";
  /** Значение по умолчанию при выборе формы (это геометрия, не цена). */
  default: number;
  /** Шаг перетаскивания и стрелок клавиатуры. */
  step: number;
};

export const DIMENSIONS: Record<ShapeKind, DimensionDef[]> = {
  straight: [
    { key: "a", label: "A", title: "Длина", unit: "mm", default: 2000, step: 10 },
    { key: "b", label: "B", title: "Ширина", unit: "mm", default: 600, step: 10 }
  ],
  "l-shape": [
    { key: "a", label: "A", title: "Общая ширина", unit: "mm", default: 2000, step: 10 },
    { key: "b", label: "B", title: "Общая длина", unit: "mm", default: 1500, step: 10 },
    { key: "c", label: "C", title: "Глубина верхней части", unit: "mm", default: 600, step: 10 },
    { key: "d", label: "D", title: "Ширина левой части", unit: "mm", default: 600, step: 10 }
  ],
  "u-shape": [
    { key: "a", label: "A", title: "Общая ширина", unit: "mm", default: 3000, step: 10 },
    { key: "b", label: "B", title: "Общая длина", unit: "mm", default: 2000, step: 10 },
    { key: "c", label: "C", title: "Глубина перемычки", unit: "mm", default: 600, step: 10 },
    { key: "d", label: "D", title: "Ширина левой части", unit: "mm", default: 600, step: 10 },
    { key: "e", label: "E", title: "Ширина правой части", unit: "mm", default: 600, step: 10 }
  ],
  radial: [
    { key: "a", label: "A", title: "Внешний радиус", unit: "mm", default: 1200, step: 10 },
    { key: "b", label: "B", title: "Внутренний радиус", unit: "mm", default: 600, step: 10 },
    { key: "c", label: "C", title: "Угол дуги", unit: "deg", default: 90, step: 5 }
  ]
};

export function shapeLabel(shape: ShapeKind): string {
  return SHAPES.find((s) => s.kind === shape)?.label ?? shape;
}

export function defaultDimensions(shape: ShapeKind): Dimensions {
  return Object.fromEntries(DIMENSIONS[shape].map((d) => [d.key, d.default]));
}

// ---------------------------------------------------------------------------------------------
// Границы размеров. Зависят друг от друга (плечо не может быть шире изделия), поэтому считаются от
// остальных значений. Эти же границы управляют перетаскиванием на чертеже и подсказками в полях.
// ---------------------------------------------------------------------------------------------

export type Bounds = { min: number; max: number };

function range(min: number, max: number): Bounds {
  return { min, max: Math.max(min, max) };
}

export function dimensionBounds(shape: ShapeKind, dims: Dimensions, key: string): Bounds {
  const n = (k: string) => (Number.isFinite(dims[k]) ? dims[k] : (DIMENSIONS[shape].find((d) => d.key === k)?.default ?? 0));
  const M = MIN_SIZE_MM;

  switch (shape) {
    case "straight":
      return range(M, MAX_SIZE_MM);
    case "l-shape":
      if (key === "a") return range(n("d") + M, MAX_SIZE_MM);
      if (key === "b") return range(n("c") + M, MAX_SIZE_MM);
      if (key === "c") return range(M, n("b") - M);
      return range(M, n("a") - M); // d
    case "u-shape":
      if (key === "a") return range(n("d") + n("e") + M, MAX_SIZE_MM);
      if (key === "b") return range(n("c") + M, MAX_SIZE_MM);
      if (key === "c") return range(M, n("b") - M);
      if (key === "d") return range(M, n("a") - n("e") - M);
      return range(M, n("a") - n("d") - M); // e
    case "radial":
      if (key === "a") return range(n("b") + M, MAX_SIZE_MM);
      if (key === "b") return range(M, n("a") - M);
      return range(MIN_ANGLE_DEG, MAX_ANGLE_DEG); // c
  }
}

/** Ошибки по ключам размеров. Пустой объект — размеры корректны. */
export function validateDimensions(shape: ShapeKind, dims: Dimensions): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const def of DIMENSIONS[shape]) {
    const value = dims[def.key];
    const suffix = def.unit === "deg" ? "°" : " мм";

    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors[def.key] = "Укажите значение";
      continue;
    }
    if (!Number.isInteger(value)) {
      errors[def.key] = "Только целое число";
      continue;
    }

    const { min, max } = dimensionBounds(shape, dims, def.key);
    if (value < min) errors[def.key] = `Не меньше ${min}${suffix}`;
    else if (value > max) errors[def.key] = `Не больше ${max}${suffix}`;
  }

  return errors;
}

function clamp(value: number, { min, max }: Bounds) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Приводит размеры к допустимым значениям (для отрисовки, пока пользователь печатает неверное число).
 * В состоянии формы значение остаётся как введено — ошибка показывается рядом с полем, а сервер
 * такое значение всё равно отклонит.
 */
export function clampDimensions(shape: ShapeKind, dims: Dimensions): Dimensions {
  const result: Dimensions = { ...defaultDimensions(shape), ...dims };
  for (const def of DIMENSIONS[shape]) {
    if (!Number.isFinite(result[def.key])) result[def.key] = def.default;
  }
  // Два прохода: границы зависят от соседних значений.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const def of DIMENSIONS[shape]) {
      result[def.key] = Math.round(clamp(result[def.key], dimensionBounds(shape, result, def.key)));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// Контур
// ---------------------------------------------------------------------------------------------

export type OutlineSide = {
  /** Стабильный идентификатор стороны (хранится в заказе). */
  id: string;
  /** Порядковый номер для подписей, с 1. */
  index: number;
  lengthMm: number;
  /** Путь SVG только прямого (не скруглённого) участка стороны: для подсветки и клика. */
  d: string;
  /** Точка на середине стороны (для подписи). */
  mid: Point;
};

export type OutlineCorner = {
  /** Стабильный идентификатор угла (хранится в заказе): `c{i}`, вершины по часовой стрелке от левой верхней. */
  id: string;
  /** Порядковый номер для подписей, с 1. */
  index: number;
  /** Вершина угла в миллиметрах. */
  point: Point;
  /** true — выпуклый угол, false — вогнутый (внутренний). */
  convex: boolean;
  /** Наибольший радиус скругления именно этого угла, целые мм (ограничен смежными сторонами и дугой). */
  maxRadius: number;
  /** Единичный вектор от вершины внутрь материала по биссектрисе угла. */
  inward: Point;
};

/** Область, занятая изделием: нужна, чтобы проверять, что точка лежит внутри заливки. */
export type OutlineRegion =
  | { kind: "polygon"; vertices: Point[] }
  | { kind: "sector"; outer: number; inner: number; angle: number };

export type Outline = {
  /** Замкнутый контур изделия (скруглены только отмеченные углы). */
  path: string;
  sides: OutlineSide[];
  corners: OutlineCorner[];
  bbox: BBox;
  areaMm2: number;
  perimeterMm: number;
  region: OutlineRegion;
};

const f = (n: number) => Math.round(n * 100) / 100;
const dist = (p: Point, q: Point) => Math.hypot(q.x - p.x, q.y - p.y);

function polygonVertices(shape: ShapeKind, d: Dimensions): Point[] | null {
  const { a, b, c, d: dd, e } = { a: d.a, b: d.b, c: d.c, d: d.d, e: d.e };
  switch (shape) {
    case "straight":
      return [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a, y: b },
        { x: 0, y: b }
      ];
    case "l-shape":
      // Верхняя перекладина на всю ширину A и глубину C + левая стойка шириной D на всю длину B.
      return [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a, y: c },
        { x: dd, y: c },
        { x: dd, y: b },
        { x: 0, y: b }
      ];
    case "u-shape":
      // Перемычка сверху (глубина C) + две стойки: слева шириной D, справа шириной E.
      return [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a, y: b },
        { x: a - e, y: b },
        { x: a - e, y: c },
        { x: dd, y: c },
        { x: dd, y: b },
        { x: 0, y: b }
      ];
    case "radial":
      return null;
  }
}

/** Знак поворота в вершине: > 0 — выпуклый угол для обхода по часовой стрелке (ось Y вниз). */
function isConvex(prev: Point, cur: Point, next: Point) {
  return (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x) > 0;
}

function shoelace(v: Point[]) {
  let sum = 0;
  for (let i = 0; i < v.length; i += 1) {
    const p = v[i];
    const q = v[(i + 1) % v.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return Math.abs(sum) / 2;
}

function towards(from: Point, to: Point, by: number): Point {
  const len = dist(from, to);
  return { x: from.x + ((to.x - from.x) / len) * by, y: from.y + ((to.y - from.y) / len) * by };
}

// ---------------------------------------------------------------------------------------------
// Сборка контура из сторон и скруглений углов (общая для многоугольников и радиальной формы)
// ---------------------------------------------------------------------------------------------

/** Сторона до скруглений: прямая или дуга окружности. */
type RawSide = {
  id: string;
  lengthMm: number;
  mid: Point;
  from: Point;
  to: Point;
  /** Для дуги: радиус и направление (1 — по часовой стрелке на экране). */
  arc?: { radius: number; sweep: 0 | 1 };
};

/** Скругление угла: дуга окружности радиуса `radius` между двумя точками касания. */
type Fillet = { radius: number; sweep: 0 | 1; from: Point; to: Point };

const move = (p: Point) => `${f(p.x)} ${f(p.y)}`;

function segment(side: RawSide, to: Point) {
  return side.arc ? `A ${f(side.arc.radius)} ${f(side.arc.radius)} 0 0 ${side.arc.sweep} ${move(to)}` : `L ${move(to)}`;
}

/**
 * `fillets[i]` — скругление угла i, он стоит между стороной i-1 и стороной i. Точки касания обрезают
 * концы соседних сторон, поэтому подсветка стороны (`d`) не вылезает за скруглённый угол.
 */
function assemble(raw: RawSide[], fillets: Array<Fillet | null>): { path: string; sides: OutlineSide[] } {
  const n = raw.length;
  const start = (i: number) => fillets[i]?.to ?? raw[i].from;
  const end = (i: number) => fillets[(i + 1) % n]?.from ?? raw[i].to;

  const parts = [`M ${move(start(0))}`];
  const sides: OutlineSide[] = [];

  for (let i = 0; i < n; i += 1) {
    const side = raw[i];
    parts.push(segment(side, end(i)));
    const corner = fillets[(i + 1) % n];
    if (corner) parts.push(`A ${f(corner.radius)} ${f(corner.radius)} 0 0 ${corner.sweep} ${move(corner.to)}`);

    sides.push({
      id: side.id,
      index: i + 1,
      lengthMm: side.lengthMm,
      d: `M ${move(start(i))} ${segment(side, end(i))}`,
      mid: side.mid
    });
  }

  return { path: `${parts.join(" ")} Z`, sides };
}

/** Радиус угла, который реально рисуется: угол отмечен, радиус положителен и не больше предела угла. */
function effectiveRadius(corner: OutlineCorner, radius: number, selected: ReadonlySet<string>) {
  if (!selected.has(corner.id)) return 0;
  return Math.max(0, Math.min(radius, corner.maxRadius));
}

type Geometry = Pick<Outline, "path" | "sides" | "corners" | "bbox" | "areaMm2" | "perimeterMm" | "region">;

function polygonGeometry(v: Point[], radius: number, selected: ReadonlySet<string>): Geometry {
  const n = v.length;

  const corners: OutlineCorner[] = v.map((p, i) => {
    const prev = v[(i + n - 1) % n];
    const next = v[(i + 1) % n];
    const convex = isConvex(prev, p, next);
    const u1 = towards(p, prev, 1);
    const u2 = towards(p, next, 1);
    const bx = u1.x + u2.x - 2 * p.x;
    const by = u1.y + u2.y - 2 * p.y;
    const len = Math.hypot(bx, by) || 1;
    // Внутри материала — по биссектрисе острого клина у выпуклого угла и против неё у вогнутого.
    const k = (convex ? 1 : -1) / len;
    return {
      id: `c${i}`,
      index: i + 1,
      point: p,
      convex,
      maxRadius: Math.floor(Math.min(MAX_CORNER_RADIUS_MM, dist(prev, p) / 2, dist(p, next) / 2)),
      inward: { x: bx * k, y: by * k }
    };
  });

  const raw: RawSide[] = v.map((p, i) => {
    const q = v[(i + 1) % n];
    return {
      id: `s${i}`,
      lengthMm: dist(p, q),
      mid: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
      from: p,
      to: q
    };
  });

  // Контуры прямоугольные (все углы по 90°), поэтому точка касания лежит ровно в `radius` от вершины.
  const fillets = corners.map<Fillet | null>((corner, i) => {
    const r = effectiveRadius(corner, radius, selected);
    if (r <= 0) return null;
    return {
      radius: r,
      sweep: corner.convex ? 1 : 0,
      from: towards(corner.point, v[(i + n - 1) % n], r),
      to: towards(corner.point, v[(i + 1) % n], r)
    };
  });

  const { path, sides } = assemble(raw, fillets);
  const xs = v.map((p) => p.x);
  const ys = v.map((p) => p.y);

  return {
    path,
    sides,
    corners,
    bbox: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
    areaMm2: shoelace(v),
    perimeterMm: sides.reduce((sum, s) => sum + s.lengthMm, 0),
    region: { kind: "polygon", vertices: v }
  };
}

/** Наибольшее целое значение из 0…MAX_CORNER_RADIUS_MM, для которого `fits` истинно (`fits` монотонна). */
function largestFitting(fits: (radius: number) => boolean): number {
  let lo = 0;
  let hi = MAX_CORNER_RADIUS_MM;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function radialGeometry(d: Dimensions, radius: number, selected: ReadonlySet<string>): Geometry {
  const R = d.a;
  const r = d.b;
  const theta = (d.c * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const outerEnd = { x: R * cos, y: R * sin };
  const innerEnd = { x: r * cos, y: r * sin };
  const root2 = Math.SQRT2;

  // Скругление считаем в локальной системе у начальной кромки: прямая лежит на оси X, материал — при y > 0.
  // Для конечной кромки (угол theta) локальные точки отражаются в глобальные этим же преобразованием.
  const toEnd = (p: Point): Point => ({ x: p.x * cos + p.y * sin, y: p.x * sin - p.y * cos });

  // Внешний угол: окружность скругления касается внешней дуги изнутри, её центр на расстоянии R − ρ.
  const outerFillet = (rho: number) => {
    const cx = Math.sqrt(Math.max(0, R * R - 2 * R * rho));
    const k = R / (R - rho);
    return { line: { x: cx, y: 0 }, arc: { x: cx * k, y: rho * k }, alongLine: R - cx, alpha: Math.atan2(rho, cx) };
  };
  // Внутренний угол: окружность скругления касается внутренней дуги снаружи, центр на расстоянии r + ρ.
  const innerFillet = (rho: number) => {
    const cx = Math.sqrt(r * r + 2 * r * rho);
    const k = r / (r + rho);
    return { line: { x: cx, y: 0 }, arc: { x: cx * k, y: rho * k }, alongLine: cx - r, alpha: Math.atan2(rho, cx) };
  };

  const halfLine = (R - r) / 2;
  const fitsOuter = (rho: number) => {
    if (2 * rho > R) return false;
    const t = outerFillet(rho);
    return t.alongLine <= halfLine && t.alpha <= theta / 2;
  };
  const fitsInner = (rho: number) => {
    const t = innerFillet(rho);
    return t.alongLine <= halfLine && t.alpha <= theta / 2;
  };
  const maxOuter = largestFitting(fitsOuter);
  const maxInner = largestFitting(fitsInner);

  const corners: OutlineCorner[] = [
    { id: "c0", index: 1, point: { x: r, y: 0 }, convex: true, maxRadius: maxInner, inward: { x: 1 / root2, y: 1 / root2 } },
    { id: "c1", index: 2, point: { x: R, y: 0 }, convex: true, maxRadius: maxOuter, inward: { x: -1 / root2, y: 1 / root2 } },
    {
      id: "c2",
      index: 3,
      point: outerEnd,
      convex: true,
      maxRadius: maxOuter,
      inward: { x: (-cos + sin) / root2, y: (-sin - cos) / root2 }
    },
    {
      id: "c3",
      index: 4,
      point: innerEnd,
      convex: true,
      maxRadius: maxInner,
      inward: { x: (cos + sin) / root2, y: (sin - cos) / root2 }
    }
  ];

  // Все четыре угла сектора выпуклые; обход по часовой стрелке, поэтому дуги скругления тоже с sweep = 1.
  const rho = corners.map((corner) => effectiveRadius(corner, radius, selected));
  const fillets: Array<Fillet | null> = [
    rho[0] > 0
      ? (() => {
          const t = innerFillet(rho[0]);
          return { radius: rho[0], sweep: 1 as const, from: t.arc, to: t.line };
        })()
      : null,
    rho[1] > 0
      ? (() => {
          const t = outerFillet(rho[1]);
          return { radius: rho[1], sweep: 1 as const, from: t.line, to: t.arc };
        })()
      : null,
    rho[2] > 0
      ? (() => {
          const t = outerFillet(rho[2]);
          return { radius: rho[2], sweep: 1 as const, from: toEnd(t.arc), to: toEnd(t.line) };
        })()
      : null,
    rho[3] > 0
      ? (() => {
          const t = innerFillet(rho[3]);
          return { radius: rho[3], sweep: 1 as const, from: toEnd(t.line), to: toEnd(t.arc) };
        })()
      : null
  ];

  // Дуга ≤ 180°, поэтому large-arc всегда 0. Внешняя дуга идёт по часовой (sweep 1), внутренняя — обратно.
  const raw: RawSide[] = [
    { id: "start", lengthMm: R - r, mid: { x: (R + r) / 2, y: 0 }, from: { x: r, y: 0 }, to: { x: R, y: 0 } },
    {
      id: "outer",
      lengthMm: theta * R,
      mid: { x: R * Math.cos(theta / 2), y: R * Math.sin(theta / 2) },
      from: { x: R, y: 0 },
      to: outerEnd,
      arc: { radius: R, sweep: 1 }
    },
    { id: "end", lengthMm: R - r, mid: { x: ((R + r) / 2) * cos, y: ((R + r) / 2) * sin }, from: outerEnd, to: innerEnd },
    {
      id: "inner",
      lengthMm: theta * r,
      mid: { x: r * Math.cos(theta / 2), y: r * Math.sin(theta / 2) },
      from: innerEnd,
      to: { x: r, y: 0 },
      arc: { radius: r, sweep: 0 }
    }
  ];

  const { path, sides } = assemble(raw, fillets);

  // Габариты: концы дуг + крайние точки (90° и 180°), если дуга их захватывает.
  const angles = [0, theta, ...(d.c >= 90 ? [Math.PI / 2] : []), ...(d.c >= 180 ? [Math.PI] : [])];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const rad of [r, R]) {
    for (const phi of angles) {
      xs.push(rad * Math.cos(phi));
      ys.push(rad * Math.sin(phi));
    }
  }

  return {
    path,
    sides,
    corners,
    bbox: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
    areaMm2: (theta / 2) * (R * R - r * r),
    perimeterMm: sides.reduce((sum, s) => sum + s.lengthMm, 0),
    region: { kind: "sector", outer: R, inner: r, angle: theta }
  };
}

/**
 * Контур для ВАЛИДНЫХ размеров (см. validateDimensions / clampDimensions).
 * Скругляются только углы из `roundedCorners`, радиусом `cornerRadius` (но не больше предела угла).
 */
export function buildOutline(
  shape: ShapeKind,
  dims: Dimensions,
  cornerRadius = 0,
  roundedCorners: readonly string[] = []
): Outline {
  const selected = new Set(roundedCorners);
  const radius = Number.isFinite(cornerRadius) ? Math.max(0, cornerRadius) : 0;

  if (shape === "radial") return radialGeometry(dims, radius, selected);
  const vertices = polygonVertices(shape, dims);
  if (!vertices) throw new Error(`Unknown shape: ${shape}`);
  return polygonGeometry(vertices, radius, selected);
}

/** Лежит ли точка внутри заливки изделия (границы считаются внутренними). */
export function pointInOutline(outline: Outline, p: Point): boolean {
  const { region } = outline;

  if (region.kind === "sector") {
    const radius = Math.hypot(p.x, p.y);
    if (radius < region.inner - 1e-6 || radius > region.outer + 1e-6) return false;
    const angle = Math.atan2(p.y, p.x);
    return angle >= -1e-9 && angle <= region.angle + 1e-9;
  }

  const v = region.vertices;
  let inside = false;
  for (let i = 0, j = v.length - 1; i < v.length; j = i, i += 1) {
    const crosses = v[i].y > p.y !== v[j].y > p.y;
    if (crosses && p.x < ((v[j].x - v[i].x) * (p.y - v[i].y)) / (v[j].y - v[i].y) + v[i].x) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------------------------------------
// Скругление углов
// ---------------------------------------------------------------------------------------------

/** Идентификаторы углов формы (не зависят от размеров). */
export function cornerIds(shape: ShapeKind): string[] {
  const count = { straight: 4, "l-shape": 6, "u-shape": 8, radial: 4 }[shape];
  return Array.from({ length: count }, (_, i) => `c${i}`);
}

/**
 * Человекочитаемое положение угла для подписи чекбокса «R» (скринридеры и список углов на узком экране).
 * Порядок углов задан контуром (`polygonVertices` / `radialGeometry`), размеры на него не влияют, поэтому
 * подписи — таблица, а не вычисление по координатам. Тесты сверяют таблицу с настоящей геометрией
 * (выпуклый/вогнутый угол), так что расхождение при изменении контуров не пройдёт незамеченным.
 */
const CORNER_POSITIONS: Record<ShapeKind, readonly string[]> = {
  straight: ["левый верхний", "правый верхний", "правый нижний", "левый нижний"],
  "l-shape": [
    "левый верхний",
    "правый верхний",
    "правый нижний верхней части",
    "внутренний угол выемки",
    "правый нижний левой части",
    "левый нижний"
  ],
  "u-shape": [
    "левый верхний",
    "правый верхний",
    "правый нижний",
    "левый нижний правой части",
    "внутренний угол выемки справа",
    "внутренний угол выемки слева",
    "правый нижний левой части",
    "левый нижний"
  ],
  radial: ["начало дуги, внутренний радиус", "начало дуги, внешний радиус", "конец дуги, внешний радиус", "конец дуги, внутренний радиус"]
};

/** Положение угла `c{i}` формы словами; для неизвестного угла — нейтральное «угол N». */
export function cornerPositionLabel(shape: ShapeKind, cornerId: string): string {
  const index = /^c(\d+)$/.test(cornerId) ? Number(cornerId.slice(1)) : -1;
  return CORNER_POSITIONS[shape][index] ?? (index >= 0 ? `угол ${index + 1}` : cornerId);
}

/** Ключи размеров, которых нет у формы (включая `__proto__` и прочие собственные ключи объекта). */
export function unknownDimensionKeys(shape: ShapeKind, dims: object): string[] {
  const allowed = new Set(DIMENSIONS[shape].map((d) => d.key));
  return Object.getOwnPropertyNames(dims).filter((key) => !allowed.has(key));
}

/** Только размеры формы: лишние ключи отбрасываются. Отсутствующие размеры остаются отсутствующими. */
export function pickDimensions(shape: ShapeKind, dims: Dimensions): Dimensions {
  const result: Dimensions = {};
  for (const { key } of DIMENSIONS[shape]) {
    if (Object.prototype.hasOwnProperty.call(dims, key)) result[key] = dims[key];
  }
  return result;
}

/** Оставляет только существующие у формы углы, без повторов (порядок сохраняется). */
export function pruneCorners(shape: ShapeKind, ids: readonly string[]): string[] {
  const valid = new Set(cornerIds(shape));
  return [...new Set(ids)].filter((id) => valid.has(id));
}

/**
 * Наибольший радиус для набора углов: самый тесный угол ограничивает всех. Без аргумента `ids` берутся
 * все углы формы. Ограничение угла — не больше половины более короткой смежной стороны (у радиальной
 * формы ещё и условие, чтобы скругление помещалось на дуге) и не больше MAX_CORNER_RADIUS_MM.
 */
export function maxCornerRadius(shape: ShapeKind, dims: Dimensions, ids?: readonly string[]): number {
  const corners = buildOutline(shape, dims).corners.filter((corner) => !ids || ids.includes(corner.id));
  if (corners.length === 0) return 0;
  return Math.min(...corners.map((corner) => corner.maxRadius));
}

export type CornerAnchor = { id: string; index: number; point: Point };

/**
 * Где ставить чекбокс «R»: точка внутри заливки на биссектрисе угла, на расстоянии `offset` (единицы
 * чертежа) от вершины. Если у узкой фигуры точка вышла бы за контур, расстояние уменьшается вдвое,
 * пока она не окажется внутри.
 */
export function cornerAnchors(outline: Outline, offset: number): CornerAnchor[] {
  return outline.corners.map((corner) => {
    const at = (d: number): Point => ({ x: corner.point.x + corner.inward.x * d, y: corner.point.y + corner.inward.y * d });
    // Нулевое смещение дало бы саму вершину, а она лежит на границе, а не внутри: берём хотя бы 1 единицу.
    let distance = Math.max(1, offset);
    for (let i = 0; i < 12 && !pointInOutline(outline, at(distance)); i += 1) distance /= 2;
    return { id: corner.id, index: corner.index, point: at(distance) };
  });
}

// ---------------------------------------------------------------------------------------------
// Стороны: кромка и бортик
// ---------------------------------------------------------------------------------------------

/** Идентификаторы сторон формы (не зависят от размеров). */
export function sideIds(shape: ShapeKind): string[] {
  switch (shape) {
    case "straight":
      return ["s0", "s1", "s2", "s3"];
    case "l-shape":
      return ["s0", "s1", "s2", "s3", "s4", "s5"];
    case "u-shape":
      return ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7"];
    case "radial":
      return ["start", "outer", "end", "inner"];
  }
}

// ---------------------------------------------------------------------------------------------
// Измерение изделия — вход для расчёта сметы
// ---------------------------------------------------------------------------------------------

export type ShapeItem = {
  shape: ShapeKind;
  dims: Dimensions;
  /** Радиус скругления, мм. Применяется только к углам из `roundedCorners`. */
  cornerRadius: number;
  /** Идентификаторы отмеченных для скругления углов (`c0`, `c1`, …). */
  roundedCorners: string[];
  /** Стороны с обработкой кромки (профиль и толщина оплачиваются по их длине). */
  edgeSides: string[];
  /** Стороны с бортиком. Не пересекаются с edgeSides. */
  backsplashSides: string[];
};

export type ItemMeasure = {
  areaMm2: number;
  perimeterMm: number;
  edgeLengthMm: number;
  backsplashLengthMm: number;
  roundedCorners: number;
};

export function measureItem(item: ShapeItem): ItemMeasure {
  const outline = buildOutline(item.shape, item.dims, item.cornerRadius, item.roundedCorners);
  const lengthOf = (ids: string[]) =>
    outline.sides.filter((s) => ids.includes(s.id)).reduce((sum, s) => sum + s.lengthMm, 0);

  // Скругление с нулевым радиусом — это не скругление: считаем только то, что реально нарисовано.
  const known = new Set(outline.corners.map((corner) => corner.id));
  const rounded = item.cornerRadius > 0 ? new Set(item.roundedCorners.filter((id) => known.has(id))).size : 0;

  return {
    areaMm2: outline.areaMm2,
    perimeterMm: outline.perimeterMm,
    edgeLengthMm: lengthOf(item.edgeSides),
    backsplashLengthMm: lengthOf(item.backsplashSides),
    roundedCorners: rounded
  };
}

/** Ошибки изделия целиком: размеры, углы, радиус, стороны. Пустой объект — всё корректно. */
export function validateItem(item: ShapeItem): Record<string, string> {
  const errors = validateDimensions(item.shape, item.dims);
  if (Object.keys(errors).length > 0) return errors;

  const outline = buildOutline(item.shape, item.dims);
  const known = new Set(outline.corners.map((corner) => corner.id));
  const unknown = item.roundedCorners.some((id) => !known.has(id));
  const duplicate = new Set(item.roundedCorners).size !== item.roundedCorners.length;
  if (unknown) errors.roundedCorners = "Неизвестный угол изделия";
  else if (duplicate) errors.roundedCorners = "Угол отмечен дважды";

  // Радиус ограничен самым тесным из отмеченных углов; без отмеченных — общим пределом.
  const selected = item.roundedCorners.filter((id) => known.has(id));
  const max = selected.length > 0 ? maxCornerRadius(item.shape, item.dims, selected) : MAX_CORNER_RADIUS_MM;
  if (!Number.isInteger(item.cornerRadius) || item.cornerRadius < 0) {
    errors.cornerRadius = "Только целое неотрицательное число";
  } else if (item.cornerRadius > max) {
    errors.cornerRadius = max === 0 ? "Для отмеченных углов скругление недоступно" : `Не больше ${max} мм`;
  }

  const valid = new Set(sideIds(item.shape));
  const bad = [...item.edgeSides, ...item.backsplashSides].some((id) => !valid.has(id));
  const overlap = item.edgeSides.some((id) => item.backsplashSides.includes(id));
  if (bad) errors.sides = "Неизвестная сторона изделия";
  else if (overlap) errors.sides = "Сторона не может быть одновременно с кромкой и бортиком";

  return errors;
}

// ---------------------------------------------------------------------------------------------
// Размерные линии
// ---------------------------------------------------------------------------------------------

/** Расстояния размерных линий в «процентах чертежа» (1 = 1% длинной стороны габарита фигуры). */
const DIM_OFFSET_U = 9;
const DIM_GAP_U = 1.4;
const DIM_OVERSHOOT_U = 1.6;

export type DimensionLine = {
  /** Уникальный идентификатор линии. У дубля размера он отличается от ключа (`b-mirror`). */
  id: string;
  /** Ключ размера из DIMENSIONS (`a`…`e`). */
  key: string;
  /** Это дубль уже нарисованного размера (П-образная: `b` справа), он привязан к тому же значению. */
  mirror: boolean;
  kind: "linear" | "angle";
  /** Значение размера: мм или градусы. */
  value: number;
  /** Концы размерной линии (острия стрелок). */
  from: Point;
  to: Point;
  /** Середина линии — сюда ставится поле ввода. */
  mid: Point;
  /** Единичное направление вдоль линии в середине (у дуги — касательная). */
  direction: Point;
  /** Куда смотрят стрелки на концах (наружу от измеряемого участка). */
  fromDir: Point;
  toDir: Point;
  /** Длина линии в единицах чертежа (у дуги — длина дуги). */
  length: number;
  /** Путь SVG самой линии. */
  path: string;
  /** Выносные линии (засечки): от измеряемого места до чуть дальше размерной линии. */
  extensions: Array<{ from: Point; to: Point }>;
  /** Для угла: окружность, по которой идёт дуга (углы в радианах). */
  arc?: { center: Point; radius: number; start: number; end: number };
};

function linearLine(
  id: string,
  key: string,
  value: number,
  from: Point,
  to: Point,
  extensions: DimensionLine["extensions"],
  mirror = false
): DimensionLine {
  const length = dist(from, to);
  const direction = { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
  return {
    id,
    key,
    mirror,
    kind: "linear",
    value,
    from,
    to,
    mid: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
    direction,
    // `0 -` вместо унарного минуса: у нулевой компоненты не должно появляться «-0».
    fromDir: { x: 0 - direction.x, y: 0 - direction.y },
    toDir: direction,
    length,
    path: `M ${move(from)} L ${move(to)}`,
    extensions
  };
}

/**
 * Размерные линии формы: геометрия (концы, середина, направление, выносные линии) без единой точки отрисовки.
 * Линии вынесены за контур; `ShapeCanvas` их только рисует, а поля ввода ставит по `mid`.
 * Для ВАЛИДНЫХ размеров (см. clampDimensions).
 */
export function dimensionLines(shape: ShapeKind, dims: Dimensions): DimensionLine[] {
  const { bbox } = buildOutline(shape, dims);
  const u = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) / 100;
  const off = DIM_OFFSET_U * u;
  const gap = DIM_GAP_U * u;
  const over = DIM_OVERSHOOT_U * u;
  const { a, b, c, d, e } = { a: dims.a, b: dims.b, c: dims.c, d: dims.d, e: dims.e };

  /** Горизонтальный размер на высоте `yLine` между x1 и x2; `yFeature` — край фигуры, от которого идут выносные. */
  const horizontal = (id: string, key: string, x1: number, x2: number, yLine: number, yFeature: number) => {
    const dir = yLine >= yFeature ? 1 : -1;
    const ext = (x: number) => ({ from: { x, y: yFeature + dir * gap }, to: { x, y: yLine + dir * over } });
    return linearLine(id, key, dims[key], { x: x1, y: yLine }, { x: x2, y: yLine }, [ext(x1), ext(x2)]);
  };

  /** Вертикальный размер на `xLine` между y1 и y2; `xFeature` — край фигуры. */
  const vertical = (id: string, key: string, y1: number, y2: number, xLine: number, xFeature: number, mirror = false) => {
    const dir = xLine >= xFeature ? 1 : -1;
    const ext = (y: number) => ({ from: { x: xFeature + dir * gap, y }, to: { x: xLine + dir * over, y } });
    return linearLine(id, key, dims[key], { x: xLine, y: y1 }, { x: xLine, y: y2 }, [ext(y1), ext(y2)], mirror);
  };

  switch (shape) {
    case "straight":
      return [horizontal("a", "a", 0, a, -off, 0), vertical("b", "b", 0, b, -off, 0)];

    case "l-shape":
      return [
        horizontal("a", "a", 0, a, -off, 0),
        vertical("b", "b", 0, b, -off, 0),
        vertical("c", "c", 0, c, a + off, a),
        horizontal("d", "d", 0, d, b + off, b)
      ];

    case "u-shape": {
      const cutMid = (d + a - e) / 2;
      return [
        horizontal("a", "a", 0, a, -off, 0),
        vertical("b", "b", 0, b, -off, 0),
        // Тот же размер B справа: отдельного размера у правой ножки нет.
        vertical("b-mirror", "b", 0, b, a + off, a, true),
        // Глубина перемычки: внутри фигуры, по центру выреза, от верхнего края до дна выреза.
        linearLine("c", "c", c, { x: cutMid, y: 0 }, { x: cutMid, y: c }, []),
        horizontal("d", "d", 0, d, b + off, b),
        horizontal("e", "e", a - e, a, b + off, b)
      ];
    }

    case "radial": {
      // Радиусы — над начальной кромкой, от центра дуги (x = 0); внутренний ближе к кромке, внешний выше.
      const yInner = -off;
      const yOuter = -off * 2.1;
      const radiusLine = (id: string, key: string, x2: number, y: number) =>
        linearLine(id, key, dims[key], { x: 0, y }, { x: x2, y }, [
          { from: { x: 0, y: -gap }, to: { x: 0, y: y - over } },
          { from: { x: x2, y: -gap }, to: { x: x2, y: y - over } }
        ]);

      // Угол — дуга снаружи сектора с центром в центре дуг.
      const theta = (c * Math.PI) / 180;
      const arcRadius = a + off;
      const at = (phi: number, radius: number): Point => ({ x: radius * Math.cos(phi), y: radius * Math.sin(phi) });
      const tangent = (phi: number): Point => ({ x: -Math.sin(phi), y: Math.cos(phi) });
      const start = at(0, arcRadius);
      const end = at(theta, arcRadius);
      const angle: DimensionLine = {
        id: "c",
        key: "c",
        mirror: false,
        kind: "angle",
        value: c,
        from: start,
        to: end,
        mid: at(theta / 2, arcRadius),
        direction: tangent(theta / 2),
        fromDir: { x: 0 - tangent(0).x, y: 0 - tangent(0).y },
        toDir: tangent(theta),
        length: arcRadius * theta,
        path: `M ${move(start)} A ${f(arcRadius)} ${f(arcRadius)} 0 0 1 ${move(end)}`,
        extensions: [0, theta].map((phi) => ({ from: at(phi, a + gap), to: at(phi, arcRadius + over) })),
        arc: { center: { x: 0, y: 0 }, radius: arcRadius, start: 0, end: theta }
      };

      return [radiusLine("a", "a", a, yOuter), radiusLine("b", "b", b, yInner), angle];
    }
  }
}

/** Рамка видимой области чертежа с полями. */
export function viewBoxFor(bbox: BBox, padRatio = 0.14): { x: number; y: number; width: number; height: number } {
  const w = bbox.maxX - bbox.minX;
  const h = bbox.maxY - bbox.minY;
  const pad = Math.max(w, h) * padRatio;
  return { x: bbox.minX - pad, y: bbox.minY - pad, width: w + pad * 2, height: h + pad * 2 };
}

/** Рамка чертежа с размерными линиями: фигура + все линии, выносные и дуги + небольшое поле. */
export function dimensionViewBox(
  shape: ShapeKind,
  dims: Dimensions,
  padRatio = 0.03
): { x: number; y: number; width: number; height: number } {
  const { bbox } = buildOutline(shape, dims);
  const xs = [bbox.minX, bbox.maxX];
  const ys = [bbox.minY, bbox.maxY];
  const add = (p: Point) => {
    xs.push(p.x);
    ys.push(p.y);
  };

  for (const line of dimensionLines(shape, dims)) {
    add(line.from);
    add(line.to);
    for (const ext of line.extensions) {
      add(ext.from);
      add(ext.to);
    }
    if (line.arc) {
      const { center, radius, start, end } = line.arc;
      for (let i = 0; i <= 24; i += 1) {
        const phi = start + ((end - start) * i) / 24;
        add({ x: center.x + radius * Math.cos(phi), y: center.y + radius * Math.sin(phi) });
      }
    }
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(maxX - minX, maxY - minY) * padRatio;
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}
