export type SignatureStatus = "VALID" | "COMPROMISED" | "PENDING";

export type SignatureScheme = "ecdsa" | "wots";

export interface TransactionPayload {
  recipient: string;
  amount: string;
}

export interface PayloadErrors {
  recipient?: string | undefined;
  amount?: string | undefined;
}

export interface SignatureRecord {
  scheme: SignatureScheme;
  name: string;
  label: string;
  /** Full hex signature (simulated, deterministic from the message hash). */
  hex: string;
  /** Short structural description, e.g. "r ‖ s ‖ v · 65 B". */
  layout: string;
  status: SignatureStatus;
}

export type AttackPhase = "idle" | "running" | "complete";

export type VerificationResult =
  | { outcome: "PASS" }
  | { outcome: "REJECTED"; reason: string; detail: string }
  | { outcome: "BLOCKED"; reason: string };
