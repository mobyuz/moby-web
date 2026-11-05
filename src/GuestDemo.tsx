import { useState, type FormEvent } from "react";
import { DEMO_TEXT_LIMIT, sendDemoMessage } from "./api/demo";
import { Icon } from "./Icon";
import { MobyFace } from "./MobyFace";
import { TurnstileWidget } from "./TurnstileWidget";

const siteKey = import.meta.env.VITE_MOBY_TURNSTILE_SITE_KEY?.trim();

type DemoState =
  | { status: "idle" | "sending" }
  | { status: "success" | "error"; message: string };

export function GuestDemo() {
  const [text, setText] = useState("");
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [state, setState] = useState<DemoState>({ status: "idle" });
  const message = text.trim();
  const count = [...message].length;
  const tooLong = count > DEMO_TEXT_LIMIT;
  const sending = state.status === "sending";
  const canSend = Boolean(token && count && !tooLong && !sending);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend || !token) return;

    setState({ status: "sending" });
    const result = await sendDemoMessage({ text: message, bot_token: token });
    setToken(null);
    setVerificationAttempt((attempt) => attempt + 1);
    if ("reply" in result) {
      setState({ status: "success", message: result.reply });
      setText("");
    } else {
      setState({ status: "error", message: result.error });
    }
  }

  return (
    <section id="demo" className="demo-section" aria-labelledby="demo-heading">
      <div className="shell section-space">
        <p className="eyebrow mb-3">Moby on the web</p>
        <h2 id="demo-heading" className="section-title">Try Moby in your browser.</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-subtle">
          Get a feel for Moby with a short conversation, or sign in to explore your workspace.
        </p>

        {siteKey ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <form onSubmit={submit} className="grid content-start gap-4 rounded-2xl border border-line bg-panel p-5 sm:p-6">
              <label className="font-semibold" htmlFor="demo-message">Message</label>
              <textarea
                id="demo-message"
                className="min-h-28 w-full resize-y rounded-lg border border-field bg-ink px-3 py-2.5 text-text"
                rows={3}
                value={text}
                placeholder="Say hello to Moby"
                aria-describedby="demo-count"
                aria-invalid={tooLong || undefined}
                readOnly={sending}
                onFocus={() => setVerificationStarted(true)}
                onChange={(event) => setText(event.target.value)}
              />
              <p id="demo-count" className="text-sm text-subtle">
                {count} / {DEMO_TEXT_LIMIT} characters{tooLong && " · Message is over the limit"}
              </p>
              {verificationStarted && (
                <TurnstileWidget key={verificationAttempt} siteKey={siteKey} onToken={setToken} />
              )}
              <button className="action w-fit cursor-pointer disabled:cursor-default disabled:opacity-50" type="submit" disabled={!canSend}>
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>

            <div className="demo-response flex flex-col items-center justify-center gap-5 rounded-2xl border border-line bg-panel p-5 text-center sm:p-6" data-state={state.status}>
              <MobyFace />
              <div role="status" aria-atomic="true" className="max-w-full wrap-anywhere leading-relaxed text-subtle">
                {state.status === "idle" && "Moby’s reply will appear here."}
                {state.status === "sending" && "Waiting for Moby…"}
                {state.status === "success" && <p lang="uz-Latn" className="text-text">{state.message}</p>}
                {state.status === "error" && <p>{state.message}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="demo-offline">
            <div className="flex items-start gap-3">
              <span className="feature-icon shrink-0"><Icon name="message" /></span>
              <div>
                <h3 className="font-bold tracking-tight">Guest demo is offline</h3>
                <p className="mt-1 text-sm text-subtle">Sign in to use the assistant and voice tools in Moby Web.</p>
              </div>
            </div>
            <a className="action-secondary" href="/app/">Open Moby Web <Icon name="arrow" size={16} /></a>
          </div>
        )}
      </div>
    </section>
  );
}
