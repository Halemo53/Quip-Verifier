import type { UIMessage } from "ai";

import { DEMO_SLOT_BUDGET, SHRINCS_MAX_LEAVES } from "@/lib/slot-budget";
import { WOTS_CHAINS, WOTS_N, WOTS_W } from "@/lib/hybrid-signature";
import type { AttackPhase, SignatureStatus, VerificationResult } from "@/components/verifier/types";

/**
 * Technical note shown in section 05 and sent verbatim to the explainer model.
 * Split around the emphasised word so the UI can bold it without a second copy.
 */
export const TECHNICAL_NOTE = {
  before: "Quip Accounts require ",
  emphasis: "both",
  after:
    " signatures to be valid. A quantum computer running Shor's algorithm can derive the ECDSA private key from the public key, but it cannot invert the hash functions that secure WOTS+. The post-quantum layer is additive — it never weakens the classical layer, it only adds a second lock.",
} as const;
export const TECHNICAL_NOTE_TEXT = TECHNICAL_NOTE.before + TECHNICAL_NOTE.emphasis + TECHNICAL_NOTE.after;

/** Limits for the public explainer endpoint. */
export const MAX_QUESTION_CHARS = 1000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_LOG_LINES = 10;

/** What the explainer is told about the page at the moment a question is sent. */
export interface SimulationSnapshot {
  payload: { recipient: string; amount: string; valid: boolean };
  messageHash: string | null;
  ecdsa: SignatureStatus;
  wots: SignatureStatus;
  verification: VerificationResult;
  attackPhase: AttackPhase;
  attackLog: string[];
  slots: { used: number; total: number };
}

const STATUSES: readonly SignatureStatus[] = ["VALID", "COMPROMISED", "PENDING"];
const PHASES: readonly AttackPhase[] = ["idle", "running", "complete"];
const OUTCOMES = ["PASS", "REJECTED", "BLOCKED"] as const;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max ? v : null);

/** Strict parse of a client-supplied snapshot; anything unexpected is rejected. */
export function parseSnapshot(raw: unknown): SimulationSnapshot | null {
  if (!isObj(raw)) return null;
  const { payload, messageHash, ecdsa, wots, verification, attackPhase, attackLog, slots } = raw;
  if (!isObj(payload) || !isObj(verification) || !isObj(slots) || !Array.isArray(attackLog)) return null;

  const recipient = str(payload["recipient"], 120);
  const amount = str(payload["amount"], 40);
  if (recipient === null || amount === null || typeof payload["valid"] !== "boolean") return null;

  const hash = messageHash === null ? null : str(messageHash, 64);
  if (hash === null && messageHash !== null) return null;
  if (hash !== null && !/^[0-9a-f]{64}$/.test(hash)) return null;

  if (!STATUSES.includes(ecdsa as SignatureStatus) || !STATUSES.includes(wots as SignatureStatus)) return null;
  if (!PHASES.includes(attackPhase as AttackPhase)) return null;

  const outcome = verification["outcome"];
  if (!OUTCOMES.includes(outcome as (typeof OUTCOMES)[number])) return null;
  let v: VerificationResult;
  if (outcome === "PASS") v = { outcome: "PASS" };
  else {
    const reason = str(verification["reason"], 200);
    if (reason === null) return null;
    if (outcome === "BLOCKED") v = { outcome: "BLOCKED", reason };
    else {
      const detail = str(verification["detail"], 200);
      if (detail === null) return null;
      v = { outcome: "REJECTED", reason, detail };
    }
  }

  if (attackLog.length > MAX_LOG_LINES) return null;
  const log: string[] = [];
  for (const line of attackLog) {
    const l = str(line, 200);
    if (l === null) return null;
    log.push(l);
  }

  const used = slots["used"];
  const total = slots["total"];
  if (!Number.isInteger(used) || !Number.isInteger(total)) return null;
  if ((total as number) < 1 || (total as number) > SHRINCS_MAX_LEAVES) return null;
  if ((used as number) < 0 || (used as number) > (total as number)) return null;

  return {
    payload: { recipient, amount, valid: payload["valid"] },
    messageHash: hash,
    ecdsa: ecdsa as SignatureStatus,
    wots: wots as SignatureStatus,
    verification: v,
    attackPhase: attackPhase as AttackPhase,
    attackLog: log,
    slots: { used: used as number, total: total as number },
  };
}

