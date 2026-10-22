import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOutline,
  clampDimensions,
  cornerAnchors,
  cornerIds,
  cornerPositionLabel,
  defaultDimensions,
  DIMENSIONS,
  dimensionLines,
  dimensionViewBox,
  maxCornerRadius,
  measureItem,
  pointInOutline,
  pickDimensions,
  pruneCorners,
  SHAPE_KINDS,
  sideIds,
  unknownDimensionKeys,
  validateDimensions,
  validateItem,
  type Dimensions,
  type Point,
  type ShapeKind
} from "./geometry";
import { boxesOverlap, CORNER_HIT_SIZE, layoutOverlays } from "./overlay-layout";

const close = (actual: number, expected: number, eps = 0.5) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);

describe("площадь и периметр", () => {
  it("прямая: A×B", () => {
    const o = buildOutline("straight", { a: 2000, b: 600 });
    assert.equal(o.areaMm2, 1_200_000);
    assert.equal(o.perimeterMm, 5200);
  });

  it("Г-образная: A·C + D·(B−C), периметр как у объемлющего прямоугольника", () => {
    const dims = { a: 2000, b: 1500, c: 600, d: 600 };
    const o = buildOutline("l-shape", dims);
    assert.equal(o.areaMm2, 2000 * 600 + 600 * (1500 - 600));
    assert.equal(o.perimeterMm, 2 * (2000 + 1500));
  });

  it("П-образная: A·C + (B−C)·(D+E), периметр = 2(A+B) + 2(B−C)", () => {
    const dims = { a: 3000, b: 2000, c: 600, d: 600, e: 700 };
    const o = buildOutline("u-shape", dims);
    assert.equal(o.areaMm2, 3000 * 600 + (2000 - 600) * (600 + 700));
    assert.equal(o.perimeterMm, 2 * (3000 + 2000) + 2 * (2000 - 600));
  });

  it("радиальная: сектор кольца", () => {
    const o = buildOutline("radial", { a: 1200, b: 600, c: 90 });
    close(o.areaMm2, (Math.PI / 4) * (1200 ** 2 - 600 ** 2), 1);
    close(o.perimeterMm, (Math.PI / 2) * (1200 + 600) + 2 * 600, 1);
  });

  it("сумма сторон равна периметру, идентификаторы сторон стабильны", () => {
    for (const shape of SHAPE_KINDS) {
      const o = buildOutline(shape, defaultDimensions(shape));
      close(o.sides.reduce((sum, s) => sum + s.lengthMm, 0), o.perimeterMm, 0.001);
      assert.deepEqual(
        o.sides.map((s) => s.id),
        sideIds(shape)
      );
    }
  });

  it("скругление углов не меняет площадь и периметр", () => {
    for (const shape of SHAPE_KINDS) {
      const dims = defaultDimensions(shape);
      const all = cornerIds(shape);
      assert.equal(buildOutline(shape, dims, 50, all).areaMm2, buildOutline(shape, dims, 0).areaMm2);
      assert.equal(buildOutline(shape, dims, 50, all).perimeterMm, buildOutline(shape, dims, 0).perimeterMm);
    }
  });
});

