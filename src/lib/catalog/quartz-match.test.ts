import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  brandPriceSpan,
  indexQuartzMaterials,
  joinBrandDecors,
  matchQuartzMaterial,
  quartzDecorKey,
  quartzMaterialKey,
  type QuartzMaterialRef
} from "./quartz-match";

function mat(over: Partial<QuartzMaterialRef> & Pick<QuartzMaterialRef, "name">): QuartzMaterialRef {
  return {
    id: over.id ?? over.name,
    brand: over.brand ?? "Belenco",
    name: over.name,
    sku: over.sku,
    image: over.image,
    isActive: over.isActive ?? true,
    pricePerSqm: over.pricePerSqm ?? 12500,
    formats: over.formats ?? [],
    thicknessesMm: over.thicknessesMm ?? [],
    finish: over.finish,
    shades: over.shades ?? [],
    textures: over.textures ?? []
  };
}

describe("соединение декора с материалом", () => {
  it("совпадает по картинке и переносит цену и характеристики", () => {
    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "1010 Premium White", image: "/images/Belenco/1010.webp" }],
      [
        mat({
          name: "Другое имя",
          sku: "999",
          image: "/images/Belenco/1010.webp",
          pricePerSqm: 15000,
          formats: ["N", "J"],
          thicknessesMm: [20],
          finish: "polished",
          shades: ["белый"],
          textures: ["монотонный"]
        })
      ]
    );

    assert.equal(decor.price, 15000);
    assert.equal(decor.sku, "999");
    assert.deepEqual(decor.formats, ["N", "J"]);
    assert.deepEqual(decor.thicknessesMm, [20]);
    assert.equal(decor.finish, "polished");
    assert.deepEqual(decor.shades, ["белый"]);
    assert.deepEqual(decor.textures, ["монотонный"]);
    assert.equal(decor.name, "1010 Premium White");
  });

  it("без картинки соединяет бренд + артикул + название", () => {
    assert.equal(quartzDecorKey("Belenco", "1010 Premium White"), quartzMaterialKey(mat({ sku: "1010", name: "Premium White" })));

    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "1010 Premium White", image: "/missing.webp" }],
      [mat({ sku: "1010", name: "Premium White", image: "/other.webp", pricePerSqm: 17500, shades: ["белый"] })]
    );

    assert.equal(decor.price, 17500);
    assert.equal(decor.sku, "1010");
    assert.deepEqual(decor.shades, ["белый"]);
  });

  it("признак матовости в названии не мешает запасному ключу", () => {
    const [decor] = joinBrandDecors(
      "Vicostone",
      [{ name: "BQ 8820 Storm Grey (Мат)", image: "/nope.webp" }],
      [mat({ brand: "Vicostone", sku: "BQ", name: "8820 Storm Grey Mat", image: "" })]
    );
    assert.equal(decor.price, 12500);
  });

  it("тот же декор другого бренда не подходит", () => {
    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "Antracite", image: "/belenco.webp" }],
      [mat({ brand: "Vicostone", name: "Antracite", image: "/vicostone.webp", pricePerSqm: 20000 })]
    );
    assert.equal(decor.price, null);
    assert.equal(decor.sku, undefined);
    assert.deepEqual(decor.formats, []);
  });

  it("без материала оставляет артикул и характеристики каталога", () => {
    const [decor] = joinBrandDecors(
      "Aleph Stone",
      [
        {
          name: "Arabescato Azzurro",
          image: "/images/stones/aleph-stone/a74/01.png",
          sku: "A74",
          formats: ["J"],
          thicknessesMm: [20],
          finish: "polished",
          shades: ["белый"]
        }
      ],
      []
    );

    assert.equal(decor.price, null);
    assert.equal(decor.sku, "A74");
    assert.deepEqual(decor.formats, ["J"]);
    assert.deepEqual(decor.thicknessesMm, [20]);
    assert.equal(decor.finish, "polished");
    assert.deepEqual(decor.shades, ["белый"]);
  });

  it("декор без материала остаётся без цены и характеристик", () => {
    const [decor] = joinBrandDecors("Belenco", [{ name: "Нет в базе", image: "/x.webp" }], []);
    assert.equal(decor.price, null);
    assert.equal(decor.finish, undefined);
    assert.deepEqual(decor.thicknessesMm, []);
    assert.deepEqual(decor.shades, []);
    assert.deepEqual(decor.textures, []);
  });

  it("неактивный и нулевая цена не отдают цену, характеристики сохраняют", () => {
    const decors = joinBrandDecors(
      "Belenco",
      [
        { name: "Скрытый", image: "/hidden.webp" },
        { name: "Нулевой", image: "/zero.webp" }
      ],
      [
        mat({ name: "Скрытый", image: "/hidden.webp", isActive: false, pricePerSqm: 15000, formats: ["N"] }),
        mat({ name: "Нулевой", image: "/zero.webp", isActive: true, pricePerSqm: 0, shades: ["серый"] })
      ]
    );

    assert.equal(decors[0].price, null);
    assert.deepEqual(decors[0].formats, ["N"]);
    assert.equal(decors[1].price, null);
    assert.deepEqual(decors[1].shades, ["серый"]);
  });

  it("картинка неактивного важнее тёзки с ценой", () => {
    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "White", image: "/a.webp" }],
      [
        mat({ id: "off", name: "White", image: "/a.webp", isActive: false, pricePerSqm: 0 }),
        mat({ id: "on", name: "White", image: "/b.webp", isActive: true, pricePerSqm: 12500 })
      ]
    );
    assert.equal(decor.price, null);
  });

  it("неоднозначная картинка и ключ помечаются отдельно от пустого поиска", () => {
    const materials = [
      mat({ id: "1", name: "White", image: "/a.webp" }),
      mat({ id: "2", name: "White", image: "/a.webp" })
    ];
    const index = indexQuartzMaterials(materials);
    assert.equal(matchQuartzMaterial("Belenco", { name: "White", image: "/a.webp" }, index).status, "ambiguous");
    assert.equal(matchQuartzMaterial("Belenco", { name: "Нет такого", image: "/missing.webp" }, index).status, "none");
  });

  it("две записи с одной картинкой и одним ключом не угадываются", () => {
    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "White", image: "/a.webp" }],
      [
        mat({ id: "1", name: "White", image: "/a.webp", pricePerSqm: 10000 }),
        mat({ id: "2", name: "White", image: "/a.webp", pricePerSqm: 20000 })
      ]
    );
    assert.equal(decor.price, null);
    assert.deepEqual(decor.formats, []);
  });

  it("среди чужих картинок берётся единственная своего бренда", () => {
    const [decor] = joinBrandDecors(
      "Belenco",
      [{ name: "White", image: "/shared.webp" }],
      [
        mat({ id: "v", brand: "Vicostone", name: "Иное", image: "/shared.webp", pricePerSqm: 20000 }),
        mat({ id: "b", brand: "Belenco", name: "Иное", image: "/shared.webp", pricePerSqm: 15000, formats: ["J"] })
      ]
    );
    assert.equal(decor.price, 15000);
    assert.deepEqual(decor.formats, ["J"]);
  });
});

describe("диапазон цен бренда", () => {
  it("мин и макс только по камням с ценой", () => {
    assert.deepEqual(
      brandPriceSpan([{ price: 15000 }, { price: null }, { price: 12500 }, { price: 0 }]),
      { min: 12500, max: 15000 }
    );
  });

  it("одна цена — диапазон из неё же", () => {
    assert.deepEqual(brandPriceSpan([{ price: 17500 }, { price: null }]), { min: 17500, max: 17500 });
  });

  it("без цен диапазона нет", () => {
    assert.equal(brandPriceSpan([]), null);
    assert.equal(brandPriceSpan([{ price: null }, { price: 0 }]), null);
  });
});
