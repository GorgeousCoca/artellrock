import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  buildSpecPatch,
  collectResearch,
  materialHasSpecs,
  parseResearchEntries,
  planResearchImport,
  storedMatchesPatch,
  summarizeResearchPlan,
  type ResearchRecord,
  type StoredMaterial
} from "./spec-research";
import { STONE_SHADES, STONE_TEXTURES } from "@/lib/calculator/taxonomy";

const PATCH_KEYS = new Set(["formats", "thicknessesMm", "finish", "shade", "texture"]);

function entry(patch: Record<string, unknown> = {}) {
  return {
    id: "5",
    brand: "Belenco",
    sku: "100",
    name: "Calacatta",
    formats: ["N"],
    thicknessesMm: [20, 30],
    finish: "polished",
    shades: ["белый"],
    textures: ["монотонный"],
    inferred: ["shades"],
    confidence: "confirmed",
    sources: ["https://example.test/stone"],
    notes: "заметка не пишется",
    ...patch
  };
}

function blank(id: number | string, brand: string): StoredMaterial {
  return { id, brand, formats: [], thicknessesMm: [], finish: null, shade: null, texture: null };
}

function record(patch: Partial<ResearchRecord> = {}): ResearchRecord {
  return {
    file: "belenco.json",
    index: 1,
    id: "5",
    brand: "Belenco",
    sku: "100",
    name: "Calacatta",
    formats: ["N"],
    thicknessesMm: [20, 30],
    finish: "polished",
    shades: ["белый"],
    textures: ["монотонный"],
    ...patch
  };
}

describe("разбор исследовательской записи", () => {
  it("принимает запись и не считает служебные поля проблемой", () => {
    const parsed = parseResearchEntries([entry()], "belenco.json");
    assert.equal(parsed.problems.length, 0);
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.records[0]?.id, "5");
    assert.equal(parsed.records[0]?.file, "belenco.json");
    assert.equal(parsed.records[0]?.index, 1);
  });

  it("неизвестные значения перечисляются, запись целиком не проходит", () => {
    const parsed = parseResearchEntries([
      entry({
        formats: ["N", "Z"],
        thicknessesMm: [20, "15", 99],
        finish: "gloss",
        shades: ["белый", "золотой"],
        textures: ["монотонный", "мрамор"]
      })
    ]);
    assert.equal(parsed.records.length, 0);
    assert.equal(parsed.problems.length, 1);
    const text = parsed.problems[0]?.messages.join("\n") ?? "";
    assert.match(text, /formats:.*Z/);
    assert.match(text, /thicknessesMm:.*15/);
    assert.match(text, /thicknessesMm:.*99/);
    assert.match(text, /finish:.*gloss/);
    assert.match(text, /shades:.*золотой/);
    assert.match(text, /textures:.*мрамор/);
    assert.doesNotMatch(text, /formats:.*«N»/);
  });

  it("пустой id, нестроковый id и не-объект — проблемы", () => {
    const parsed = parseResearchEntries(["камень", entry({ id: "  " }), entry({ id: 12 })]);
    assert.equal(parsed.records.length, 0);
    assert.equal(parsed.problems.length, 3);
    assert.match(parsed.problems[0]?.messages[0] ?? "", /не объект/);
    assert.match(parsed.problems[1]?.messages[0] ?? "", /id:/);
    assert.match(parsed.problems[2]?.messages.join(" "), /id:/);
  });

  it("повтор id внутри файла бракует обе записи", () => {
    const parsed = parseResearchEntries([entry({ id: "7", name: "Первый" }), entry({ id: "7", name: "Второй" })]);
    assert.equal(parsed.records.length, 0);
    assert.equal(parsed.problems.length, 2);
    assert.match(parsed.problems[0]?.messages[0] ?? "", /повторяется/);
  });

  it("null в sku не бракует запись: артикул в патч не входит", () => {
    const parsed = parseResearchEntries([entry({ sku: null })]);
    assert.equal(parsed.problems.length, 0);
    assert.equal(parsed.records[0]?.sku, "");
    assert.equal(Object.hasOwn(buildSpecPatch(parsed.records[0]!), "sku"), false);
  });

  it("пустые массивы и null — годная запись без патча", () => {
    const parsed = parseResearchEntries([
      entry({ formats: [], thicknessesMm: [], finish: null, shades: [], textures: [] })
    ]);
    assert.equal(parsed.problems.length, 0);
    assert.deepEqual(buildSpecPatch(parsed.records[0]!), {});
  });
});

