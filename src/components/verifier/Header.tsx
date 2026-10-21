import logo from "@/assets/logo-quip.png";
import { quipLinks } from "@/config/quipLinks";
import { ExternalLink } from "./primitives";

/** Shares max-width and side padding with <main> so edges align with the content grid. */
export function Header() {
  return (
    <header className="relative z-10 border-b border-divider">
      <div className="mx-auto flex min-h-12 max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 md:px-8">
        <h1 className="flex items-center gap-2 label-caps whitespace-nowrap text-foreground">
          <img src={logo} alt="QUIP" width={62} height={16} className="block h-4 w-auto" />
          <span className="font-light text-faint">/</span> HYBRID SIGNATURE VERIFIER
        </h1>
        <div className="flex items-center gap-4 whitespace-nowrap">
          <div className="flex items-center gap-2 label-caps text-accent" role="status">
            <span aria-hidden className="block size-1.5 bg-accent" />
            <span>SIMULATION MODE</span>
          </div>
          <span aria-hidden className="block h-4 w-px bg-control" />
          <ExternalLink href={quipLinks.docs} muted className="label-caps">
            DOCS ↗
          </ExternalLink>
        </div>
      </div>
    </header>
  );
}
