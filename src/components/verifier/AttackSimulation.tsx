import { cn } from "@/lib/utils";
import { Section, SimulatedTag } from "./primitives";
import type { AttackPhase } from "./types";

export interface AttackLogEntry {
  at: number;
  text: string;
  /** Optional status word appended in its status color. */
  status?: { word: string; tone: "compromised" | "valid" };
}

interface Props {
  phase: AttackPhase;
  log: AttackLogEntry[];
  disabled: boolean;
  onAttack: () => void;
  onReset: () => void;
}

export function AttackSimulation({ phase, log, disabled, onAttack, onReset }: Props) {
  const running = phase === "running";
  return (
    <Section id="attack-heading" index="03" title="Attack Simulation">
      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-0">
        <div className="md:border-r md:border-divider md:pr-8">
          {/* Primary action sits alone, left-aligned, with deliberate space to its right. */}
          <div className="md:pr-8">
            <button
              type="button"
              onClick={onAttack}
              disabled={disabled || phase !== "idle"}
              aria-busy={running}
              className="btn btn-primary w-full md:w-auto"
            >
              {running ? "ATTACK IN PROGRESS…" : "SIMULATE QUANTUM ATTACK"}
            </button>
          </div>

          <div className="mt-4 h-px w-full bg-divider" aria-hidden>
            <div
              className={cn(
                "h-px origin-left bg-accent ease-linear [transition-property:transform]",
                phase === "idle" ? "scale-x-0 duration-0" : "scale-x-100 duration-[1500ms]",
              )}
            />
          </div>

          {phase === "complete" && (
            <button type="button" onClick={onReset} className="btn mt-4 w-full md:w-auto">
              RESET
            </button>
          )}

          <p className="mt-4 text-label text-muted-foreground">
            {disabled && phase === "idle"
              ? "Disabled — fix the transaction payload to produce signatures."
              : "Models an adversary with a cryptographically relevant quantum computer. Both signatures are re-checked."}
          </p>
        </div>

        <div className="md:pl-8">
          <div className="mb-2 flex justify-end">
            <SimulatedTag />
          </div>
          <ol
            aria-live="polite"
            className="scroll-thin min-h-32 space-y-1 overflow-x-auto border border-structure bg-background p-4 text-label"
          >
            {log.length === 0 && <li className="text-faint">&gt; idle — awaiting attack simulation</li>}
            {log.map((entry) => (
              <li key={entry.at} className="flex gap-4">
                <span className="shrink-0 text-faint">t+{(entry.at / 1000).toFixed(3)}s</span>
                <span className="text-muted-foreground">
                  &gt; {entry.text}
                  {entry.status && (
                    <>
                      {" — "}
                      <span
                        className={cn(
                          "font-semibold",
                          entry.status.tone === "compromised" ? "text-compromised-text" : "text-valid-text",
                        )}
                      >
                        {entry.status.word}
                      </span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
