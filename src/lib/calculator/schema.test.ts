import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculatorInputSchema, isCatalogId, MAX_ITEMS, submitSchema } from "./schema";

/** Корректное изделие; тесты портят по одному полю. */
const item = (patch: Record<string, unknown> = {}) => ({
  id: "i1",
  shape: "straight",
  dims: { a: 2000, b: 600 },
  cornerRadius: 0,
  roundedCorners: [],
  edgeSides: [],
  backsplashSides: [],
  ...patch
});

const input = (patch: Record<string, unknown> = {}) => ({ items: [item()], services: [], ...patch });

const submit = (patch: Record<string, unknown> = {}) =>
  input({ materialId: "7", name: "Анна", phone: "+7 900 000-00-00", consent: true, ...patch });

const ok = (schema: typeof calculatorInputSchema | typeof submitSchema, value: unknown) => schema.safeParse(value).success;

describe("calculatorInputSchema: изделия", () => {
  it("корректный вход проходит", () => {
    assert.equal(ok(calculatorInputSchema, input()), true);
  });

  it("NaN и Infinity в размерах отклоняются", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: bad, b: 600 } })] })), false, String(bad));
    }
  });

  it("NaN и Infinity в радиусе отклоняются", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(ok(calculatorInputSchema, input({ items: [item({ cornerRadius: bad })] })), false, String(bad));
    }
  });

  it("дробные размеры и дробный радиус отклоняются", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 2000.5, b: 600 } })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ cornerRadius: 10.5, roundedCorners: ["c0"] })] })), false);
  });

  it("размеры вне допустимого диапазона отклоняются", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 99, b: 600 } })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 6001, b: 600 } })] })), false);
  });

  it("повторяющиеся и неизвестные углы отклоняются", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ roundedCorners: ["c0", "c0"], cornerRadius: 10 })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ roundedCorners: ["c9"], cornerRadius: 10 })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ roundedCorners: ["c0", "c1"], cornerRadius: 10 })] })), true);
  });

  it("радиус больше предела угла отклоняется (предел — половина короткой стороны, не больше 300 мм)", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ roundedCorners: ["c0"], cornerRadius: 301 })] })), false);
    // Ширина 100 мм: предел радиуса 50.
    const narrow = { dims: { a: 2000, b: 100 }, roundedCorners: ["c0"] };
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ ...narrow, cornerRadius: 50 })] })), true);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ ...narrow, cornerRadius: 51 })] })), false);
  });

  it(`не больше ${MAX_ITEMS} изделий: 20 проходит, 21 — нет`, () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => item({ id: `i${i}` }));
    assert.equal(ok(calculatorInputSchema, input({ items: many(MAX_ITEMS) })), true);
    assert.equal(ok(calculatorInputSchema, input({ items: many(MAX_ITEMS + 1) })), false);
  });

  it("пустой список изделий и дубликат id изделия отклоняются", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item(), item()] })), false);
  });

  it("неизвестная сторона и пересечение кромки с бортиком отклоняются", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ edgeSides: ["s9"] })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ edgeSides: ["s0"], backsplashSides: ["s0"] })] })), false);
  });
});

describe("calculatorInputSchema: ключи dims", () => {
  it("лишний ключ — ошибка", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 2000, b: 600, zzz: 1 } })] })), false);
  });

  it("лишний ключ другой формы — ошибка (у прямой нет «c»)", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 2000, b: 600, c: 600 } })] })), false);
  });

  it("огромное значение под чужим ключом ({zzz: 1e308}) — ошибка", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 2000, b: 600, zzz: 1e308 } })] })), false);
  });

  it("50 лишних ключей — ошибка", () => {
    const dims: Record<string, number> = { a: 2000, b: 600 };
    for (let i = 0; i < 50; i += 1) dims[`k${i}`] = i;
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims })] })), false);
  });

  it("собственный ключ __proto__ (из JSON) — ошибка", () => {
    const dims = JSON.parse('{"a":2000,"b":600,"__proto__":1}');
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims })] })), false);
  });

  it("обязательные ключи: отсутствующий размер — ошибка", () => {
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: { a: 2000 } })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ dims: {} })] })), false);
    assert.equal(ok(calculatorInputSchema, input({ items: [item({ shape: "l-shape", dims: { a: 2000, b: 1500, c: 600 } })] })), false);
  });

  it("в результате остаются только ключи фигуры (нужные размеры)", () => {
    const parsed = calculatorInputSchema.safeParse(
      input({ items: [item({ shape: "l-shape", dims: { a: 2000, b: 1500, c: 600, d: 600 } })] })
    );
    assert.equal(parsed.success, true);
    if (parsed.success) assert.deepEqual(Object.getOwnPropertyNames(parsed.data.items[0].dims).sort(), ["a", "b", "c", "d"]);
  });
});

