import { useState, type FormEvent } from "react";
import { DEMO_TEXT_LIMIT, sendDemoMessage } from "./api/demo";
import { Icon } from "./Icon";
import { MobyFace } from "@mobyuz/moby-ui";
import { Reveal } from "./motion";
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
  const [focused, setFocused] = useState(false);
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

  const expression = state.status === "sending" ? "thinking"
    : state.status === "success" ? "speaking"
      : state.status === "error" ? "error"
        : focused ? "listening" : "idle";

  return (
    <section id="demo" className="band band-alt" aria-labelledby="demo-heading">
      <div className="shell">
        <Reveal className="section-head">
          <p className="eyebrow">Guest demo</p>
          <h2 id="demo-heading" className="section-title">Try Moby in your browser.</h2>
          <p className="section-intro">Say a few words to Moby, or sign in to explore your workspace. No account is needed for the demo.</p>
        </Reveal>

        {siteKey ? (
          <div className="demo-grid">
            <form onSubmit={submit} className="demo-form">
              <label htmlFor="demo-message">Message</label>
              <textarea
                id="demo-message"
                rows={4}
                value={text}
                placeholder="Say hello to Moby"
                aria-describedby="demo-count"
                aria-invalid={tooLong || undefined}
                readOnly={sending}
                onFocus={() => { setVerificationStarted(true); setFocused(true); }}
                onBlur={() => setFocused(false)}
                onChange={(event) => setText(event.target.value)}
              />
              <p id="demo-count" className="demo-count" data-over={tooLong || undefined}>
                {count} / {DEMO_TEXT_LIMIT} characters{tooLong && " · Message is over the limit"}
              </p>
              {verificationStarted && (
                <TurnstileWidget key={verificationAttempt} siteKey={siteKey} onToken={setToken} />
              )}
              <button className="button button-primary" type="submit" disabled={!canSend}>
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>

            <div className="demo-response" data-state={state.status} data-expression={expression}>
              <MobyFace expression={expression} size="min(100%, 20rem)" decorative />
              <div role="status" aria-atomic="true" className="demo-reply">
                {state.status === "idle" && "Moby’s reply will appear here."}
                {state.status === "sending" && "Waiting for Moby…"}
                {state.status === "success" && <p lang="uz-Latn">{state.message}</p>}
                {state.status === "error" && <p>{state.message}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="demo-offline">
            <MobyFace expression="disconnected" size={160} label="Moby is disconnected" />
            <div>
              <h3>Guest demo is offline</h3>
              <p>Sign in to use the assistant and voice tools in Moby Web.</p>
              <a className="button" href="/app/">Open Moby Web <Icon name="arrow" size={16} /></a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
