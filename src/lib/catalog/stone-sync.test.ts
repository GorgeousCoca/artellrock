import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { patchForMaterial, planStoneSync, type SyncMaterial, type SyncStone } from "./stone-sync";

function stone(over: Partial<SyncStone> & Pick<SyncStone, "name">): SyncStone {
  const name = over.name;
  const sku = over.sku ?? "A1";
  const hero = over.hero ?? `/images/stones/aleph-stone/${over.slug ?? "stone"}/01.jpg`;
  return {
    brandName: over.brandName ?? "Aleph Stone",
    name,
    sku,
    slug: over.slug ?? "stone",
    sortOrder: over.sortOrder ?? 0,
    hero,
    heroReady: over.heroReady ?? true,
    formats: over.formats ?? [],
    thicknessesMm: over.thicknessesMm ?? [],
    finish: over.finish,
    shades: over.shades ?? [],
    sheetLengthMm: over.sheetLengthMm,
    sheetWidthMm: over.sheetWidthMm,
    ref: over.ref ?? {
      name,
      image: hero,
      sku,
      matchNames: [`${sku} ${name}`]
    }
  };
}

function material(over: Partial<SyncMaterial> & Pick<SyncMaterial, "id" | "name">): SyncMaterial {
  return {
    id: over.id,
    brand: over.brand ?? "Aleph Stone",
    name: over.name,
    sku: over.sku ?? "A1",
    image: over.image,
    shade: over.shade,
    finish: over.finish,
    formats: over.formats,
    thicknessesMm: over.thicknessesMm,
    sheetLengthMm: over.sheetLengthMm,
    sheetWidthMm: over.sheetWidthMm
  };
}

