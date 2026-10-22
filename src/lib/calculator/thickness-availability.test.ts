import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isThicknessAvailable,
  THICKNESS_RESET_MESSAGE,
  unavailableThicknessMessage,
  type ThicknessChoice
} from "./thickness-availability";

const slab20: ThicknessChoice = { thicknessMm: 20 };
const slab30: ThicknessChoice = { thicknessMm: 30 };
const sandwich: ThicknessChoice = {};
const miter40: ThicknessChoice = { thicknessMm: 40 };
const miter70: ThicknessChoice = { thicknessMm: 70 };
const assembled = [sandwich, miter40, miter70];

describe("isThicknessAvailable", () => {
  it("пустые данные камня — все толщины доступны", () => {
    for (const choice of [slab20, slab30, ...assembled]) {
      assert.equal(isThicknessAvailable(choice, []), true);
    }
  });

  it("сплошной слэб доступен только при той же толщине камня", () => {
    assert.equal(isThicknessAvailable(slab20, [20]), true);
    assert.equal(isThicknessAvailable(slab30, [20]), false);
    assert.equal(isThicknessAvailable(slab20, [30]), false);
    assert.equal(isThicknessAvailable(slab30, [30]), true);
    assert.equal(isThicknessAvailable(slab20, [20, 30]), true);
    assert.equal(isThicknessAvailable(slab30, [20, 30]), true);
    assert.equal(isThicknessAvailable(slab20, [12, 20]), true);
    assert.equal(isThicknessAvailable(slab30, [15, 30]), true);
  });

  it("сэндвич и «в ус» доступны, если у камня есть 20 или 30 мм", () => {
    for (const choice of assembled) {
      assert.equal(isThicknessAvailable(choice, [20]), true);
      assert.equal(isThicknessAvailable(choice, [30]), true);
      assert.equal(isThicknessAvailable(choice, [12, 20]), true);
      assert.equal(isThicknessAvailable(choice, [15, 30]), true);
      assert.equal(isThicknessAvailable(choice, [20, 30]), true);
    }
  });

  it("если в данных нет ни 20, ни 30 — недоступны и слэбы, и сборные", () => {
    for (const choice of [slab20, slab30, ...assembled]) {
      assert.equal(isThicknessAvailable(choice, [12]), false);
      assert.equal(isThicknessAvailable(choice, [15]), false);
      assert.equal(isThicknessAvailable(choice, [12, 15]), false);
    }
  });
});

describe("unavailableThicknessMessage", () => {
  it("без материала и при неизвестных толщинах отказа нет", () => {
    assert.equal(unavailableThicknessMessage(slab30, undefined), null);
    assert.equal(unavailableThicknessMessage(undefined, [20]), null);
    assert.equal(unavailableThicknessMessage(slab30, []), null);
  });

  it("недоступная толщина возвращает понятный текст", () => {
    assert.equal(unavailableThicknessMessage(slab30, [20]), THICKNESS_RESET_MESSAGE);
    assert.equal(unavailableThicknessMessage(miter40, [12]), THICKNESS_RESET_MESSAGE);
    assert.equal(unavailableThicknessMessage(slab20, [20, 30]), null);
  });
});
