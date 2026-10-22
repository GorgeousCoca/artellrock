import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { firstToken, groupBy, hasMat, materialKey, normalizeTitle, sameBrandName, stripMat } from "./identity";

describe("identity", () => {
  it("сводит регистр, мат-признаки и миллиметры к одному ключу", () => {
    assert.equal(normalizeTitle("BQ 5260 Beton (5мм) (Мат)"), "bq 5260 beton 5mm mat");
    assert.equal(normalizeTitle("Bq 5260 Beton 5mm Matt"), "bq 5260 beton 5mm mat");
  });

  it("матовый и глянцевый варианты остаются разными позициями", () => {
    assert.notEqual(normalizeTitle("Noble Arco"), normalizeTitle("Noble Arco (мат)"));
    assert.equal(hasMat(normalizeTitle("Noble Arco (мат)")), true);
    assert.equal(stripMat(normalizeTitle("Noble Arco (мат)")), "noble arco");
  });

  it("ключ материала строится из артикула и названия вместе", () => {
    assert.equal(materialKey({ id: 1, brand: "Belenco", name: "Premium White", sku: "1010" }), "1010 premium white");
    assert.equal(materialKey({ id: 2, brand: "Smart Quartz", name: "Calacatta" }), "calacatta");
  });

  it("firstToken, sameBrandName и groupBy", () => {
    assert.equal(firstToken("bq 8926 calacatta"), "bq");
    assert.equal(sameBrandName("Avant Quartz", "avant  QUARTZ"), true);
    assert.equal(sameBrandName("Avant Quartz", "Avarus"), false);

    const groups = groupBy(["a1", "b1", "a2"], (item) => item[0]);
    assert.deepEqual([...groups.keys()], ["a", "b"]);
    assert.deepEqual(groups.get("a"), ["a1", "a2"]);
  });
});
