import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { truncateHex } from "@/lib/hybrid-signature";
import { MAX_QUESTION_CHARS, suggestedQuestions, type SimulationSnapshot } from "@/lib/tutor-context";
import { cn } from "@/lib/utils";
import { ProvenanceTag, Section } from "./primitives";

const STORAGE_KEY = "quip-verifier:explainer:v1";

interface Props {
  index: string;
  snapshot: SimulationSnapshot;
}

/** Backtick segments render as emphasised identifiers; everything else stays plain text. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code key={i} className="font-semibold text-foreground">
            {p.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function verdictText(s: SimulationSnapshot): string {
  const v = s.verification;
  return v.outcome === "PASS" ? "PASS" : v.outcome === "BLOCKED" ? "— awaiting payload" : "REJECTED";
}

export function TutorPanel({ index, snapshot }: Props) {
  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/tutor" }), []);
  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({
    id: "verifier-explainer",
    transport,
  });
  const [input, setInput] = useState("");
  const loaded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  // Restore the single conversation from this browser after hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(saved) && saved.length) setMessages(saved as UIMessage[]);
    } catch {
      /* corrupt entry — start fresh */
    }
    loaded.current = true;
  }, [setMessages]);

  // Persist completed turns only, never a half-streamed answer.
  useEffect(() => {
    if (!loaded.current || busy) return;
    try {
      if (messages.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage full or blocked — conversation still works for this session */
    }
  }, [messages, busy]);

  // Keep the transcript pinned to the newest line (inside its own box, never the page).
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Return focus to the composer when an answer finishes.
  const prevBusy = useRef(false);
  useEffect(() => {
    if (prevBusy.current && !busy) inputRef.current?.focus();
    prevBusy.current = busy;
  }, [busy]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || busy || q.length > MAX_QUESTION_CHARS) return;
    clearError();
    setInput("");
    void sendMessage({ text: q }, { body: { snapshot } });
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const clear = () => {
    clearError();
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    inputRef.current?.focus();
  };

  const last = messages[messages.length - 1];
  const waiting =
    busy && (last?.role === "user" || (last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text)));
  const suggestions = suggestedQuestions(snapshot);
  const tooLong = input.trim().length > MAX_QUESTION_CHARS;

  return (
    <Section id="explainer-heading" index={index} title="Ask the Verifier">
      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-0">
        {/* Left: what the model sees + starter questions */}
        <div className="md:border-r md:border-divider md:pr-8">
          <h3 className="label-caps text-muted-foreground">CONTEXT SENT WITH EACH QUESTION</h3>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-structure py-4 text-label">
            <ContextRow term="PAYLOAD">
              {snapshot.payload.valid
                ? `${snapshot.payload.amount} ETH → ${snapshot.payload.recipient}`
                : "invalid — no signatures"}
            </ContextRow>
            <ContextRow term="HASH">{snapshot.messageHash ? truncateHex(snapshot.messageHash, 8, 6) : "none"}</ContextRow>
            <ContextRow term="ECDSA">{snapshot.ecdsa}</ContextRow>
            <ContextRow term="WOTS+">{snapshot.wots}</ContextRow>
            <ContextRow term="VERDICT">{verdictText(snapshot)}</ContextRow>
            <ContextRow term="ATTACK">{snapshot.attackPhase}</ContextRow>
            <ContextRow term="SLOTS">
              {snapshot.slots.used} / {snapshot.slots.total}
            </ContextRow>
            <ContextRow term="NOTE">section 05 technical note</ContextRow>
          </dl>
          <p className="mt-2 text-label text-faint">Updates live. Run the attack, then ask why it failed.</p>

          <h3 className="mt-8 label-caps text-muted-foreground">TRY ASKING</h3>
          <ul className="mt-4 space-y-2">
            {suggestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => ask(q)}
                  className="btn h-auto min-h-10 w-full justify-start whitespace-normal py-2 text-left font-normal normal-case tracking-normal"
                >
                  <span aria-hidden className="text-faint">
                    →
                  </span>
                  <span className="text-label">{q}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: transcript + composer */}
        <div className="flex min-w-0 flex-col md:pl-8">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-label text-faint">[?]</span>
              <span className="text-body font-semibold text-foreground">Explainer</span>
            </p>
            <ProvenanceTag>MODEL OUTPUT</ProvenanceTag>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Explainer conversation"
            className="scroll-thin h-[420px] overflow-y-auto border border-structure bg-background p-4"
          >
            {messages.length === 0 && !busy && (
              <p className="text-label text-faint">
                &gt; idle — ask about ECDSA, WOTS+, the attack or the slot budget. Answers use the technical note and
                the state on the left.
              </p>
            )}
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} />
              ))}
              {waiting && (
                <div>
                  <p className="label-caps text-faint">EXPLAINER</p>
                  <p className="mt-1 text-label text-faint">composing explanation…</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex gap-2">
            <label htmlFor="explainer-input" className="sr-only">
              Question for the explainer
            </label>
            <input
              id="explainer-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Why does WOTS+ survive Shor's algorithm?"
              autoComplete="off"
              aria-invalid={tooLong}
              className="field min-w-0 flex-1"
            />
            {busy ? (
              <button type="button" onClick={() => void stop()} className="btn w-24">
                STOP
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() || tooLong} className="btn w-24">
                ASK
              </button>
            )}
          </form>

          <div className="mt-2 flex min-h-10 flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div aria-live="assertive" className="min-w-0 flex-1 text-label">
              {error ? (
                <p className="text-compromised-text">Explainer error — {error.message || "request failed"}</p>
              ) : tooLong ? (
                <p className="text-compromised-text">Questions are limited to {MAX_QUESTION_CHARS} characters.</p>
              ) : (
                <p className="text-faint">
                  AI-generated explanations can be wrong. The primary sources in section 05 are authoritative.
                </p>
              )}
            </div>
            <button type="button" onClick={clear} disabled={busy || messages.length === 0} className="btn">
              CLEAR
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContextRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-faint">{term}</dt>
      <dd className="min-w-0 truncate text-muted-foreground">{children}</dd>
    </>
  );
}

function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const reasoning = message.parts
    .map((p) => (p.type === "reasoning" ? p.text : ""))
    .join("\n")
    .trim();
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  if (isUser) {
    return (
      <div className="border-l-2 border-focus-line pl-4">
        <p className="label-caps text-faint">YOU</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-body text-foreground">{text}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="label-caps text-faint">EXPLAINER</p>
      {reasoning && (
        <details className="mt-1">
          <summary className="link link-muted cursor-pointer text-label">reasoning summary</summary>
          <p className="mt-1 whitespace-pre-wrap text-label text-faint">{reasoning}</p>
        </details>
      )}
      {text && (
        <div className={cn("mt-1 space-y-3 text-body font-light text-foreground")}>
          {text
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="whitespace-pre-wrap break-words">
                <InlineText text={para} />
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
