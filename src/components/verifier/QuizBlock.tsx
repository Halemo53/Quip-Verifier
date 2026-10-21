import { useState } from "react";

import { cn } from "@/lib/utils";
import { isQuizCorrect, type QuizOption } from "@/lib/slot-budget";
import { Section } from "./primitives";

const OPTIONS: { id: QuizOption; text: string }[] = [
  { id: "A", text: "It executes normally — ECDSA was the only gate." },
  { id: "B", text: "It is rejected — the post-quantum signature is also required." },
  { id: "C", text: "It executes but funds are frozen." },
];

export function QuizBlock() {
  const [choice, setChoice] = useState<QuizOption | null>(null);

  return (
    <Section id="quiz-heading" index="09" title="Verify what you learned">
      <fieldset className="max-w-[65ch] border border-structure bg-background p-4 md:p-6">
        <legend className="sr-only">Quiz question</legend>
        <p className="text-body text-foreground">
          If a quantum attacker breaks the ECDSA key but cannot produce a valid SHRINCS signature, what
          happens to the transaction?
        </p>

        <div className="mt-4 space-y-2">
          {OPTIONS.map((o) => {
            const selected = choice === o.id;
            return (
              <label
                key={o.id}
                className={cn(
                  "flex min-h-10 cursor-pointer items-start gap-3 border px-3 py-2 select-none",
                  "transition-[background-color,border-color,color,transform] duration-100 ease-linear",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                  "active:translate-y-px active:bg-active-fill active:duration-[60ms]",
                  selected
                    ? "border-accent text-foreground"
                    : "border-control text-muted-foreground hover:border-focus-line hover:bg-hover-fill hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="quiz"
                  value={o.id}
                  checked={selected}
                  onChange={() => setChoice(o.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 block size-2 shrink-0 border transition-mech",
                    selected ? "border-accent bg-accent" : "border-control",
                  )}
                />
                <span className="text-body">
                  <span className="font-semibold">{o.id})</span> {o.text}
                </span>
              </label>
            );
          })}
        </div>

        <div aria-live="polite" className="min-h-8">
          {choice && (
            <p className={cn("mt-4 text-label", isQuizCorrect(choice) ? "text-valid-text" : "text-compromised-text")}>
              {isQuizCorrect(choice)
                ? "Correct. Both paths must validate. The post-quantum layer is additive, not a replacement."
                : "Incorrect. Quip Accounts require both signatures. The ECDSA break alone does not authorize movement."}
            </p>
          )}
        </div>
      </fieldset>
    </Section>
  );
}
