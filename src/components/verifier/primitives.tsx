import { useEffect, useRef, useState, type ReactNode } from "react";

import { externalLinkProps } from "@/config/quipLinks";
import { cn } from "@/lib/utils";

/** Section marker (amber index) + left-aligned title. 32px below. */
export function SectionLabel({ index, id, children }: { index: string; id: string; children: ReactNode }) {
  return (
    <div className="mb-8 flex items-baseline gap-4">
      <span className="label-caps text-accent">{index}</span>
      <h2 id={id} className="label-caps text-muted-foreground">
        {children}
      </h2>
    </div>
  );
}

/**
 * Major section: 8% divider, 64px (48px below 1024px) to the title.
 * `divider={false}` for the opening row that sits directly under the header.
 */
export function Section({
  id,
  index,
  title,
  divider = true,
  className,
  children,
}: {
  id: string;
  index: string;
  title: ReactNode;
  divider?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(divider && "mt-12 border-t border-divider pt-12 lg:pt-16 max-lg:mt-8", className)}
    >
      <SectionLabel index={index} id={id}>
        {title}
      </SectionLabel>
      {children}
    </section>
  );
}

/** Dashed provenance marker (SIMULATED, MODEL OUTPUT). */
export function ProvenanceTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center border border-dashed border-control px-2 label-caps text-faint">
      {children}
    </span>
  );
}

/** Inline marker for any value produced locally rather than fetched from a real source. */
export function SimulatedTag() {
  return <ProvenanceTag>SIMULATED</ProvenanceTag>;
}

export function ExternalLink({
  href,
  muted = false,
  className,
  children,
}: {
  href: string;
  muted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} {...externalLinkProps} className={cn("link", muted && "link-muted", className)}>
      {children}
    </a>
  );
}

/** Replace a few characters with "×" for the 200ms glitch frame; string stays readable. */
export function glitchText(s: string): string {
  const positions = [4, 9, s.length - 6, s.length - 3];
  const chars = s.split("");
  for (const p of positions) {
    const c = chars[p];
    if (c !== undefined && c !== "…" && c !== "x") chars[p] = "×";
  }
  return chars.join("");
}

/**
 * Middle-truncated value that copies the full string on click.
 * The visible label swaps to "COPIED" for 400ms — no icon, no toast.
 */
export function CopyValue({
  value,
  display,
  label,
  struck = false,
  glitch = false,
  className,
  textClassName,
}: {
  value: string;
  display: string;
  label: string;
  struck?: boolean;
  glitch?: boolean;
  className?: string;
  textClassName?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 400);
  };

  const text = state === "copied" ? "COPIED" : state === "failed" ? "COPY FAILED" : glitch ? glitchText(display) : display;

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy the full value"
      aria-label={`Copy ${label}`}
      className={cn("field copy-field", className)}
    >
      <span
        key={glitch ? "glitch" : "steady"}
        data-struck={struck}
        className={cn("strike", glitch && "glitch", state !== "idle" && "label-caps text-foreground", textClassName)}
      >
        {text}
      </span>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
      </span>
    </button>
  );
}
