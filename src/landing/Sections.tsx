import { MobyFace } from "@mobyuz/moby-ui";
import { Icon } from "../Icon";
import { Reveal } from "../motion";
import type { Expression } from "./story";

const org = "https://github.com/mobyuz";

function SectionHead({ eyebrow, title, id, children }: { eyebrow: string; title: string; id: string; children?: React.ReactNode }) {
  return (
    <Reveal className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-title">{title}</h2>
      {children && <p className="section-intro">{children}</p>}
    </Reveal>
  );
}

const flow: { name: string; face?: Expression; icon?: "usb" | "server"; text: string; via?: string }[] = [
  {
    name: "The robot",
    face: "listening",
    text: "A microphone, an OLED face, a mute switch and a talk button. Hold talk to speak. The face shows when Moby is listening, thinking or answering.",
    via: "USB",
  },
  {
    name: "The desktop app",
    icon: "usb",
    text: "The Windows app is linked to the robot over USB. It keeps your conversations on your computer and runs local tools, after you approve them.",
    via: "Moby API",
  },
  {
    name: "The cloud",
    icon: "server",
    text: "The Moby API handles accounts, sessions, daily limits, the assistant and voice. It is open source too.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="band" aria-labelledby="how-heading">
      <div className="shell">
        <SectionHead id="how-heading" eyebrow="How it works" title="Robot, desktop, cloud.">
          Three parts, each with one job. Your computer sits in the middle, so it stays in charge.
        </SectionHead>
        <ol className="flow">
          {flow.map((step, index) => (
            <Reveal as="li" key={step.name} delay={index * 90} className="flow-step">
              <div className="flow-visual" aria-hidden="true">
                {step.face ? <MobyFace expression={step.face} size={176} decorative /> : step.icon && <Icon name={step.icon} size={34} />}
              </div>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
              {step.via && <span className="flow-via" aria-label={`Connects through ${step.via}`}>{step.via} <span aria-hidden="true">→</span></span>}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const privacy = [
  ["Mute switch", "A physical switch disconnects the microphone data line. It does not depend on software, so when it is off the robot cannot capture sound."],
  ["Consent you can withdraw", "Cloud voice is its own choice, separate from the terms and the privacy policy. Grant it or withdraw it at any time."],
  ["History stays on your computer", "The Windows app saves conversations locally. Choose how long they are kept, or delete all of them in Settings."],
  ["Your account, your data", "Export what the API stores about you, or delete the account, from Moby Web."],
] as const;

export function Privacy() {
  return (
    <section id="privacy" className="band band-alt" aria-labelledby="privacy-heading">
      <div className="shell split">
        <Reveal className="split-lead">
          <p className="eyebrow">Privacy</p>
          <h2 id="privacy-heading" className="section-title">You decide what Moby hears and keeps.</h2>
          <figure className="mute-card" data-expression="muted">
            <MobyFace expression="muted" size="100%" decorative />
            <figcaption>The face shows it when the mute switch is on.</figcaption>
          </figure>
        </Reveal>
        <div className="rows">
          {privacy.map(([title, text], index) => (
            <Reveal key={title} delay={index * 70} className="row">
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
          <p className="row-links">
            <a href="/docs/data/">Data and consent</a>
            <a href="/legal/privacy/">Privacy Policy</a>
          </p>
        </div>
      </div>
    </section>
  );
}

const tools = [
  ["git_status", "Reads the Git status of a project.", "A project folder you added"],
  ["search_files", "Searches file names in a project.", "A project folder you added"],
  ["open_project", "Opens a project.", "Your confirmation, every time"],
  ["open_app", "Opens a program.", "Your confirmation, every time"],
  ["create_reminder", "Sets a reminder.", "No folder or program needed"],
] as const;

export function Tools() {
  return (
    <section id="tools" className="band" aria-labelledby="tools-heading">
      <div className="shell">
        <SectionHead id="tools-heading" eyebrow="Tools on your PC" title="Moby asks before it acts.">
          Moby can help on your computer through a short list of tools. You add the projects and programs it may use, and the Activity page lists what it did.
        </SectionHead>
        <Reveal className="ledger-wrap">
          <table className="ledger">
            <caption className="sr-only">Local tools in the Windows app and what each one needs</caption>
            <thead>
              <tr><th scope="col">Tool</th><th scope="col">What it does</th><th scope="col">What it needs</th></tr>
            </thead>
            <tbody>
              {tools.map(([name, does, needs]) => (
                <tr key={name}>
                  <th scope="row"><code>{name}</code></th>
                  <td>{does}</td>
                  <td data-confirm={needs.startsWith("Your") || undefined}>{needs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

const languages = [
  ["English", "en", "Hello"],
  ["Russian", "ru", "Привет"],
  ["Uzbek (Latin)", "uz-Latn", "Salom"],
  ["Uzbek (Cyrillic)", "uz-Cyrl", "Салом"],
] as const;

export function Languages() {
  return (
    <section id="languages" className="band band-alt" aria-labelledby="languages-heading">
      <div className="shell">
        <SectionHead id="languages-heading" eyebrow="Languages" title="English, Russian and Uzbek.">
          Voice and text work in four languages and scripts. Pick one in Moby Web or the desktop app.
        </SectionHead>
        <ul className="greetings">
          {languages.map(([name, lang, word], index) => (
            <Reveal as="li" key={lang} delay={index * 70} className="greeting">
              <span lang={lang} className="greeting-word">{word}</span>
              <span className="greeting-name">{name}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Download() {
  return (
    <section id="download" className="band" aria-labelledby="download-heading">
      <div className="shell split">
        <Reveal className="split-lead">
          <p className="eyebrow">Download</p>
          <h2 id="download-heading" className="section-title">Windows app, not released yet.</h2>
          <p className="section-intro">
            Moby is in early development and there is no installer to download today. You can try the assistant in your browser now,
            or build the Windows app from source.
          </p>
          <div className="cta-row">
            <a className="button button-primary" href="/app/">Open Moby Web <Icon name="arrow" size={18} /></a>
            <a className="button" href={`${org}/moby-desktop`}>Desktop app source <Icon name="external" size={16} /></a>
          </div>
        </Reveal>
        <Reveal className="rows" delay={90}>
          <div className="row">
            <h3>Build your own</h3>
            <p>The hardware is open too: Blender models, wiring and a parts list for the ESP32-S3 prototype.</p>
            <p className="row-links">
              <a href={`${org}/3d-model`}>3D models and wiring <Icon name="external" size={14} /></a>
              <a href={`${org}/moby-firmware`}>Firmware <Icon name="external" size={14} /></a>
            </p>
          </div>
          <div className="row">
            <h3>Read the code</h3>
            <p>Website, API, desktop app, firmware and protocol are developed in the open.</p>
            <p className="row-links">
              <a href={`${org}/moby-web`}>Website <Icon name="external" size={14} /></a>
              <a href={`${org}/moby-api`}>API <Icon name="external" size={14} /></a>
              <a href="/docs/">Documentation</a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const facts = [
  ["Size", "74.8 × 56.9 × 60.8 mm"],
  ["Brain", "ESP32-S3"],
  ["Voice", "English, Russian, Uzbek"],
  ["Open", "GPL-3.0 software, CERN-OHL-P hardware"],
] as const;

export function SpecStrip() {
  return (
    <section className="specs" aria-label="Moby Mini at a glance">
      <dl className="shell specs-grid">
        {facts.map(([term, value]) => (
          <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </section>
  );
}
