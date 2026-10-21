import { cn } from "@/lib/utils";
import { Section } from "./primitives";

function FlowNode({ title, note, primary = false }: { title: string; note: string; primary?: boolean }) {
  return (
    <div
      className={cn(
        "border border-structure bg-background",
        primary ? "border-t-2 border-t-accent px-6 py-6" : "p-4",
      )}
    >
      <p className="label-caps text-foreground">{title}</p>
      <p className="mt-2 text-label text-muted-foreground">{note}</p>
    </div>
  );
}

/** Double-headed connector drawn with CSS borders; vertical on mobile, horizontal from md. */
function FlowArrow() {
  return (
    <div aria-hidden className="flex h-12 items-center justify-center md:h-auto md:px-4">
      <div className="relative h-px w-10 rotate-90 bg-control md:w-12 md:rotate-0">
        <span className="absolute -left-px top-1/2 size-2 -translate-y-1/2 -rotate-45 border-l border-t border-control" />
        <span className="absolute -right-px top-1/2 size-2 -translate-y-1/2 rotate-45 border-r border-t border-control" />
      </div>
    </div>
  );
}

export function SwapFlow() {
  return (
    <Section id="swap-heading" index="08" title="Where the swap fits">
      <p className="mb-4 label-caps text-muted-foreground">VALUE MOVES WITHOUT A BRIDGE</p>

      <div className="grid items-center md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)_auto_minmax(0,1fr)]">
        <FlowNode title="QUIP ACCOUNT" note="holds assets, enforces PQ signature" />
        <FlowArrow />
        <FlowNode primary title="QUIPSWAP" note="shared secret settles both legs, or neither" />
        <FlowArrow />
        <FlowNode title="COUNTERPARTY ACCOUNT" note="on a different chain, same interlock" />
      </div>

      <p className="mt-4 text-label text-faint">
        No oracle, no wrapped asset, no intermediary holding funds mid-trade.
      </p>
    </Section>
  );
}
