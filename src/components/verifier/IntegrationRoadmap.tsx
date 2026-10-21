import { useState } from "react";

import { quipLinks } from "@/config/quipLinks";
import { ExternalLink } from "./primitives";

const ITEMS: { title: string; required: string; link: { href: string; label: string } }[] = [
  {
    title: "Replace mock signatures with real ones",
    required:
      "@quip/hashsigs-ts or equivalent — check the hashsigs-ts repository on GitHub for the current package name and API surface.",
    link: { href: quipLinks.hashsigsTs, label: "github.com/quipnetwork/hashsigs-ts" },
  },
  {
    title: "Verify signatures on-chain, not in the browser",
    required: "Quip's ethereum-sdk — ERC-4337 account contracts and the audited hybrid verifier.",
    link: { href: quipLinks.docsQuipSdk, label: "developers.quip.network/docs (Quip SDK section)" },
  },
  {
    title: "Read live account state",
    required:
      "An RPC endpoint. No public CORS-enabled RPC is documented. A backend proxy is the realistic path.",
    link: { href: quipLinks.docsQuickstart, label: "developers.quip.network/docs (quickstart)" },
  },
  {
    title: "Deploy a verifier of your own",
    required:
      "The Solidity contracts in the quipnetwork organization — check the repositories list for the current audited version, do not assume a fixed filename.",
    link: { href: quipLinks.github, label: "github.com/quipnetwork" },
  },
];

export function IntegrationRoadmap({ index }: { index: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="roadmap-heading" className="mt-12 border-t border-divider pt-12 max-lg:mt-8 lg:pt-16">
      <div className="flex items-center gap-4">
        <span className="label-caps text-accent">{index}</span>
        <h2 id="roadmap-heading">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="roadmap-list"
            onClick={() => setOpen((o) => !o)}
            className="btn"
          >
            <span aria-hidden className="inline-block w-3 text-left">
              {open ? "▾" : "▸"}
            </span>
            To make this real
          </button>
        </h2>
      </div>

      {open && (
        <ol id="roadmap-list" className="mt-8">
          {ITEMS.map((item, i) => (
            <li
              key={item.title}
              className="grid gap-2 border-b border-divider py-4 md:grid-cols-[40%_minmax(0,1fr)] md:gap-6"
            >
              <p className="text-body font-semibold text-foreground">
                <span className="mr-3 font-light text-faint">{String(i + 1).padStart(2, "0")}</span>
                {item.title}
              </p>
              <div>
                <p className="text-label text-muted-foreground">
                  <span className="text-faint">REQUIRED · </span>
                  {item.required}
                </p>
                <ExternalLink href={item.link.href} className="mt-2 inline-block text-label">
                  {item.link.label} ↗
                </ExternalLink>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
