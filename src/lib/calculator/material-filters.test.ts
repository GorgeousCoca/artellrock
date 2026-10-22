import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { collectStoneFilterOptions, EMPTY_STONE_FILTERS, hasActiveStoneFilters, matchesStoneFilters, type StoneFilters, type StoneSpecs } from "./material-filters";
import { formatLegendLabel, splitTags } from "./taxonomy";

const specs = (over: Partial<StoneSpecs> = {}): StoneSpecs => ({
  formats: [],
  thicknessesMm: [],
  shades: [],
  textures: [],
  ...over
});

const filters = (over: Partial<StoneFilters> = {}): StoneFilters => ({ ...EMPTY_STONE_FILTERS, ...over });

describe("matchesStoneFilters", () => {
  const stone = specs({
    formats: ["N", "J"],
    thicknessesMm: [20, 30],
    shades: ["бежевый", "белый"],
    finish: "polished",
    textures: ["разводы", "мелкие жилы"]
  });

  it("пустые фильтры пропускают всё, в том числе камень без данных", () => {
    assert.equal(matchesStoneFilters(stone, EMPTY_STONE_FILTERS), true);
    assert.equal(matchesStoneFilters(specs(), EMPTY_STONE_FILTERS), true);
    assert.equal(matchesStoneFilters(specs({ finish: undefined }), EMPTY_STONE_FILTERS), true);
  });

  it("несколько критериев складываются через И", () => {
    assert.equal(matchesStoneFilters(stone, filters({ format: "N", thicknessMm: 30, shade: "белый", finish: "polished" })), true);
    assert.equal(matchesStoneFilters(stone, filters({ format: "N", thicknessMm: 12 })), false);
    assert.equal(matchesStoneFilters(stone, filters({ shade: "белый", finish: "matte" })), false);
  });

  it("внутри многозначного поля достаточно одного совпадения", () => {
    assert.equal(matchesStoneFilters(stone, filters({ format: "J" })), true);
    assert.equal(matchesStoneFilters(stone, filters({ format: "J+" })), false);
    assert.equal(matchesStoneFilters(stone, filters({ thicknessMm: 20 })), true);
    assert.equal(matchesStoneFilters(stone, filters({ shade: "бежевый" })), true);
    assert.equal(matchesStoneFilters(stone, filters({ texture: "мелкие жилы" })), true);
    assert.equal(matchesStoneFilters(stone, filters({ texture: "монотонный" })), false);
  });

  it("камень без данных по выбранному критерию не подходит", () => {
    const blank = specs();
    assert.equal(matchesStoneFilters(blank, filters({ format: "N" })), false);
    assert.equal(matchesStoneFilters(blank, filters({ thicknessMm: 20 })), false);
    assert.equal(matchesStoneFilters(blank, filters({ shade: "белый" })), false);
    assert.equal(matchesStoneFilters(blank, filters({ finish: "polished" })), false);
    assert.equal(matchesStoneFilters(blank, filters({ texture: "разводы" })), false);
    assert.equal(matchesStoneFilters(specs({ shades: ["белый"] }), filters({ shade: "белый", format: "N" })), false);
  });
});

describe("collectStoneFilterOptions", () => {
  it("только встретившиеся значения и только в порядке словарей", () => {
    const options = collectStoneFilterOptions([
      specs({ formats: ["J", "N"], thicknessesMm: [30, 12], shades: ["розовый", "белый"], finish: "matte", textures: ["крупные жилы"] }),
      specs({ formats: ["J"], thicknessesMm: [20], shades: ["чёрный"], finish: "polished", textures: ["монотонный", "крупные жилы"] }),
      specs({ shades: ["нет в словаре"] })
    ]);
    assert.deepEqual(options.formats, ["N", "J"]);
    assert.deepEqual(options.thicknessesMm, [12, 20, 30]);
    assert.deepEqual(options.shades, ["белый", "чёрный", "розовый"]);
    assert.deepEqual(options.finishes, ["polished", "matte"]);
    assert.deepEqual(options.textures, ["монотонный", "крупные жилы"]);
  });

  it("пустой список камней — пустые списки опций", () => {
    assert.deepEqual(collectStoneFilterOptions([]), { formats: [], thicknessesMm: [], shades: [], finishes: [], textures: [] });
  });
});

describe("hasActiveStoneFilters", () => {
  it("null-критерии не считаются выбранными", () => {
    assert.equal(hasActiveStoneFilters(EMPTY_STONE_FILTERS), false);
    assert.equal(hasActiveStoneFilters(filters({ shade: "белый" })), true);
    assert.equal(hasActiveStoneFilters(filters({ thicknessMm: 12 })), true);
  });
});

describe("словари характеристик", () => {
  it("splitTags: разделитель «/», без пустых и повторов", () => {
    assert.deepEqual(splitTags("бежевый / белый"), ["бежевый", "белый"]);
    assert.deepEqual(splitTags(" белый / белый / "), ["белый"]);
    assert.deepEqual(splitTags("белый/серый"), ["белый", "серый"]);
    assert.deepEqual(splitTags("   "), []);
    assert.deepEqual(splitTags(null), []);
    assert.deepEqual(splitTags(undefined), []);
  });

  it("formatLegendLabel", () => {
    assert.equal(formatLegendLabel("N"), "[N] — плита NORMAL 3040 × 1440 мм");
    assert.equal(formatLegendLabel("N+"), "[N+] — плита NORMAL+ 3100 × 1520 мм");
    assert.equal(formatLegendLabel("J"), "[J] — плита JUMBO 3200 × 1600 мм");
    assert.equal(formatLegendLabel("J+"), "[J+] — плита JUMBO+ 3300 × 1650 мм");
  });
});
