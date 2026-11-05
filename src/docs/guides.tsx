import { useState } from "react";
import spec from "../../contracts/moby-api.openapi.json";
import { apiJson, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { Callout, CodeBlock, DataTable, Flow, Steps, project, updated, type DocPage } from "./ui";

type Operation = { summary?: string; responses: Record<string, unknown>; security?: unknown[] };

const notes: Record<string, [string, string]> = {
  "GET /health": ["Service", "Reports that the API process is running. Returns status “ok”."],
  "GET /ready": ["Service", "Reports whether PostgreSQL and the required migrations are ready. Returns 503 when they are not."],
  "GET /openapi.json": ["Service", "Returns the OpenAPI 3.1 contract this page is built from."],
  "POST /v1/auth/register": ["Authentication", "Starts registration with an email, a password, and the terms and privacy versions you accept. Sends a verification email."],
  "GET /v1/auth/verify-email": ["Authentication", "Serves the HTML verification form linked from the email."],
  "POST /v1/auth/verify-email": ["Authentication", "Completes registration with the email token and the registration password."],
  "POST /v1/auth/login": ["Authentication", "Signs in with email and password. Optionally takes an installation ID. Returns an access and refresh token pair."],
  "POST /v1/auth/refresh": ["Authentication", "Exchanges a refresh token for a new pair. Each refresh token works once."],
  "POST /v1/auth/logout": ["Authentication", "Revokes the session that owns the refresh token."],
  "POST /v1/auth/password/forgot": ["Authentication", "Requests a reset email. Always answers 202, whether or not the account exists."],
  "GET /v1/auth/password/reset": ["Authentication", "Serves the HTML reset form linked from the email."],
  "POST /v1/auth/password/reset": ["Authentication", "Sets a new password using the reset token. Ends the account’s sessions."],
  "GET /v1/auth/google/start": ["Google", "Begins the Google OpenID flow for a local loopback app and redirects to Google."],
  "GET /v1/auth/google/callback": ["Google", "Receives Google’s redirect and returns a one-time code to the local app."],
  "POST /v1/auth/google/exchange": ["Google", "Exchanges the one-time code and PKCE verifier for a token pair, creating the account if needed."],
  "POST /v1/auth/google/link": ["Google", "Links a Google identity to the signed-in account. Needs the current password."],
  "GET /v1/me": ["Account", "Returns your profile and the current installation ID."],
  "PATCH /v1/me": ["Account", "Updates the display name (1 to 100 characters, or null to clear)."],
  "DELETE /v1/me": ["Account", "Permanently deletes the account after a password or Google proof."],
  "POST /v1/me/export": ["Account", "Returns a JSON export of account, installation, session, and consent metadata."],
  "GET /v1/installations": ["Installations and consent", "Lists your registered devices."],
  "POST /v1/installations": ["Installations and consent", "Registers a device with a name and an optional app version."],
  "DELETE /v1/installations/{id}": ["Installations and consent", "Revokes a device and ends its sessions."],
  "GET /v1/consents": ["Installations and consent", "Lists consent records and the policy versions currently in force."],
  "POST /v1/consents": ["Installations and consent", "Grants or withdraws one consent type for one version."],
  "POST /v1/agent/turn": ["Assistant", "Runs one stateless assistant turn and streams events as server-sent events."],
  "POST /v1/voice/stt": ["Voice", "Transcribes a WAV clip of up to 30 seconds. Needs cloud voice consent."],
  "POST /v1/voice/tts": ["Voice", "Turns up to 500 characters into a WAV clip. Needs cloud voice consent."],
  "GET /v1/usage": ["Usage", "Returns remaining assistant tokens, transcription seconds, speech characters, and the reset time."],
  "POST /v1/demo/chat": ["Guest demo", "Sends one short guest message with a Turnstile token. No account needed."],
};

const methodOrder = ["get", "post", "patch", "delete"];

const operations = Object.entries(spec.paths as Record<string, Record<string, Operation>>)
  .flatMap(([path, methods]) => methodOrder.filter((method) => method in methods).map((method) => {
    const operation = methods[method] as Operation;
    const key = `${method.toUpperCase()} ${path}`;
    const [group, description] = notes[key] ?? ["Other", operation.summary ?? "See the OpenAPI contract."];
    return {
      key, method: method.toUpperCase(), path, group, description,
      auth: Boolean(operation.security?.length),
      statuses: Object.keys(operation.responses),
    };
  }));

const groups = [...new Set(Object.values(notes).map(([group]) => group))];

function LiveStatus() {
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    const probes = ["/health", "/ready"] as const;
    const results = await Promise.allSettled(probes.map((path) => apiJson<Model<"ProbeBody">>(path)));
    setLines(results.map((result, index) => result.status === "fulfilled"
      ? `${probes[index]} → ${result.value.status}`
      : `${probes[index]} → unreachable`));
    setBusy(false);
  }

  return (
    <div className="live-check">
      <button type="button" className="workspace-button" onClick={() => void check()} disabled={busy}>
        <Icon name="server" size={15} /> {busy ? "Checking…" : "Check the API from this page"}
      </button>
      <ul aria-live="polite">{lines.map((line) => <li key={line}><i aria-hidden="true" />{line}</li>)}</ul>
    </div>
  );
}

