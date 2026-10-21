import { useState } from "react";

import { PROBE_TIMEOUT_MS, PROBE_URL } from "@/config/quipLinks";
import { probeEndpoint, type ProbeResult } from "@/lib/probe";
import { Section } from "./primitives";

export function StatusProbe({ index }: { index: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);

  const run = async () => {
    setPending(true);
    setResult(null);
    setResult(await probeEndpoint(PROBE_URL, PROBE_TIMEOUT_MS));
    setPending(false);
  };

  return (
    <Section id="probe-heading" index={index} title="Testnet Status Probe">
      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-0">
        <div className="md:border-r md:border-divider md:pr-8">
          <button type="button" onClick={run} disabled={pending} aria-busy={pending} className="btn w-full md:w-auto">
            {pending ? "FETCHING…" : "ATTEMPT FETCH"}
          </button>
          <p className="mt-4 break-words text-label text-faint">
            GET {PROBE_URL} · mode: cors · Accept: text/html · timeout {PROBE_TIMEOUT_MS}ms
          </p>
        </div>

        <div className="md:pl-8">
          <div aria-live="polite" className="min-h-12">
            {!pending && !result && <p className="text-body text-foreground/40">— not attempted</p>}
            {pending && <p className="text-body text-muted-foreground">REQUEST IN FLIGHT…</p>}
            {result && <ProbeLine result={result} />}
          </div>
          <p className="mt-4 border-t border-divider pt-4 text-label text-muted-foreground">
            No RPC endpoint for testnet is documented as CORS-open. This probe is honest about that
            limitation.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ProbeLine({ result }: { result: ProbeResult }) {
  const ms = <span className="text-faint"> · {result.elapsedMs}ms</span>;
  switch (result.kind) {
    case "reachable":
      return (
        <p className="text-body text-valid-text">
          REACHABLE — docs endpoint responded {result.status}
          {ms}
        </p>
      );
    case "http-error":
      return (
        <p className="text-body text-compromised-text">
          RESPONDED {result.status} — endpoint reachable but returned an error
          {ms}
        </p>
      );
    case "timeout":
      return (
        <p className="text-body text-compromised-text">
          TIMEOUT
          <span className="text-faint"> · aborted after {PROBE_TIMEOUT_MS}ms</span>
        </p>
      );
    case "unreachable":
      return (
        <>
          <p className="text-body text-compromised-text">
            UNREACHABLE FROM BROWSER — CORS or network policy blocked the request
            {ms}
          </p>
          <p className="mt-2 text-label text-muted-foreground">
            This is expected: most protocol endpoints are not CORS-enabled for browser apps. A backend
            proxy would be required.
          </p>
          <p className="mt-1 text-label text-faint">browser error: {result.message}</p>
        </>
      );
  }
}
