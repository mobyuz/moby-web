import { useEffect, useState, type FormEvent } from "react";
import { EXPRESSION_META, MobyFace } from "@mobyuz/moby-ui";
import { apiJson, apiResponse, jsonBody, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { useReducedMotion } from "../landing/hooks";
import type { Expression } from "../landing/story";
import { TaskFeedback, useTask, valueOf } from "./controls";
import { googleAvailableHere, googleProof, googleSignInHref, registrationPolicies } from "./google";
import "./auth.css";

const faceCycle: Expression[] = ["idle", "listening", "thinking", "happy"];

const views = {
  login: { title: "Sign in to Moby", description: "Use your Moby account in the browser. It is the same account as in the Windows app.", button: "Sign in" },
  register: { title: "Create your account", description: "You will confirm your email next. Cloud voice is a separate choice you make later.", button: "Create account" },
  verify: { title: "Verify your email", description: "Paste the link from your verification email and enter your password.", button: "Verify email" },
  forgot: { title: "Reset your password", description: "Enter your email address to request a reset link.", button: "Send reset link" },
  reset: { title: "Choose a new password", description: "Paste the link from your reset email and choose a new password.", button: "Update password" },
  google: { title: "You’re one step away", description: "Use your Google account to sign in or create a Moby account.", button: "Continue with Google" },
} as const;

type Mode = keyof typeof views;

function initialMode(): Mode {
  const view = new URLSearchParams(window.location.search).get("view");
  return view && Object.hasOwn(views, view) ? view as Mode : "login";
}

function emailToken(raw: string) {
  const text = raw.trim();
  const token = new URLSearchParams(text.split("#").at(-1)).get("token") ?? text;
  if (!/^[0-9a-f]{64}$/i.test(token)) throw new Error("Enter the code or full link from your email.");
  return token;
}

export function AuthPanel({ onSignIn }: { onSignIn: (tokens: Model<"TokenPair">) => void }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const task = useTask();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const expression: Expression = task.busy ? "thinking" : task.feedback?.kind === "error" ? "confused" : (faceCycle[step % faceCycle.length] ?? "idle");

  // The face on the left idles through a few expressions. It stops when motion is reduced.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setStep((current) => current + 1), 3200);
    return () => window.clearInterval(id);
  }, [reduced]);
  const view = views[mode];
  const needsEmail = mode === "login" || mode === "register" || mode === "forgot";
  const needsToken = mode === "verify" || mode === "reset";
  const newPassword = mode === "reset" || mode === "register";

  function nextView(next: Mode) {
    setMode(next);
    setShowPassword(false);
    const url = new URL(window.location.href);
    if (next === "login") url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    window.history.replaceState(null, "", url);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = valueOf(form, "email").trim();
    const password = valueOf(form, "password");
    void task.run(async () => {
      switch (mode) {
        case "login": {
          const installation = valueOf(form, "installation_id").trim();
          const body: Model<"Login"> = { email, password, installation_id: installation || null };
          onSignIn(await apiJson<Model<"TokenPair">>("/v1/auth/login", jsonBody(body)));
          return;
        }
        case "register": {
          const body: Model<"Register"> = { email, password, ...registrationPolicies };
          await apiResponse("/v1/auth/register", jsonBody(body));
          nextView("verify");
          return "Check your email for a verification link.";
        }
        case "verify": {
          const body: Model<"Verify"> = { token: emailToken(valueOf(form, "token")), password };
          await apiResponse("/v1/auth/verify-email", jsonBody(body));
          nextView("login");
          return "Email verified. You can sign in now.";
        }
        case "forgot": {
          await apiResponse("/v1/auth/password/forgot", jsonBody({ email } satisfies Model<"Forgot">));
          nextView("reset");
          return "If an account uses that email, it will receive a reset link.";
        }
        case "reset": {
          const body: Model<"Reset"> = { token: emailToken(valueOf(form, "token")), new_password: password };
          await apiResponse("/v1/auth/password/reset", jsonBody(body));
          nextView("login");
          return "Password updated. Sign in with your new password.";
        }
        case "google": {
          const proof = await googleProof(registrationPolicies);
          const body: Model<"Exchange"> = { ...proof, installation_id: null };
          onSignIn(await apiJson<Model<"TokenPair">>("/v1/auth/google/exchange", jsonBody(body)));
        }
      }
    });
  }

  return (
    <section className="au-card" aria-labelledby="auth-heading">
      <aside className="au-aside" aria-label="About Moby Web" data-expression={expression}>
        <p className="au-eyebrow">Moby Web</p>
        <p className="au-aside-title">Talk to Moby from any browser.</p>
        <p className="au-aside-copy">
          The same account works in the Windows app. Conversations in the app stay on your computer, and cloud voice stays off until you agree to it.
        </p>
        <figure className="au-figure">
          <img src="/models/moby-mini-poster.webp" width="1200" height="1000" alt="Moby Mini, a small slate-grey desk robot with a face on an OLED screen" decoding="async" />
          <figcaption>
            <MobyFace expression={expression} size={72} decorative />
            <span><strong>Moby Mini</strong> {EXPRESSION_META[expression].status}</span>
          </figcaption>
        </figure>
        <ul className="au-points">
          <li><Icon name="message" size={17} /> Chat with the assistant</li>
          <li><Icon name="mic" size={17} /> Voice tools in English, Russian and Uzbek</li>
          <li><Icon name="shield" size={17} /> Export or delete your data any time</li>
        </ul>
      </aside>
      <div className="au-panel">
        <div className="au-content">
          {mode !== "login" && (
            <a href="/app/" className="au-back"><Icon name="back" size={17} /> Back to sign in</a>
          )}
          <h1 id="auth-heading">{view.title}</h1>
          <p className="au-description">{view.description}</p>
          <div className="au-feedback" key={task.feedback?.message ?? "none"}><TaskFeedback feedback={task.feedback} /></div>
          {(mode === "login" || mode === "register") && (
            <div className="au-social">
              <a className="au-google" href={googleSignInHref}><img src="/google-g.png" width="20" height="20" alt="" /> Continue with Google</a>
              <p className="au-separator"><span>or use email</span></p>
            </div>
          )}
          <form key={mode} className="au-form" onSubmit={submit} aria-labelledby="auth-heading" aria-busy={task.busy}>
            {needsEmail && (
              <label className="au-field">Email address
                <input type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
              </label>
            )}
            {needsToken && (
              <label className="au-field">{mode === "verify" ? "Verification link or code" : "Password reset link or code"}
                <input name="token" autoComplete="off" spellCheck={false} maxLength={2048} required />
              </label>
            )}
            {mode !== "forgot" && mode !== "google" && (
              <div className="au-field">
                <div className="au-field-heading">
                  <label htmlFor="auth-password">{mode === "reset" ? "New password" : "Password"}</label>
                  {mode === "login" && <a href="/app/?view=forgot">Forgot password?</a>}
                </div>
                <div className="au-password">
                  <input id="auth-password" type={showPassword ? "text" : "password"} name="password" required minLength={15} maxLength={128}
                    placeholder={newPassword ? "Create a strong password" : "Enter your password"}
                    spellCheck={false} autoCapitalize="none" autoComplete={newPassword ? "new-password" : "current-password"}
                    aria-describedby={newPassword ? "auth-password-hint" : undefined} />
                  <button type="button" aria-controls="auth-password" aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>
                {newPassword && <small id="auth-password-hint" className="au-hint">Use at least 15 characters.</small>}
              </div>
            )}
            {(mode === "register" || mode === "google") && (
              <label className="au-consent">
                <input type="checkbox" required />
                <span>I accept the <a href="/legal/terms/" target="_blank" rel="noreferrer">terms</a> ({registrationPolicies.terms_version}) and <a href="/legal/privacy/" target="_blank" rel="noreferrer">privacy policy</a> ({registrationPolicies.privacy_policy_version}) for this API environment.</span>
              </label>
            )}
            {mode === "google" && !googleAvailableHere && (
              <p className="au-hint">Google sign-in uses the local web app at 127.0.0.1.</p>
            )}
            <button className={mode === "google" ? "au-google" : "au-submit"} data-busy={task.busy || undefined}
              disabled={task.busy || (mode === "google" && !googleAvailableHere)}>
              {mode === "google" && <img src="/google-g.png" width="20" height="20" alt="" />}
              {task.busy ? <><span className="au-spinner" aria-hidden="true" /> Working…</> : view.button}
              {mode !== "google" && !task.busy && <Icon name="arrow" size={18} />}
            </button>
            {mode === "login" && (
              <details className="au-advanced">
                <summary>Connecting an existing installation?</summary>
                <label className="au-field">Installation ID
                  <input name="installation_id" autoComplete="off" maxLength={36} placeholder="Enter your installation ID" />
                </label>
              </details>
            )}
          </form>
          <p className="au-help">
            {mode === "login" && (
              <>
                <span>New to Moby? <a href="/app/?view=register">Create an account</a></span>
                <span>Have an email link? <a href="/app/?view=verify">Verify your email</a></span>
              </>
            )}
            {mode === "register" && <span>Already have a verification link? <a href="/app/?view=verify">Verify your email</a></span>}
            {mode === "verify" && <span>No account yet? <a href="/app/?view=register">Create one</a></span>}
            {mode === "forgot" && <span>Already have a reset link? <a href="/app/?view=reset">Choose a new password</a></span>}
          </p>
        </div>
      </div>
    </section>
  );
}
