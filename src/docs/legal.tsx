import { Callout, DataTable, project, updated, type DocPage } from "./ui";

const issues = `${project}/issues`;

export const privacy: DocPage = {
  slug: "privacy",
  path: "/legal/privacy/",
  group: "Legal",
  title: "Privacy Policy",
  nav: "Privacy Policy",
  kicker: "Legal",
  summary: "What Moby collects when you use the website, the web app, the API, and the desktop companion, why it is collected, how long it is kept, and the controls you have over it.",
  updated,
  versioned: "privacy_policy",
  highlights: [
    ["0", "cookies set by Moby Web"],
    ["SHA-256", "hashes for stored tokens"],
    ["15 min", "access token lifetime"],
    ["1 click", "account export and deletion"],
  ],
  sections: [
    {
      id: "summary",
      title: "The short version",
      body: (
        <>
          <p>Moby is an open-source desktop companion robot. Its online parts, which are this website, the signed-in web app, and the Moby API, keep only the information needed to run your account and to count your usage. This page explains each piece in detail.</p>
          <ul>
            <li><strong>Passwords are never stored.</strong> The API keeps a salted Argon2 hash of your password, and tokens in the database are stored as SHA-256 hashes.</li>
            <li><strong>Conversations are not kept.</strong> Assistant messages and tool results exist in the memory of a single request. The usage ledger records amounts, dates, and IDs only.</li>
            <li><strong>Voice processing needs your consent.</strong> Speech-to-text and text-to-speech are blocked until you grant cloud voice consent, and you can withdraw it at any time.</li>
            <li><strong>You are in control.</strong> You can edit your profile, export your account data, revoke devices, and permanently delete your account from the web app.</li>
            <li><strong>No advertising and no selling of data.</strong> Moby Web has no advertising or analytics trackers, and it does not set cookies.</li>
          </ul>
          <Callout title="Preview software">
            Moby is in development. The values on this page, such as lifetimes and quotas, describe the current API configuration. Values that are still being decided for a public launch are marked clearly, and this policy will be updated with a new version before they change.
          </Callout>
        </>
      ),
    },
    {
      id: "scope",
      title: "Who this policy covers",
      body: (
        <>
          <p>This policy applies to the Moby website, the signed-in Moby Web app, the Moby API that backs them, and the account features used by the Moby desktop app for Windows. Moby is developed in the open by the Moby contributors and is licensed under GPL-3.0-only; the source code is available at <a href={project}>github.com/mobyuz/moby-web</a>.</p>
          <p>The physical Moby robot has a hardware switch that disconnects the microphone data line. When the switch is off, no audio reaches the robot’s processor, so no audio can be sent anywhere. This policy covers audio only after it has been captured and sent to the API.</p>
        </>
      ),
    },
    {
      id: "collect",
      title: "Information we collect",
      body: (
        <>
          <p>The API stores the following records in its PostgreSQL database. The right-hand column states the purpose of each record.</p>
          <DataTable
            head={["Information", "What is stored", "Why"]}
            rows={[
              ["Account", "Lower-cased email address, whether it is verified, account status, creation time, and an Argon2 hash of your password.", "To create and secure your account and to sign you in."],
              ["Profile", "An optional display name of 1 to 100 characters. Leaving it blank clears it.", "To personalise the web app. It is never required."],
              ["Google sign-in", "Your Google account identifier (the OpenID subject) and email address. Moby requests only the “openid email” scope.", "To let you sign in with Google and to link Google to an existing account."],
              ["Installations", "A name you choose, the operating system (Windows), an optional app version, and created, last seen, and revoked times.", "To tie sessions to a device and let you revoke a device."],
              ["Sessions", "Session identifiers, expiry and revocation times, and SHA-256 hashes of refresh tokens.", "To keep you signed in and detect refresh-token reuse."],
              ["Email links", "SHA-256 hashes of verification and reset tokens, their expiry, and for registrations the pending password hash and the policy versions you accepted.", "To verify email addresses and reset passwords safely."],
              ["Consent records", "The type (terms, privacy policy, cloud voice), version, accepted time, and withdrawn time.", "To prove what you agreed to and to enforce your choices."],
              ["Rate-limit counters", "A keyed HMAC of your network address (grouped by /64 for IPv6), a hit count, and a reset time.", "To slow down abuse. The raw address is not stored in these records."],
              ["Usage ledger", "Reservation IDs, the meter (assistant, transcription, speech, or guest demo), amounts, UTC dates, and settlement times.", "To enforce quotas and service budgets."],
              ["Server logs", "A request ID, the route template, the status code, and the duration of each request.", "To operate and debug the service."],
            ]}
          />
        </>
      ),
    },
    {
      id: "not-collected",
      title: "What Moby does not keep",
      body: (
        <>
          <ul>
            <li><strong>Conversation content.</strong> Messages you send to the assistant, the assistant’s replies, and tool results are held in request memory while a turn runs. The usage ledger stores no text.</li>
            <li><strong>Audio and transcripts.</strong> A speech-to-text request is a WAV clip of up to 30 seconds. Only the PCM audio frames go to the voice provider, and the API writes only amounts and IDs to the ledger.</li>
            <li><strong>Guest demo messages.</strong> The single message you type in the guest demo is used by the demo provider after admission and is not written to the ledger.</li>
            <li><strong>Plain-text secrets.</strong> Passwords, refresh tokens, and email tokens are never stored in the clear.</li>
            <li><strong>Browser cookies and trackers.</strong> Moby Web does not set cookies, and it sends API requests without cookie credentials. Your session lives in the memory of the open tab, so reloading the page signs you out. Chat history also stays in the tab.</li>
          </ul>
        </>
      ),
    },
    {
      id: "use",
      title: "How we use information",
      body: (
        <>
          <ul>
            <li>To create accounts, verify email addresses, sign you in, and rotate sessions.</li>
            <li>To run the assistant, voice tools, and guest demo you ask for.</li>
            <li>To enforce daily quotas and service budgets so the free preview stays available to everyone.</li>
            <li>To protect the service from abuse, using rate limits and bot verification.</li>
            <li>To record and honour your consent choices.</li>
            <li>To diagnose faults using request IDs and route-level logs.</li>
          </ul>
          <p>We do not use your information for advertising, profiling, or training models, and we do not sell it.</p>
        </>
      ),
    },
    {
      id: "voice",
      title: "Voice and cloud processing",
      body: (
        <>
          <p>Voice features are processed in the cloud, so they require a separate <em>cloud voice</em> consent in addition to the terms and privacy policy. Before admitting any voice request, the API checks that consent under a database row lock. If you withdraw consent, new requests are blocked immediately. A request already admitted before the withdrawal may finish.</p>
          <DataTable
            head={["Feature", "Limit", "Sent to the provider"]}
            rows={[
              ["Speech to text", "One mono, 16 kHz, 16-bit PCM WAV clip of up to 30 seconds.", "PCM frames only, plus your language and script hint."],
              ["Text to speech", "Up to 500 characters per request.", "The text and your language and script hint."],
            ]}
          />
          <p>Supported languages are English, Russian (Cyrillic), and Uzbek in Latin and Cyrillic scripts. At this stage the voice and assistant providers are deterministic local mocks used for development, so no audio or text leaves the API for a third party.</p>
          <Callout title="Real providers will change this policy">
            Before a real speech or language provider is connected, this policy will be updated to name it and describe what it receives. The policy version recorded with your consent lets Moby ask you to accept the new version.
          </Callout>
        </>
      ),
    },
    {
      id: "assistant",
      title: "The assistant and desktop tools",
      body: (
        <>
          <p>The assistant is stateless. Each turn sends the conversation history and the list of tools the client offers, and the API streams a reply. The API validates every tool the model proposes against the list the client advertised, and the desktop app asks for your permission before it runs anything on your computer.</p>
          <p>The web app sends an empty tool list, so it cannot run local tools. Assistant text is used only to produce a reply and is not stored. A circuit breaker and token budget reserve the maximum cost before work starts, and settle the real amount afterwards.</p>
        </>
      ),
    },
    {
      id: "guest-demo",
      title: "The guest demo and Cloudflare Turnstile",
      body: (
        <>
          <p>When the operator enables the guest demo, visitors can send one short message (up to 280 characters) without an account. To block bots, the page loads a Cloudflare Turnstile widget when you click into the message box. Cloudflare receives the usual information a browser sends when it loads and runs the widget, and the API sends the widget’s token and secret to Cloudflare’s Siteverify service to confirm that it is valid for this website.</p>
          <p>Guest requests are limited to 12 every 15 minutes per network by default, using the keyed network-address counter described above. Forwarding headers are not trusted for this limit.</p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "Sharing and third parties",
      body: (
        <>
          <DataTable
            head={["Party", "When", "What they receive"]}
            rows={[
              ["Google", "Only if you choose Google sign-in or linking.", "Standard OpenID sign-in traffic. Moby receives your account identifier and email."],
              ["Cloudflare", "Only when the guest demo is enabled and you use it.", "Turnstile widget traffic and the verification token."],
              ["Email delivery", "When Moby sends verification and reset emails.", "Your email address and the message. Development uses a local mail catcher; the production email service has not been chosen yet."],
              ["Speech and language providers", "Not yet. Current providers are local mocks.", "Will be named in an updated policy before use."],
            ]}
          />
          <p>We do not sell personal information, and we do not share it for advertising. We may disclose information if the law requires it.</p>
        </>
      ),
    },
    {
      id: "retention",
      title: "How long we keep information",
      body: (
        <>
          <p>Account data is kept until you delete your account. Short-lived records expire on their own, and a cleanup worker removes expired rows.</p>
          <DataTable
            head={["Record", "Retention"]}
            rows={[
              ["Email verification link", "24 hours"],
              ["Password reset link", "30 minutes"],
              ["Access token", "15 minutes"],
              ["Session", "Up to 30 days from first sign-in, or until you sign out, reset your password, or revoke the device"],
              ["Google sign-in attempt", "10 minutes"],
              ["Google one-time handoff code", "90 seconds"],
              ["Rate-limit counters", "15 minutes, then removed by the cleanup worker"],
              ["Consent records", "Until account deletion"],
              ["Usage ledger rows", "Kept for service accounting, with the link to your account removed when you delete your account"],
            ]}
          />
          <p>These are the current development values. Production lifetimes and the production email transport will be confirmed before a public launch.</p>
        </>
      ),
    },
    {
      id: "security",
      title: "How we protect information",
      body: (
        <>
          <ul>
            <li>Access tokens are Ed25519-signed JWTs. Every protected request also re-checks the session, device, and account in the database, so signing out or resetting a password takes effect on the next request.</li>
            <li>Refresh tokens are random, single-use, and rotated on every refresh. Reuse of an old token revokes the session.</li>
            <li>Email links carry the token in the URL fragment, which browsers do not send to servers. Tokens are stored as SHA-256 hashes, and a verification link also requires the registration password.</li>
            <li>Password verification, token use, and account changes run inside database transactions with row locks.</li>
            <li>Failed or repeated attempts are rate limited by account and network.</li>
          </ul>
          <p>Read the full details on the <a href="/docs/security/">Security page</a>. No system is perfectly secure; if you find a weakness, please tell us as described there.</p>
        </>
      ),
    },
    {
      id: "rights",
      title: "Your choices and rights",
      body: (
        <>
          <DataTable
            head={["You can", "Where in Moby Web"]}
            rows={[
              ["Edit or clear your display name", "Account → Profile"],
              ["Download a copy of your account data (JSON)", "Account → Profile → Export account data"],
              ["See and revoke devices", "Account → Installations → Revoke"],
              ["Grant or withdraw terms, privacy, and cloud voice consent", "Account → Consent"],
              ["Link Google to your account", "Account → Link Google"],
              ["Permanently delete your account", "Account → Delete account (needs your password or Google)"],
              ["Check remaining quota", "Usage"],
            ]}
          />
          <p>The export contains your account, installation, session, and consent metadata from a single consistent database snapshot. Deleting your account removes the account and the records that depend on it, including email-based limits, in one transaction. Rate-limit counters that were keyed by network address expire on their normal schedule. Depending on where you live, you may have further legal rights, such as to object to or restrict processing; contact us to use them.</p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: <p>Moby is not designed for children, and we do not knowingly create accounts for them. If you believe a child has created an account, tell us and we will delete it.</p>,
    },
    {
      id: "hosting",
      title: "Where information is processed",
      body: <p>The hosting location of the production service has not been decided. This section will state the region before a public launch. Until then, anything you run yourself, such as a local Docker setup, keeps data on your own machine.</p>,
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: <p>Each version of this policy has an identifier. When you register, the API records the version you accepted. If we make a material change we will publish a new version, update the date above, and ask you to accept it again where the law or our consent system requires. Earlier consent can be withdrawn at any time from the Consent card in your account.</p>,
    },
    {
      id: "contact",
      title: "Contact",
      body: (
        <>
          <p>Questions, requests, and complaints are handled through the project’s GitHub repository: <a href={issues}>github.com/mobyuz/moby-web/issues</a>. Please do not post passwords, tokens, or other sensitive information in a public issue.</p>
          <p>A dedicated privacy contact address and the name of the legal entity operating the production service will be published here before a public launch.</p>
        </>
      ),
    },
  ],
};

export const terms: DocPage = {
  slug: "terms",
  path: "/legal/terms/",
  group: "Legal",
  title: "Terms of Service",
  nav: "Terms of Service",
  kicker: "Legal",
  summary: "The rules for using Moby Web, the Moby API, and the Moby desktop companion: your account, acceptable use, quotas, voice features, and our responsibilities.",
  updated,
  versioned: "terms",
  highlights: [
    ["15+", "character password minimum"],
    ["30 s", "longest voice clip"],
    ["500", "characters per speech request"],
    ["GPL-3.0", "open-source licence"],
  ],
  sections: [
    {
      id: "agreement",
      title: "Agreement and preview status",
      body: (
        <>
          <p>These terms are an agreement between you and the Moby contributors. By creating an account, signing in, or using the guest demo you accept them together with the <a href="/legal/privacy/">Privacy Policy</a>. If you do not agree, do not use the service.</p>
          <Callout tone="warn" title="Moby is pre-release software">
            The website, API, and desktop app are under active development. Features, quotas, and prices can change, data can be reset during development, and the service may be unavailable at times. Do not depend on it for anything critical.
          </Callout>
        </>
      ),
    },
    {
      id: "service",
      title: "What the service includes",
      body: (
        <>
          <ul>
            <li><strong>Moby Web</strong>: the public website, a guest demo when enabled, and a signed-in app with account settings, a text assistant, voice tools, and usage views.</li>
            <li><strong>The Moby API</strong>: accounts, email verification, device-bound sessions, the assistant, voice, quotas, and consent records.</li>
            <li><strong>The Moby desktop app for Windows 10 and 11 (64-bit)</strong>: connects the robot over USB and runs local tools only after it checks your permissions.</li>
            <li><strong>The Moby robot</strong>: a prototype desktop companion with an OLED display and physical mute and talk controls.</li>
          </ul>
          <p>The web assistant handles text turns and does not run desktop tools. Those need the Windows app.</p>
        </>
      ),
    },
    {
      id: "accounts",
      title: "Your account",
      body: (
        <>
          <ul>
            <li>You must be able to receive email at the address you register, and you must verify it with the link we send. You also confirm the registration password when you verify.</li>
            <li>Passwords must be 15 to 128 characters. Choose one you do not use anywhere else.</li>
            <li>You are responsible for activity under your account. Revoke any device you no longer trust from your Account page and tell us about suspected misuse.</li>
            <li>Each account is for one person. Do not share credentials or sell access.</li>
            <li>You can link a Google account and sign in with it. Linking needs your current password.</li>
          </ul>
        </>
      ),
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      body: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>break the law, or use Moby to harass, deceive, or harm anyone;</li>
            <li>probe, scan, or attack the service, or try to access accounts, tokens, or data that are not yours;</li>
            <li>bypass or overload rate limits, quotas, or bot verification, including by automating the guest demo;</li>
            <li>send malware, or content that is unlawful or that infringes the rights of others;</li>
            <li>upload audio of other people without having the right to do so;</li>
            <li>use the service to build a competing hosted service from our infrastructure, or to resell it.</li>
          </ul>
          <p>We may limit, suspend, or disable access that breaks these rules or puts the service or other users at risk.</p>
        </>
      ),
    },
    {
      id: "limits",
      title: "Quotas, limits, and availability",
      body: (
        <>
          <p>To keep the preview fair and affordable, usage is metered. The API reserves the maximum amount before work starts and settles the real amount afterwards. Quotas reset on a UTC schedule; the Usage screen shows what is left and when it resets.</p>
          <DataTable
            head={["Limit", "Default value"]}
            rows={[
              ["Assistant tokens per account per day", "250,000"],
              ["Transcription per account per day", "300 seconds"],
              ["Speech synthesis per account per day", "5,000 characters"],
              ["Guest demo tokens per day (all guests)", "60,000"],
              ["Guest demo requests", "12 per 15 minutes per network"],
              ["Guest demo message", "280 characters"],
              ["Assistant message", "8 KiB; a whole request is capped at 128 KiB"],
              ["Voice clip", "30 seconds of mono 16 kHz 16-bit WAV"],
              ["Speech request", "500 characters"],
            ]}
          />
          <p>The operator can change these values, and they may differ on a hosted deployment. We do not guarantee uptime, and the service may be paused, rate limited, or stopped when a budget is used up.</p>
        </>
      ),
    },
    {
      id: "ai",
      title: "AI output",
      body: (
        <>
          <p>Assistant replies are generated automatically and can be wrong, incomplete, or out of date. Do not rely on them for medical, legal, financial, or safety decisions. At this stage the assistant is a deterministic development provider, so replies are placeholders rather than the final product experience.</p>
          <p>When the desktop app runs a tool the assistant proposed, you remain responsible for the permissions you approve. Review what a tool will do before you allow it.</p>
        </>
      ),
    },
    {
      id: "voice",
      title: "Voice features and consent",
      body: <p>Speech-to-text and text-to-speech process your audio or text in the cloud and need your cloud voice consent. You can withdraw it from Account → Consent at any time. You promise that you have the right to submit any audio you upload. See the <a href="/legal/privacy/#voice">Privacy Policy</a> for what is sent and what is kept.</p>,
    },
    {
      id: "desktop-robot",
      title: "The desktop app and the robot",
      body: (
        <>
          <p>The Moby robot is a prototype design. Its dimensions (74.8 × 56.9 × 60.8 mm), features, and release plans may change, and nothing on this website is an offer to sell hardware. The hardware mute switch physically disconnects the microphone data line; it is a privacy control for you, and you should confirm it is in the position you want before speaking.</p>
          <p>The Windows app checks your permissions before it runs a local task such as reading a project’s Git status. You can change permissions at any time.</p>
        </>
      ),
    },
    {
      id: "content",
      title: "Your content",
      body: <p>You keep ownership of the messages, text, and audio you submit. You give Moby a limited licence to process them only as needed to run the feature you asked for, as described in the Privacy Policy. We do not use them to train models.</p>,
    },
    {
      id: "open-source",
      title: "Open-source software",
      body: <p>Moby’s source code is licensed under GPL-3.0-only, and the licence text in each repository governs your use, copying, and modification of the code. These terms govern the hosted service and do not limit the rights the licence gives you. The Moby name and logo identify the project; do not use them in a way that suggests an endorsement.</p>,
    },
    {
      id: "termination",
      title: "Ending your use",
      body: (
        <>
          <p>You can stop at any time. Delete your account from Account → Delete account, which removes your account and its dependent records. We can suspend or end access for breach of these terms, for security reasons, or if the service is discontinued. Sections about content, open-source, disclaimers, and liability continue after termination.</p>
        </>
      ),
    },
    {
      id: "disclaimer",
      title: "Disclaimers and liability",
      body: (
        <>
          <p>The service is provided “as is” and “as available”, without warranties of any kind, to the fullest extent the law allows. We do not warrant that it will be uninterrupted, error free, or secure, or that results will be accurate.</p>
          <p>To the fullest extent the law allows, the Moby contributors are not liable for indirect, incidental, special, or consequential damages, or for lost data, profits, or goodwill, arising from your use of a pre-release service. Nothing in these terms limits liability that cannot be limited by law, and your statutory consumer rights are unaffected.</p>
        </>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: <p>Terms are versioned. We will publish a new version with a new date, and we may ask you to accept it again, which is recorded in your consent history. If you keep using the service after a change takes effect, you accept the new version. You can withdraw consent and delete your account instead.</p>,
    },
    {
      id: "law",
      title: "Governing law and contact",
      body: (
        <>
          <p>The legal entity that will operate the public service and the governing law and courts that apply have not been designated yet. They will be stated here before a public launch. Until then, nothing in this section limits rights you have under the law where you live.</p>
          <p>For questions about these terms, open an issue at <a href={issues}>github.com/mobyuz/moby-web/issues</a>.</p>
        </>
      ),
    },
  ],
};
