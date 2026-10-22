import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeTitle, type MaterialLike } from "@/lib/catalog/identity";
import { BRAND_ALIASES, matchSpecs, specFileKey, specImportBlocked, type SpecHit } from "./spec-match";
import type { SpecRow } from "./spec-list";
import type { StoneFinish, StoneFormat } from "@/lib/calculator/taxonomy";

let nextLine = 1;
let nextId = 1;

function row(brand: string, title: string, finish: StoneFinish = "polished", shades: string[] = ["белый"]): SpecRow {
  return {
    brand,
    title,
    formats: ["N"] as StoneFormat[],
    thicknessesMm: [20, 30],
    shades,
    finish,
    textures: ["монотонный"],
    line: nextLine++,
    warnings: []
  };
}

function mat(brand: string, name: string, sku?: string): MaterialLike {
  return { id: nextId++, brand, name, sku };
}

function only(result: ReturnType<typeof matchSpecs>): SpecHit {
  assert.equal(result.notFound.length, 0, JSON.stringify(result.notFound.map((item) => item.reason)));
  assert.equal(result.ambiguous.length, 0, JSON.stringify(result.ambiguous.map((item) => item.reason)));
  assert.equal(result.matched.length, 1);
  return result.matched[0];
}

describe("ключ названия из файла характеристик", () => {
  it("OFF отбрасывается, (M) становится mat, дефис без записи в BRAND_ALIASES не трогается", () => {
    assert.equal(specFileKey("Aleph Stone", "A35 Bianco Marble OFF"), normalizeTitle("A35 Bianco Marble"));
    assert.equal(specFileKey("Aleph Stone", "A66 Storm Grey (M) OFF"), normalizeTitle("A66 Storm Grey Mat"));
    assert.equal(specFileKey("Technistone", "Noble Quartzite Matt (M)"), normalizeTitle("Noble Quartzite Mat"));
    assert.equal(specFileKey("Другой бренд", "BQ-2600"), "bq-2600");
  });

  it("алиасы брендов задокументированы и меняют только свой бренд", () => {
    for (const alias of BRAND_ALIASES) assert.ok(alias.reason.length > 20, alias.brand);
    assert.equal(specFileKey("Asterum", "A-0001 Perfecta"), normalizeTitle("0001 Perfecta"));
    assert.equal(specFileKey("Noblle Quartz", "Q-117 Jade White"), normalizeTitle("Q117 Jade White"));
    assert.equal(specFileKey("Vicostone", "BQ-2600"), normalizeTitle("BQ 2600"));
    assert.equal(specFileKey("Etna Quartz", "EQHM-001"), normalizeTitle("EQHM 001"));
    assert.equal(specFileKey("Etna Quartz", "EQTM-018 (print)"), normalizeTitle("EQTM 018"));
    assert.equal(specFileKey("Radianz", "AD-151"), normalizeTitle("AD151"));
    assert.equal(specFileKey("Caesarstone", "1141 Pure White (RAD)"), normalizeTitle("1141 Pure White"));
    assert.equal(specFileKey("Primax", "313 White Arctic (3D M)"), normalizeTitle("313 White Arctic Mat"));
    assert.equal(specFileKey("Primax", "704 Arabescata White PRINT"), normalizeTitle("704 Arabescata White"));
    assert.equal(specFileKey("Primax", "340 Taj Mahal (PRINT FB)"), normalizeTitle("340 Taj Mahal"));
  });
});

