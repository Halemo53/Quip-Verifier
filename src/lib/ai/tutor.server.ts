import { GoogleGenAI } from "@google/genai";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { buildTutorInstructions, parseTutorRequest, toGeminiContents } from "@/lib/tutor-context";

/** Alias for Google's current Flash model; gemini-1.5-flash and gemini-2.0-flash are retired. */
const MODEL = "gemini-flash-latest";

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

/** Safe, user-facing text for a Gemini failure. Raw provider detail stays in server logs. */
function describeError(error: unknown): string {
  console.error("[tutor] gemini error", error);
  const e = error as { status?: unknown; name?: unknown; message?: unknown };
  if (e?.name === "AbortError") return "Stopped.";
  const status = typeof e?.status === "number" ? e.status : undefined;
  const msg = typeof e?.message === "string" ? e.message : "";
  if (status === 400 && /api key/i.test(msg)) return "Gemini rejected the API key. Check the GEMINI_API_KEY secret.";
  if (status === 401 || status === 403) return "Gemini rejected the API key. Check the GEMINI_API_KEY secret.";
  if (status === 404) return `Gemini model "${MODEL}" is not available for this key.`;
  if (status === 429) return "Gemini quota or rate limit reached. Wait a moment, then ask again.";
  if (status === 503 || status === 500) return "Gemini is overloaded right now. Try again in a moment.";
  return "Gemini could not answer right now. Try again in a moment.";
}

export async function handleTutor(request: Request): Promise<Response> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return json(500, "The explainer is not configured: GEMINI_API_KEY is missing.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, "Malformed request.");
  }
  const parsed = parseTutorRequest(body);
  if (!parsed.ok) return json(400, parsed.error);

  const { messages, snapshot } = parsed.data;
  const ai = new GoogleGenAI({ apiKey });

  const stream = createUIMessageStream({
    originalMessages: messages,
    onError: describeError,
    execute: async ({ writer }) => {
      const response = await ai.models.generateContentStream({
        model: MODEL,
        contents: toGeminiContents(messages),
        config: {
          systemInstruction: buildTutorInstructions(snapshot),
          thinkingConfig: { includeThoughts: true },
          abortSignal: request.signal,
        },
      });

      let open: "text" | "reasoning" | null = null;
      let n = 0;
      let id = "";
      const switchTo = (kind: "text" | "reasoning") => {
        if (open === kind) return;
        if (open) writer.write({ type: `${open}-end`, id });
        id = `${kind}-${n++}`;
        writer.write({ type: `${kind}-start`, id });
        open = kind;
      };

      for await (const chunk of response) {
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (!part.text) continue;
          const kind = part.thought ? "reasoning" : "text";
          switchTo(kind);
          writer.write({ type: `${kind}-delta`, id, delta: part.text });
        }
      }
      if (open) writer.write({ type: `${open}-end`, id });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
