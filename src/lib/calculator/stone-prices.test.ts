import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bulkPricesSchema,
  changePercent,
  MAX_BULK_ROWS,
  MAX_PRICE_PER_SQM,
  parsePercent,
  parsePriceAmount,
  parsePriceInput,
  planBulkUpdate,
  priceInputError,
  roundPrice,
  scalePrice,
  summarizeChanges,
  summarizePlan,
  type BulkPriceRow,
  type CurrentMaterial,
  type PriceEdit
} from "./stone-prices";

const T0 = "2026-10-12T00:00:00.000Z";
const T1 = "2026-10-12T01:00:00.000Z";

const row = (patch: Partial<BulkPriceRow> = {}): BulkPriceRow => ({ id: 1, pricePerSqm: 20000, isActive: true, updatedAt: T0, ...patch });
const stored = (patch: Partial<CurrentMaterial> = {}): CurrentMaterial => ({ id: 1, pricePerSqm: 10000, isActive: true, updatedAt: T0, ...patch });
const map = (...items: CurrentMaterial[]) => new Map(items.map((item) => [item.id, item]));

describe("bulkPricesSchema: запрос к эндпоинту", () => {
  const ok = (value: unknown) => bulkPricesSchema.safeParse(value).success;
  const rows = (n: number) => Array.from({ length: n }, (_, i) => row({ id: i + 1 }));

  it("корректный запрос проходит", () => {
    assert.equal(ok({ rows: [row()] }), true);
  });

  it("цена: только целая от 0 до максимума", () => {
    assert.equal(ok({ rows: [row({ pricePerSqm: 0 })] }), true);
    assert.equal(ok({ rows: [row({ pricePerSqm: MAX_PRICE_PER_SQM })] }), true);
    for (const bad of [-1, 0.5, 17771.5, MAX_PRICE_PER_SQM + 1, Number.NaN, Number.POSITIVE_INFINITY, 1e308]) {
      assert.equal(ok({ rows: [row({ pricePerSqm: bad })] }), false, String(bad));
    }
    assert.equal(ok({ rows: [{ ...row(), pricePerSqm: "17771" }] }), false);
  });

  it("цена не кратная 250 отклоняется", () => {
    const parsed = bulkPricesSchema.safeParse({ rows: [row({ pricePerSqm: 17771 })] });
    assert.equal(parsed.success, false);
    if (!parsed.success) assert.match(parsed.error.issues.map((issue) => issue.message).join(" "), /250/);
    assert.equal(ok({ rows: [row({ pricePerSqm: 17750 })] }), true);
    assert.equal(ok({ rows: [row({ pricePerSqm: 0 })] }), true);
  });

  it("id: положительное целое в пределах integer", () => {
    for (const bad of [0, -1, 1.5, 2_147_483_648, "7", null]) {
      assert.equal(ok({ rows: [{ ...row(), id: bad }] }), false, String(bad));
    }
  });

  it("isActive — только boolean, updatedAt — только дата", () => {
    assert.equal(ok({ rows: [{ ...row(), isActive: "true" }] }), false);
    assert.equal(ok({ rows: [{ ...row(), updatedAt: "вчера" }] }), false);
    assert.equal(ok({ rows: [{ ...row(), updatedAt: undefined }] }), false);
  });

  it(`строк: от 1 до ${MAX_BULK_ROWS}`, () => {
    assert.equal(ok({ rows: [] }), false);
    assert.equal(ok({ rows: rows(MAX_BULK_ROWS) }), true);
    assert.equal(ok({ rows: rows(MAX_BULK_ROWS + 1) }), false);
  });

  it("повтор id в одном запросе отклоняется; чужие поля отбрасываются", () => {
    assert.equal(ok({ rows: [row(), row()] }), false);
    const parsed = bulkPricesSchema.safeParse({ rows: [{ ...row(), name: "Взлом", brand: "X" }], extra: 1 });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.deepEqual(Object.keys(parsed.data.rows[0]).sort(), ["id", "isActive", "pricePerSqm", "updatedAt"]);
  });
});