describe("сопоставление характеристик с БД", () => {
  it("OFF без токена мата совпадает с названием без Mat, (M) — только с матовым", () => {
    const gloss = mat("Aleph Stone", "Bianco Marble", "A35");
    const named = mat("Aleph Stone", "Storm Grey Mat", "A66");
    const plain = mat("Aleph Stone", "Storm Grey", "A66");
    const off = matchSpecs([row("Aleph Stone", "A35 Bianco Marble OFF", "matte")], [gloss, named]);
    assert.equal(only(off).material.id, gloss.id);
    assert.equal(only(off).via, "key");

    const matte = matchSpecs([row("Aleph Stone", "A66 Storm Grey (M) OFF", "matte")], [plain, named]);
    assert.equal(only(matte).material.id, named.id);
  });

  it("Asterum: «A-0001» ↔ «0001»", () => {
    const material = mat("Asterum", "Perfecta", "0001");
    const hit = only(matchSpecs([row("Asterum", "A-0001 Perfecta")], [material]));
    assert.equal(hit.material.id, material.id);
    assert.equal(hit.via, "key");
  });

  it("Vicostone: голый артикул «BQ-2600» ↔ «BQ 2600 Valley White», (M) без мата в БД — не совпадение", () => {
    const valley = mat("Vicostone", "Valley White", "BQ 2600");
    const black = mat("Vicostone", "Pure Black", "BQ 2101");
    const denali = mat("Vicostone", "Denali Mat", "Bq 2605");
    const result = matchSpecs(
      [
        row("Vicostone", "BQ-2600"),
        row("Vicostone", "BQ-2101 (M)", "matte"),
        row("Vicostone", "BQ-2605 (M)", "matte")
      ],
      [valley, black, denali]
    );
    assert.deepEqual(
      result.matched.map((hit) => [hit.row.title, hit.material.id, hit.via]),
      [
        ["BQ-2600", valley.id, "article"],
        ["BQ-2605 (M)", denali.id, "article"]
      ]
    );
    assert.equal(result.notFound.length, 1);
    assert.equal(result.notFound[0]?.row.title, "BQ-2101 (M)");
    assert.deepEqual(
      result.notFound[0]?.candidates.map((item) => item.id),
      [black.id]
    );
    assert.match(result.notFound[0]?.reason ?? "", /матовости/);
  });

  it("Etna: дефис и (print) снимаются, глянец и мат одного артикула не смешиваются", () => {
    const gloss = mat("Etna Quartz", "Canvas", "EQHG 004");
    const matte = mat("Etna Quartz", "Canvas Matovyy", "Eqhg 004");
    const print = mat("Etna Quartz", "Calacatta Borghini", "EQTM 018");
    const result = matchSpecs(
      [
        row("Etna Quartz", "EQHG-004"),
        row("Etna Quartz", "EQHG-004 (M)", "matte"),
        row("Etna Quartz", "EQTM-018 (print)")
      ],
      [matte, gloss, print]
    );
    const byTitle = new Map(result.matched.map((hit) => [hit.row.title, hit.material.id]));
    assert.equal(byTitle.get("EQHG-004"), gloss.id);
    assert.equal(byTitle.get("EQHG-004 (M)"), matte.id);
    assert.equal(byTitle.get("EQTM-018 (print)"), print.id);
    assert.equal(result.notFound.length, 0);
    assert.equal(result.ambiguous.length, 0);
  });

  it("Noblle: дефис в артикуле снимается, (M) в середине названия не совпадает с глянцем", () => {
    const jade = mat("Noblle Quartz", "Jade White", "Q117");
    const sand = mat("Noblle Quartz", "Black Sand", "Q131");
    const result = matchSpecs(
      [row("Noblle Quartz", "Q-117 Jade White"), row("Noblle Quartz", "Q-131 (M) Black Sand", "matte")],
      [jade, sand]
    );
    assert.equal(result.matched.length, 1);
    assert.equal(result.matched[0]?.material.id, jade.id);
    assert.equal(result.notFound[0]?.row.title, "Q-131 (M) Black Sand");
    assert.equal(result.notFound[0]?.candidates[0]?.id, sand.id);
  });

  it("Belenco: голый «4110» совпадает, «5050 Forza» не подменяется на «Forza Fume»", () => {
    const diamond = mat("Belenco", "Diamond White", "4110");
    const fume = mat("Belenco", "Forza Fume", "5050");
    const result = matchSpecs([row("Belenco", "4110"), row("Belenco", "5050 Forza")], [diamond, fume]);
    assert.equal(result.matched.length, 1);
    assert.equal(result.matched[0]?.material.id, diamond.id);
    assert.equal(result.matched[0]?.via, "article");
    assert.equal(result.notFound[0]?.row.title, "5050 Forza");
    assert.equal(result.notFound[0]?.candidates.length, 0);
  });

  it("Caesarstone: (RAD) не часть имени, мат только в БД — не совпадение, полировка лишь в справке", () => {
    const pure = mat("Caesarstone", "Pure White", "1141");
    const sleek = mat("Caesarstone", "Sleek Concrete Mat", "4003");
    const result = matchSpecs(
      [row("Caesarstone", "1141 Pure White (RAD)"), row("Caesarstone", "4003 Sleek Concrete (RAD)", "matte")],
      [pure, sleek]
    );
    assert.equal(result.matched.length, 1);
    assert.equal(result.matched[0]?.material.id, pure.id);
    const problem = result.notFound[0];
    assert.equal(problem?.row.title, "4003 Sleek Concrete (RAD)");
    assert.equal(problem?.candidates[0]?.id, sleek.id);
    assert.equal(problem?.polishHints[0]?.id, sleek.id);
  });

  it("Avant Quartz и Avarus: кириллица по артикулу, противоречие мата не угадывается", () => {
    const avalon = mat("Avant Quartz", "Avalon", "1111");
    const tayga = mat("Avarus", "Belaya Tayga", "R104");
    const taygaMat = mat("Avarus", "Belaya Tayga Mat", "RM104");
    const result = matchSpecs(
      [
        row("Avant Quartz", "1111 Аваллон"),
        row("Avant Quartz", "1111 Аваллон (M)", "matte"),
        row("Avarus", "RM104 (M) Белая Тайга", "matte"),
        row("Avarus", "R104 Белая Тайга")
      ],
      [avalon, tayga, taygaMat]
    );
    const byTitle = new Map(result.matched.map((hit) => [hit.row.title, hit.material.id]));
    assert.equal(byTitle.get("1111 Аваллон"), avalon.id);
    assert.equal(result.matched.find((hit) => hit.row.title === "1111 Аваллон")?.via, "sku");
    assert.equal(byTitle.get("RM104 (M) Белая Тайга"), taygaMat.id);
    assert.equal(byTitle.get("R104 Белая Тайга"), tayga.id);
    assert.equal(result.notFound[0]?.row.title, "1111 Аваллон (M)");
    assert.equal(result.notFound[0]?.candidates[0]?.id, avalon.id);
  });

  it("опечатка не исправляется: Paladium не становится Palladium", () => {
    const palladium = mat("Asterum", "Palladium", "3102");
    const result = matchSpecs([row("Asterum", "A-3102 Paladium")], [palladium]);
    assert.equal(result.matched.length, 0);
    assert.equal(result.notFound.length, 1);
    assert.equal(result.notFound[0]?.candidates.length, 0);
  });

  it("несколько кандидатов и две строки на один материал — неоднозначно", () => {
    const first = mat("Primax", "Ivory White", "100");
    const second = mat("Primax", "Ivory White", "100");
    const many = matchSpecs([row("Primax", "100 Ivory White")], [first, second]);
    assert.equal(many.ambiguous.length, 1);
    assert.equal(many.matched.length, 0);

    const onlyOne = mat("Smart Quartz", "Giallo");
    const twice = matchSpecs([row("Smart Quartz", "Giallo"), row("Smart Quartz", "Giallo")], [onlyOne]);
    assert.equal(twice.ambiguous.length, 2);
    assert.equal(twice.matched.length, 0);

    const shared = mat("Belenco", "Diamond White", "4110");
    const both = matchSpecs([row("Belenco", "4110"), row("Belenco", "4110 Diamond White")], [shared]);
    assert.equal(both.matched.length, 0);
    assert.equal(both.ambiguous.length, 2);
    assert.match(both.ambiguous[0]?.reason ?? "", /один материал/);
  });

  it("чужой бренд не подходит", () => {
    const result = matchSpecs([row("Aleph Stone", "A30 Ultra White")], [mat("Asterum", "Ultra White", "A30")]);
    assert.equal(result.matched.length, 0);
    assert.match(result.notFound[0]?.reason ?? "", /нет в БД/);
  });
});

describe("допуск несопоставленных при записи", () => {
  it("без разрешения несопоставленные блокируют, с ALLOW_UNMATCHED — нет; неоднозначность блокирует всегда", () => {
    assert.equal(specImportBlocked(47, 0, false), true);
    assert.equal(specImportBlocked(47, 0, true), false);
    assert.equal(specImportBlocked(0, 1, true), true);
    assert.equal(specImportBlocked(47, 2, true), true);
    assert.equal(specImportBlocked(0, 0, false), false);
  });
});
