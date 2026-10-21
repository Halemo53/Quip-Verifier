import { describe, expect, it } from "vitest";

import { PROBE_TIMEOUT_MS, PROBE_URL } from "@/config/quipLinks";
import { probeEndpoint } from "@/lib/probe";

const respond = (status: number) => (async () => new Response("", { status })) as unknown as typeof fetch;

describe("testnet status probe", () => {
  it("calls the docs URL with a 5000ms timeout", () => {
    expect(PROBE_URL).toBe("https://developers.quip.network/docs");
    expect(PROBE_TIMEOUT_MS).toBe(5000);
  });

  it("sends GET, cors mode and Accept: text/html", async () => {
    let seen: RequestInit | undefined;
    const spy = (async (_u: string, init?: RequestInit) => {
      seen = init;
      return new Response("", { status: 200 });
    }) as unknown as typeof fetch;
    await probeEndpoint(PROBE_URL, 1000, spy);
    expect(seen?.method).toBe("GET");
    expect(seen?.mode).toBe("cors");
    expect((seen?.headers as Record<string, string>)["Accept"]).toBe("text/html");
  });

  it("reports reachable only when the response is ok", async () => {
    expect(await probeEndpoint(PROBE_URL, 1000, respond(200))).toMatchObject({ kind: "reachable", status: 200 });
  });

  it("does not report success for a non-ok response", async () => {
    expect((await probeEndpoint(PROBE_URL, 1000, respond(503))).kind).toBe("http-error");
  });

  it("reports unreachable when fetch throws (CORS / network)", async () => {
    const blocked = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect((await probeEndpoint(PROBE_URL, 1000, blocked)).kind).toBe("unreachable");
  });

  it("reports timeout when the request outlives the deadline", async () => {
    const hang = ((_u: string, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })) as unknown as typeof fetch;
    expect((await probeEndpoint(PROBE_URL, 20, hang)).kind).toBe("timeout");
  });
});
