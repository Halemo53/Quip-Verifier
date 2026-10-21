import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_CHARS,
  TECHNICAL_NOTE_TEXT,
  buildTutorInstructions,
  parseSnapshot,
  parseTutorRequest,
  toGeminiContents,
  trimHistory,
  type SimulationSnapshot,
} from "@/lib/tutor-context";

const attacked: SimulationSnapshot = {
  payload: { recipient: "0x7a3f...c91e", amount: "1.5", valid: true },
  messageHash: "a".repeat(64),
  ecdsa: "COMPROMISED",
  wots: "VALID",
  verification: {
    outcome: "REJECTED",
    reason: "ECDSA signature invalid",
    detail: "WOTS+ signature remains intact. Transaction fails closed.",
  },
  attackPhase: "complete",
  attackLog: ["t+0.600s discrete log solved, d recovered — ECDSA COMPROMISED"],
  slots: { used: 40, total: 40 },
};

const msg = (id: string, role: "user" | "assistant", text: string): UIMessage => ({
  id,
  role,
  parts: [{ type: "text", text }],
});

describe("explainer instructions", () => {
  it("include the technical note verbatim", () => {
    expect(buildTutorInstructions(attacked)).toContain(TECHNICAL_NOTE_TEXT);
  });

  it("include the current signature statuses and verdict", () => {
    const out = buildTutorInstructions(attacked);
    expect(out).toContain("ECDSA (secp256k1) signature status: COMPROMISED");
    expect(out).toContain("WOTS+ signature status: VALID");
    expect(out).toContain("Hybrid verification result: REJECTED — ECDSA signature invalid");
  });

  it("report an exhausted slot budget", () => {
    expect(buildTutorInstructions(attacked)).toContain("40 of 40 slots used — exhausted, break-glass path required");
  });
});

describe("explainer request validation", () => {
  it("accepts a question with valid state", () => {
    const r = parseTutorRequest({ messages: [msg("1", "user", "Why rejected?")], snapshot: attacked });
    expect(r.ok).toBe(true);
  });

  it("rejects questions over the character limit", () => {
    const r = parseTutorRequest({
      messages: [msg("1", "user", "x".repeat(MAX_QUESTION_CHARS + 1))],
      snapshot: attacked,
    });
    expect(r.ok).toBe(false);
  });

  it("requires the newest message to be the learner's", () => {
    const r = parseTutorRequest({
      messages: [msg("1", "user", "hi"), msg("2", "assistant", "hello")],
      snapshot: attacked,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown signature status", () => {
    expect(parseSnapshot({ ...attacked, ecdsa: "FORGED" })).toBeNull();
  });

  it("rejects slot usage above the total", () => {
    expect(parseSnapshot({ ...attacked, slots: { used: 41, total: 40 } })).toBeNull();
  });
});

describe("history sent to the model", () => {
  it(`keeps only the last ${MAX_HISTORY_MESSAGES} messages`, () => {
    const many = Array.from({ length: 30 }, (_, i) => msg(String(i), i % 2 ? "assistant" : "user", `m${i}`));
    const out = trimHistory(many);
    expect(out).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(out[0]?.id).toBe("10");
  });

  it("drops reasoning parts", () => {
    const m: UIMessage = {
      id: "a",
      role: "assistant",
      parts: [
        { type: "reasoning", text: "thinking" },
        { type: "text", text: "answer" },
      ],
    };
    expect(trimHistory([m])[0]?.parts).toEqual([{ type: "text", text: "answer" }]);
  });

  it("maps explainer turns to Gemini's model role", () => {
    const out = toGeminiContents([msg("1", "user", "Why?"), msg("2", "assistant", "Because."), msg("3", "user", "And?")]);
    expect(out.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(out[1]?.parts).toEqual([{ text: "Because." }]);
  });
});
