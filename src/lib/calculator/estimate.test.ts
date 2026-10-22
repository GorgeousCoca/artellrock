import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildEstimate, serviceQuantity } from "./estimate";
import { calculatorInputSchema, submitSchema, type CalculatorInput } from "./schema";
import type { ServiceRecord } from "./types";

// Цены ниже — тестовые данные (фикстуры). В коде приложения цен нет.
const material = {
  id: "1",
  brand: "Test Brand",
  name: "Decor",
  pricePerSqm: 10_000,
  sheetLengthMm: 3000,
  sheetWidthMm: 1400,
  formats: [],
  thicknessesMm: [],
  shades: [],
  textures: []
};
const profile = { id: "2", kind: "profile" as const, name: "Профиль R", pricePerMeter: 500 };
const thickness = { id: "3", kind: "thickness" as const, name: "Сэндвич 24", pricePerMeter: 2000 };
const backsplash = { id: "4", name: "Накладной бортик", pricePerMeter: 700 };
const sink = { id: "5", type: "undermount" as const, name: "Вырез под столешницу", price: 6000 };

const service = (over: Partial<ServiceRecord> & Pick<ServiceRecord, "id" | "quantityMode" | "unit">): ServiceRecord => ({
  name: `Услуга ${over.id}`,
  category: "processing",
  price: 100,
  autoApply: false,
  ...over
});

const straight = (over: Partial<CalculatorInput["items"][number]> = {}): CalculatorInput["items"][number] => ({
  id: "item-1",
  shape: "straight",
  dims: { a: 2000, b: 600 },
  // Радиус по умолчанию есть, а отмеченных углов нет: в расчёт скругление не попадает.
  cornerRadius: 50,
  roundedCorners: [],
  edgeSides: ["s0", "s1", "s2", "s3"],
  backsplashSides: [],
  ...over
});

const input = (over: Partial<CalculatorInput> = {}): CalculatorInput => ({
  items: [straight()],
  services: [],
  ...over
});

