import type { Dispatch, SetStateAction } from "react";

import { cn } from "@/lib/utils";
import { DEMO_SLOT_BUDGET, signOne, slotStatus } from "@/lib/slot-budget";
import { Section, SimulatedTag } from "./primitives";

/** Slot count is owned by the Verifier so the explainer can see it. */
export function SlotBudget({ used, setUsed }: { used: number; setUsed: Dispatch<SetStateAction<number>> }) {
  const status = slotStatus(used);

  return (
    <Section id="slots-heading" index="07" title="Slot Budget (Everyday Path)">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setUsed((u) => signOne(u))}
          disabled={status.exhausted}
          className="btn w-full sm:w-auto"
        >
          SIGN ONE MESSAGE
        </button>
        <button type="button" onClick={() => setUsed(0)} disabled={used === 0} className="btn w-full sm:w-auto">
          RESET
        </button>
      </div>

      <div
        className="mt-6 flex gap-1"
        role="meter"
        aria-label="Slots used"
        aria-valuemin={0}
        aria-valuemax={DEMO_SLOT_BUDGET}
        aria-valuenow={used}
      >
        {Array.from({ length: DEMO_SLOT_BUDGET }, (_, i) => (
          <span
            key={i}
            className={cn(
              "block h-4 flex-1 border transition-mech",
              i < used ? "border-accent bg-accent" : "border-control bg-background",
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="flex items-center gap-4 text-body text-muted-foreground">
          <SimulatedTag />
          <span>
            Slots used: <span className="font-semibold text-foreground">{used}</span> / {DEMO_SLOT_BUDGET}
          </span>
        </p>
        <p
          aria-live="polite"
          className={cn("text-label", status.exhausted ? "text-compromised-text" : "text-muted-foreground")}
        >
          {status.text}
        </p>
      </div>

      <p className="mt-4 max-w-[65ch] text-label text-faint">
        Each slot signs exactly one message. Reusing a slot weakens the scheme. In production, clients
        track this state for you.
      </p>
    </Section>
  );
}
