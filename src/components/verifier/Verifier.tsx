import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildSignatures,
  isPayloadValid,
  messageHash,
  validatePayload,
  verifyHybrid,
} from "@/lib/hybrid-signature";
import { ATTACK_TIMELINE as T } from "@/lib/attack-timeline";
import { DEMO_SLOT_BUDGET } from "@/lib/slot-budget";
import { MAX_LOG_LINES, type SimulationSnapshot } from "@/lib/tutor-context";
import { AttackSimulation, type AttackLogEntry } from "./AttackSimulation";
import { Header } from "./Header";
import { IntegrationRoadmap } from "./IntegrationRoadmap";
import { QuizBlock } from "./QuizBlock";
import { ShrincsStrip } from "./ShrincsStrip";
import { SignatureState } from "./SignatureState";
import { SlotBudget } from "./SlotBudget";
import { SourceFooter } from "./SourceFooter";
import { StatusProbe } from "./StatusProbe";
import { SwapFlow } from "./SwapFlow";
import { TechnicalNote } from "./TechnicalNote";
import { TransactionPayload } from "./TransactionPayload";
import { TutorPanel } from "./TutorPanel";
import type { AttackPhase, SignatureStatus, TransactionPayload as Payload, VerificationResult } from "./types";

const DEFAULT_PAYLOAD: Payload = { recipient: "0x7a3f...c91e", amount: "1.5" };
const PRE_ATTACK: VerificationResult = { outcome: "PASS" };

export function Verifier() {
  const [payload, setPayload] = useState<Payload>(DEFAULT_PAYLOAD);
  const [phase, setPhase] = useState<AttackPhase>("idle");
  const [ecdsaStatus, setEcdsaStatus] = useState<SignatureStatus>("VALID");
  const [glitch, setGlitch] = useState(false);
  const [struck, setStruck] = useState(false);
  const [wotsFlash, setWotsFlash] = useState(false);
  const [verdictHidden, setVerdictHidden] = useState(false);
  const [verdictRevealed, setVerdictRevealed] = useState(false);
  const [log, setLog] = useState<AttackLogEntry[]>([]);
  const [slotsUsed, setSlotsUsed] = useState(0);
  const timers = useRef<number[]>([]);

  const errors = useMemo(() => validatePayload(payload), [payload]);
  const valid = isPayloadValid(payload);
  const hash = useMemo(() => (valid ? messageHash(payload) : null), [payload, valid]);
  const [ecdsa, wots] = useMemo(() => buildSignatures(hash, ecdsaStatus, "VALID"), [hash, ecdsaStatus]);

  // The result line holds its pre-attack text until the fade swaps in the new verdict.
  const verification =
    phase === "running" && !verdictRevealed ? PRE_ATTACK : verifyHybrid(ecdsa.status, wots.status);

  const snapshot: SimulationSnapshot = {
    payload: { recipient: payload.recipient.slice(0, 120), amount: payload.amount.slice(0, 40), valid },
    messageHash: hash,
    ecdsa: ecdsa.status,
    wots: wots.status,
    verification,
    attackPhase: phase,
    attackLog: log.slice(-MAX_LOG_LINES).map((e) =>
      `t+${(e.at / 1000).toFixed(3)}s ${e.text}${e.status ? ` — ${e.status.word}` : ""}`.slice(0, 200),
    ),
    slots: { used: slotsUsed, total: DEMO_SLOT_BUDGET },
  };

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const at = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const push = (entry: AttackLogEntry) => setLog((l) => [...l, entry]);

  const runAttack = useCallback(() => {
    if (!valid || phase !== "idle") return;
    clearTimers();
    setPhase("running");
    setGlitch(true);
    setLog([{ at: 0, text: "target secp256k1 public key Q = d·G — running Shor period finding" }]);

    at(T.glitchEnd, () => {
      setGlitch(false);
      setStruck(true);
    });
    at(T.badge, () => {
      setEcdsaStatus("COMPROMISED");
      push({
        at: T.badge,
        text: "discrete log solved, d recovered",
        status: { word: "ECDSA COMPROMISED", tone: "compromised" },
      });
    });
    at(T.flashStart, () => {
      setWotsFlash(true);
      push({
        at: T.flashStart,
        text: "target WOTS+ chains (SHA-256) — no group structure; preimage still 2¹²⁸",
        status: { word: "INTACT", tone: "valid" },
      });
    });
    at(T.fadeOut, () => setVerdictHidden(true));
    at(T.fadeIn, () => {
      setVerdictRevealed(true);
      setVerdictHidden(false);
    });
    at(T.flashEnd, () => setWotsFlash(false));
    at(T.done, () => {
      setPhase("complete");
      push({
        at: T.done,
        text: "verifier: require(ecdsa ∧ wots) → false",
        status: { word: "REJECTED", tone: "compromised" },
      });
    });
  }, [valid, phase]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setEcdsaStatus("VALID");
    setGlitch(false);
    setStruck(false);
    setWotsFlash(false);
    setVerdictHidden(false);
    setVerdictRevealed(false);
    setLog([]);
  }, []);

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-12 pb-16 md:px-8 lg:pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-0">
          <div className="md:border-r md:border-divider md:pr-8">
            <TransactionPayload
              payload={payload}
              errors={errors}
              hash={hash}
              disabled={phase !== "idle"}
              onChange={setPayload}
            />
          </div>
          <div className="md:pl-8">
            <SignatureState
              ecdsa={ecdsa}
              wots={wots}
              hash={hash}
              ecdsaGlitch={glitch}
              ecdsaStruck={struck}
              wotsFlash={wotsFlash}
              verification={verification}
              verificationHidden={verdictHidden}
            />
          </div>
        </div>

        <AttackSimulation phase={phase} log={log} disabled={!valid} onAttack={runAttack} onReset={reset} />
        <StatusProbe index="04" />
        <TechnicalNote />
        <ShrincsStrip />
        <SlotBudget used={slotsUsed} setUsed={setSlotsUsed} />
        <SwapFlow />
        <QuizBlock />
        <TutorPanel index="10" snapshot={snapshot} />
        <IntegrationRoadmap index="11" />
      </main>
      <SourceFooter />
    </div>
  );
}
