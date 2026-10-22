import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { parsePriceList, PriceListError, type PriceRow } from "./price-list";
import { normalizeTitle, type MaterialLike } from "@/lib/catalog/identity";
import { matchPrices } from "./price-match";

let nextLine = 1;
const row = (brand: string, title: string, price = 10000): PriceRow => ({
  brand,
  title,
  price,
  line: nextLine++,
  raw: `* ${title} — от ${price} ₽/м²`
});

let nextId = 1;
const mat = (brand: string, name: string, sku?: string): MaterialLike => ({ id: nextId++, brand, name, sku });

/** Единственное соответствие: возвращает id найденного материала. */
function matchedId(rows: PriceRow[], materials: MaterialLike[]): Array<number | string> {
  const result = matchPrices(rows, materials);
  assert.equal(result.notFound.length, 0, JSON.stringify(result.notFound.map((p) => p.reason)));
  assert.equal(result.ambiguous.length, 0, JSON.stringify(result.ambiguous.map((p) => p.reason)));
  return result.matched.map((m) => m.material.id);
}

describe("нормализация названий прайса", () => {
  it("регистр не важен", () => {
    assert.equal(normalizeTitle("BQ 8926 Calacatta"), normalizeTitle("Bq 8926 calacatta"));
  });

  it("все признаки матовости дают один токен mat", () => {
    for (const variant of ["(Мат)", "(мат)", "(Матовый)", "(матовый)", "Mat", "Matt", "Matovyy", "Мат"]) {
      assert.equal(normalizeTitle(`Canvas ${variant}`), "canvas mat", variant);
    }
  });

  it("токен mat не выбрасывается, а слова с «mat» внутри не трогаются", () => {
    assert.notEqual(normalizeTitle("Noble Arco"), normalizeTitle("Noble Arco (мат)"));
    assert.equal(normalizeTitle("Materica"), "materica");
  });

  it("(5мм) и 5mm — одно и то же", () => {
    assert.equal(normalizeTitle("BQ 5260 Beton (5мм) (Мат)"), "bq 5260 beton 5mm mat");
    assert.equal(normalizeTitle("Bq 5260 Beton 5mm Mat"), "bq 5260 beton 5mm mat");
  });

  it("опечатки исходных названий не исправляются", () => {
    assert.notEqual(normalizeTitle("CH949 Charocal"), normalizeTitle("CH949 Charcoal"));
  });
});

describe("сопоставление прайса с БД", () => {
  it("глянцевый и матовый варианты — разные позиции", () => {
    const gloss = mat("Technistone", "Noble Arco");
    const matte = mat("Technistone", "Noble Arco Mat");
    const result = matchPrices(
      [row("Technistone", "Noble Arco", 25817), row("Technistone", "Noble Arco (мат)", 26556)],
      [matte, gloss]
    );
    assert.equal(result.matched.length, 2);
    const byTitle = new Map(result.matched.map((m) => [m.row.title, m.material.id]));
    assert.equal(byTitle.get("Noble Arco"), gloss.id);
    assert.equal(byTitle.get("Noble Arco (мат)"), matte.id);
  });

  it("Primax: «(Мат)» и «Mat» — один и тот же матовый вариант", () => {
    const gloss = mat("Primax", "Snow White", "111");
    const matte = mat("Primax", "Snow White Mat", "111");
    assert.deepEqual(
      matchedId([row("Primax", "111 Snow White (Мат)"), row("Primax", "111 Snow White")], [gloss, matte]),
      [matte.id, gloss.id]
    );
  });

  it("Belenco: артикул не уникален, различает остаток названия (Seta)", () => {
    const plain = mat("Belenco", "Premium White", "1010");
    const seta = mat("Belenco", "Premium White Seta", "1010");
    assert.deepEqual(
      matchedId([row("Belenco", "1010 Premium White Seta"), row("Belenco", "1010 Premium White")], [plain, seta]),
      [seta.id, plain.id]
    );
  });

  it("Avant Quartz: кириллица в прайсе, транслит в БД — по артикулу", () => {
    const m = mat("Avant Quartz", "Kalakatta Vive Print", "5754");
    const result = matchPrices([row("Avant Quartz", "5754 Калакатта Вивье (Print)")], [m]);
    assert.equal(result.matched[0]?.material.id, m.id);
    assert.equal(result.matched[0]?.via, "sku");
  });

  it("Avarus: R104 и RM104 — разные артикулы, матовость сверяется", () => {
    const glossy = mat("Avarus", "Belaya Tayga", "R104");
    const matte = mat("Avarus", "Belaya Tayga Mat", "RM104");
    assert.deepEqual(
      matchedId([row("Avarus", "RM104 Белая Тайга Мат"), row("Avarus", "R104 Белая Тайга")], [glossy, matte]),
      [matte.id, glossy.id]
    );
  });

  it("по артикулу совпал, но матовость противоречит -> неоднозначно, не угадываем", () => {
    const m = mat("Avant Quartz", "Evri Matovyy", "8044");
    const result = matchPrices([row("Avant Quartz", "8044 Эври")], [m]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.ambiguous.length, 1);
  });

  it("регистр: «BQ 8926» в прайсе и «Bq 8926» в БД", () => {
    const m = mat("Vicostone", "Calacatta Caldia Mat", "Bq 8926");
    assert.deepEqual(matchedId([row("Vicostone", "BQ 8926 Calacatta Caldia (Мат)")], [m]), [m.id]);
  });

  it("Vicostone: «(5мм)» в прайсе и «5mm» в БД", () => {
    const m = mat("Vicostone", "Beton 5mm Mat", "Bq 5260");
    assert.deepEqual(matchedId([row("Vicostone", "BQ 5260 Beton (5мм) (Мат)")], [m]), [m.id]);
  });

  it("бренды без артикула (Smart Quartz): только по названию", () => {
    const m = mat("Smart Quartz", "Crema Marfil Matovyy");
    assert.deepEqual(matchedId([row("Smart Quartz", "Crema Marfil (Матовый)")], [m]), [m.id]);
  });

  it("бренд из другого бренда не подходит", () => {
    const result = matchPrices([row("Radianz", "Carola")], [mat("Belenco", "Carola")]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.notFound.length, 1);
    assert.deepEqual(result.missingBrands, ["Radianz"]);
  });

  it("неоднозначность в БД (две записи с одним ключом) — ошибка, а не выбор первой", () => {
    const a = mat("Primax", "Ivory White", "100");
    const b = mat("Primax", "IVORY WHITE", "100");
    const result = matchPrices([row("Primax", "100 Ivory White")], [a, b]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.ambiguous.length, 1);
    assert.equal(result.ambiguous[0].candidates.length, 2);
  });

  it("повтор артикула в БД у sku-бренда — неоднозначно", () => {
    const result = matchPrices(
      [row("Avarus", "R500 Жемчуг Приморья")],
      [mat("Avarus", "Zhemchug Primorya", "R500"), mat("Avarus", "Zhemchug Primorya copy", "R500")]
    );
    assert.equal(result.ambiguous.length, 1);
  });

  it("повтор строки в прайсе — неоднозначно для обеих строк", () => {
    const result = matchPrices([row("Primax", "100 Ivory White"), row("Primax", "100 ivory white")], [mat("Primax", "Ivory White", "100")]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.ambiguous.length, 2);
  });

  it("опечатка не «подгоняется»: Charcoal не равно Charocal", () => {
    const result = matchPrices([row("Radianz", "CH949 Charcoal")], [mat("Radianz", "Charocal", "CH949")]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.notFound.length, 1);
  });

  it("материалы без строки в прайсе попадают в unusedMaterials", () => {
    const extra = mat("Primax", "Unlisted", "999");
    const result = matchPrices([row("Primax", "100 Ivory White")], [mat("Primax", "Ivory White", "100"), extra]);
    assert.deepEqual(result.unusedMaterials, [extra]);
  });
});