describe("planBulkUpdate: план записи", () => {
  it("обычное изменение цены", () => {
    const [plan] = planBulkUpdate([row()], map(stored()));
    assert.deepEqual(plan, { id: 1, status: "update", data: { pricePerSqm: 20000, isActive: true }, forcedInactive: false });
  });

  it("совпадающее с БД значение — без изменений", () => {
    assert.equal(planBulkUpdate([row({ pricePerSqm: 10000 })], map(stored()))[0].status, "unchanged");
  });

  it("цена 0 выключает позицию автоматически", () => {
    const [plan] = planBulkUpdate([row({ pricePerSqm: 0, isActive: true })], map(stored()));
    assert.deepEqual(plan, { id: 1, status: "update", data: { pricePerSqm: 0, isActive: false }, forcedInactive: true });
  });

  it("цена 0 у уже выключенной позиции с ценой 0 — без изменений", () => {
    assert.equal(planBulkUpdate([row({ pricePerSqm: 0 })], map(stored({ pricePerSqm: 0, isActive: false })))[0].status, "unchanged");
  });

  it("переключатель без смены цены", () => {
    const [plan] = planBulkUpdate([row({ pricePerSqm: 10000, isActive: false })], map(stored()));
    assert.deepEqual(plan, { id: 1, status: "update", data: { pricePerSqm: 10000, isActive: false }, forcedInactive: false });
  });

  it("запись в БД новее присланной — конфликт, а не молчаливая перезапись", () => {
    const [plan] = planBulkUpdate([row({ updatedAt: T0 })], map(stored({ updatedAt: T1, pricePerSqm: 15000 })));
    assert.equal(plan.status, "error");
    if (plan.status === "error") {
      assert.equal(plan.code, "conflict");
      assert.match(plan.message, /другой пользователь/);
    }
  });

  it("то же время или БД старше — не конфликт", () => {
    assert.equal(planBulkUpdate([row({ updatedAt: T1 })], map(stored({ updatedAt: T0 })))[0].status, "update");
    assert.equal(planBulkUpdate([row({ updatedAt: T1 })], map(stored({ updatedAt: T1 })))[0].status, "update");
  });

  it("если итог уже совпал с БД, «новизна» записи не мешает", () => {
    assert.equal(planBulkUpdate([row({ pricePerSqm: 15000, updatedAt: T0 })], map(stored({ updatedAt: T1, pricePerSqm: 15000 })))[0].status, "unchanged");
  });

  it("несуществующий материал — ошибка not_found", () => {
    const [plan] = planBulkUpdate([row({ id: 99 })], map(stored()));
    assert.equal(plan.status === "error" && plan.code, "not_found");
  });

  it("сводка по плану", () => {
    const plan = planBulkUpdate(
      [row({ id: 1 }), row({ id: 2, pricePerSqm: 0 }), row({ id: 3, pricePerSqm: 10000 }), row({ id: 4, updatedAt: T0 })],
      map(stored({ id: 1 }), stored({ id: 2 }), stored({ id: 3 }), stored({ id: 4, updatedAt: T1 }))
    );
    assert.deepEqual(summarizePlan(plan), { updated: 2, skipped: 1, deactivated: 1, failed: 1 });
  });
});

