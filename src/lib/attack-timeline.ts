/**
 * Quantum attack choreography (ms from click). Total 1.5s.
 *   0–200     ECDSA hex glitches
 *   200–600   strikethrough draws across ECDSA hex (400ms)
 *   600–800   ECDSA badge VALID → COMPROMISED (100ms color transition)
 *   800–1400  WOTS+ border flash: 200 in, 200 hold, 200 out
 *   1200–1500 verification line fades out, swaps to the rejection, fades in
 */
export const ATTACK_TIMELINE = {
  glitchEnd: 200,
  strikeStart: 200,
  strikeDurationMs: 400,
  badge: 600,
  flashStart: 800,
  flashEnd: 1400,
  fadeOut: 1200,
  fadeIn: 1350,
  done: 1500,
} as const;
