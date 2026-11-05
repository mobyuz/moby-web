import type { Model } from "../api/workspace";

export type PolicyVersions = Pick<Model<"Register">, "terms_version" | "privacy_policy_version">;

export const registrationPolicies: PolicyVersions = {
  terms_version: import.meta.env.VITE_MOBY_TERMS_VERSION || "dev-1",
  privacy_policy_version: import.meta.env.VITE_MOBY_PRIVACY_POLICY_VERSION || "dev-1",
};

const port = Number(window.location.port);
export const googleAvailableHere = window.location.hostname === "127.0.0.1"
  && window.location.protocol === "http:" && port >= 1024;

// The API returns to 127.0.0.1. Move the signed-out tab there first so its
// BroadcastChannel and the OAuth callback have the same origin.
const signInUrl = new URL("/app/?view=google", window.location.origin);
if (signInUrl.hostname === "localhost" && signInUrl.protocol === "http:" && port >= 1024) {
  signInUrl.hostname = "127.0.0.1";
}
export const googleSignInHref = signInUrl.href;

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function googleProof(policies: PolicyVersions): Promise<Model<"Proof">> {
  if (!googleAvailableHere) throw new Error("Google sign-in requires the local Moby web app.");
  const popup = window.open("", "_blank", "popup,width=520,height=720");
  if (!popup) throw new Error("Allow pop-ups to continue with Google.");
  popup.opener = null;

  const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const channel = new BroadcastChannel(`moby-google-${state}`);
  try {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const query = new URLSearchParams({
      ...policies,
      desktop_port: String(port),
      desktop_state: state,
      code_challenge: base64url(new Uint8Array(hash)),
    });
    const code = await new Promise<string>((resolve, reject) => {
      const finish = (error?: Error, code?: string) => {
        window.clearInterval(poll);
        window.clearTimeout(timeout);
        if (error) reject(error);
        else if (code) resolve(code);
      };
      const timeout = window.setTimeout(() => finish(new Error("Google sign-in timed out.")), 5 * 60_000);
      const poll = window.setInterval(() => {
        if (popup.closed) {
          finish(new Error("The Google sign-in window was closed."));
          return;
        }
        try {
          if (popup.location.pathname === "/v1/auth/google/start" && popup.document.readyState === "complete") {
            finish(new Error("Google sign-in is unavailable right now. Please sign in with email or try again later."));
          }
        } catch {
          // The provider's page is on a different origin.
        }
      }, 500);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        const value = event.data;
        if (typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)) finish(undefined, value);
        else finish(new Error("Google did not authorize this request."));
      };
      try {
        popup.location.replace(`/v1/auth/google/start?${query}`);
      } catch {
        finish(new Error("Could not open the Google sign-in page."));
      }
    });
    return { code, code_verifier: verifier };
  } finally {
    channel.close();
    popup.close();
  }
}