export const overview: DocPage = {
  slug: "overview",
  path: "/docs/",
  group: "Documentation",
  title: "Moby documentation",
  nav: "Overview",
  kicker: "Documentation",
  summary: "Start here to understand how Moby fits together and to run the website and API on your own Windows computer.",
  updated,
  highlights: [
    ["4", "locales for voice and text"],
    [String(operations.length), "documented API operations"],
    ["3", "projects: web, API, desktop"],
    ["0", "cloud accounts needed to try it locally"],
  ],
  sections: [
    {
      id: "what-is-moby",
      title: "What Moby is",
      body: (
        <>
          <p>Moby is a compact desktop companion robot, designed to listen, respond, and help with tasks you approve on your Windows PC. The project has several parts that work together, all developed in the open.</p>
          <Flow nodes={[["Robot", "Microphone, OLED face, mute switch"], ["Desktop app", "Windows 10 and 11, runs local tools"], ["Moby API", "Rust, Axum, PostgreSQL"], ["Providers", "Language and voice models"]]} />
          <p>The robot captures your voice and shows its state on a small OLED display. It connects over USB to the Windows app, which sends requests to the Moby API and asks your permission before running local tools. The API owns accounts, sessions, quotas, and the assistant. Moby Web is the browser front end for the same API.</p>
        </>
      ),
    },
    {
      id: "components",
      title: "The parts",
      body: (
        <DataTable
          head={["Part", "Stack", "Role"]}
          rows={[
            ["moby-web", "React, TypeScript, Tailwind CSS, Vite", "Website, guest demo, and the signed-in web app."],
            ["moby-api", "Rust, Axum, Tokio, SQLx, PostgreSQL", "Accounts, email verification, sessions, assistant, voice, quotas, and consent."],
            ["moby-desktop", "Windows app", "USB link to the robot, local tools, and permission checks."],
            ["moby-firmware", "Microcontroller firmware", "Runs on the robot: audio capture, display, and controls."],
            ["moby-protocol", "Shared wire types", "The message contract shared by the API and desktop app."],
          ]}
        />
      ),
    },
    {
      id: "run-api",
      title: "Run the API locally",
      body: (
        <>
          <p>You need Docker Desktop with the Linux engine running. In the <code>moby-api</code> folder, run PowerShell:</p>
          <CodeBlock label="PowerShell">{`docker compose up --build --detach --wait
Invoke-RestMethod http://127.0.0.1:8080/health
Invoke-RestMethod http://127.0.0.1:8080/ready`}</CodeBlock>
          <p>The API applies its database migrations on start. Compose also starts a local mail catcher: open <code>http://127.0.0.1:8025</code> to read the verification and reset emails you trigger. Stop everything with <code>docker compose down</code>.</p>
          <LiveStatus />
        </>
      ),
    },
    {
      id: "run-web",
      title: "Run the website",
      body: (
        <>
          <Steps items={[
            ["Install", <>Use Node.js 24.13.0 and npm 11.6.2. In <code>moby-web</code> run <code>npm.cmd ci --ignore-scripts --no-audit --no-fund</code>.</>],
            ["Start", <>Run <code>npm.cmd run dev</code>. Vite prints the local address, for example <code>http://127.0.0.1:5173/</code>.</>],
            ["Connect", <>Vite proxies <code>/v1</code>, <code>/health</code>, <code>/ready</code>, and <code>/openapi.json</code> to <code>http://127.0.0.1:8080</code>. Set <code>MOBY_API_ORIGIN</code> in <code>.env.local</code> to use another API.</>],
            ["Open the app", <>Go to <a href="/app/">/app/</a>, create an account, open the verification link from the mail catcher, and sign in.</>],
          ]} />
          <CodeBlock label="Production build">{`npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test`}</CodeBlock>
        </>
      ),
    },
    {
      id: "configuration",
      title: "Configuration reference",
      body: (
        <>
          <p>Moby Web reads these build settings. Copy <code>.env.example</code> to <code>.env.local</code> to change them.</p>
          <DataTable
            head={["Setting", "Purpose", "Default"]}
            rows={[
              ["MOBY_API_ORIGIN", "Upstream API for the Vite dev and preview proxy.", "http://127.0.0.1:8080"],
              ["VITE_MOBY_TURNSTILE_SITE_KEY", "Public key of the Turnstile widget. Without it the guest demo shows as offline.", "empty"],
              ["VITE_MOBY_TERMS_VERSION", "Terms version sent when registering. Must match the API.", "dev-1"],
              ["VITE_MOBY_PRIVACY_POLICY_VERSION", "Privacy version sent when registering. Must match the API.", "dev-1"],
            ]}
          />
          <p>The API reads its own environment variables, and a few matter most for operators:</p>
          <DataTable
            head={["Variable", "Purpose", "Local default"]}
            rows={[
              ["DATABASE_URL", "PostgreSQL connection (required).", "postgres://moby:…@127.0.0.1:55432/moby"],
              ["MOBY_BIND_ADDR", "Address the server listens on.", "127.0.0.1:8080"],
              ["MOBY_AGENT_ENABLED", "Turns the assistant route on or off.", "true"],
              ["MOBY_VOICE_ENABLED", "Turns the voice routes on or off.", "false"],
              ["MOBY_DEMO_ENABLED", "Turns the guest demo on, with MOBY_TURNSTILE_SECRET_KEY and MOBY_DEMO_HOSTNAME.", "false"],
              ["MOBY_LLM_DAILY_TOKENS", "Assistant tokens per account per day.", "250000"],
              ["MOBY_STT_DAILY_SECONDS", "Transcription seconds per account per day.", "300"],
              ["MOBY_TTS_DAILY_CHARS", "Speech characters per account per day.", "5000"],
              ["MOBY_GOOGLE_CLIENT_ID, _SECRET, _REDIRECT_URI", "Set all three to enable Google sign-in.", "unset"],
            ]}
          />
        </>
      ),
    },
    {
      id: "next",
      title: "Where to go next",
      body: (
        <ul>
          <li>Learn every screen in the <a href="/docs/web-app/">web app guide</a>.</li>
          <li>Call the service directly with the <a href="/docs/api/">API reference</a>.</li>
          <li>Understand tokens and sessions on the <a href="/docs/security/">security page</a>.</li>
          <li>See what is stored on the <a href="/docs/data/">data and consent page</a>, or read the full <a href="/legal/privacy/">Privacy Policy</a> and <a href="/legal/terms/">Terms of Service</a>.</li>
          <li>Browse or contribute to the code on <a href={project}>GitHub</a>.</li>
        </ul>
      ),
    },
  ],
};

export const webApp: DocPage = {
  slug: "web-app",
  path: "/docs/web-app/",
  group: "Documentation",
  title: "Web app guide",
  nav: "Web app guide",
  kicker: "Documentation",
  summary: "A walkthrough of every screen in Moby Web, from signing in to using the assistant, voice tools, and usage limits.",
  updated,
  highlights: [
    ["4", "workspace sections"],
    ["6", "sign-in screens"],
    ["tab", "session lives in memory"],
    ["EN RU UZ", "voice and text languages"],
  ],
  sections: [
    {
      id: "sign-in",
      title: "Signing in and registering",
      body: (
        <>
          <p>Open <a href="/app/">/app/</a>. The sign-in page offers the following flows, each reachable with a <code>?view=</code> link:</p>
          <DataTable
            head={["Screen", "Link", "What it does"]}
            rows={[
              ["Sign in", "/app/", "Email and password. An advanced option lets you connect an existing installation ID."],
              ["Create account", "/app/?view=register", "Email, a password of at least 15 characters, and acceptance of the terms and privacy policy."],
              ["Verify email", "/app/?view=verify", "Paste the link or code from the email, plus your registration password."],
              ["Forgot password", "/app/?view=forgot", "Request a reset email. The answer is the same whether or not the account exists."],
              ["Reset password", "/app/?view=reset", "Paste the reset link or code and choose a new password."],
              ["Google", "/app/?view=google", "Sign in or register with Google on the local app."],
            ]}
          />
          <Callout title="Your session lives in the tab">
            Moby Web keeps tokens in memory, not in cookies or storage. It refreshes them automatically, and reloading or closing the tab signs you out.
          </Callout>
        </>
      ),
    },
    {
      id: "google",
      title: "Google sign-in",
      body: (
        <>
          <p>Google sign-in is available on the local app at <code>http://127.0.0.1:&lt;port&gt;</code>. If you start from <code>localhost</code>, the app moves the signed-out tab to <code>127.0.0.1</code> first, because the API returns to that address. A pop-up opens for Google, and the one-time code comes back to the originating tab, which holds the PKCE verifier. Account linking and deletion keep your current session.</p>
          <p>The API must have <code>MOBY_GOOGLE_CLIENT_ID</code>, <code>MOBY_GOOGLE_CLIENT_SECRET</code>, and <code>MOBY_GOOGLE_REDIRECT_URI</code> set. If it does not, the API answers 503 and you can use email instead.</p>
        </>
      ),
    },
    {
      id: "account",
      title: "Account",
      body: (
        <>
          <DataTable
            head={["Card", "What you can do"]}
            rows={[
              ["Profile", "Change your display name and export your account data as a JSON file."],
              ["Installations", "See registered devices, register a new one with an optional app version, and revoke any of them. Revoking the current one signs this tab out."],
              ["Consent", "Grant or withdraw terms, privacy policy, and cloud voice consent for the current version. Older versions can be withdrawn too."],
              ["Link Google", "Attach a Google identity after confirming your password."],
              ["Delete account", "Permanently delete your account with your password or a fresh Google check."],
            ]}
          />
        </>
      ),
    },
    {
      id: "assistant",
      title: "Assistant",
      body: (
        <>
          <p>Type a message and press Enter to send, or Shift+Enter for a new line. The reply appears as it streams, and you can press Stop to cancel. The tab keeps up to 62 earlier messages for context, and New chat clears them. Messages must be under 8 KiB, and a whole request under 128 KiB.</p>
          <p>The web assistant uses text only and sends no desktop tools. For local tasks, use the Windows app.</p>
        </>
      ),
    },
    {
      id: "voice",
      title: "Voice tools",
      body: (
        <>
          <p>Choose a language first: English, Russian, Uzbek (Latin), or Uzbek (Cyrillic). Both tools need cloud voice consent from the Account screen.</p>
          <ul>
            <li><strong>Speech to text.</strong> Upload a mono, 16 kHz, 16-bit PCM WAV clip up to 30 seconds. The transcript shows the detected language, script, and confidence.</li>
            <li><strong>Text to speech.</strong> Enter 1 to 500 characters. Play the returned WAV in the page or download it.</li>
          </ul>
        </>
      ),
    },
    {
      id: "usage",
      title: "Usage and limits",
      body: <p>The Usage screen shows what is left of your assistant tokens, transcription seconds, and speech characters, and when the window resets. Use Refresh usage after a few requests to see the numbers change.</p>,
    },
    {
      id: "api-status",
      title: "API status",
      body: <p>Open <a href="/app/#api-status">/app/#api-status</a> to test the API process and database readiness, see how long each answered, and read the live OpenAPI title, version, and path count.</p>,
    },
    {
      id: "guest-demo",
      title: "Guest demo",
      body: <p>The home page has a guest demo for trying Moby without an account. When it is enabled you pass a Cloudflare Turnstile check, send one message of up to 280 characters, and see Moby’s reply. When it is not enabled the section links you to the web app.</p>,
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      body: (
        <DataTable
          head={["Symptom", "Likely cause", "Fix"]}
          rows={[
            ["“Could not reach the Moby API.”", "The API is not running or the proxy points elsewhere.", "Start the API and check MOBY_API_ORIGIN."],
            ["Voice request returns 403", "Cloud voice consent is missing.", "Grant it under Account → Consent."],
            ["Google button is disabled", "You are not on 127.0.0.1.", "Open the app at http://127.0.0.1:<port>/app/."],
            ["No verification email", "Mail is delivered to the local mail catcher.", "Open http://127.0.0.1:8025."],
            ["429 Too Many Requests", "A rate limit or quota was reached.", "Wait for the limit window or the daily reset."],
          ]}
        />
      ),
    },
  ],
};

export const api: DocPage = {
  slug: "api",
  path: "/docs/api/",
  group: "Documentation",
  title: "API reference",
  nav: "API reference",
  kicker: "Documentation",
  summary: "Every Moby API endpoint, generated from the same OpenAPI contract the website is built against, with authentication, status codes, and examples.",
  updated,
  highlights: [
    [String(operations.length), "operations in the contract"],
    [String(operations.filter((item) => item.auth).length), "need a bearer token"],
    ["OpenAPI 3.1", "contract format"],
    ["SSE", "streaming assistant replies"],
  ],
  sections: [
    {
      id: "basics",
      title: "Basics",
      body: (
        <>
          <p>The API speaks JSON over HTTP. During development it listens on <code>http://127.0.0.1:8080</code>, and the website reaches it through a same-origin proxy so the browser needs no CORS configuration. The contract is available live at <a href="/openapi.json">/openapi.json</a>.</p>
          <DataTable
            head={["Topic", "Behaviour"]}
            rows={[
              ["Content type", "Send application/json, except voice transcription, which takes audio/wav."],
              ["Errors", "Failures return a JSON body with a human-readable message field."],
              ["Authentication", "Protected routes need Authorization: Bearer <access token>. A 401 with a Bearer challenge means the token is missing or expired."],
              ["Rate limits", "429 means a per-account or per-network limit was hit. Back off and retry later."],
              ["Request size", "Oversized bodies return 413."],
              ["Availability", "503 means a dependency or feature is unavailable or disabled."],
            ]}
          />
        </>
      ),
    },
    {
      id: "auth-flow",
      title: "Authentication flow",
      body: (
        <>
          <Steps items={[
            ["Sign in", <>POST <code>/v1/auth/login</code> returns <code>access_token</code>, <code>refresh_token</code>, <code>expires_in</code>, and <code>installation_id</code>.</>],
            ["Call the API", <>Send the access token as a Bearer token. It lasts 15 minutes in the local configuration.</>],
            ["Refresh", <>POST <code>/v1/auth/refresh</code> with the refresh token before it expires. Each refresh token is single use, so store the new pair. Run one refresh at a time per session.</>],
            ["Sign out", <>POST <code>/v1/auth/logout</code> with the refresh token to end the session.</>],
          ]} />
          <CodeBlock label="Sign in">{`curl -X POST http://127.0.0.1:8080/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"your password","installation_id":null}'`}</CodeBlock>
          <CodeBlock label="Read your profile">{`curl http://127.0.0.1:8080/v1/me \\
  -H "Authorization: Bearer <access_token>"`}</CodeBlock>
        </>
      ),
    },
    ...groups.map((group) => ({
      id: `endpoints-${group.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      title: group,
      body: (
        <div className="endpoint-list">
          {operations.filter((operation) => operation.group === group).map((operation) => (
            <article className="endpoint" key={operation.key}>
              <header>
                <span className="method" data-method={operation.method}>{operation.method}</span>
                <code>{operation.path}</code>
                <span className="auth-tag" data-auth={operation.auth}>{operation.auth ? "Bearer" : "Public"}</span>
              </header>
              <p>{operation.description}</p>
              <ul className="status-chips" aria-label="Status codes">
                {operation.statuses.map((status) => <li key={status} data-ok={status.startsWith("2") || status.startsWith("3")}>{status}</li>)}
              </ul>
            </article>
          ))}
        </div>
      ),
    })),
    {
      id: "assistant-stream",
      title: "Assistant stream",
      body: (
        <>
          <p><code>POST /v1/agent/turn</code> responds with <code>text/event-stream</code>. Each data frame holds one JSON event, and the stream ends at the first terminal event.</p>
          <DataTable
            head={["Event", "Meaning"]}
            rows={[
              ["speech_delta", "A chunk of reply text to append."],
              ["completed", "The final display_text and speech_text. The stream ends."],
              ["error", "A terminal error with a message and the API request ID."],
              ["tool_call", "A proposed desktop tool. Only the Windows app can run it."],
            ]}
          />
          <CodeBlock label="Request">{`curl -N -X POST http://127.0.0.1:8080/v1/agent/turn \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"kind":"user","text":"Hello Moby"}],
       "language":"en","script":"latn",
       "available_tools":[],"resources":[]}'`}</CodeBlock>
        </>
      ),
    },
    {
      id: "try-it",
      title: "Try the API from this page",
      body: (
        <>
          <p>This page is served from the same origin as the API proxy, so it can check the public probes for you.</p>
          <LiveStatus />
        </>
      ),
    },
  ],
};

export const security: DocPage = {
  slug: "security",
  path: "/docs/security/",
  group: "Documentation",
  title: "Security",
  nav: "Security",
  kicker: "Documentation",
  summary: "How Moby protects accounts, sessions, and tokens, how email links and Google sign-in are hardened, and how to report a vulnerability.",
  updated,
  highlights: [
    ["Ed25519", "access token signatures"],
    ["Argon2", "password hashing"],
    ["1 use", "per refresh token"],
    ["HW switch", "physical microphone cut-off"],
  ],
  sections: [
    {
      id: "model",
      title: "Security model",
      body: (
        <>
          <p>Moby assumes that tokens can leak, that email links can be opened by the wrong person, and that clients can retry or race. The API therefore keeps authority in the database: it checks the session, device, and account on every protected request, uses short-lived credentials, and makes each important change atomic.</p>
        </>
      ),
    },
    {
      id: "passwords",
      title: "Passwords",
      body: <p>Passwords must be 15 to 128 characters. The API stores only an Argon2 hash and verifies it before changes that matter. Login locks the account row and confirms that the hash it checked is still current, so a password reset cannot be raced by a sign-in that started earlier.</p>,
    },
    {
      id: "tokens",
      title: "Access and refresh tokens",
      body: (
        <>
          <DataTable
            head={["Token", "Format", "Lifetime (local)", "How it is protected"]}
            rows={[
              ["Access token", "Ed25519-signed JWT", "15 minutes", "Signature, algorithm, kid, typ, issuer, audience, and expiry are validated, and the database confirms the session, device, and account."],
              ["Refresh token", "32 random bytes", "Session up to 30 days", "Stored only as a SHA-256 hash, single use, rotated in one transaction."],
              ["Email token", "32 random bytes", "24 h verify, 30 min reset", "Stored only as a SHA-256 hash. Using a verification token cancels other open ones."],
            ]}
          />
          <p>If an already-used refresh token is presented, the API revokes the session, even if a parallel request had just succeeded. Signing keys can be rotated, and previous public keys keep older signatures verifiable during the changeover.</p>
        </>
      ),
    },
    {
      id: "email-links",
      title: "Email links",
      body: (
        <>
          <ul>
            <li>The token travels in the URL fragment, which browsers do not send to the server, and the page posts it explicitly.</li>
            <li>A verification link also needs the password chosen at registration, so someone who typed your email address cannot activate an account for you.</li>
            <li>Password reset requests are answered with the same response whether or not an account exists, and the email is sent through a bounded queue so response time does not reveal it.</li>
            <li>A reset ends the account’s sessions in the same transaction as the password change.</li>
          </ul>
        </>
      ),
    },
    {
      id: "google",
      title: "Google sign-in",
      body: <p>Moby uses the OpenID Connect flow with the “openid email” scope and PKCE. The API accepts only a local loopback callback, stores the sign-in attempt for 10 minutes, and hands back a one-time code that expires in 90 seconds. The browser tab that began the flow holds the verifier, so a code intercepted elsewhere cannot be redeemed.</p>,
    },
    {
      id: "abuse",
      title: "Abuse protection",
      body: (
        <ul>
          <li>Sign-in, reset, verification, and other sensitive routes are rate limited per account and per network in 15-minute windows.</li>
          <li>Network addresses are stored as a keyed HMAC, grouped by /64 for IPv6. Forwarded-for headers are not trusted.</li>
          <li>The guest demo is protected by Cloudflare Turnstile and a separate daily token allowance and monetary budget.</li>
          <li>Assistant and voice work reserve their maximum cost in a transaction before running, and unknown charges stay counted so spending cannot silently exceed caps.</li>
        </ul>
      ),
    },
    {
      id: "browser",
      title: "In the browser",
      body: <p>Moby Web keeps tokens in memory only and makes API requests without cookies. It validates events from the assistant stream, caps message and stream sizes, and refuses redirects on API calls. Browser conversations stay in the tab.</p>,
    },
    {
      id: "hardware",
      title: "Your microphone",
      body: <p>The Moby robot includes a physical switch that disconnects the microphone data line. It does not depend on software, so when it is off the robot cannot capture sound. Cloud voice processing also needs your consent and can be withdrawn at any time.</p>,
    },
    {
      id: "report",
      title: "Reporting a vulnerability",
      body: (
        <>
          <p>Please report security problems responsibly. Do not include exploit details, tokens, or personal data in a public issue.</p>
          <Steps items={[
            ["Check for private reporting", <>If the <a href={project}>GitHub repository</a> offers private vulnerability reporting under its Security tab, use that.</>],
            ["Otherwise open a minimal issue", <>Open an issue titled “Security contact request” with no technical details, and a maintainer will arrange a private channel.</>],
            ["Give us time", <>Allow reasonable time to investigate and fix before disclosing publicly.</>],
          ]} />
          <Callout title="Contact details are coming">A dedicated security contact will be published here before a public launch.</Callout>
        </>
      ),
    },
  ],
};

export const data: DocPage = {
  slug: "data",
  path: "/docs/data/",
  group: "Documentation",
  title: "Data and consent",
  nav: "Data and consent",
  kicker: "Documentation",
  summary: "A practical guide to the three consents Moby records, what is stored about you, and how to export or delete it.",
  updated,
  highlights: [
    ["3", "consent types"],
    ["JSON", "account export format"],
    ["1 tx", "atomic account deletion"],
    ["0", "stored conversations"],
  ],
  sections: [
    {
      id: "consents",
      title: "The three consents",
      body: (
        <>
          <DataTable
            head={["Consent", "Needed for", "Withdrawing it"]}
            rows={[
              ["Terms", "Using your account and the service.", "Recorded as withdrawn. Delete your account to leave entirely."],
              ["Privacy policy", "Letting Moby process your information as described.", "Recorded as withdrawn. Delete your account to leave entirely."],
              ["Cloud voice", "Speech to text and text to speech.", "Blocks new voice requests immediately."],
            ]}
          />
          <p>Each consent is stored per version with an accepted and a withdrawn time. Granting again after a withdrawal records a fresh acceptance time, while repeating a grant or a withdrawal does not change the existing time.</p>
          <Callout title="Registering records two consents">When you register or create an account with Google, the terms and privacy versions you accept are stored together with the account. Cloud voice is always a separate choice.</Callout>
        </>
      ),
    },
    {
      id: "stored",
      title: "What is stored",
      body: (
        <>
          <p>In short: your email, a password hash, an optional name, your devices and sessions, your consent history, and amounts of usage. The <a href="/legal/privacy/#collect">Privacy Policy</a> lists every record, its purpose, and its retention.</p>
          <DataTable
            head={["Kept", "Not kept"]}
            rows={[
              ["Email, password hash, optional display name", "Your password in plain text"],
              ["Device names, app versions, session and expiry times", "Refresh and email tokens in plain text"],
              ["Consent records with versions and times", "Assistant conversations and tool results"],
              ["Usage amounts, meters, dates, and IDs", "Audio and transcripts in the database"],
            ]}
          />
        </>
      ),
    },
    {
      id: "export",
      title: "Export your data",
      body: (
        <>
          <p>In Moby Web go to <strong>Account → Profile → Export account data</strong>. The API reads your account, installations, sessions, and consent metadata from one consistent snapshot and returns a JSON file named <code>moby-account-export.json</code>.</p>
          <CodeBlock label="From the API">{`curl -X POST http://127.0.0.1:8080/v1/me/export \\
  -H "Authorization: Bearer <access_token>" -o moby-account-export.json`}</CodeBlock>
        </>
      ),
    },
    {
      id: "delete",
      title: "Delete your account",
      body: (
        <>
          <p>Go to <strong>Account → Delete account</strong>. You confirm with your password, or with a fresh Google check if you sign in with Google. The API then re-verifies your session and credentials under a row lock and removes your account, its installations, sessions, consents, and email-based limits in one transaction.</p>
          <ul>
            <li>Usage ledger rows stay for service accounting, but lose their link to you.</li>
            <li>Rate-limit counters keyed by network address expire on their normal 15-minute schedule.</li>
            <li>This cannot be undone. Export your data first if you want a copy.</li>
          </ul>
        </>
      ),
    },
    {
      id: "devices",
      title: "Devices and sessions",
      body: <p>Every sign-in belongs to an installation. Revoking an installation affects only that device and the sessions bound to it, and the revocation applies on the very next request. Resetting your password ends all your sessions at once.</p>,
    },
    {
      id: "questions",
      title: "Questions",
      body: <p>Read the <a href="/legal/privacy/">Privacy Policy</a> and <a href="/legal/terms/">Terms of Service</a>, or ask on <a href={`${project}/issues`}>GitHub</a>.</p>,
    },
  ],
};

export const guides = [overview, webApp, api, security, data];