describe("buildEstimate", () => {
  it("материал: площадь × цена за м²", () => {
    const e = buildEstimate(input({ materialId: "1" }), { material, services: [] });
    assert.equal(e.lines.length, 1);
    assert.equal(e.lines[0].quantity, 1.2);
    assert.equal(e.lines[0].amount, 12_000);
    assert.equal(e.total, 12_000);
  });

  it("площадь Г-образной учитывает форму, а не габариты", () => {
    const l = straight({ shape: "l-shape", dims: { a: 2000, b: 1500, c: 600, d: 600 }, edgeSides: [] });
    const e = buildEstimate(input({ items: [l], materialId: "1" }), { material, services: [] });
    assert.equal(e.totals.areaSqm, 1.74); // а не 2.0 × 1.5 = 3.0
    assert.equal(e.total, 17_500); // 1.74 × 10 000 = 17 400 → 17 500
  });

  it("кромка, толщина и бортик считаются по выбранным сторонам", () => {
    const item = straight({ edgeSides: ["s1", "s2", "s3"], backsplashSides: ["s0"] });
    const e = buildEstimate(input({ items: [item], thicknessId: "3", profileId: "2", backsplashId: "4" }), {
      thickness,
      profile,
      backsplash,
      services: []
    });
    const byKind = Object.fromEntries(e.lines.map((l) => [l.kind, l]));
    assert.equal(byKind.thickness.quantity, 3.2);
    assert.equal(byKind.thickness.amount, 6500); // 6 400 → 6 500
    assert.equal(byKind.profile.amount, 1500); // 1 600 → 1 500
    assert.equal(byKind.backsplash.quantity, 2);
    assert.equal(byKind.backsplash.amount, 1500); // 1 400 → 1 500
  });

  it("без профиля, бортика и мойки этих строк нет", () => {
    const e = buildEstimate(input({ materialId: "1", thicknessId: "3" }), { material, thickness, services: [] });
    assert.deepEqual(
      e.lines.map((line) => line.kind),
      ["material", "thickness"]
    );
    assert.equal(e.warnings.length, 0);
  });

  it("мойка — одна позиция; итог равен сумме строк", () => {
    const e = buildEstimate(input({ materialId: "1", profileId: "2", sinkId: "5" }), { material, profile, sink, services: [] });
    assert.equal(e.total, e.lines.reduce((s, l) => s + l.amount, 0));
    assert.equal(e.lines.find((l) => l.kind === "sink")?.amount, 6000);
  });

  it("несколько изделий суммируются", () => {
    const items = [straight({ id: "a" }), straight({ id: "b", dims: { a: 1000, b: 500 } })];
    const e = buildEstimate(input({ items, materialId: "1" }), { material, services: [] });
    assert.equal(e.totals.areaSqm, 1.7);
    assert.equal(e.totals.itemCount, 2);
    assert.deepEqual(e.items.map((i) => i.areaSqm), [1.2, 0.5]);
  });

  it("число листов — по размеру листа материала", () => {
    const e = buildEstimate(input({ materialId: "1" }), { material, services: [] });
    assert.equal(e.sheets, 0.29); // 1.2 / (3.0 × 1.4)
    assert.equal(buildEstimate(input({ materialId: "1" }), { material: { ...material, sheetLengthMm: undefined }, services: [] }).sheets, null);
  });

  it("автоматические услуги входят всегда; количество берётся из геометрии", () => {
    const auto = [
      service({ id: "10", quantityMode: "perimeter", unit: "meter", price: 600, autoApply: true }),
      service({ id: "11", quantityMode: "area", unit: "sqm", price: 4000, autoApply: true }),
      service({ id: "12", quantityMode: "once", unit: "piece", price: 1000, autoApply: true })
    ];
    const e = buildEstimate(input(), { services: auto });
    assert.deepEqual(
      e.lines.map((l) => [l.quantity, l.amount]),
      [
        [5.2, 3000], // 3 120 → 3 000
        [1.2, 4750], // 4 800 → 4 750
        [1, 1000]
      ]
    );
  });

  it("клиент не может переопределить количество услуги, посчитанной по геометрии", () => {
    const svc = service({ id: "20", quantityMode: "perimeter", unit: "meter", price: 100 });
    const e = buildEstimate(input({ services: [{ serviceId: "20", quantity: 999 }] }), { services: [svc] });
    assert.equal(e.lines[0].quantity, 5.2);
  });

  it("услуга с количеством от клиента: штуки округляются до целых, метры — до сотых", () => {
    const pcs = service({ id: "30", quantityMode: "user", unit: "piece", price: 250 });
    const m = service({ id: "31", quantityMode: "user", unit: "meter", price: 100 });
    const e = buildEstimate(
      input({
        services: [
          { serviceId: "30", quantity: 2.6 },
          { serviceId: "31", quantity: 1.234 }
        ]
      }),
      { services: [pcs, m] }
    );
    assert.deepEqual(
      e.lines.map((l) => [l.quantity, l.amount]),
      [
        [3, 750],
        [1.23, 0] // 123 ₽ ближе к 0, чем к 250
      ]
    );
  });

  it("скругление углов: услуга считается по числу ОТМЕЧЕННЫХ углов; без отмеченных не применяется", () => {
    const svc = service({ id: "40", quantityMode: "rounded-corners", unit: "piece", price: 300 });
    const request = { services: [{ serviceId: "40", quantity: 1 }] };

    const two = buildEstimate(input({ items: [straight({ roundedCorners: ["c0", "c2"] })], ...request }), { services: [svc] });
    assert.equal(two.lines[0].quantity, 2);
    assert.equal(two.total, 500); // 2 × 300 = 600 → 500
    assert.equal(two.totals.roundedCorners, 2);

    const all = buildEstimate(input({ items: [straight({ roundedCorners: ["c0", "c1", "c2", "c3"] })], ...request }), { services: [svc] });
    assert.equal(all.lines[0].quantity, 4);
    assert.equal(all.total, 1250); // 4 × 300 = 1 200 → 1 250

    // Внутренний угол Г-образной — такой же угол, как остальные.
    const l = straight({
      shape: "l-shape",
      dims: { a: 2000, b: 1500, c: 600, d: 600 },
      edgeSides: [],
      roundedCorners: ["c3", "c5"]
    });
    assert.equal(buildEstimate(input({ items: [l], ...request }), { services: [svc] }).lines[0].quantity, 2);

    // Углы суммируются по всем изделиям.
    const items = [straight({ id: "a", roundedCorners: ["c0"] }), straight({ id: "b", roundedCorners: ["c1", "c2"] })];
    assert.equal(buildEstimate(input({ items, ...request }), { services: [svc] }).lines[0].quantity, 3);

    // Радиус по умолчанию есть, но углы не отмечены: услуга не применяется.
    const plain = buildEstimate(input(request), { services: [svc] });
    assert.equal(plain.lines.length, 0);
    assert.equal(plain.warnings.length, 2); // услуга не применена + материал не выбран
    assert.ok(plain.warnings.some((w) => w.includes("не применена")));
  });

  it("предупреждает, если кромка выбрана, а сторон с кромкой нет", () => {
    const e = buildEstimate(input({ items: [straight({ edgeSides: [] })], profileId: "2" }), { profile, services: [] });
    assert.equal(e.lines.length, 0);
    assert.ok(e.warnings.some((w) => w.includes("кромк")));
  });

  it("строка 1,2 м² × 17 750 округляется до 21 250; цена за единицу остаётся как в каталоге", () => {
    const stone = { ...material, pricePerSqm: 17_750 };
    const e = buildEstimate(input({ materialId: "1" }), { material: stone, services: [] });
    assert.equal(e.lines[0].quantity, 1.2);
    assert.equal(e.lines[0].unitPrice, 17_750);
    assert.equal(e.lines[0].amount, 21_250); // 1.2 × 17 750 = 21 300 → 21 250
    assert.equal(e.total, 21_250);
    assert.equal(e.total % 250, 0);
  });

  it("итог равен сумме округлённых строк и кратен 250", () => {
    const e = buildEstimate(input({ materialId: "1", profileId: "2", sinkId: "5" }), {
      material: { ...material, pricePerSqm: 17_750 },
      profile,
      sink,
      services: []
    });
    assert.equal(e.total, e.lines.reduce((sum, line) => sum + line.amount, 0));
    assert.equal(e.total % 250, 0);
    for (const line of e.lines) assert.equal(line.amount % 250, 0, line.kind);
  });

  it("цена за единицу не округляется отдельно сверх значения в каталоге", () => {
    const raw = { ...material, pricePerSqm: 17_771 };
    const e = buildEstimate(input({ materialId: "1" }), { material: raw, services: [] });
    assert.equal(e.lines[0].unitPrice, 17_771);
    assert.equal(e.lines[0].amount % 250, 0);
    assert.notEqual(e.lines[0].unitPrice % 250, 0);
  });

  it("serviceQuantity: режим once/rounded-corners/edge", () => {
    const totals = { itemCount: 1, areaSqm: 1.234, perimeterM: 5.2, edgeM: 3.2, backsplashM: 2, roundedCorners: 4 };
    assert.equal(serviceQuantity({ quantityMode: "once", unit: "piece" }, totals), 1);
    assert.equal(serviceQuantity({ quantityMode: "edge", unit: "meter" }, totals), 3.2);
    assert.equal(serviceQuantity({ quantityMode: "area", unit: "sqm" }, totals), 1.23);
  });
});

