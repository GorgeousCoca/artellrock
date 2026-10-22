import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatRub } from "./format";
import { isPriceStepMultiple, PRICE_STEP, priceStepError, roundToPriceStep } from "./price-rounding";

describe("roundToPriceStep", () => {
  it("половина вверх: 124 → 0, 125 → 250, 126 → 250", () => {
    assert.equal(roundToPriceStep(124), 0);
    assert.equal(roundToPriceStep(125), 250);
    assert.equal(roundToPriceStep(126), 250);
  });

  it("0 остаётся 0", () => {
    assert.equal(roundToPriceStep(0), 0);
  });

  it("большие числа и примеры прайса", () => {
    assert.equal(roundToPriceStep(1_000_000), 1_000_000);
    assert.equal(roundToPriceStep(10_000_124), 10_000_000);
    assert.equal(roundToPriceStep(10_000_125), 10_000_250);
    assert.equal(roundToPriceStep(1600), 1500);
    assert.equal(roundToPriceStep(2600), 2500);
    assert.equal(roundToPriceStep(3400), 3500);
    assert.equal(roundToPriceStep(4200), 4250);
    assert.equal(roundToPriceStep(17771), 17750);
  });

  it("нецелые округляются тем же правилом", () => {
    assert.equal(roundToPriceStep(124.4), 0);
    assert.equal(roundToPriceStep(374.9), 250);
    assert.equal(roundToPriceStep(375), 500);
    assert.equal(roundToPriceStep(17771.6), 17750);
  });

  it("NaN и отрицательные становятся 0", () => {
    assert.equal(roundToPriceStep(Number.NaN), 0);
    assert.equal(roundToPriceStep(Number.POSITIVE_INFINITY), 0);
    assert.equal(roundToPriceStep(-1), 0);
    assert.equal(roundToPriceStep(-125), 0);
  });
});

describe("isPriceStepMultiple", () => {
  it("кратные 250, включая 0", () => {
    for (const value of [0, PRICE_STEP, 17750, 1_000_000]) assert.equal(isPriceStepMultiple(value), true, String(value));
  });

  it("остальное — нет", () => {
    for (const value of [124, 125, 1, 17771, 250.5, -250, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(isPriceStepMultiple(value), false, String(value));
    }
  });
});

describe("priceStepError", () => {
  it("для кратного значения ошибки нет", () => {
    assert.equal(priceStepError(0), null);
    assert.equal(priceStepError(17750), null);
  });

  it("называет ближайшее значение через formatRub", () => {
    assert.equal(priceStepError(17771), `Цена должна быть кратна 250 ₽. Ближайшее значение: ${formatRub(17750)}`);
    assert.equal(priceStepError(124), `Цена должна быть кратна 250 ₽. Ближайшее значение: ${formatRub(0)}`);
  });
});
