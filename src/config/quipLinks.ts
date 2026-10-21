/**
 * Single source of truth for every external Quip Network reference in the UI.
 * Deep-link paths were checked against the live docs site (Oct 2026); the docs
 * nest pages under section folders, so the short paths from the brief 404.
 */
const DOCS = "https://developers.quip.network/docs";
const GITHUB = "https://github.com/quipnetwork";

export const quipLinks = {
  docs: DOCS,
  website: "https://quip.network/?utm_source=developers.quip.network",
  linkhub: "https://links.quip.network/",
  whitepaper: "https://quip.network/documents/Quip-Whitepaper.pdf",
  github: GITHUB,

  docsQuickstart: `${DOCS}/getting-started/quickstart`,
  docsQuipSdk: `${DOCS}/getting-started/quip-sdk`,
  docsQuipAccounts: `${DOCS}/quip-interlock-protocol/quip-accounts`,
  docsNetworkBasics: `${DOCS}/quip-interlock-protocol/quip-the-quantum-unit-interlock-pathway`,

  hashsigsRs: `${GITHUB}/hashsigs-rs`,
  hashsigsTs: `${GITHUB}/hashsigs-ts`,
} as const;

/** The one endpoint the testnet status probe is allowed to call. */
export const PROBE_URL = DOCS;
export const PROBE_TIMEOUT_MS = 5000;

/** Props every external link must carry. */
export const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" } as const;
