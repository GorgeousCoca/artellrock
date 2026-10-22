import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { StoneRecord } from "@/content/stone-catalog";
import type { QuartzMaterialRef } from "@/lib/catalog/quartz-match";

import { planUnpricedRemoval, type UnpricedBrand } from "./unpriced-stones";

const brand: UnpricedBrand = {
  name: "Radianz",
  slug: "radianz",
  decors: []
};

function stone(slug: string, name: string, image: string): StoneRecord {
  return {
    brandSlug: brand.slug,
    slug,
    name,
    sku: slug,
    description: "",
    characteristics: [],
    images: [image]
  };
}

function material(id: number, name: string, image: string, pricePerSqm: number): QuartzMaterialRef {
  return {
    id,
    brand: brand.name,
    name,
    sku: name,
    image,
    isActive: pricePerSqm > 0,
    pricePerSqm,
    formats: [],
    thicknessesMm: [],
    shades: [],
    textures: []
  };
}

describe("planUnpricedRemoval", () => {
  it("убирает материал и карточку без цены и оставляет камень с ценой", () => {
    const priced = stone("acacia", "Acacia", "/images/acacia.png");
    const free = stone("empty", "Empty", "/images/empty.png");
    const plan = planUnpricedRemoval(
      [brand],
      [priced, free],
      [material(1, "Acacia", priced.images[0], 23250), material(2, "Empty", free.images[0], 0)]
    );

    assert.deepEqual(plan.blocked, []);
    assert.deepEqual(plan.dropMaterialIds, [2]);
    assert.deepEqual(plan.dropStoneKeys, ["radianz/empty"]);
    assert.equal(plan.keptStones, 1);
  });

  it("не удаляет карточку, если нулевая запись только заслоняла цену", () => {
    const image = "/images/acacia.png";
    const plan = planUnpricedRemoval(
      [brand],
      [stone("acacia", "Acacia", image)],
      [material(1, "Acacia", image, 23250), material(2, "Acacia", image, 0)]
    );

    assert.deepEqual(plan.blocked, []);
    assert.deepEqual(plan.dropMaterialIds, [2]);
    assert.deepEqual(plan.dropStoneKeys, []);
    assert.equal(plan.keptStones, 1);
  });
});