describe("патч для БД", () => {
  it("пишет только непустые поля, теги без повторов и в порядке первого вхождения", () => {
    const parsed = parseResearchEntries([
      entry({
        formats: ["J", "N", "J"],
        thicknessesMm: [30, 20, 30],
        finish: null,
        shades: ["серый", "белый", "серый"],
        textures: []
      })
    ]);
    const patch = buildSpecPatch(parsed.records[0]!);
    assert.deepEqual(patch, {
      formats: ["J", "N"],
      thicknessesMm: ["30", "20"],
      shade: "серый / белый"
    });
    assert.equal("finish" in patch, false);
    assert.equal("texture" in patch, false);
    for (const key of Object.keys(patch)) assert.equal(PATCH_KEYS.has(key), true);
  });

  it("карточка с любой заполненной характеристикой считается занятой", () => {
    assert.equal(materialHasSpecs(blank("1", "A")), false);
    assert.equal(materialHasSpecs({ ...blank("1", "A"), shade: "   " }), false);
    assert.equal(materialHasSpecs({ ...blank("1", "A"), formats: [""] }), false);
    assert.equal(materialHasSpecs({ ...blank("1", "A"), shade: "белый" }), true);
    assert.equal(materialHasSpecs({ ...blank("1", "A"), finish: "matte" }), true);
    assert.equal(materialHasSpecs({ ...blank("1", "A"), thicknessesMm: ["12"] }), true);
  });
});

describe("план записи", () => {
  it("обновляет только пустую карточку своего бренда и не трогает чужие поля", () => {
    const source = record({ formats: ["N", "N"], shades: ["белый", "белый", "серый"], textures: [], finish: "polished" });
    const material = blank("5", "Belenco");
    const first = planResearchImport([source], [], new Map([["5", material]]));
    assert.equal(first.updates.length, 1);
    assert.equal(first.updates[0]?.dbId, "5");
    assert.deepEqual(first.updates[0]?.patch, {
      formats: ["N"],
      thicknessesMm: ["20", "30"],
      finish: "polished",
      shade: "белый / серый"
    });
    assert.equal("texture" in (first.updates[0]?.patch ?? {}), false);

    const written: StoredMaterial = {
      ...material,
      formats: first.updates[0]?.patch.formats ?? [],
      thicknessesMm: first.updates[0]?.patch.thicknessesMm ?? [],
      finish: first.updates[0]?.patch.finish ?? null,
      shade: first.updates[0]?.patch.shade ?? null,
      texture: first.updates[0]?.patch.texture ?? null
    };
    assert.equal(storedMatchesPatch(written, first.updates[0]!.patch), true);
    const second = planResearchImport([source], [], new Map([["5", written]]));
    assert.equal(second.updates.length, 0);
    assert.equal(second.skips[0]?.reason, "filled");
    assert.match(second.skips[0]?.messages.join(" ") ?? "", /уже заполнен/);
    const summary = summarizeResearchPlan(second);
    assert.equal(summary.change, 0);
    assert.equal(summary.filled, 1);
    assert.equal(summary.total, 1);
  });

  it("чужой бренд, пустая запись, отсутствие id и ошибка разбора не пишутся", () => {
    const empty = record({ id: "1", formats: [], thicknessesMm: [], finish: null, shades: [], textures: [] });
    const otherBrand = record({ id: "2", brand: "Belenco" });
    const absent = record({ id: "404" });
    const problem = {
      file: "a.json",
      index: 4,
      id: "9",
      brand: "Belenco",
      name: "Сбой",
      messages: ["formats: «Z» (string) нет в словаре форматов"]
    };
    const plan = planResearchImport(
      [empty, otherBrand, absent],
      [problem],
      new Map([
        ["1", blank("1", "Belenco")],
        ["2", blank(2, "Caesarstone")],
        ["9", blank("9", "Belenco")]
      ])
    );
    assert.equal(plan.updates.length, 0);
    assert.deepEqual(
      plan.skips.map((skip) => skip.reason),
      ["problem", "empty", "problem", "missing"]
    );
    assert.match(plan.skips[2]?.messages[0] ?? "", /в файле «Belenco», в БД «Caesarstone»/);
    const summary = summarizeResearchPlan(plan);
    assert.equal(summary.total, 4);
    assert.equal(summary.change, 0);
    assert.equal(summary.empty, 1);
    assert.equal(summary.problem, 2);
    assert.equal(summary.missing, 1);
  });

  it("файл не массив и повтор id между файлами пропускаются", () => {
    const collected = collectResearch([
      { file: "a.json", data: { id: "1" } },
      { file: "b.json", data: [entry({ id: "8", brand: "A" })] },
      { file: "c.json", data: [entry({ id: "8", brand: "B", name: "Другой" })] }
    ]);
    assert.equal(collected.records.length, 0);
    assert.equal(collected.problems.length, 3);
    assert.match(collected.problems[0]?.messages[0] ?? "", /не является массивом/);
    assert.match(collected.problems.map((item) => item.messages.join(" ")).join("\n"), /повторяется в файлах: b.json, c.json/);
  });
});

