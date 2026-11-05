import { useState, type FormEvent } from "react";
import { apiJson, apiResponse, jsonBody, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { TaskFeedback, useTask, valueOf } from "./controls";
import { googleAvailableHere, googleProof, googleSignInHref, registrationPolicies } from "./google";

const views = {
  login: { title: "Sign in to Moby", description: "Your companion. Your workspace. All in one place.", button: "Sign in" },
  register: { title: "Create your account", description: "A little more possibility for your everyday.", button: "Create account" },
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
    <section className="auth-layout" aria-labelledby="auth-heading">
      <aside className="auth-aside" aria-label="About Moby Web">
        <div className="auth-aside-heading">
          <span className="auth-aside-label"><span /> A small companion. A big idea.</span>
          <p className="auth-aside-title">Make room for<br /><em>a little Moby.</em></p>
          <p className="auth-aside-copy">A place to think out loud, explore ideas, and connect with your companion.</p>
        </div>
        <div className="auth-scene" aria-hidden="true">
          <div className="auth-orbit auth-orbit-outer" />
          <div className="auth-orbit auth-orbit-inner" />
          <div className="auth-mark">
            <img src="/moby.svg" alt="" width="176" height="171" />
          </div>
          <div className="auth-scene-chip auth-scene-chat"><span className="auth-scene-icon"><Icon name="message" size={19} /></span><span>Ideas start here<small>Meet your assistant</small></span></div>
          <div className="auth-scene-chip auth-scene-voice"><Icon name="mic" size={18} /><span className="auth-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div>
          <span className="auth-scene-spark auth-scene-spark-one">+</span>
          <span className="auth-scene-spark auth-scene-spark-two">+</span>
        </div>
        <div className="auth-aside-foot"><span><Icon name="shield" size={17} /> Your data, your control</span><a href="https://github.com/mobyuz/moby-web">Built in the open <Icon name="external" size={15} /></a></div>
      </aside>
      <div className="auth-panel">
        <div className="auth-content">
          {mode !== "login" && (
            <a href="/app/" className="auth-back"><Icon name="back" size={17} /> Back to sign in</a>
          )}
          {mode === "login" && <p className="auth-welcome">Welcome back</p>}
          <h1 id="auth-heading">{view.title}</h1>
          <p className="auth-description">{view.description}</p>
          <TaskFeedback feedback={task.feedback} />
          {(mode === "login" || mode === "register") && (
            <div className="auth-social">
              <a className="google-button" href={googleSignInHref}><img src="/google-g.png" width="20" height="20" alt="" /> Continue with Google</a>
              <p className="auth-separator">or continue with email</p>
            </div>
          )}
          <form key={mode} className="auth-form" onSubmit={submit} aria-labelledby="auth-heading">
            {needsEmail && (
              <label className="field">Email address
                <input type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
              </label>
            )}
            {needsToken && (
              <label className="field">{mode === "verify" ? "Verification link or code" : "Password reset link or code"}
                <input name="token" autoComplete="off" spellCheck={false} maxLength={2048} required />
              </label>
            )}
            {mode !== "forgot" && mode !== "google" && (
              <div className="field">
                <div className="auth-field-heading">
                  <label htmlFor="auth-password">{mode === "reset" ? "New password" : "Password"}</label>
                  {mode === "login" && <a href="/app/?view=forgot">Forgot password?</a>}
                </div>
                <div className="auth-password">
                  <input id="auth-password" type={showPassword ? "text" : "password"} name="password" required minLength={15} maxLength={128}
                    placeholder={newPassword ? "Create a strong password" : "Enter your password"}
                    spellCheck={false} autoCapitalize="none" autoComplete={newPassword ? "new-password" : "current-password"}
                    aria-describedby={newPassword ? "auth-password-hint" : undefined} />
                  <button type="button" aria-controls="auth-password" aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>
                {newPassword && <small id="auth-password-hint" className="text-subtle">Use at least 15 characters.</small>}
              </div>
            )}
            {(mode === "register" || mode === "google") && (
              <label className="auth-consent">
                <input type="checkbox" required />
                <span>I accept the <a href="/legal/terms/" target="_blank" rel="noreferrer">terms</a> ({registrationPolicies.terms_version}) and <a href="/legal/privacy/" target="_blank" rel="noreferrer">privacy policy</a> ({registrationPolicies.privacy_policy_version}) for this API environment.</span>
              </label>
            )}
            {mode === "google" && !googleAvailableHere && (
              <p className="text-sm text-subtle">Google sign-in uses the local web app at 127.0.0.1.</p>
            )}
            <button className={mode === "google" ? "google-button" : "action auth-submit w-full"} disabled={task.busy || (mode === "google" && !googleAvailableHere)}>
              {mode === "google" && <img src="/google-g.png" width="20" height="20" alt="" />}
              {task.busy ? "Working…" : view.button}
              {mode !== "google" && !task.busy && <Icon name="arrow" size={18} />}
            </button>
            {mode === "login" && (
              <details className="auth-advanced">
                <summary>Connecting an existing installation?</summary>
                <label className="field mt-2">Installation ID
                  <input name="installation_id" autoComplete="off" maxLength={36} placeholder="Enter your installation ID" />
                </label>
              </details>
            )}
          </form>
          <div className="auth-help">
            {mode === "login" && (
              <>
                <p>New to Moby? <a href="/app/?view=register">Create an account</a></p>
                <p><a href="/app/?view=verify">Verify your email</a></p>
              </>
            )}
            {mode === "register" && <p>Already have a verification link? <a href="/app/?view=verify">Verify your email</a></p>}
            {mode === "forgot" && <p>Already have a reset link? <a href="/app/?view=reset">Choose a new password</a></p>}
          </div>
        </div>
      </div>
    </section>
  );
}
