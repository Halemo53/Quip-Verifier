<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Verifier UI lives in `src/components/verifier/` (one file per section, shared shapes in `types.ts`); why: brief requires per-section components.
- Crypto simulation logic (hashing, signature derivation, hybrid verify rule) stays pure in `src/lib/` and is unit-tested; why: the fail-closed rule must be testable without UI.
- No shadcn/UI library or animation library in verifier components — hand-built Tailwind + CSS transitions only; why: explicit brief constraint.
- All external Quip URLs live in `src/config/quipLinks.ts` and every external link spreads `externalLinkProps` (new tab, noopener noreferrer); why: one source of truth for references, verified against live docs.
- Network probes go through `src/lib/probe.ts`: real fetch only, explicit success/HTTP-error/CORS/timeout states, never a simulated success; locally generated values carry the inline `SimulatedTag`. Why: tool credibility depends on not faking live data.
- Shared verifier primitives (Section, SectionLabel, SimulatedTag, ExternalLink, CopyValue) live in `src/components/verifier/primitives.tsx`; buttons/fields/links use the `.btn`, `.btn-primary`, `.field`, `.link` classes in `src/styles.css`. Why: one place enforces control height, line opacities and interaction timings.
- Attack choreography timings live in `src/lib/attack-timeline.ts` and are tested; why: the sequence is a stated requirement.
- The explainer chat streams from `src/routes/api/tutor.ts` → `src/lib/ai/*.server.ts` (Google Gemini via `@google/genai` `generateContentStream`, re-emitted as an AI SDK UI message stream; server-only `GEMINI_API_KEY` secret, never a `VITE_` key or committed `.env`, which would ship the key to visitors); prompt building, request validation and history trimming stay pure in `src/lib/tutor-context.ts` and are tested. The client sends a live `SimulationSnapshot` with every question. Why: keys and prompts stay server-side, and grounding rules are testable.
- Chat UI is hand-built (no AI Elements) under the no-shadcn rule above; why: AI Elements are shadcn registry components with rounded/icon styling the brief forbids.