describe("углы контура", () => {
  it("у каждой формы стабильные id c0…cN, совпадающие с cornerIds", () => {
    const counts = { straight: 4, "l-shape": 6, "u-shape": 8, radial: 4 } as const;
    for (const shape of SHAPE_KINDS) {
      const ids = buildOutline(shape, defaultDimensions(shape)).corners.map((c) => c.id);
      assert.deepEqual(ids, cornerIds(shape));
      assert.equal(ids.length, counts[shape]);
      assert.deepEqual(ids, Array.from({ length: counts[shape] }, (_, i) => `c${i}`));
    }
  });

  it("id углов и сторон не пересекаются", () => {
    for (const shape of SHAPE_KINDS) {
      const sides = new Set(sideIds(shape));
      assert.ok(cornerIds(shape).every((id) => !sides.has(id)));
    }
  });

  it("выпуклые и вогнутые: Г-образная — 5 + 1, П-образная — 6 + 2, остальные — только выпуклые", () => {
    const convexOf = (shape: ShapeKind) =>
      buildOutline(shape, defaultDimensions(shape)).corners.map((c) => (c.convex ? "x" : "v")).join("");
    assert.equal(convexOf("straight"), "xxxx");
    assert.equal(convexOf("l-shape"), "xxxvxx"); // c3 = внутренний угол (d, c)
    assert.equal(convexOf("u-shape"), "xxxxvvxx"); // c4, c5 = дно выреза
    assert.equal(convexOf("radial"), "xxxx");
  });

  it("вершины углов — это вершины контура", () => {
    const o = buildOutline("l-shape", { a: 2000, b: 1500, c: 600, d: 600 });
    assert.deepEqual(o.corners[3].point, { x: 600, y: 600 });
    assert.deepEqual(o.corners[5].point, { x: 0, y: 1500 });
  });

  it("по умолчанию путь без дуг; без выбранных углов радиус ничего не меняет", () => {
    for (const shape of SHAPE_KINDS) {
      const dims = defaultDimensions(shape);
      assert.equal(buildOutline(shape, dims, 50, []).path, buildOutline(shape, dims, 0, []).path);
    }
    assert.ok(!buildOutline("straight", { a: 2000, b: 600 }, 50).path.includes("A"));
  });

  it("скругляется только выбранный угол; сторона обрезается до точки касания", () => {
    const dims = { a: 2000, b: 600 };
    const o = buildOutline("straight", dims, 50, ["c0"]);
    assert.ok(o.path.startsWith("M 50 0 "), o.path);
    assert.equal(o.path.match(/A /g)?.length, 1);
    assert.equal(o.sides[0].d, "M 50 0 L 2000 0");
    assert.equal(o.sides[3].d, "M 0 600 L 0 50");
    assert.equal(o.sides[1].d, "M 2000 0 L 2000 600");
  });

  it("радиус угла не превышает его предел: на узкой фигуре дуга меньше заказанной", () => {
    const o = buildOutline("straight", { a: 2000, b: 100 }, 300, ["c0"]);
    assert.ok(o.path.includes("A 50 50 0 0 1"), o.path);
  });

  it("внутренний (вогнутый) угол Г-образной скругляется дугой против часовой стрелки", () => {
    const dims = { a: 2000, b: 1500, c: 600, d: 600 };
    const o = buildOutline("l-shape", dims, 50, ["c3"]);
    assert.equal(o.path.match(/A /g)?.length, 1);
    assert.ok(o.path.includes("A 50 50 0 0 0 600 650"), o.path); // sweep = 0, к левой ножке
    assert.ok(o.path.includes("L 650 600"), o.path); // перед дугой — вдоль верхней части
    const convexOnly = buildOutline("l-shape", dims, 50, ["c1"]);
    assert.ok(convexOnly.path.includes("A 50 50 0 0 1"));
  });

  it("внутренние углы дна выреза П-образной скругляются; выпуклые и вогнутые вместе", () => {
    const dims = defaultDimensions("u-shape");
    const o = buildOutline("u-shape", dims, 40, ["c4", "c5", "c2"]);
    assert.equal(o.path.match(/A 40 40 0 0 0/g)?.length, 2);
    assert.equal(o.path.match(/A 40 40 0 0 1/g)?.length, 1);
  });

  it("радиальная форма: каждый из четырёх углов скругляется, точки касания лежат на нужных окружностях", () => {
    const dims = { a: 1200, b: 600, c: 90 };
    const theta = Math.PI / 2;
    const rho = 100;
    const o = buildOutline("radial", dims, rho, ["c0", "c1", "c2", "c3"]);

    const tokens = [...o.path.matchAll(/([MLA])\s*([^MLAZ]*)/g)].map((m) => ({
      cmd: m[1],
      nums: m[2].trim().split(/\s+/).map(Number)
    }));
    const points = tokens.map((t) => ({ x: t.nums[t.nums.length - 2], y: t.nums[t.nums.length - 1] }));
    const onRay = (p: Point, phi: number) => {
      const along = p.x * Math.cos(phi) + p.y * Math.sin(phi);
      const across = -p.x * Math.sin(phi) + p.y * Math.cos(phi);
      return Math.abs(across) < 0.05 && along >= 600 - 0.05 && along <= 1200 + 0.05;
    };
    for (const p of points) {
      const radius = Math.hypot(p.x, p.y);
      const onArc = Math.abs(radius - 1200) < 0.05 || Math.abs(radius - 600) < 0.05;
      assert.ok(onArc || onRay(p, 0) || onRay(p, theta), `точка ${p.x},${p.y} не лежит на контуре`);
    }

    // Хорда дуги скругления определяется её центральным углом. Угол между нормалью к кромке и нормалью к дуге:
    // у внешнего угла 90° + asin(ρ/(R−ρ)), у внутреннего acos(ρ/(r+ρ)). Порядок в пути: c1, c2 (внешние), c3, c0 (внутренние).
    const chord = (angle: number) => 2 * rho * Math.sin(angle / 2);
    const expected = [
      chord(Math.PI / 2 + Math.asin(rho / (1200 - rho))),
      chord(Math.PI / 2 + Math.asin(rho / (1200 - rho))),
      chord(Math.acos(rho / (600 + rho))),
      chord(Math.acos(rho / (600 + rho)))
    ];
    const actual: number[] = [];
    tokens.forEach((t, i) => {
      if (t.cmd !== "A" || Math.abs(t.nums[0] - rho) > 0.01) return;
      actual.push(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    });
    assert.equal(actual.length, 4);
    actual.forEach((value, i) => close(value, expected[i], 0.2));
    assert.ok(o.path.startsWith("M "));
  });

  it("предел радиуса: у угла — половина короткой смежной стороны, у радиальной формы — ещё и дуга", () => {
    const tight = buildOutline("l-shape", { a: 2000, b: 1500, c: 100, d: 600 });
    assert.equal(tight.corners[2].maxRadius, 50); // (a, c): смежная сторона длиной C = 100
    assert.equal(tight.corners[0].maxRadius, 300); // ограничен общим пределом
    assert.equal(maxCornerRadius("l-shape", { a: 2000, b: 1500, c: 100, d: 600 }), 50);
    assert.equal(maxCornerRadius("l-shape", { a: 2000, b: 1500, c: 100, d: 600 }, ["c0", "c4"]), 300);

    const radial = buildOutline("radial", defaultDimensions("radial"));
    assert.deepEqual(
      radial.corners.map((c) => c.maxRadius),
      [300, 262, 262, 300]
    );

    // Узкий сектор: скругление должно помещаться на короткой дуге.
    const narrow = buildOutline("radial", { a: 200, b: 100, c: 10 });
    for (const corner of narrow.corners) assert.ok(corner.maxRadius >= 0 && corner.maxRadius < 50);
    const drawn = buildOutline("radial", { a: 200, b: 100, c: 10 }, 300, ["c0", "c1", "c2", "c3"]);
    assert.ok(!drawn.path.includes("NaN"));
  });

  it("pruneCorners отбрасывает несуществующие углы и повторы", () => {
    assert.deepEqual(pruneCorners("straight", ["c0", "c5", "c0", "zz"]), ["c0"]);
    assert.deepEqual(pruneCorners("l-shape", ["c5", "c1"]), ["c5", "c1"]);
    assert.deepEqual(pruneCorners("radial", ["c4", "c3"]), ["c3"]);
  });
});

describe("якоря чекбоксов «R»", () => {
  const cases: Array<[ShapeKind, Dimensions]> = [
    ["straight", { a: 2000, b: 600 }],
    ["straight", { a: 6000, b: 100 }],
    ["l-shape", { a: 2000, b: 1500, c: 600, d: 600 }],
    ["l-shape", { a: 2000, b: 1500, c: 100, d: 100 }],
    ["u-shape", { a: 3000, b: 2000, c: 600, d: 600, e: 600 }],
    ["u-shape", { a: 3000, b: 2000, c: 100, d: 1400, e: 1400 }],
    ["radial", { a: 1200, b: 600, c: 90 }],
    ["radial", { a: 200, b: 100, c: 10 }],
    ["radial", { a: 1200, b: 600, c: 180 }]
  ];

  it("по одной точке на угол, и все они внутри контура — при любом смещении", () => {
    for (const [shape, dims] of cases) {
      const outline = buildOutline(shape, dims);
      for (const offset of [0, 20, 80, 400, 5000]) {
        const anchors = cornerAnchors(outline, offset);
        assert.equal(anchors.length, outline.corners.length, `${shape} ${JSON.stringify(dims)}`);
        for (const anchor of anchors) {
          assert.ok(pointInOutline(outline, anchor.point), `${shape} ${JSON.stringify(dims)} ${anchor.id} @${offset}`);
        }
      }
    }
  });

  it("точка лежит на биссектрисе: у выпуклого угла прямой — на равном удалении от сторон, у вогнутого — внутри материала", () => {
    const o = buildOutline("straight", { a: 2000, b: 600 });
    const [first] = cornerAnchors(o, 100);
    close(first.point.x, 100 / Math.SQRT2, 0.01);
    close(first.point.y, 100 / Math.SQRT2, 0.01);

    const l = buildOutline("l-shape", { a: 2000, b: 1500, c: 600, d: 600 });
    const concave = cornerAnchors(l, 100)[3];
    close(concave.point.x, 600 - 100 / Math.SQRT2, 0.01);
    close(concave.point.y, 600 - 100 / Math.SQRT2, 0.01);
  });
});

describe("размерные линии", () => {
  const defaults = (shape: ShapeKind) => defaultDimensions(shape);
  const byId = (shape: ShapeKind, dims = defaults(shape)) =>
    Object.fromEntries(dimensionLines(shape, dims).map((line) => [line.id, line]));

  it("число линий: прямая 2, Г 4, П 6 (с дублем b), радиальная 3", () => {
    assert.equal(dimensionLines("straight", defaults("straight")).length, 2);
    assert.equal(dimensionLines("l-shape", defaults("l-shape")).length, 4);
    assert.equal(dimensionLines("u-shape", defaults("u-shape")).length, 6);
    assert.equal(dimensionLines("radial", defaults("radial")).length, 3);
  });

  it("у каждого размера формы есть линия, ключи берутся из DIMENSIONS", () => {
    for (const shape of SHAPE_KINDS) {
      const keys = new Set(dimensionLines(shape, defaults(shape)).map((line) => line.key));
      assert.deepEqual([...keys].sort(), DIMENSIONS[shape].map((d) => d.key).sort());
    }
  });

  it("прямая: a сверху на всю длину, b слева на всю ширину; линии вне контура со стрелками и выносными", () => {
    const { a, b } = byId("straight", { a: 2000, b: 600 });
    assert.ok(a.from.y < 0 && a.to.y === a.from.y);
    assert.equal(a.from.x, 0);
    assert.equal(a.to.x, 2000);
    assert.deepEqual(a.mid, { x: 1000, y: a.from.y });
    assert.deepEqual(a.direction, { x: 1, y: 0 });
    assert.ok(b.from.x < 0 && b.to.x === b.from.x);
    assert.equal(b.from.y, 0);
    assert.equal(b.to.y, 600);
    assert.equal(a.extensions.length, 2);
    // Выносная линия начинается у фигуры (с зазором) и выходит за размерную линию.
    const ext = a.extensions[0];
    assert.ok(ext.from.y < 0 && ext.from.y > a.from.y);
    assert.ok(ext.to.y < a.from.y);
    assert.deepEqual(a.fromDir, { x: -1, y: 0 });
    assert.deepEqual(a.toDir, { x: 1, y: 0 });
  });

  it("Г-образная: c справа только на высоту верхней части, d снизу только под левой ножкой", () => {
    const lines = byId("l-shape", { a: 2000, b: 1500, c: 600, d: 600 });
    assert.ok(lines.c.from.x > 2000 && lines.c.from.y === 0 && lines.c.to.y === 600);
    assert.ok(lines.d.from.y > 1500 && lines.d.from.x === 0 && lines.d.to.x === 600);
    assert.ok(lines.b.from.x < 0 && lines.b.to.y === 1500);
  });

  it("П-образная: b продублирован справа с тем же значением, c внутри фигуры по центру выреза, d и e под ножками", () => {
    const dims = { a: 3000, b: 2000, c: 600, d: 600, e: 800 };
    const lines = byId("u-shape", dims);
    assert.equal(lines["b-mirror"].key, "b");
    assert.equal(lines["b-mirror"].mirror, true);
    assert.equal(lines["b-mirror"].value, 2000);
    assert.ok(lines["b-mirror"].from.x > 3000 && lines.b.from.x < 0);
    assert.equal(lines.b.mirror, false);

    // Вырез: x от 600 до 2200, центр 1400; линия от верхнего края (y = 0) до дна выреза (y = c).
    assert.equal(lines.c.from.x, 1400);
    assert.deepEqual([lines.c.from.y, lines.c.to.y], [0, 600]);
    assert.equal(lines.c.value, 600);

    assert.ok(lines.d.from.y > 2000 && lines.d.from.x === 0 && lines.d.to.x === 600);
    assert.ok(lines.e.from.y > 2000 && lines.e.from.x === 2200 && lines.e.to.x === 3000);
    assert.equal(lines.e.value, 800);
  });

  it("радиальная: радиусы a и b над кромкой от центра дуги, угол c — дугой снаружи сектора", () => {
    const dims = { a: 1200, b: 600, c: 90 };
    const lines = byId("radial", dims);
    assert.equal(lines.a.from.x, 0);
    assert.equal(lines.a.to.x, 1200);
    assert.equal(lines.b.to.x, 600);
    assert.ok(lines.a.from.y < lines.b.from.y && lines.b.from.y < 0);

    assert.equal(lines.c.kind, "angle");
    assert.ok(lines.c.arc && lines.c.arc.radius > 1200);
    assert.equal(lines.c.arc.end - lines.c.arc.start, Math.PI / 2);
    assert.equal(lines.c.value, 90);
    assert.ok(lines.c.path.includes("A "));
    close(Math.hypot(lines.c.mid.x, lines.c.mid.y), lines.c.arc.radius, 0.01);
  });

  it("размерные линии вынесены за контур (кроме c у П-образной), а рамка чертежа их вмещает", () => {
    for (const shape of SHAPE_KINDS) {
      const dims = defaults(shape);
      const outline = buildOutline(shape, dims);
      const view = dimensionViewBox(shape, dims);
      for (const line of dimensionLines(shape, dims)) {
        for (const p of [line.from, line.to, line.mid]) {
          assert.ok(p.x >= view.x && p.x <= view.x + view.width && p.y >= view.y && p.y <= view.y + view.height, `${shape} ${line.id}`);
        }
        if (shape === "u-shape" && line.id === "c") continue;
        if (line.kind === "angle") continue;
        const outside = [line.from, line.to].every(
          (p) => p.x < outline.bbox.minX || p.x > outline.bbox.maxX || p.y < outline.bbox.minY || p.y > outline.bbox.maxY
        );
        assert.ok(outside, `${shape} ${line.id}`);
      }
    }
  });
});

describe("раскладка полей и чекбоксов на чертеже", () => {
  const FIELD = { w: 98, h: 36 };

  /** Раскладка так, как её строит компонент: якоря чекбоксов от размера зоны нажатия и масштаба. */
  function layoutFor(shape: ShapeKind, dims: Dimensions, widthPx: number, selected: string[] = []) {
    const narrow = widthPx < 520;
    // Зона нажатия чекбокса — та же константа, что в компоненте (не меньше 44×44 на любой ширине).
    const cornerSize = CORNER_HIT_SIZE;
    const outline = buildOutline(shape, dims, 50, selected);
    const view = dimensionViewBox(shape, dims);
    const lines = dimensionLines(shape, dims);
    const scale = widthPx / view.width;
    const anchors = cornerAnchors(outline, ((cornerSize.w / 2 + 2) * Math.SQRT2) / scale);
    const layout = layoutOverlays({ view, widthPx, lines, corners: anchors, cornerSize, fieldSize: FIELD, fieldsAllowed: !narrow });
    const px = (p: Point) => ({ x: (p.x - view.x) * scale, y: (p.y - view.y) * scale });
    return { layout, lines, anchors, view, scale, cornerSize, px };
  }

  const cases: Array<[string, ShapeKind, Dimensions]> = [
    ["прямая по умолчанию", "straight", { a: 2000, b: 600 }],
    ["прямая 6000×100", "straight", { a: 6000, b: 100 }],
    ["прямая 100×6000", "straight", { a: 100, b: 6000 }],
    ["прямая 100×100", "straight", { a: 100, b: 100 }],
    ["Г по умолчанию", "l-shape", { a: 2000, b: 1500, c: 600, d: 600 }],
    ["Г с узкими плечами", "l-shape", { a: 6000, b: 6000, c: 100, d: 100 }],
    ["П по умолчанию", "u-shape", { a: 3000, b: 2000, c: 600, d: 600, e: 600 }],
    ["П с узким вырезом", "u-shape", { a: 3000, b: 2000, c: 600, d: 1450, e: 1450 }],
    ["П минимальная", "u-shape", { a: 300, b: 200, c: 100, d: 100, e: 100 }],
    ["радиальная по умолчанию", "radial", { a: 1200, b: 600, c: 90 }],
    ["радиальная узкая", "radial", { a: 200, b: 100, c: 10 }]
  ];

  it("зона нажатия чекбокса «R» не меньше 44×44 px", () => {
    assert.ok(CORNER_HIT_SIZE.w >= 44 && CORNER_HIT_SIZE.h >= 44, JSON.stringify(CORNER_HIT_SIZE));
  });

  it("встроенные поля и чекбоксы никогда не перекрываются (зоны 44×44, без зазора), поля остаются на своих линиях", () => {
    for (const [name, shape, dims] of cases) {
      for (const width of [280, 320, 360, 480, 560, 620, 700, 900, 1100, 1400]) {
        const { layout, lines, anchors, cornerSize, px } = layoutFor(shape, dims, width);
        const boxes: Array<{ id: string; cx: number; cy: number; w: number; h: number }> = [];

        if (layout.fieldsInline) {
          for (const line of lines) {
            const c = px(layout.fields[line.id]);
            boxes.push({ id: `field:${line.id}`, cx: c.x, cy: c.y, ...FIELD });

            // Центр поля лежит на отрезке линии (для дуги — в её середине).
            const a = px(line.from);
            const b = px(line.to);
            const mid = px(line.mid);
            if (line.kind === "linear") {
              const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
              const t = ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / len2;
              const dx = a.x + t * (b.x - a.x) - c.x;
              const dy = a.y + t * (b.y - a.y) - c.y;
              assert.ok(Math.hypot(dx, dy) < 0.01, `${name} ${width} ${line.id}: поле ушло с линии`);
              assert.ok(t >= -1e-6 && t <= 1 + 1e-6, `${name} ${width} ${line.id}: поле за концом линии`);
            } else {
              assert.ok(Math.hypot(c.x - mid.x, c.y - mid.y) < 0.01);
            }
          }
        }
        if (layout.cornersInline) {
          for (const anchor of anchors) {
            const c = px(anchor.point);
            boxes.push({ id: `corner:${anchor.id}`, cx: c.x, cy: c.y, ...cornerSize });
          }
        }

        boxes.forEach((box, i) => {
          for (const other of boxes.slice(i + 1)) {
            assert.ok(!boxesOverlap(box, other, 0), `${name} @${width}px: ${box.id} перекрывает ${other.id}`);
          }
        });
      }
    }
  });

  it("на широком чертеже обычная прямая держит и поля, и чекбоксы на чертеже", () => {
    const { layout } = layoutFor("straight", { a: 2000, b: 600 }, 700);
    assert.equal(layout.fieldsInline, true);
    assert.equal(layout.cornersInline, true);
  });

  it("узкая полоса 6000×100: чекбоксы уходят в список, поля остаются на линиях", () => {
    const { layout } = layoutFor("straight", { a: 6000, b: 100 }, 900);
    assert.equal(layout.fieldsInline, true);
    assert.equal(layout.cornersInline, false);
  });

  it("узкий экран: поля идут списком, подписи остаются на линиях", () => {
    const { layout } = layoutFor("l-shape", { a: 2000, b: 1500, c: 600, d: 600 }, 340);
    assert.equal(layout.fieldsInline, false);
  });

  it("П-образная с узким вырезом: поля d и e сдвигаются вдоль своих линий и не перекрываются", () => {
    const dims = { a: 3000, b: 2000, c: 600, d: 1450, e: 1450 };
    const { layout, lines, px } = layoutFor("u-shape", dims, 900);
    assert.equal(layout.fieldsInline, true);
    const d = px(layout.fields.d);
    const e = px(layout.fields.e);
    assert.ok(Math.abs(d.x - e.x) >= FIELD.w, "поля d и e должны быть разведены");
    const line = lines.find((l) => l.id === "d")!;
    assert.equal(layout.fields.d.y, line.mid.y); // сдвиг только вдоль линии (по x)
  });
});

describe("положение угла словами (подпись чекбокса «R»)", () => {
  it("у каждого угла каждой формы есть своя непустая подпись", () => {
    for (const shape of SHAPE_KINDS) {
      const labels = cornerIds(shape).map((id) => cornerPositionLabel(shape, id));
      assert.ok(labels.every((label) => label.length > 0 && !/^угол \d+$/.test(label)), `${shape}: ${labels.join("; ")}`);
      assert.equal(new Set(labels).size, labels.length, `${shape}: подписи повторяются`);
    }
  });

  it("прямая: четыре угла по сторонам света", () => {
    assert.deepEqual(
      cornerIds("straight").map((id) => cornerPositionLabel("straight", id)),
      ["левый верхний", "правый верхний", "правый нижний", "левый нижний"]
    );
  });

  it("подписи согласованы с геометрией: «внутренний» ровно у вогнутых углов", () => {
    for (const shape of SHAPE_KINDS) {
      for (const corner of buildOutline(shape, defaultDimensions(shape)).corners) {
        const inner = cornerPositionLabel(shape, corner.id).includes("внутренний угол");
        assert.equal(inner, !corner.convex, `${shape} ${corner.id}`);
      }
    }
  });

  it("стороны света в подписи соответствуют координатам вершины (многоугольники)", () => {
    for (const shape of ["straight", "l-shape", "u-shape"] as const) {
      const { corners, bbox } = buildOutline(shape, defaultDimensions(shape));
      for (const corner of corners) {
        const label = cornerPositionLabel(shape, corner.id);
        if (label.startsWith("левый верхний")) assert.ok(corner.point.x === bbox.minX && corner.point.y === bbox.minY, `${shape} ${corner.id}`);
        if (label.startsWith("правый верхний")) assert.ok(corner.point.x === bbox.maxX && corner.point.y === bbox.minY, `${shape} ${corner.id}`);
        if (label === "левый нижний") assert.ok(corner.point.x === bbox.minX && corner.point.y === bbox.maxY, `${shape} ${corner.id}`);
        if (label === "правый нижний" && shape === "straight") assert.ok(corner.point.x === bbox.maxX && corner.point.y === bbox.maxY);
      }
    }
  });

  it("неизвестный угол не ломает подпись", () => {
    assert.equal(cornerPositionLabel("straight", "c9"), "угол 10");
    assert.equal(cornerPositionLabel("straight", "zzz"), "zzz");
  });
});

describe("ключи размеров формы", () => {
  it("unknownDimensionKeys: лишние ключи, включая __proto__", () => {
    assert.deepEqual(unknownDimensionKeys("straight", { a: 1, b: 2 }), []);
    assert.deepEqual(unknownDimensionKeys("straight", { a: 1, b: 2, c: 3, zzz: 4 }), ["c", "zzz"]);
    assert.deepEqual(unknownDimensionKeys("straight", JSON.parse('{"a":1,"b":2,"__proto__":3}')), ["__proto__"]);
  });

  it("pickDimensions оставляет только ключи формы и не придумывает отсутствующие", () => {
    assert.deepEqual(pickDimensions("straight", { a: 1, b: 2, zzz: 3 }), { a: 1, b: 2 });
    assert.deepEqual(pickDimensions("straight", { a: 1 }), { a: 1 });
    const picked = pickDimensions("straight", JSON.parse('{"a":1,"b":2,"__proto__":{"x":1}}'));
    assert.deepEqual(Object.getOwnPropertyNames(picked), ["a", "b"]);
  });
});

describe("валидация размеров", () => {
  it("значения по умолчанию корректны у всех форм", () => {
    for (const shape of SHAPE_KINDS) {
      assert.deepEqual(validateDimensions(shape, defaultDimensions(shape)), {});
    }
  });

  it("плечо Г-образной не может быть шире изделия", () => {
    const errors = validateDimensions("l-shape", { a: 1000, b: 1500, c: 600, d: 950 });
    assert.ok(errors.d);
  });

  it("перемычка П-образной не может занять всю длину", () => {
    assert.ok(validateDimensions("u-shape", { a: 3000, b: 600, c: 600, d: 600, e: 600 }).c);
  });

  it("ножки П-образной не могут сомкнуться", () => {
    const errors = validateDimensions("u-shape", { a: 1000, b: 2000, c: 600, d: 500, e: 500 });
    assert.ok(errors.d && errors.e);
  });

  it("дробные, пустые и бесконечные значения отклоняются", () => {
    assert.ok(validateDimensions("straight", { a: 2000.5, b: 600 }).a);
    assert.ok(validateDimensions("straight", { a: Number.NaN, b: 600 }).a);
    assert.ok(validateDimensions("straight", { a: Number.POSITIVE_INFINITY, b: 600 }).a);
    assert.ok(validateDimensions("straight", { b: 600 }).a);
  });

  it("clampDimensions всегда возвращает корректные размеры", () => {
    const garbage: Dimensions[] = [
      { a: -5, b: 999_999, c: 0, d: 99_999, e: 4 },
      { a: Number.NaN },
      {}
    ];
    for (const shape of SHAPE_KINDS) {
      for (const dims of garbage) {
        assert.deepEqual(validateDimensions(shape, clampDimensions(shape, dims)), {}, `${shape} ${JSON.stringify(dims)}`);
      }
    }
  });
});

describe("изделие целиком", () => {
  const base = {
    shape: "straight" as const,
    dims: { a: 2000, b: 600 },
    cornerRadius: 50,
    roundedCorners: [] as string[],
    edgeSides: ["s0", "s1", "s2", "s3"],
    backsplashSides: []
  };

  it("длины кромки и бортика считаются по выбранным сторонам", () => {
    const m = measureItem({ ...base, edgeSides: ["s1", "s2", "s3"], backsplashSides: ["s0"] });
    assert.equal(m.edgeLengthMm, 600 + 2000 + 600);
    assert.equal(m.backsplashLengthMm, 2000);
  });

  it("сторона не может быть и кромкой, и бортиком; чужие стороны отклоняются", () => {
    assert.ok(validateItem({ ...base, backsplashSides: ["s0"] }).sides);
    assert.ok(validateItem({ ...base, edgeSides: ["s9"] }).sides);
  });

  it("радиус скругления ограничен половиной короткой стороны", () => {
    assert.equal(maxCornerRadius("straight", { a: 2000, b: 600 }), 300);
    assert.equal(maxCornerRadius("straight", { a: 2000, b: 200 }), 100);
    assert.equal(maxCornerRadius("radial", defaultDimensions("radial")), 262);
    assert.deepEqual(validateItem({ ...base, cornerRadius: 50 }), {});
    // Нет отмеченных углов — радиус ограничен только общим пределом.
    assert.deepEqual(validateItem({ ...base, dims: { a: 2000, b: 200 }, cornerRadius: 150 }), {});
    assert.ok(validateItem({ ...base, cornerRadius: 301 }).cornerRadius);
  });

  it("радиус проверяется по самому тесному из ОТМЕЧЕННЫХ углов", () => {
    const l = { ...base, shape: "l-shape" as const, dims: { a: 2000, b: 1500, c: 100, d: 600 }, edgeSides: [] };
    assert.deepEqual(validateItem({ ...l, roundedCorners: ["c0"], cornerRadius: 150 }), {});
    assert.ok(validateItem({ ...l, roundedCorners: ["c0", "c2"], cornerRadius: 150 }).cornerRadius);
    assert.deepEqual(validateItem({ ...l, roundedCorners: ["c0", "c2"], cornerRadius: 50 }), {});
    assert.ok(validateItem({ ...l, roundedCorners: ["c1"], cornerRadius: 60 }).cornerRadius); // (a, 0): сторона C = 100
  });

  it("отрицательный, дробной и нечисловой радиус отклоняется", () => {
    for (const cornerRadius of [-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.ok(validateItem({ ...base, cornerRadius }).cornerRadius, String(cornerRadius));
    }
    assert.deepEqual(validateItem({ ...base, cornerRadius: 0 }), {});
  });

  it("неверные и повторяющиеся id углов отклоняются", () => {
    assert.ok(validateItem({ ...base, roundedCorners: ["c9"] }).roundedCorners);
    assert.ok(validateItem({ ...base, roundedCorners: ["s0"] }).roundedCorners);
    assert.ok(validateItem({ ...base, roundedCorners: ["c0", "c0"] }).roundedCorners);
    // c4 есть у Г-образной, но не у прямой: после смены формы такой id недопустим.
    assert.ok(validateItem({ ...base, roundedCorners: ["c4"] }).roundedCorners);
    assert.deepEqual(validateItem({ ...base, shape: "l-shape", dims: { a: 2000, b: 1500, c: 600, d: 600 }, roundedCorners: ["c4"], edgeSides: [] }), {});
    assert.deepEqual(validateItem({ ...base, roundedCorners: ["c0", "c3"] }), {});
  });

  it("число скруглённых углов — число отмеченных; радиус 0 или пустой выбор — ноль", () => {
    assert.equal(measureItem({ ...base, roundedCorners: ["c0", "c2"] }).roundedCorners, 2);
    assert.equal(measureItem({ ...base, roundedCorners: ["c0", "c1", "c2", "c3"] }).roundedCorners, 4);
    assert.equal(measureItem({ ...base, roundedCorners: [] }).roundedCorners, 0);
    assert.equal(measureItem({ ...base, roundedCorners: ["c0"], cornerRadius: 0 }).roundedCorners, 0);
    // Лишние и повторные id в расчёт не попадают.
    assert.equal(measureItem({ ...base, roundedCorners: ["c0", "c0", "c9"] }).roundedCorners, 1);
    const l = { ...base, shape: "l-shape" as const, dims: { a: 2000, b: 1500, c: 600, d: 600 }, edgeSides: [] };
    assert.equal(measureItem({ ...l, roundedCorners: ["c3", "c5"] }).roundedCorners, 2); // с внутренним углом
  });
});
