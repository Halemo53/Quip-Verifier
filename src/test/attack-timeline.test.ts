import { describe, expect, it } from "vitest";

import { ATTACK_TIMELINE as T } from "@/lib/attack-timeline";
import { truncateHex } from "@/lib/hybrid-signature";

describe("attack timeline", () => {
  it("keeps the 1.5s total", () => {
    expect(T.done).toBe(1500);
  });

  it("glitches 0–200ms, then draws the strike over 200–600ms", () => {
    expect(T.glitchEnd).toBe(200);
    expect(T.strikeStart + T.strikeDurationMs).toBe(600);
  });

  it("flips the ECDSA badge at 600ms and starts the WOTS+ flash at 800ms", () => {
    expect(T.badge).toBe(600);
    expect(T.flashStart).toBe(800);
  });

  it("fades the verification line within 1200–1500ms", () => {
    expect(T.fadeOut).toBe(1200);
    expect(T.fadeIn).toBeLessThan(T.done);
  });
});

describe("hex display", () => {
  it("truncates in the middle, keeping both ends", () => {
    const shown = truncateHex("7a3f" + "0".repeat(40) + "c91e", 4, 4);
    expect(shown).toBe("0x7a3f…c91e");
  });
});
