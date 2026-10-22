import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { parseSpecList, SpecListError } from "./spec-list";

const LEGEND = [
  "* **`[N]` (NORMAL)** — 3040 × 1440 мм",
  "* **`[N+]` (NORMAL+)** — 3100 × 1520 мм",
  "* **`[J]` (JUMBO)** — 3200 × 1600 мм",
  "* **`[J+]` (JUMBO+)** — 3300 × 1650 мм"
].join("\n");

const stone = (title: string, body: string) => `* **${title}** — ${body}`;
const fields = (patch: Partial<Record<"Формат" | "Толщина" | "Оттенок" | "Полировка" | "Фактура", string>> = {}) => {
  const values = {
    Формат: "`[N]`, `[J]`",
    Толщина: "20 мм, 30 мм",
    Оттенок: "белый",
    Полировка: "полированный",
    Фактура: "монотонный",
    ...patch
  };
  return `Формат: ${values.Формат} | Толщина: ${values.Толщина} | Оттенок: ${values.Оттенок} | Полировка: ${values.Полировка} | Фактура: ${values.Фактура}`;
};

function parse(body: string) {
  return parseSpecList(`${LEGEND}\n${body}`);
}

describe("разбор файла характеристик", () => {
  it("преамбула игнорируется, бренды идут в порядке файла, составные значения режутся по « / »", () => {
    const list = parse(
      [
        "Текст до брендов, не данные.",
        "* **Оттенок:** белый, серый",
        "",
        "---",
        "### 2. Asterum",
        stone("A-0001 Perfecta", fields({ Формат: "`[J]`" })),
        "### 1. Aleph Stone",
        stone("A82 Golden Age", fields({ Оттенок: "бежевый / белый", Фактура: "разводы / мелкие жилы" }))
      ].join("\n")
    );
    assert.deepEqual(list.brands, ["Asterum", "Aleph Stone"]);
    assert.equal(list.rows[1]?.title, "A82 Golden Age");
    assert.deepEqual(list.rows[1]?.shades, ["бежевый", "белый"]);
    assert.deepEqual(list.rows[1]?.textures, ["разводы", "мелкие жилы"]);
    assert.deepEqual(list.rows[1]?.formats, ["N", "J"]);
    assert.deepEqual(list.rows[1]?.thicknessesMm, [20, 30]);
    assert.equal(list.rows[1]?.finish, "polished");
  });

  it("порядок форматов и толщин сохраняется, [J+] не путается с [J]", () => {
    const list = parse(["### 1. A", stone("X", fields({ Формат: "`[J+]`, `[N]`", Толщина: "12 мм, 15 мм, 30 мм" }))].join("\n"));
    assert.deepEqual(list.rows[0]?.formats, ["J+", "N"]);
    assert.deepEqual(list.rows[0]?.thicknessesMm, [12, 15, 30]);
  });

  it("повреждённая строка: метка дважды — берётся последнее значение и пишется предупреждение", () => {
    const broken =
      "Формат: `[N]`, `[J+]` | Толщина: 20 мм, 30 мм | Оттенок: белый | Полировка: полированный | Фактура:0 мм, 30 мм | Оттенок: белый | Полировка: полированный | Фактура: мелкие жилы";
    const list = parse(["### 1. Vicostone", stone("BQ-2600", broken)].join("\n"));
    const row = list.rows[0];
    assert.deepEqual(row?.warnings, [
      "поле Оттенок продублировано, взято последнее значение",
      "поле Полировка продублировано, взято последнее значение",
      "поле Фактура продублировано, взято последнее значение"
    ]);
    assert.deepEqual(row?.formats, ["N", "J+"]);
    assert.deepEqual(row?.thicknessesMm, [20, 30]);
    assert.deepEqual(row?.shades, ["белый"]);
    assert.equal(row?.finish, "polished");
    assert.deepEqual(row?.textures, ["мелкие жилы"]);
  });

  it("если последнее продублированное значение вне словаря — ошибка, первое молча не подставляется", () => {
    const line = stone(
      "X",
      "Формат: `[N]` | Толщина: 20 мм | Оттенок: белый | Полировка: полированный | Фактура: монотонный | Оттенок: пурпурный"
    );
    assert.throws(
      () => parse(`### 1. A\n${line}`),
      (error: unknown) => error instanceof SpecListError && error.message.includes("пурпурный")
    );
  });

  it("нераспознанная строка камня, значение вне словаря и легенда не по словарю — ошибка с номером строки", () => {
    assert.throws(
      () => parse("### 1. A\n* **Без полей** — просто текст"),
      (error: unknown) => error instanceof SpecListError && error.line === 6 && error.text.includes("Без полей")
    );
    assert.throws(
      () => parse(`### 1. A\n${stone("X", fields({ Толщина: "18 мм" }))}`),
      (error: unknown) => error instanceof SpecListError && error.message.includes("18")
    );
    assert.throws(
      () => parse(`### 1. A\n${stone("X", fields({ Фактура: "мрамор" }))}`),
      (error: unknown) => error instanceof SpecListError && error.message.includes("мрамор")
    );
    const badLegend = LEGEND.replace("3040 × 1440", "9999 × 1440");
    assert.throws(
      () => parseSpecList(`${badLegend}\n### 1. A\n${stone("X", fields())}`),
      (error: unknown) => error instanceof SpecListError && error.message.includes("не совпадает со словарём")
    );
  });

  it("позиция до бренда, повтор бренда и неполная легенда — ошибки", () => {
    assert.throws(() => parse(`${stone("X", fields())}\n### 1. A`), SpecListError);
    assert.throws(() => parse("### 1. A\n### 2. A"), SpecListError);
    assert.throws(() => parseSpecList("### 1. A\n" + stone("X", fields())), SpecListError);
  });

  it("настоящий файл scripts/data/material-specs.txt: 15 брендов, 258 камней, BQ-2600 починен по последним полям", () => {
    const list = parseSpecList(readFileSync(new URL("../../../scripts/data/material-specs.txt", import.meta.url), "utf8"));
    assert.deepEqual(list.brands, [
      "Aleph Stone",
      "Asterum",
      "Avant Quartz",
      "Avarus",
      "Belenco",
      "Caesarstone",
      "Etna Quartz",
      "Noblle Quartz",
      "Primax",
      "Quantra Quartz",
      "Radianz",
      "Smart Quartz",
      "Still Stone",
      "Technistone",
      "Vicostone"
    ]);
    assert.equal(list.rows.length, 258);

    const warned = list.rows.filter((row) => row.warnings.length > 0);
    assert.equal(warned.length, 1);
    const bq = warned[0];
    assert.equal(bq?.title, "BQ-2600");
    assert.equal(bq?.brand, "Vicostone");
    assert.deepEqual(bq?.thicknessesMm, [20, 30]);
    assert.deepEqual(bq?.textures, ["мелкие жилы"]);
    assert.equal(bq?.finish, "polished");
    assert.deepEqual(bq?.warnings, [
      "поле Оттенок продублировано, взято последнее значение",
      "поле Полировка продублировано, взято последнее значение",
      "поле Фактура продублировано, взято последнее значение"
    ]);

    const ultra = list.rows.find((row) => row.title === "A30 Ultra White");
    assert.deepEqual(ultra?.formats, ["N", "J"]);
    const leather = list.rows.find((row) => row.title === "Q-122");
    assert.deepEqual(leather?.thicknessesMm, [15, 20, 30]);
    const thin = list.rows.find((row) => row.title === "BQ-200");
    assert.deepEqual(thin?.thicknessesMm, [12, 20, 30]);
    const off = list.rows.find((row) => row.title === "A35 Bianco Marble OFF");
    assert.equal(off?.finish, "matte");
  });
});
