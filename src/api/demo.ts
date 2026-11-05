import type { paths } from "./schema";

const endpoint = "/v1/demo/chat";
type DemoOperation = paths[typeof endpoint]["post"];
type DemoRequest = DemoOperation["requestBody"]["content"]["application/json"];
type DemoReply = DemoOperation["responses"][200]["content"]["application/json"];
type DemoResult = DemoReply | { error: string };

export const DEMO_TEXT_LIMIT = 280;
const unavailable = "The demo is temporarily unavailable. Try again later.";

function errorMessage(status: number, code: unknown): string {
  switch (status) {
    case 400:
    case 413:
      return "Check your message and complete verification again.";
    case 403:
      return "Verification was rejected. Complete the check again and retry.";
    case 429:
      return "This network has reached the demo limit. Try again in a few minutes.";
    case 503:
      if (code === "demo_budget_exhausted") return "The guest demo has used its allowance. Try again later.";
      if (code === "demo_disabled") return "The guest demo is currently offline.";
      return unavailable;
    case 504:
      return "The demo took too long to reply. Try again.";
    default:
      return unavailable;
  }
}

export async function sendDemoMessage(input: DemoRequest): Promise<DemoResult> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const code = body && typeof body === "object" && "code" in body ? body.code : undefined;
      return { error: errorMessage(response.status, code) };
    }
    if (body && typeof body === "object" && "reply" in body && typeof body.reply === "string" && body.reply.trim()) {
      return { reply: body.reply };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { error: "The demo took too long to reply. Try again." };
    }
  }
  return { error: unavailable };
}
