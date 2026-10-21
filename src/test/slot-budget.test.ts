import { describe, expect, it } from "vitest";

import { DEMO_SLOT_BUDGET, isQuizCorrect, signOne, slotStatus } from "@/lib/slot-budget";

describe("slot budget", () => {
  it("has a demo budget of 40 slots", () => {
    expect(DEMO_SLOT_BUDGET).toBe(40);
  });

  it("consumes exactly one slot per signature", () => {
    expect(signOne(0)).toBe(1);
    expect(signOne(17)).toBe(18);
  });

  it("never goes past 40", () => {
    expect(signOne(40)).toBe(40);
  });

  it("reports remaining slots while active", () => {
    expect(slotStatus(3).text).toBe("Everyday path active. Remaining slots: 37.");
    expect(slotStatus(39).exhausted).toBe(false);
  });

  it("requires break-glass path at 40 / 40", () => {
    const s = slotStatus(40);
    expect(s.exhausted).toBe(true);
    expect(s.text).toBe("Budget exhausted. Everyday path unavailable. Break-glass path required.");
  });
});

describe("quiz", () => {
  it("accepts only B as correct", () => {
    expect(isQuizCorrect("B")).toBe(true);
    expect(isQuizCorrect("A")).toBe(false);
    expect(isQuizCorrect("C")).toBe(false);
  });
});