function verdictLine(v: VerificationResult): string {
  if (v.outcome === "PASS") return "PASS (both signatures valid)";
  if (v.outcome === "BLOCKED") return `BLOCKED — ${v.reason}`;
  return `REJECTED — ${v.reason}. ${v.detail}`;
}

const PHASE_TEXT: Record<AttackPhase, string> = {
  idle: "not run yet",
  running: "in progress",
  complete: "complete — the simulated quantum adversary has recovered the ECDSA key",
};

/** Plain-text readout of the current page state. Shared by the panel readout and the model prompt. */
export function describeSnapshot(s: SimulationSnapshot): string {
  const lines = [
    `Transaction payload: send ${s.payload.amount || "(empty)"} ETH to ${s.payload.recipient || "(empty)"} — ${s.payload.valid ? "valid" : "invalid, so no signatures are produced"}`,
    `Message hash (SHA-256 of the canonical payload): ${s.messageHash ? `0x${s.messageHash}` : "none"}`,
    `ECDSA (secp256k1) signature status: ${s.ecdsa}`,
    `WOTS+ signature status: ${s.wots}`,
    `Hybrid verification result: ${verdictLine(s.verification)}`,
    `Quantum attack simulation: ${PHASE_TEXT[s.attackPhase]}`,
    `Everyday-path slot budget (demo): ${s.slots.used} of ${s.slots.total} slots used${s.slots.used >= s.slots.total ? " — exhausted, break-glass path required" : ""}`,
  ];
  if (s.attackLog.length) lines.push("Attack log:", ...s.attackLog.map((l) => `  > ${l}`));
  return lines.join("\n");
}

/** System instructions for the explainer: role, grounding material, current state. */
export function buildTutorInstructions(s: SimulationSnapshot): string {
  return `You are the explainer built into the Quip Hybrid Signature Verifier, an interactive teaching tool. Learners ask about what they see on the page and the cryptography behind it.

How to answer:
- Ground every answer in the technical note, the page facts and the current simulation state below. Refer to the learner's actual values and statuses when they are relevant (for example, which signature is COMPROMISED right now).
- Explain concepts precisely but plainly: ECDSA and the elliptic-curve discrete log problem, Shor's and Grover's algorithms, hash preimage resistance, WOTS+ hash chains and checksums, one-time signature slot reuse, SHRINCS, and why the hybrid rule fails closed.
- Everything on this page is a simulation. Signatures are derived locally from the hash and are not real; the attack is choreographed. Say so when it matters.
- Do not invent Quip APIs, package names, contract addresses, numbers or dates. If something is not covered below, say you are not sure and point the learner to the Quip documentation at developers.quip.network.
- Write plain text in short paragraphs, under about 180 words unless the learner asks for depth. No markdown headings, tables or bold. Use \`backticks\` only for identifiers or formulas.
- Stay on topic: this tool, Quip Accounts and the cryptography involved.

Technical note (from the page, authoritative for this tool):
${TECHNICAL_NOTE_TEXT}

Page facts:
- Section 01 Transaction payload: recipient + amount are canonically encoded and hashed with SHA-256; that hash is the message both schemes sign.
- Section 02 Signature state: ECDSA secp256k1 signature is r ‖ s ‖ v, 65 bytes. WOTS+ uses n = ${WOTS_N} bytes, w = ${WOTS_W}: 64 message digits plus a 3-digit checksum = ${WOTS_CHAINS} chains, ${WOTS_CHAINS * WOTS_N} bytes. Each base-16 digit says how many times its chain is hashed; the checksum stops an attacker from advancing chains to forge another message.
- Verification rule: the transaction passes only if BOTH signatures are VALID. Any invalid signature rejects it (fail closed).
- Section 03 Attack simulation: Shor's period finding recovers the ECDSA private key d from Q = d·G, so ECDSA becomes COMPROMISED. WOTS+ has no group structure for Shor to exploit; Grover only gives a square-root speedup, leaving about 2^128 work for SHA-256 preimages, so WOTS+ stays VALID. The verifier then rejects.
- Section 06 SHRINCS: what Quip Accounts actually use. Two paths under one 32-byte public commitment: an everyday WOTS-C one-time signature under an unbalanced Merkle tree (cheap, each signature consumes one leaf, max ${SHRINCS_MAX_LEAVES.toLocaleString("en-US")} leaves), and a break-glass full SPHINCS+C signature (expensive, stateless, for recovery and key rotation). WOTS+ shown above is the legacy v1 scheme used for teaching.
- Section 07 Slot budget: a scaled-down demo of ${DEMO_SLOT_BUDGET} slots; one slot per signature; reusing a slot weakens the scheme.
- Section 08 Swap flow: Quip Account → QuipSwap → counterparty account on another chain; a shared secret settles both legs or neither; no bridge, oracle, wrapped asset or intermediary holding funds.

Current simulation state (captured when this question was sent):
${describeSnapshot(s)}`;
}

