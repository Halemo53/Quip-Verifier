/** Scaled-down demo budget shown in the UI. Production SHRINCS everyday path allows up to 4,096 leaves. */
export const DEMO_SLOT_BUDGET = 40;
export const SHRINCS_MAX_LEAVES = 4096;

/** Signing consumes exactly one slot; never exceeds the budget. */
export function signOne(used: number, total: number = DEMO_SLOT_BUDGET): number {
  return Math.min(used + 1, total);
}

export function slotStatus(used: number, total: number = DEMO_SLOT_BUDGET) {
  const remaining = Math.max(0, total - used);
  if (remaining === 0) {
    return {
      exhausted: true,
      remaining,
      text: "Budget exhausted. Everyday path unavailable. Break-glass path required.",
    };
  }
  return { exhausted: false, remaining, text: `Everyday path active. Remaining slots: ${remaining}.` };
}

export type QuizOption = "A" | "B" | "C";
export const QUIZ_CORRECT: QuizOption = "B";
export const isQuizCorrect = (choice: QuizOption) => choice === QUIZ_CORRECT;
