import { quipLinks } from "@/config/quipLinks";
import { TECHNICAL_NOTE } from "@/lib/tutor-context";
import { ExternalLink, Section } from "./primitives";

const PRIMARY_SOURCES = [
  { label: "Quip Accounts documentation (post-quantum pads)", href: quipLinks.docsQuipAccounts },
  { label: "hashsigs-rs — SHRINCS and WOTS+ implementations", href: quipLinks.hashsigsRs },
  { label: "Quip Whitepaper §12 (Asset and Settlement Layer)", href: quipLinks.whitepaper },
];

export function TechnicalNote() {
  return (
    <Section id="note-heading" index="05" title="Technical Note">
      <div className="max-w-[65ch] border-l-2 border-accent pl-6">
        <p className="text-body font-light text-foreground">
          {TECHNICAL_NOTE.before}
          <span className="font-semibold">{TECHNICAL_NOTE.emphasis}</span>
          {TECHNICAL_NOTE.after}
        </p>
        <p className="mt-4 text-label text-faint">
          Source:{" "}
          <ExternalLink href={quipLinks.docsQuipAccounts}>Quip Network documentation — Quip Accounts</ExternalLink>,
          hash-based signatures (WOTS+ / SHRINCS).
        </p>

        <div className="mt-6 border-l border-structure p-3">
          <h3 className="label-caps text-muted-foreground">READ THE PRIMARY SOURCES</h3>
          <ul className="mt-2 space-y-1">
            {PRIMARY_SOURCES.map((s) => (
              <li key={s.href + s.label} className="flex gap-2 text-label">
                <span aria-hidden className="text-faint">
                  →
                </span>
                <ExternalLink href={s.href}>{s.label}</ExternalLink>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-label text-faint">
            The visualizer above simplifies these mechanisms for teaching. The linked documents are
            authoritative.
          </p>
        </div>
      </div>
    </Section>
  );
}
