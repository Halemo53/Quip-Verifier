import { sha256 } from "@/lib/sha256";
import type {
  PayloadErrors,
  SignatureRecord,
  SignatureStatus,
  TransactionPayload,
  VerificationResult,
} from "@/components/verifier/types";

/** WOTS+ parameters: n = 32 bytes, w = 16 → len1 = 64, len2 = 3, len = 67 chains. */
export const WOTS_N = 32;
export const WOTS_W = 16;
export const WOTS_CHAINS = 67;

export function validatePayload(p: TransactionPayload): PayloadErrors {
  const errors: PayloadErrors = {};
  const r = p.recipient.trim();
  if (!r) errors.recipient = "Recipient required";
  else if (!/^0x[0-9a-fA-F.…]{4,}$/.test(r)) errors.recipient = "Expected 0x-prefixed hex address";

  const a = p.amount.trim();
  if (!a) errors.amount = "Amount required";
  else if (!/^\d+(\.\d+)?$/.test(a)) errors.amount = "Expected a decimal number";
  else if (Number(a) <= 0) errors.amount = "Amount must be greater than 0";
  return errors;
}

export function isPayloadValid(p: TransactionPayload): boolean {
  return Object.keys(validatePayload(p)).length === 0;
}

/** Canonical encoding hashed as the transaction message. */
export function encodePayload(p: TransactionPayload): string {
  return JSON.stringify({ to: p.recipient.trim().toLowerCase(), value: p.amount.trim(), unit: "ETH" });
}

export function messageHash(p: TransactionPayload): string {
  return sha256(encodePayload(p));
}

/** Simulated ECDSA signature: r ‖ s ‖ v (65 bytes). Deterministic, not a real signature. */
export function simulateEcdsa(hash: string): string {
  const r = sha256(`ecdsa:r:${hash}`);
  const s = sha256(`ecdsa:s:${hash}`);
  const v = parseInt(hash.slice(-1), 16) % 2 === 0 ? "1b" : "1c";
  return r + s + v;
}

/** Simulated WOTS+ signature: 67 chain values × 32 bytes. Deterministic, not a real signature. */
export function simulateWots(hash: string): string {
  let out = "";
  for (let i = 0; i < WOTS_CHAINS; i++) out += sha256(`wots:${i}:${hash}`);
  return out;
}

export function buildSignatures(
  hash: string | null,
  ecdsaStatus: SignatureStatus,
  wotsStatus: SignatureStatus,
): [SignatureRecord, SignatureRecord] {
  return [
    {
      scheme: "ecdsa",
      name: "ECDSA (secp256k1)",
      label: "Classical signature",
      hex: hash ? simulateEcdsa(hash) : "",
      layout: "r ‖ s ‖ v · 65 B",
      status: hash ? ecdsaStatus : "PENDING",
    },
    {
      scheme: "wots",
      name: "WOTS+ (hash-based)",
      label: "Post-quantum signature",
      hex: hash ? simulateWots(hash) : "",
      layout: `${WOTS_CHAINS} chains × ${WOTS_N} B · w=${WOTS_W} · ${(WOTS_CHAINS * WOTS_N).toLocaleString("en-US")} B`,
      status: hash ? wotsStatus : "PENDING",
    },
  ];
}

/**
 * Quip Account rule: a transaction is accepted only if BOTH signatures are valid.
 * Any invalid signature rejects the transaction (fail closed).
 */
export function verifyHybrid(ecdsa: SignatureStatus, wots: SignatureStatus): VerificationResult {
  if (ecdsa === "PENDING" || wots === "PENDING") {
    return { outcome: "BLOCKED", reason: "awaiting valid payload" };
  }
  if (ecdsa !== "VALID") {
    return {
      outcome: "REJECTED",
      reason: "ECDSA signature invalid",
      detail:
        wots === "VALID"
          ? "WOTS+ signature remains intact. Transaction fails closed."
          : "WOTS+ signature also invalid. Transaction fails closed.",
    };
  }
  if (wots !== "VALID") {
    return {
      outcome: "REJECTED",
      reason: "WOTS+ signature invalid",
      detail: "ECDSA signature valid. Transaction fails closed.",
    };
  }
  return { outcome: "PASS" };
}

export function truncateHex(hex: string, head = 18, tail = 10): string {
  if (hex.length <= head + tail + 1) return `0x${hex}`;
  return `0x${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

/**
 * Base-w message digits for WOTS+ (w = 16): 64 nibbles of the hash followed by a
 * 3-digit checksum Σ(w−1−dᵢ). Each digit is how many times its chain is hashed.
 */
export function wotsDigits(hash: string): number[] {
  const msg = Array.from(hash.slice(0, 64), (c) => parseInt(c, 16));
  const checksum = msg.reduce((acc, d) => acc + (WOTS_W - 1 - d), 0);
  const cs = [(checksum >> 8) & 0xf, (checksum >> 4) & 0xf, checksum & 0xf];
  return [...msg, ...cs];
}