describe("пакетные операции над ценами", () => {
  it("±N%: после процентов цена кратна 250", () => {
    assert.equal(scalePrice(17771, 5), 18750); // 18 659.55 → 18 660 → 18 750
    assert.equal(scalePrice(17771, -5), 17000); // 16 882.45 → 16 882 → 17 000
    assert.equal(scalePrice(10000, 10), 11000);
    assert.equal(scalePrice(0, 50), 0);
    assert.equal(scalePrice(12345, 3.3), 12750);
    assert.equal(scalePrice(12345, 3.3) % 250, 0);
  });

  it("результат ограничен 0…максимум и остаётся кратным 250", () => {
    assert.equal(scalePrice(1000, -99), 0); // 10 ₽ ближе к 0, чем к 250
    assert.equal(scalePrice(900_000, 1000), MAX_PRICE_PER_SQM);
  });

  it("округление до 250 / 500 / 1000 ₽", () => {
    assert.equal(roundPrice(17771, 250), 17750);
    assert.equal(roundPrice(17771, 500), 18000);
    assert.equal(roundPrice(17771, 1000), 18000);
    assert.equal(roundPrice(17499, 1000), 17000);
    assert.equal(roundPrice(125, 250), 250);
    assert.equal(roundPrice(0, 250), 0);
  });

  it("parsePercent: допустимые и недопустимые значения", () => {
    assert.equal(parsePercent("5"), 5);
    assert.equal(parsePercent(" -7,5 "), -7.5);
    assert.equal(parsePercent("+10"), 10);
    for (const bad of ["", "abc", "5%", "-100", "-150", "1001", "1e3", "--5", "NaN", "Infinity"]) {
      assert.equal(parsePercent(bad), null, bad);
    }
  });

  it("parsePriceInput: целые рубли, кратные 250; пробелы-разделители допустимы, остальное — null", () => {
    assert.equal(parsePriceInput("17750"), 17750);
    assert.equal(parsePriceInput("17 750"), 17750);
    assert.equal(parsePriceInput("0"), 0);
    assert.equal(parsePriceInput("17771"), null);
    assert.equal(parsePriceInput("17 771"), null);
    for (const bad of ["", "-5", "17,5", "17.5", "abc", "1000001", "12345678"]) assert.equal(parsePriceInput(bad), null, bad);
  });

  it("priceInputError объясняет некратность 250, а прочий ввод — общей подсказкой", () => {
    assert.equal(priceInputError("17750"), null);
    assert.match(priceInputError("17771") ?? "", /кратна 250/);
    assert.match(priceInputError("17771") ?? "", /17[\s\u00A0\u202F]?750/);
    assert.equal(parsePriceAmount("17771"), 17771);
    assert.match(priceInputError("abc") ?? "", /кратное 250/);
  });
});

describe("summarizeChanges: сводка перед сохранением", () => {
  const edit = (patch: Partial<PriceEdit> & { id: number }): PriceEdit => ({
    label: `Камень ${patch.id}`,
    oldPrice: 10000,
    newPrice: 10000,
    oldActive: true,
    newActive: true,
    ...patch
  });

  it("changePercent", () => {
    assert.equal(changePercent(10000, 12000), 20);
    assert.equal(changePercent(10000, 5000), -50);
    assert.equal(changePercent(0, 5000), null);
  });

  it("без изменений — пустая сводка", () => {
    const s = summarizeChanges([edit({ id: 1 }), edit({ id: 2 })]);
    assert.equal(s.priceChanges, 0);
    assert.equal(s.biggest.length, 0);
    assert.equal(s.large.length, 0);
  });

  it("считает изменённые цены и выделяет самые большие по проценту", () => {
    const s = summarizeChanges([
      edit({ id: 1, newPrice: 10500 }),
      edit({ id: 2, newPrice: 15000 }),
      edit({ id: 3, newPrice: 7000 }),
      edit({ id: 4 })
    ]);
    assert.equal(s.priceChanges, 3);
    assert.deepEqual(s.biggest.map((e) => e.id), [2, 3, 1]);
    assert.equal(s.biggest[0].percent, 50);
  });

  it("предупреждение: изменение больше 30% (ровно 30% — ещё нет)", () => {
    const s = summarizeChanges([edit({ id: 1, newPrice: 13000 }), edit({ id: 2, newPrice: 13001 }), edit({ id: 3, newPrice: 6999 })]);
    assert.deepEqual(s.large.map((e) => e.id).sort(), [2, 3]);
  });

  it("цена 0: позиция попадает в zeroed и willHide даже при включённом переключателе", () => {
    const s = summarizeChanges([edit({ id: 1, newPrice: 0, newActive: true })]);
    assert.deepEqual(s.zeroed.map((e) => e.id), [1]);
    assert.deepEqual(s.willHide.map((e) => e.id), [1]);
  });

  it("переключатель без смены цены учитывается отдельно", () => {
    const s = summarizeChanges([edit({ id: 1, newActive: false }), edit({ id: 2, oldActive: false, newActive: true })]);
    assert.equal(s.priceChanges, 0);
    assert.equal(s.activeOnlyChanges, 2);
    assert.deepEqual(s.willHide.map((e) => e.id), [1]);
    assert.deepEqual(s.willShow.map((e) => e.id), [2]);
  });

  it("новая цена у позиции без цены (было 0) не считается «больше 30%»", () => {
    const s = summarizeChanges([edit({ id: 1, oldPrice: 0, oldActive: false, newPrice: 17771 })]);
    assert.equal(s.priceChanges, 1);
    assert.equal(s.large.length, 0);
    assert.deepEqual(s.willShow.map((e) => e.id), [1]);
  });
});
