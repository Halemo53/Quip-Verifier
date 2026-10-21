export type ProbeResult =
  | { kind: "reachable"; status: number; elapsedMs: number }
  | { kind: "http-error"; status: number; elapsedMs: number }
  | { kind: "unreachable"; message: string; elapsedMs: number }
  | { kind: "timeout"; elapsedMs: number };

/**
 * Real browser fetch, no fallbacks and no simulated success.
 * CORS rejections surface as a TypeError from fetch → "unreachable".
 */
export async function probeEndpoint(
  url: string,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<ProbeResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const start = Date.now();

  try {
    const res = await fetchImpl(url, {
      method: "GET",
      mode: "cors",
      headers: { Accept: "text/html" },
      signal: controller.signal,
      cache: "no-store",
    });
    const elapsedMs = Date.now() - start;
    return res.ok
      ? { kind: "reachable", status: res.status, elapsedMs }
      : { kind: "http-error", status: res.status, elapsedMs };
  } catch (err) {
    const elapsedMs = Date.now() - start;
    if (timedOut) return { kind: "timeout", elapsedMs };
    return { kind: "unreachable", message: err instanceof Error ? err.message : String(err), elapsedMs };
  } finally {
    clearTimeout(timer);
  }
}
