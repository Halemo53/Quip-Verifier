import { cn } from "@/lib/utils";
import { quipLinks } from "@/config/quipLinks";
import { ExternalLink, Section } from "./primitives";

const COLUMNS = [
  {
    label: "SHRINCS",
    text: "SHRINCS is the signature construction Quip Accounts actually use. It bundles two verification paths under one 32-byte public commitment. WOTS+ is the legacy v1 scheme — shown above for teaching, not for new integrations.",
  },
  {
    label: "EVERYDAY PATH",
    text: "A WOTS-C one-time signature under an unbalanced Merkle tree. Cheap to verify. Each signature consumes one leaf from a fixed budget (max 4,096). Normal operations use this path.",
  },
  {
    label: "BREAK-GLASS PATH",
    text: "A full SPHINCS+C signature. Expensive, stateless, needs no signer record. Reserved for recovery and key rotation — the path you use when the everyday slot record is lost.",
  },
];

export function ShrincsStrip() {
  return (
    <Section id="shrincs-heading" index="06" title="What the account actually uses: SHRINCS">
      <div className="grid border-y border-structure md:grid-cols-3">
        {COLUMNS.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "py-6 md:px-6 md:first:pl-0 md:last:pr-0",
              i > 0 && "border-t border-divider md:border-t-0 md:border-l",
            )}
          >
            <h3 className="label-caps text-foreground">{c.label}</h3>
            <p className="mt-2 text-body font-light text-foreground">{c.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-label text-faint">
        Source: <ExternalLink href={quipLinks.hashsigsRs}>Quip Network hashsigs-rs</ExternalLink> — SHRINCS
        construction (ePrint 2025/2203).
      </p>
    </Section>
  );
}
