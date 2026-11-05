import { jsonBody, type BrowserSession, type Model } from "./workspace";

function frameData(frame: string) {
  return frame.split(/\r?\n/).filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, "")).join("\n");
}

export async function agentTurn(
  session: BrowserSession,
  messages: Model<"AgentMessage">[],
  locale: Pick<Model<"AgentTurnRequest">, "language" | "script">,
  onDelta: (text: string) => void,
  signal: AbortSignal,
) {
  const request: Model<"AgentTurnRequest"> = { messages, ...locale, available_tools: [], resources: [] };
  const init = jsonBody(request);
  if (new TextEncoder().encode(String(init.body)).byteLength > 128 * 1024) {
    throw new Error("This conversation is too large for the API. Start a new chat.");
  }
  const response = await session.request("/v1/agent/turn", { ...init, signal });
  if (!response.headers.get("Content-Type")?.startsWith("text/event-stream") || !response.body) {
    throw new Error("The API did not return an agent stream.");
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) throw new Error("The agent stream ended before a reply was completed.");
      buffer += value;
      let boundary: RegExpMatchArray | null;
      while ((boundary = buffer.match(/\r?\n\r?\n/)) && boundary.index !== undefined) {
        const data = frameData(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
        if (!data) continue;
        const event: Model<"AgentTurnResponse"> = JSON.parse(data);
        switch (event.event) {
          case "speech_delta":
            onDelta(event.text);
            break;
          case "completed":
            return event.display_text || event.speech_text;
          case "error":
            throw new Error(event.error.message);
          case "tool_call":
            throw new Error("This tool requires the Moby desktop app.");
          default:
            throw new Error("The API returned an unsupported agent event.");
        }
      }
      if (buffer.length > 64 * 1024) throw new Error("The API returned an oversized agent event.");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
