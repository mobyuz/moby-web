import { GuestDemo } from "./GuestDemo";
import { Icon } from "./Icon";
import { Reveal, resetTilt, tiltPointer, trackPointer } from "./motion";
import { SiteFooter, SiteHeader } from "./SiteChrome";

const steps = [
  {
    icon: "mic",
    title: "Talk to Moby",
    description: "The robot captures your voice. Its small OLED display shows when it’s listening or responding.",
  },
  {
    icon: "usb",
    title: "Connect over USB",
    description: "The Windows app receives your requests and sends them to the Moby API for processing.",
  },
  {
    icon: "shield",
    title: "Approve what it can do",
    description: "For local tasks such as checking a project’s Git status, the desktop app checks your permissions first.",
  },
] as const;

const stats = [
  ["4", "voice & text languages"],
  ["74.8 mm", "wide, made for a desk"],
  ["USB", "wired to your PC"],
  ["100%", "open source"],
] as const;


export function App() {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="shell product-hero" aria-labelledby="hero-heading">
          <div className="hero-aurora" aria-hidden="true"><i /><i /><i /></div>
          <div className="product-intro">
            <p className="eyebrow product-badge"><span aria-hidden="true" /> Open-source robot in development</p>
            <h1 id="hero-heading">Your desktop <span>companion robot.</span></h1>
            <p className="product-lead">
              Moby is a compact robot designed to listen, respond, and help with tasks you approve on your Windows PC.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a className="action" href="/app/">Open Moby Web <Icon name="arrow" size={18} /></a>
              <a className="action-secondary" href="#demo">See the demo</a>
            </div>
            <ul className="product-notes" aria-label="Moby at a glance">
              <li><Icon name="mic" size={17} /> Voice &amp; text</li>
              <li><Icon name="usb" size={17} /> USB connected</li>
              <li><Icon name="shield" size={17} /> You’re in control</li>
            </ul>
          </div>
          <figure className="product-visual" onPointerMove={tiltPointer} onPointerLeave={resetTilt}>
            <span className="hero-chip hero-chip-voice" aria-hidden="true">
              <Icon name="mic" size={15} /> Listening <i /><i /><i /><i />
            </span>
            <span className="hero-chip hero-chip-safe" aria-hidden="true"><Icon name="shield" size={15} /> You approve every task</span>
            <div className="product-visual-top"><span>Meet your desk companion</span><span aria-hidden="true">01 / MINI</span></div>
            <div className="product-image-frame">
              <img src="/moby-mini.jpg" alt="Moby Mini prototype design with a teal face, an OLED display, and physical mute and talk controls"
                width="1400" height="1100" fetchPriority="high" />
            </div>
            <figcaption>
              <span><strong>Moby Mini</strong><small>Prototype design render</small></span>
              <span className="product-dimensions"><span>DESIGNED TO FIT YOUR DESK</span>74.8 × 56.9 × 60.8 mm</span>
            </figcaption>
          </figure>
        </section>

        <Reveal as="section" className="shell stat-strip">
          {stats.map(([value, label]) => (
            <div key={label}><strong>{value}</strong><span>{label}</span></div>
          ))}
        </Reveal>

        <section id="how-it-works" className="section-band" aria-labelledby="how-it-works-heading">
          <div className="shell section-space">
            <Reveal className="section-heading-row">
              <div>
                <p className="eyebrow mb-3">How it works</p>
                <h2 id="how-it-works-heading" className="section-title">From your desk<br />to your PC.</h2>
              </div>
              <p className="section-intro">A small companion, a connected Windows app, and your permission at every important step.</p>
            </Reveal>
            <ol className="feature-grid">
              {steps.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 110} className="feature-card">
                  <div className="feature-card-inner" onPointerMove={trackPointer}>
                    <div className="flex items-center justify-between">
                      <span className="feature-icon"><Icon name={step.icon} /></span>
                      <span className="feature-number" aria-hidden="true">0{index + 1}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <GuestDemo />

        <Reveal as="section" className="shell product-invitation" aria-labelledby="invitation-heading">
          <div>
            <p className="eyebrow">Start with the web app</p>
            <h2 id="invitation-heading">Make a little room for Moby.</h2>
            <p>Explore the assistant and voice tools from your browser.</p>
          </div>
          <a className="action" href="/app/">Open your workspace <Icon name="arrow" size={18} /></a>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