describe("исследовательские JSON в репозитории", () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../scripts/data/specs-research");

  it("15 файлов разбираются без проблем словаря", () => {
    const names = readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort((left, right) => left.localeCompare(right, "en"));
    assert.equal(names.length, 15);
    const collected = collectResearch(
      names.map((name) => ({
        file: name,
        data: JSON.parse(readFileSync(path.join(dir, name), "utf8")) as unknown
      }))
    );
    assert.equal(collected.problems.length, 0, JSON.stringify(collected.problems.slice(0, 5)));
    assert.equal(collected.records.length, 407);

    let empty = 0;
    for (const item of collected.records) {
      const patch = buildSpecPatch(item);
      for (const key of Object.keys(patch)) assert.equal(PATCH_KEYS.has(key), true, item.id);
      if (Object.keys(patch).length === 0) empty += 1;
      for (const shade of item.shades) assert.equal(STONE_SHADES.includes(shade as (typeof STONE_SHADES)[number]), true);
      for (const texture of item.textures) assert.equal(STONE_TEXTURES.includes(texture as (typeof STONE_TEXTURES)[number]), true);
    }
    assert.equal(empty, 38);
  });

  it("примеры патча совпадают с файлами: полный, пустой и частичный", () => {
    const read = (name: string) =>
      collectResearch([{ file: name, data: JSON.parse(readFileSync(path.join(dir, name), "utf8")) as unknown }]);
    const clear = read("aleph-stone.json").records.find((item) => item.id === "1");
    assert.equal(clear?.name, "Clear Quartz");
    assert.deepEqual(buildSpecPatch(clear!), {
      formats: ["J"],
      thicknessesMm: ["20"],
      finish: "polished",
      shade: "белый",
      texture: "крупные жилы"
    });

    const emperador = read("aleph-stone.json").records.find((item) => item.id === "20");
    assert.equal(emperador?.name, "Emperador");
    assert.deepEqual(buildSpecPatch(emperador!), {});

    const classic = read("noblle-quartz.json").records.find((item) => item.id === "327");
    assert.equal(classic?.name, "Statuario Classic");
    assert.deepEqual(buildSpecPatch(classic!), { shade: "белый", texture: "крупные жилы" });
  });
});