describe("разбор файла прайса", () => {
  const sample = [
    "Ниже представлен список.",
    "",
    "---",
    "",
    "### 1. [Aleph Stone]",
    "",
    "* A35 Bianco Marble — от 17 771 ₽/м²",
    "* A69 Artico Perlato (Мат) — от 25\u00A0872 ₽/м²",
    "",
    "---",
    "",
    "### 2. [Avant Quartz]",
    "* 9603 Сен-Мало — от 9997 ₽/м²"
  ].join("\r\n");

  it("читает бренды, цены с пробелами (в том числе неразрывными) и дефис в названии", () => {
    const list = parsePriceList(sample);
    assert.deepEqual(list.brands, ["Aleph Stone", "Avant Quartz"]);
    assert.deepEqual(
      list.rows.map((r) => [r.brand, r.title, r.price]),
      [
        ["Aleph Stone", "A35 Bianco Marble", 17771],
        ["Aleph Stone", "A69 Artico Perlato (Мат)", 25872],
        ["Avant Quartz", "9603 Сен-Мало", 9997]
      ]
    );
  });

  it("нераспознанная строка останавливает разбор и называет номер строки", () => {
    const broken = "### 1. [Primax]\n* 100 Ivory White — от 13 681 руб.\n";
    assert.throws(
      () => parsePriceList(broken),
      (error: unknown) => error instanceof PriceListError && error.line === 2 && error.text.includes("руб."),
    );
  });

  it("неправильная группировка тысяч и позиция до заголовка — ошибки", () => {
    assert.throws(() => parsePriceList("### 1. [A]\n* X — от 1 2345 ₽/м²"), PriceListError);
    assert.throws(() => parsePriceList("* X — от 100 ₽/м²\n### 1. [A]"), PriceListError);
  });

  it("повторный бренд — ошибка", () => {
    assert.throws(() => parsePriceList("### 1. [A]\n### 2. [A]"), PriceListError);
  });

  it("настоящий файл scripts/data/material-prices.txt разбирается целиком: 15 брендов, цены целые и больше нуля", () => {
    const list = parsePriceList(readFileSync(new URL("../../../scripts/data/material-prices.txt", import.meta.url), "utf8"));
    assert.equal(list.brands.length, 15);
    assert.ok(list.rows.length > 0);
    for (const r of list.rows) assert.ok(Number.isInteger(r.price) && r.price > 0, r.raw);
  });
});