describe("calculatorInputSchema: идентификаторы каталога", () => {
  it("допустимые id", () => {
    for (const id of ["1", "7", "42", "123456789"]) {
      assert.equal(isCatalogId(id), true, id);
      assert.equal(ok(calculatorInputSchema, input({ materialId: id })), true, id);
    }
  });

  it("«007», «0», 10+ цифр, 18 цифр, пробелы, знаки и дроби отклоняются", () => {
    for (const id of ["007", "0", "", "1234567890", "123456789012345678", "9007199254740993", " 7", "7 ", "-7", "7.5", "1e3", "abc"]) {
      assert.equal(isCatalogId(id), false, JSON.stringify(id));
      assert.equal(ok(calculatorInputSchema, input({ materialId: id })), false, JSON.stringify(id));
    }
  });

  it("то же для остальных ссылок: толщина, профиль, бортик, мойка, услуги", () => {
    for (const field of ["thicknessId", "profileId", "backsplashId", "sinkId"]) {
      assert.equal(ok(calculatorInputSchema, input({ [field]: "007" })), false, field);
      assert.equal(ok(calculatorInputSchema, input({ [field]: "5" })), true, field);
    }
    assert.equal(ok(calculatorInputSchema, input({ services: [{ serviceId: "007", quantity: 1 }] })), false);
    assert.equal(ok(calculatorInputSchema, input({ services: [{ serviceId: "7", quantity: 1 }] })), true);
  });

  it("дубликат услуги отклоняется, количество должно быть положительным", () => {
    const twice = [
      { serviceId: "7", quantity: 1 },
      { serviceId: "7", quantity: 2 }
    ];
    assert.equal(ok(calculatorInputSchema, input({ services: twice })), false);
    assert.equal(ok(calculatorInputSchema, input({ services: [{ serviceId: "7", quantity: 0 }] })), false);
    assert.equal(ok(calculatorInputSchema, input({ services: [{ serviceId: "7", quantity: Number.NaN }] })), false);
  });
});

describe("calculatorInputSchema: «подброшенные» поля", () => {
  it("price, total и прочее отбрасываются на всех уровнях", () => {
    const parsed = calculatorInputSchema.safeParse({
      items: [item({ price: 1, total: 1, areaSqm: 99 })],
      services: [{ serviceId: "7", quantity: 1, price: 1, name: "Бесплатно" }],
      materialId: "7",
      price: 1,
      pricePerSqm: 1,
      total: 1,
      estimate: { total: 1 }
    });
    assert.equal(parsed.success, true);
    if (!parsed.success) return;
    const flat = JSON.stringify(parsed.data);
    for (const forbidden of ["price", "total", "pricePerSqm", "estimate", "areaSqm", "Бесплатно"]) {
      assert.equal(flat.includes(forbidden), false, forbidden);
    }
    assert.deepEqual(Object.keys(parsed.data).sort(), ["items", "materialId", "services"]);
  });
});

describe("submitSchema", () => {
  it("корректная заявка проходит, согласие и имя обязательны", () => {
    assert.equal(ok(submitSchema, submit()), true);
  });

  it("без согласия или с consent=false отклоняется", () => {
    assert.equal(ok(submitSchema, submit({ consent: false })), false);
    assert.equal(ok(submitSchema, submit({ consent: "true" })), false);
    const withoutConsent = submit();
    delete (withoutConsent as Record<string, unknown>).consent;
    assert.equal(ok(submitSchema, withoutConsent), false);
  });

  it("пустое имя (в том числе из пробелов) и слишком короткое отклоняются", () => {
    for (const name of ["", "   ", "А"]) assert.equal(ok(submitSchema, submit({ name })), false, JSON.stringify(name));
  });

  it("материал обязателен, и его id проверяется так же строго", () => {
    const noMaterial = submit();
    delete (noMaterial as Record<string, unknown>).materialId;
    assert.equal(ok(submitSchema, noMaterial), false);
    assert.equal(ok(submitSchema, submit({ materialId: "007" })), false);
  });

  it("заполненное скрытое поле-приманка отклоняется схемой, пустое — нет", () => {
    assert.equal(ok(submitSchema, submit({ website: "http://spam" })), false);
    assert.equal(ok(submitSchema, submit({ website: "" })), true);
  });

  it("лишние ключи dims отклоняются и здесь, цены и суммы отбрасываются", () => {
    assert.equal(ok(submitSchema, submit({ items: [item({ dims: { a: 2000, b: 600, zzz: 1 } })] })), false);
    const parsed = submitSchema.safeParse(submit({ total: 1, price: 1 }));
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal("total" in parsed.data || "price" in parsed.data, false);
  });
});