describe("план сверки каталога и материалов", () => {
  it("меняет кадр на витринный и не трогает уже заполненный оттенок", () => {
    const plan = planStoneSync(
      [
        stone({
          name: "Clear Quartz",
          sku: "A100",
          slug: "a100-clear-quartz",
          hero: "/images/stones/aleph-stone/a100-clear-quartz/01.jpg",
          shades: ["белый"],
          finish: "polished",
          ref: {
            name: "Clear Quartz",
            image: "/images/stones/aleph-stone/a100-clear-quartz/01.jpg",
            matchNames: ["A100 Clear Quartz"],
            matchImages: ["/images/Aleph_Stone/A100 Clear Quartz.webp"]
          }
        })
      ],
      [
        material({
          id: 7,
          name: "Clear Quartz",
          sku: "A100",
          image: "/images/Aleph_Stone/A100 Clear Quartz.webp",
          shade: "серый"
        })
      ]
    );

    assert.equal(plan.creates.length, 0);
    assert.equal(plan.ambiguous.length, 0);
    assert.equal(plan.updates.length, 1);
    assert.equal(plan.updates[0].patch.image, "/images/stones/aleph-stone/a100-clear-quartz/01.jpg");
    assert.equal(plan.updates[0].patch.finish, "polished");
    assert.equal(plan.updates[0].patch.shade, undefined);
    assert.equal("pricePerSqm" in plan.updates[0].patch, false);
  });

  it("камень без записи создаётся выключенным и без цены", () => {
    const plan = planStoneSync(
      [stone({ name: "New Decor", sku: "Z9", slug: "new-decor", thicknessesMm: [20, 99], sheetLengthMm: 3200, sheetWidthMm: 1600 })],
      []
    );
    assert.equal(plan.updates.length, 0);
    assert.deepEqual(plan.creates[0], {
      brand: "Aleph Stone",
      name: "New Decor",
      sku: "Z9",
      image: "/images/stones/aleph-stone/new-decor/01.jpg",
      thicknessesMm: ["20"],
      sheetLengthMm: 3200,
      sheetWidthMm: 1600,
      pricePerSqm: 0,
      isActive: false,
      sortOrder: 0
    });
  });

  it("демо-запись с тем же кадром не становится ценой камня", () => {
    const plan = planStoneSync(
      [stone({ name: "Clear Quartz", sku: "A100", hero: "/images/stones/aleph-stone/a100/01.jpg", ref: { name: "Clear Quartz", image: "/old.webp", matchImages: ["/old.webp"] } })],
      [material({ id: 1, name: "[ДЕМО] A100 Clear Quartz", sku: "1000", image: "/old.webp" })]
    );
    assert.equal(plan.ignoredDemo, 1);
    assert.equal(plan.updates.length, 0);
    assert.equal(plan.creates.length, 1);
    assert.equal(plan.creates[0].isActive, false);
    assert.equal(plan.creates[0].pricePerSqm, 0);
  });

  it("три камня на одну запись не обновляют её и не плодят копии", () => {
    const shared = material({ id: 1, name: "White", sku: "1", image: "/old.webp" });
    const plan = planStoneSync(
      [1, 2, 3].map((n) =>
        stone({
          name: "White",
          sku: "1",
          slug: `white-${n}`,
          ref: { name: "White", image: "/old.webp", matchImages: ["/old.webp"] }
        })
      ),
      [shared]
    );
    assert.equal(plan.updates.length, 0);
    assert.equal(plan.creates.length, 0);
    assert.equal(plan.ambiguous.length, 3);
    assert.equal(plan.unused.length, 1);
  });

  it("Avant связывается по единственному артикулу, когда имена различаются", () => {
    const plan = planStoneSync(
      [
        stone({
          brandName: "Avant Quartz",
          name: "Dizhon",
          sku: "1000",
          slug: "1000-dizhon",
          hero: "/images/stones/avant/1000-dizhon/01.jpg",
          ref: { name: "Dizhon", image: "/images/stones/avant/1000-dizhon/01.jpg", sku: "1000", matchNames: ["1000 Dizhon"] }
        })
      ],
      [material({ id: 4, brand: "Avant Quartz", name: "Дижон", sku: "1000", image: "/images/Avant_Quartz/1000-dizhon.webp" })]
    );
    assert.equal(plan.creates.length, 0);
    assert.equal(plan.ambiguous.length, 0);
    assert.equal(plan.updates[0].patch.image, "/images/stones/avant/1000-dizhon/01.jpg");
  });

  it("связывает камни, у которых артикул и порядок слов записаны иначе", () => {
    const cases: Array<{ stone: SyncStone; material: SyncMaterial }> = [
      {
        stone: stone({ brandName: "Radianz", name: "AC 711 Acacia", sku: "AC711", slug: "acacia" }),
        material: material({ id: 1, brand: "Radianz", name: "Acacia", sku: "AC711", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Vicostone", name: "Akoya BQ 8583", sku: "VSAK", slug: "akoya" }),
        material: material({ id: 2, brand: "Vicostone", name: "Akoya", sku: "BQ 8583", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Asterum", name: "A0001 Perfecta", sku: "A0001", slug: "perfecta" }),
        material: material({ id: 3, brand: "Asterum", name: "Perfecta", sku: "0001", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Asterum", name: "А5108 Vanessa", sku: "А5108", slug: "vanessa" }),
        material: material({ id: 8, brand: "Asterum", name: "Vanessa", sku: "5108", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Primax", name: "Primax Quartz 130 Beige Sand", sku: "PQ130", slug: "beige" }),
        material: material({ id: 4, brand: "Primax", name: "Beige Sand Mat", sku: "130", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Still Stone", name: "G 2807 Black Crystal", sku: "SSBC", slug: "black" }),
        material: material({ id: 5, brand: "Still Stone", name: "Black Crystal", sku: "G2807", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Etna Quartz", name: "073 EQJM Calacatta Etna", sku: "073", slug: "etna" }),
        material: material({ id: 6, brand: "Etna Quartz", name: "Calacatta Etna", sku: "EQJM 073", image: "/old.webp" })
      },
      {
        stone: stone({ brandName: "Avarus", name: "Аварус R 104 Белая Тайга", sku: "AR104", slug: "tayga" }),
        material: material({ id: 7, brand: "Avarus", name: "Belaya Tayga", sku: "R104", image: "/old.webp" })
      }
    ];

    const plan = planStoneSync(
      cases.map((item) => item.stone),
      cases.map((item) => item.material)
    );
    assert.equal(plan.creates.length, 0);
    assert.equal(plan.ambiguous.length, 0);
    assert.equal(plan.updates.length, cases.length);
  });

  it("глянец не прилипает к матовому, если в базе есть оба", () => {
    const plan = planStoneSync(
      [stone({ brandName: "Etna Quartz", name: "Canvas", sku: "EQHG", slug: "canvas" })],
      [
        material({ id: 1, brand: "Etna Quartz", name: "Canvas", sku: "EQHG 004", image: "/gloss.webp" }),
        material({ id: 2, brand: "Etna Quartz", name: "Canvas Matovyy", sku: "Eqhg 004", image: "/mat.webp" })
      ]
    );
    assert.equal(plan.creates.length, 0);
    assert.equal(plan.ambiguous.length, 0);
    assert.equal(plan.updates.length, 1);
    assert.equal(plan.updates[0].id, 1);
  });

  it("единственный артикул связывает название, которое отличается на букву", () => {
    const lux = planStoneSync(
      [stone({ brandName: "Aleph Stone", name: "Calacatta Lux", sku: "A88", slug: "lux" })],
      [material({ id: 19, brand: "Aleph Stone", name: "Calacatta Luxe", sku: "A88", image: "/old.webp" })]
    );
    assert.equal(lux.creates.length, 0);
    assert.equal(lux.updates.length, 1);
    assert.equal(lux.updates[0].id, 19);

    const coffee = planStoneSync(
      [stone({ brandName: "Asterum", name: "A3002 Cappuccino", sku: "A3002", slug: "coffee" })],
      [material({ id: 36, brand: "Asterum", name: "Cappucino", sku: "3002", image: "/old.webp" })]
    );
    assert.equal(coffee.creates.length, 0);
    assert.equal(coffee.updates.length, 1);
    assert.equal(coffee.updates[0].id, 36);
  });

  it("общий артикул двух разных камней не выбирает один из них", () => {
    const plan = planStoneSync(
      [stone({ brandName: "Belenco", name: "Другой декор", sku: "5250", slug: "other" })],
      [
        material({ id: 1, brand: "Belenco", name: "Elexir White", sku: "5250", image: "/a.webp" }),
        material({ id: 2, brand: "Belenco", name: "Elexir White Seta", sku: "5250", image: "/b.webp" })
      ]
    );
    assert.equal(plan.updates.length, 0);
    assert.equal(plan.creates.length, 1);
  });

  it("пустой кадр не затирает картинку в базе", () => {
    const patch = patchForMaterial(
      material({ id: 1, name: "White", image: "/images/Aleph_Stone/old.webp" }),
      stone({ name: "White", heroReady: false, hero: "/images/calculator/stone-texture.jpg" })
    );
    assert.equal(patch.image, undefined);
  });
});
