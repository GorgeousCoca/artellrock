import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { quartzBrands } from "./quartz-decors";
import { brandCatalogRefs, stoneCatalog, stonesForBrand } from "./stone-catalog";

describe("brandCatalogRefs", () => {
  it("у бренда без камней отдаёт старые декоры как есть", () => {
    const brand = quartzBrands.find((item) => stonesForBrand(item.slug).length === 0);
    if (!brand) return;

    assert.deepEqual(
      brandCatalogRefs(brand).map((ref) => ref.image),
      brand.decors.map((decor) => decor.image)
    );
  });

  it("сначала камни со страницами, затем декоры, которые не заняты камнем", () => {
    for (const brand of quartzBrands) {
      const stones = stonesForBrand(brand.slug);
      if (stones.length === 0) continue;

      const refs = brandCatalogRefs(brand);
      const withPage = refs.filter((ref) => ref.slug);
      assert.equal(withPage.length, stones.length, brand.slug);
      assert.deepEqual(
        refs.slice(0, stones.length).map((ref) => ref.slug),
        stones.map((stone) => stone.slug),
        brand.slug
      );

      const covered = new Set(withPage.flatMap((ref) => ref.matchImages ?? []));
      for (const leftover of refs.slice(stones.length)) {
        assert.equal(covered.has(leftover.image), false, `${brand.slug}: ${leftover.image}`);
      }
    }
  });

  it("каталог камней не пуст и slug уникален внутри бренда", () => {
    assert.ok(stoneCatalog.length > 0);
    const keys = new Set(stoneCatalog.map((stone) => `${stone.brandSlug}/${stone.slug}`));
    assert.equal(keys.size, stoneCatalog.length);
  });
});
