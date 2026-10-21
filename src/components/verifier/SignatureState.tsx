import { cn } from "@/lib/utils";
import { truncateHex, wotsDigits, WOTS_W } from "@/lib/hybrid-signature";
import { CopyValue, Section, SimulatedTag } from "./primitives";
import type { SignatureRecord, SignatureStatus, VerificationResult } from "./types";

interface Props {
  ecdsa: SignatureRecord;
  wots: SignatureRecord;
  hash: string | null;
  ecdsaGlitch: boolean;
  ecdsaStruck: boolean;
  wotsFlash: boolean;
  verification: VerificationResult;
  verificationHidden: boolean;
}

export function SignatureState({
  ecdsa,
  wots,
  hash,
  ecdsaGlitch,
  ecdsaStruck,
  wotsFlash,
  verification,
  verificationHidden,
}: Props) {
  return (
    <Section id="sig-heading" index="02" title="Signature State" divider={false}>
      {/* One container, two halves of one verification. */}
      <div className="grid divide-y divide-structure border border-structure bg-background xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <SignaturePanel
          tag="A"
          record={ecdsa}
          glitch={ecdsaGlitch}
          struck={ecdsaStruck}
          assumption="Elliptic-curve discrete log (ECDLP)"
          quantum="Broken by Shor's algorithm"
        />
        <SignaturePanel
          tag="B"
          record={wots}
          flash={wotsFlash}
          assumption="Hash preimage resistance (SHA-256)"
          quantum="Grover only: 2¹²⁸ work"
        >
          {hash && <ChainGrid hash={hash} />}
        </SignaturePanel>
      </div>

      <VerificationLine result={verification} hidden={verificationHidden} />
    </Section>
  );
}

function SignaturePanel({
  tag,
  record,
  glitch = false,
  struck = false,
  flash = false,
  assumption,
  quantum,
  children,
}: {
  tag: string;
  record: SignatureRecord;
  glitch?: boolean;
  struck?: boolean;
  flash?: boolean;
  assumption: string;
  quantum: string;
  children?: React.ReactNode;
}) {
  const compromised = record.status === "COMPROMISED";
  return (
    <article aria-label={record.name} data-flash={flash} className="flash-outline flex min-w-0 flex-col p-4 md:p-6 xl:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
          <span className="text-label text-faint">[{tag}]</span>
          <h3 className="text-body font-semibold text-foreground">{record.name}</h3>
        </div>
        <StatusBadge status={record.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2">
        <p className="text-label text-muted-foreground">
          {record.label} <span className="text-faint">·</span> {record.layout}
        </p>
        {record.hex && <SimulatedTag />}
      </div>

      <div className="mt-4">
        {record.hex ? (
          <CopyValue
            value={`0x${record.hex}`}
            display={truncateHex(record.hex, 10, 8)}
            label={`${record.name} signature`}
            glitch={glitch}
            struck={struck}
            textClassName={cn("font-light", compromised && "text-faint")}
          />
        ) : (
          <div className="field opacity-40">0x · no signature</div>
        )}
      </div>

      {children}

      <div className="flex-1" aria-hidden />
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-divider pt-4 text-label">
        <dt className="text-faint">ASSUMPTION</dt>
        <dd className="text-muted-foreground">{assumption}</dd>
        <dt className="text-faint">QUANTUM</dt>
        <dd className="text-muted-foreground">{quantum}</dd>
      </dl>
    </article>
  );
}

function StatusBadge({ status }: { status: SignatureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-[13ch] shrink-0 items-center justify-center border label-caps transition-mech",
        status === "VALID" && "border-valid bg-valid/15 text-valid-text",
        status === "COMPROMISED" && "border-compromised bg-compromised/30 text-compromised-text",
        status === "PENDING" && "border-control text-foreground/40",
      )}
    >
      {status}
    </span>
  );
}

/** One bar per WOTS+ chain; height = number of hash iterations (base-16 digit). */
function ChainGrid({ hash }: { hash: string }) {
  const digits = wotsDigits(hash);
  return (
    <figure className="mt-4">
      <div className="flex h-8 items-end gap-px" aria-hidden>
        {digits.map((d, i) => (
          <span
            key={i}
            className={cn("block flex-1", i >= 64 ? "bg-foreground/40" : "bg-foreground/16")}
            style={{ height: `${Math.max(1, ((d + 1) / WOTS_W) * 100)}%` }}
          />
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-x-4 text-label text-faint">
        <span>chain 0 → 63 · message digits</span>
        <span>64–66 · checksum</span>
      </figcaption>
    </figure>
  );
}

function VerificationLine({ result, hidden }: { result: VerificationResult; hidden: boolean }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "mt-6 min-h-16 border-t border-structure pt-4 transition-opacity duration-150 ease-linear",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      {result.outcome === "PASS" && (
        <p className="text-body text-valid-text">
          Verification: <span className="font-semibold">PASS</span>
        </p>
      )}
      {result.outcome === "BLOCKED" && (
        <p className="text-body text-foreground/40">
          Verification: <span className="font-semibold">—</span> {result.reason}
        </p>
      )}
      {result.outcome === "REJECTED" && (
        <>
          <p className="text-body text-compromised-text">
            Verification: <span className="font-semibold">REJECTED</span> — {result.reason}
          </p>
          <p className="mt-1 text-label text-muted-foreground">{result.detail}</p>
        </>
      )}
    </div>
  );
}