/**
 * History sent to the model: last N messages, user/assistant text only.
 * Reasoning and other parts are dropped so stale encrypted reasoning is never replayed.
 */
export function trimHistory(messages: UIMessage[], max = MAX_HISTORY_MESSAGES): UIMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ ...m, parts: m.parts.filter((p) => p.type === "text") }))
    .filter((m) => m.parts.length > 0)
    .slice(-max);
}

export function messageText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/** Gemini conversation turns: learner → "user", explainer → "model"; text only, empty turns dropped. */
export type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };
export function toGeminiContents(messages: UIMessage[]): GeminiContent[] {
  return trimHistory(messages)
    .map((m) => ({ role: m.role === "assistant" ? ("model" as const) : ("user" as const), text: messageText(m) }))
    .filter((m) => m.text.trim().length > 0)
    .map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}

export type TutorRequest = { messages: UIMessage[]; snapshot: SimulationSnapshot };

/** Validates the explainer request body. The newest message must be the learner's question. */
export function parseTutorRequest(body: unknown): { ok: true; data: TutorRequest } | { ok: false; error: string } {
  if (!isObj(body) || !Array.isArray(body["messages"])) return { ok: false, error: "Malformed request." };
  const snapshot = parseSnapshot(body["snapshot"]);
  if (!snapshot) return { ok: false, error: "Simulation state is missing or malformed." };

  const raw = body["messages"] as unknown[];
  if (raw.length === 0 || raw.length > 200) return { ok: false, error: "Malformed conversation." };
  for (const m of raw) {
    if (!isObj(m) || typeof m["id"] !== "string" || !Array.isArray(m["parts"])) {
      return { ok: false, error: "Malformed conversation." };
    }
    if (m["role"] !== "user" && m["role"] !== "assistant") return { ok: false, error: "Malformed conversation." };
    for (const p of m["parts"] as unknown[]) {
      if (!isObj(p) || typeof p["type"] !== "string") return { ok: false, error: "Malformed conversation." };
      if (p["type"] === "text" && typeof p["text"] !== "string") return { ok: false, error: "Malformed conversation." };
    }
  }

  const messages = trimHistory(raw as UIMessage[]);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return { ok: false, error: "Ask a question first." };
  const question = messageText(last).trim();
  if (!question) return { ok: false, error: "Ask a question first." };
  if (question.length > MAX_QUESTION_CHARS) {
    return { ok: false, error: `Questions are limited to ${MAX_QUESTION_CHARS} characters.` };
  }
  return { ok: true, data: { messages, snapshot } };
}

/** Starter questions that follow the page state. */
export function suggestedQuestions(s: SimulationSnapshot): string[] {
  const out: string[] = [];
  if (s.verification.outcome === "REJECTED") {
    out.push("Why is the transaction rejected when the WOTS+ signature is still valid?");
    out.push("How did Shor's algorithm recover the ECDSA private key here?");
  } else if (s.verification.outcome === "BLOCKED") {
    out.push("Why are there no signatures for this payload?");
  } else {
    out.push("What would happen to each signature if I run the quantum attack now?");
  }
  out.push("Why can't a quantum computer forge the WOTS+ signature?");
  out.push("What do the bar heights in the WOTS+ chain grid mean?");
  if (s.slots.used >= s.slots.total) out.push("The slot budget is exhausted — what does break-glass mean?");
  else out.push("Why can each everyday-path slot sign only one message?");
  return out.slice(0, 4);
}
