import { Fragment } from "react";

import { quipLinks } from "@/config/quipLinks";
import { ExternalLink } from "./primitives";

const LINKS = [
  { label: "Docs", href: quipLinks.docs },
  { label: "Website", href: quipLinks.website },
  { label: "Link Hub", href: quipLinks.linkhub },
  { label: "Whitepaper", href: quipLinks.whitepaper },
  { label: "GitHub", href: quipLinks.github },
];

export function SourceFooter() {
  return (
    <footer className="relative z-10 border-t border-rule">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <nav aria-label="Sources" className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="mr-2 label-caps text-accent">SOURCES</span>
          {LINKS.map((l, i) => (
            <Fragment key={l.label}>
              {i > 0 && (
                <span aria-hidden className="text-label text-foreground/20">
                  |
                </span>
              )}
              <ExternalLink href={l.href} muted className="text-label">
                {l.label}
              </ExternalLink>
            </Fragment>
          ))}
        </nav>
        <p className="text-label text-faint">Frontend simulation. No on-chain calls. No wallet connection.</p>
      </div>
    </footer>
  );
}
