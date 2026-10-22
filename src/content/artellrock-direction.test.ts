import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { quartzBrands } from "./quartz-decors";
import {
  directionDescription,
  directionDocumentTitle,
  directionH1,
  directions,
  getDirection,
  productCatalog,
  quartzBrandCopy
} from "./artellrock";
import { brandDocumentTitle, brandHeading } from "../lib/seo/snippets";

const KNOWN_PATHS = new Set([
  "/izdeliya/stoleshnitsy",
  "/izdeliya/fartuki",
  "/izdeliya/barnye-stoyki",
  "/izdeliya/podokonniki",
  "/izdeliya/stupeni",
  "/izdeliya/dushevye-poddony",
  "/moyki-iz-kvarca",
  "/kromki",
  "/kvartsevyy-aglomerat",
  "/catalog-kvarca",
  "/kalkulyator",
  "/portfolio",
  "/contacts",
  ...quartzBrands.map((brand) => `/catalog-kvarca/${brand.slug}`)
]);

describe("заголовки направления", () => {
  it("у столешниц в title и H1 есть кухня и кварцевый агломерат", () => {
    const direction = getDirection("stoleshnitsy");
    assert.ok(direction);
    const title = directionDocumentTitle(direction);
    const h1 = directionH1(direction);

    assert.match(title, /кухн/i);
    assert.match(title, /кварцевого агломерата/);
    assert.match(h1, /кухн/i);
    assert.match(h1, /кварцевого агломерата/);
    assert.ok(title.length <= 70, title);
    assert.ok(directionDescription(direction).length <= 160);
  });

  it("фартук, бар и подоконник остаются в шаблоне", () => {
    for (const slug of ["fartuki", "barnye-stoyki", "podokonniki"] as const) {
      const direction = getDirection(slug);
      assert.ok(direction);
      assert.equal(directionH1(direction), `${direction.title} из кварца`);
      assert.equal(
        directionDocumentTitle(direction),
        `${direction.title} из кварца на заказ в Петербурге — ArtellRock`
      );
      assert.ok(directionDescription(direction).length <= 160, directionDescription(direction));
    }
  });

  it("блоки P2 — секции существующих страниц, без нового пути", () => {
    const tops = getDirection("stoleshnitsy");
    const apron = getDirection("fartuki");
    const bar = getDirection("barnye-stoyki");
    const sill = getDirection("podokonniki");
    assert.ok(tops && apron && bar && sill);

    const titles = (slug: NonNullable<typeof tops>) => slug.sections?.map((section) => section.title) ?? [];
    assert.ok(titles(tops).some((title) => /мрамор/i.test(title)));
    assert.ok(titles(tops).some((title) => /мойк/i.test(title)));
    assert.ok(titles(tops).some((title) => /ванн/i.test(title)));
    assert.ok(titles(apron).some((title) => /стеновая панель/i.test(title)));
    assert.ok(titles(bar).some((title) => /остров/i.test(title)));
    assert.ok(titles(sill).some((title) => /линию со столешницей/i.test(title)));
    assert.ok(titles(sill).some((title) => /эркер/i.test(title)));
    assert.ok(titles(sill).some((title) => /накладка/i.test(title)));

    for (const direction of directions) {
      for (const link of direction.related ?? []) {
        assert.ok(KNOWN_PATHS.has(link.href), link.href);
      }
    }
  });
});

describe("каталог изделий", () => {
  it("карточки ведут на существующие страницы и не обещают архивный ассортимент", () => {
    // Ступени, поддоны и мойки владелец вернул в ассортимент 2026-10-20; акрил, столы, ресепшн и отливы остаются архивом.
    const banned = /акрил|\bстолы\b|ресепш|отливы/i;
    assert.ok(productCatalog.length >= 12);

    for (const card of productCatalog) {
      const path = card.href.split("#")[0];
      assert.ok(KNOWN_PATHS.has(path), card.href);
      assert.equal(banned.test(card.title), false, card.title);
      assert.equal(banned.test(card.line), false, card.line);
    }
  });
});

describe("карточки марок", () => {
  it("title называет кварцевый агломерат и не длиннее 70 знаков", () => {
    for (const brand of quartzBrands) {
      const title = brandDocumentTitle(brand.name);
      assert.match(title, /кварцевый агломерат/);
      assert.match(brandHeading(brand.name), /кварцевый агломерат/);
      assert.ok(title.length <= 70, `${title} (${title.length})`);
    }
  });

  it("русские имена только у марок каталога", () => {
    const slugs = new Set(quartzBrands.map((brand) => brand.slug));
    for (const slug of Object.keys(quartzBrandCopy)) {
      assert.ok(slugs.has(slug), slug);
    }
    assert.equal(quartzBrands.length, 15);
  });
});
