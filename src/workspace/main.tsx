import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserSession, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { SiteFooter, SiteHeader } from "../SiteChrome";
import { AccountPanel } from "./AccountPanel";
import { AgentPanel } from "./AgentPanel";
import { AuthPanel } from "./AuthPanel";
import { TaskFeedback, useTask } from "./controls";
import { locales, type LocaleKey } from "./locale";
import { ApiStatus, UsagePanel } from "./StatusPanels";
import { VoicePanel } from "./VoicePanel";
import "../styles.css";
import "./workspace.css";
import "../polish.css";
import "../theme.css";

const sections = ["Account", "Assistant", "Voice", "Usage"] as const;
const details = {
  Account: { heading: "Account settings", icon: "account", description: "Manage your profile, installations, and permissions." },
  Assistant: { heading: "Moby assistant", icon: "message", description: "Send a message and follow Moby’s reply as it arrives." },
  Voice: { heading: "Voice tools", icon: "mic", description: "Transcribe a WAV clip or generate audio from text." },
  Usage: { heading: "Usage and limits", icon: "chart", description: "Check what is left in your current usage window." },
} as const;

function Workspace() {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [section, setSection] = useState<typeof sections[number]>("Account");
  const [localeKey, setLocaleKey] = useState<LocaleKey>("en");
  const [showStatus, setShowStatus] = useState(() => window.location.hash === "#api-status");
  const signOut = useTask();
  const { language, script } = locales[localeKey];
  const locale = { language, script };

  useEffect(() => {
    const update = () => setShowStatus(window.location.hash === "#api-status");
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (showStatus) document.getElementById("api-status")?.scrollIntoView();
  }, [showStatus]);

  function signIn(tokens: Model<"TokenPair">) {
    const nextSession = new BrowserSession(tokens, () => {
      setSession((current) => current === nextSession ? null : current);
    });
    signOut.clear();
    setSection("Account");
    setSession(nextSession);
  }

  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader workspace>
        {session && <button type="button" className="workspace-button" disabled={signOut.busy}
          onClick={() => void signOut.run(() => session.signOut())}>{signOut.busy ? "Signing out…" : "Sign out"}</button>}
      </SiteHeader>
      <main id="main" tabIndex={-1} className={session ? "shell workspace-container" : "shell auth-container"}>
        <TaskFeedback feedback={signOut.feedback} />
        {session ? (
          <div className="workspace-layout">
            <aside className="workspace-sidebar">
              <p className="eyebrow">Workspace</p>
              <span className="workspace-live"><i /> Signed in</span>
              <nav className="workspace-nav" aria-label="Web app">
                {sections.map((name) => (
                  <button type="button" aria-pressed={name === section} key={name} onClick={() => setSection(name)}>
                    <Icon name={details[name].icon} size={18} /> <span>{name}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <div className="workspace-body">
              <div className="workspace-page-heading" key={section}>
                <div>
                  <h1>{details[section].heading}</h1>
                  <p>{details[section].description}</p>
                </div>
                {(section === "Assistant" || section === "Voice") && (
                  <label className="field workspace-language">Language
                    <select value={localeKey} onChange={(event) => setLocaleKey(event.target.value as LocaleKey)}>
                      {Object.entries(locales).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <div className="panel-enter" hidden={section !== "Account"}><AccountPanel session={session} /></div>
              <div className="panel-enter" hidden={section !== "Assistant"}><AgentPanel session={session} locale={locale} /></div>
              <div className="panel-enter" hidden={section !== "Voice"}><VoicePanel session={session} locale={locale} /></div>
              {section === "Usage" && <div className="panel-enter"><UsagePanel session={session} /></div>}
            </div>
          </div>
        ) : <AuthPanel onSignIn={signIn} />}
        {showStatus && <div id="api-status" className="mt-6"><ApiStatus /></div>}
      </main>
      <SiteFooter />
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("The Moby web app root element is missing");
createRoot(root).render(<StrictMode><Workspace /></StrictMode>);