describe("схема входа (граница доверия)", () => {
  it("принимает корректный вход", () => {
    assert.ok(calculatorInputSchema.safeParse(input({ materialId: "12" })).success);
  });

  it("отклоняет геометрию, которая не проходит валидацию", () => {
    const bad = input({ items: [straight({ shape: "l-shape", dims: { a: 1000, b: 1500, c: 600, d: 990 } })] });
    assert.equal(calculatorInputSchema.safeParse(bad).success, false);
  });

  it("отклоняет неверные углы: чужие id, повторы и радиус больше предела отмеченного угла", () => {
    const parse = (over: Partial<CalculatorInput["items"][number]>) =>
      calculatorInputSchema.safeParse(input({ items: [straight(over)] })).success;

    assert.equal(parse({ roundedCorners: ["c0", "c3"] }), true);
    assert.equal(parse({ roundedCorners: ["c4"] }), false); // у прямой только c0…c3
    assert.equal(parse({ roundedCorners: ["c0", "c0"] }), false);
    assert.equal(parse({ roundedCorners: ["s0"] }), false);
    assert.equal(parse({ roundedCorners: Array.from({ length: 9 }, (_, i) => `c${i}`) }), false);
    assert.equal(parse({ dims: { a: 2000, b: 200 }, roundedCorners: ["c0"], cornerRadius: 150 }), false);
    assert.equal(parse({ dims: { a: 2000, b: 200 }, roundedCorners: ["c0"], cornerRadius: 100 }), true);
    assert.equal(parse({ cornerRadius: -5 }), false);
    // Поле roundedCorners обязательно.
    const { roundedCorners: _omit, ...withoutCorners } = straight();
    void _omit;
    assert.equal(calculatorInputSchema.safeParse(input({ items: [withoutCorners as never] })).success, false);
  });

  it("отклоняет нечисловые и отрицательные идентификаторы каталога, дубликаты и пустой список изделий", () => {
    assert.equal(calculatorInputSchema.safeParse(input({ materialId: "abc" })).success, false);
    assert.equal(calculatorInputSchema.safeParse(input({ materialId: "-1" })).success, false);
    assert.equal(calculatorInputSchema.safeParse(input({ items: [] })).success, false);
    assert.equal(calculatorInputSchema.safeParse(input({ items: [straight(), straight()] })).success, false);
    assert.equal(
      calculatorInputSchema.safeParse(input({ services: [{ serviceId: "1", quantity: 1 }, { serviceId: "1", quantity: 2 }] })).success,
      false
    );
  });

  it("схема не пропускает цены и суммы: лишние поля отбрасываются", () => {
    const parsed = calculatorInputSchema.parse({ ...input({ materialId: "1" }), total: 1, pricePerSqm: 1 });
    assert.equal("total" in parsed, false);
    assert.equal("pricePerSqm" in parsed, false);
  });

  it("отправка заявки требует материал, согласие и пустую приманку", () => {
    const ok = { ...input({ materialId: "1" }), name: "Иван", phone: "+7 965 012-30-74", consent: true as const };
    assert.ok(submitSchema.safeParse(ok).success);
    assert.equal(submitSchema.safeParse({ ...ok, consent: false }).success, false);
    assert.equal(submitSchema.safeParse({ ...ok, materialId: undefined }).success, false);
    assert.equal(submitSchema.safeParse({ ...ok, website: "http://spam" }).success, false);
  });
});
