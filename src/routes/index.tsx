import { createFileRoute } from "@tanstack/react-router";

import { Verifier } from "@/components/verifier/Verifier";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quip / Hybrid Signature Verifier — ECDSA + WOTS+" },
      {
        name: "description",
        content:
          "Interactive simulation of Quip Account verification: classical ECDSA and post-quantum WOTS+ signatures must both be valid. Simulate a quantum attack and watch the transaction fail closed.",
      },
      { property: "og:title", content: "Quip / Hybrid Signature Verifier" },
      {
        property: "og:description",
        content:
          "ECDSA + WOTS+ hybrid verification. A quantum attack breaks ECDSA, WOTS+ holds, and the transaction fails closed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verifier,
});
