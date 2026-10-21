import { describe, expect, it } from "vitest";

import { sha256 } from "@/lib/sha256";
import { messageHash, validatePayload, verifyHybrid } from "@/lib/hybrid-signature";

describe("sha256", () => {
  it("matches the FIPS 180-4 test vector for 'abc'", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("hybrid verification", () => {
  it("passes only when both ECDSA and WOTS+ are valid", () => {
    expect(verifyHybrid("VALID", "VALID").outcome).toBe("PASS");
  });

  it("rejects (fails closed) when ECDSA is compromised even though WOTS+ is valid", () => {
    const r = verifyHybrid("COMPROMISED", "VALID");
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("ECDSA signature invalid");
  });

  it("rejects when WOTS+ is invalid even though ECDSA is valid", () => {
    expect(verifyHybrid("VALID", "COMPROMISED").outcome).toBe("REJECTED");
  });
});

describe("payload", () => {
  it("accepts the default payload and changes hash when amount changes", () => {
    const base = { recipient: "0x7a3f...c91e", amount: "1.5" };
    expect(validatePayload(base)).toEqual({});
    expect(messageHash(base)).not.toBe(messageHash({ ...base, amount: "1.6" }));
  });

  it("rejects a non-numeric amount", () => {
    expect(validatePayload({ recipient: "0x7a3f...c91e", amount: "abc" }).amount).toBeDefined();
  });
});
