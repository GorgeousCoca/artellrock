import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pageButtons, pageCountFor, paginate, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it("берёт число, остальное считает первой страницей", () => {
    assert.equal(parsePageParam("3"), 3);
    assert.equal(parsePageParam(["2", "5"]), 2);
    assert.equal(parsePageParam(undefined), 1);
    assert.equal(parsePageParam("abc"), 1);
    assert.equal(parsePageParam("0"), 1);
    assert.equal(parsePageParam("-4"), 1);
    assert.equal(parsePageParam("2.9"), 2);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 46 }, (_, index) => index + 1);

  it("считает страницы по 9 штук", () => {
    assert.equal(pageCountFor(46, 9), 6);
    assert.equal(pageCountFor(0, 9), 1);
    assert.equal(pageCountFor(9, 9), 1);
    assert.equal(pageCountFor(10, 9), 2);
  });

  it("режет список и отдаёт неполную последнюю страницу", () => {
    assert.deepEqual(paginate(items, 1, 9).items, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.deepEqual(paginate(items, 6, 9).items, [46]);
    assert.equal(paginate(items, 6, 9).pageCount, 6);
  });

  it("страница за пределами даёт пустой список", () => {
    assert.deepEqual(paginate(items, 7, 9).items, []);
  });
});

describe("pageButtons", () => {
  it("показывает все номера, пока их немного", () => {
    assert.deepEqual(pageButtons(2, 5), [1, 2, 3, 4, 5]);
  });

  it("сворачивает длинный список многоточием", () => {
    assert.deepEqual(pageButtons(1, 12), [1, 2, 3, 4, null, 12]);
    assert.deepEqual(pageButtons(6, 12), [1, null, 5, 6, 7, null, 12]);
    assert.deepEqual(pageButtons(12, 12), [1, null, 9, 10, 11, 12]);
  });
});
