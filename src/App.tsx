import { MobyFace } from "./MobyFace";

const steps = [
  {
    title: "Moby listens",
    description: "A microphone captures your voice, and a small OLED display shows what Moby is doing.",
  },
  {
    title: "The Windows app handles your request",
    description: "Moby connects to your PC over USB. The app sends voice requests to the Moby server for processing.",
  },
  {
    title: "You control what Moby can do",
    description: "For example, Moby is being designed to check Git status for a project you select. The app checks permissions on your PC.",
  },
];

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header id="top" className="border-b border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4 sm:py-5">
          <a href="#top" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <img src="/moby.svg" alt="" width="32" height="32" />
            Moby
          </a>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-subtle sm:gap-x-7">
            <a className="hover:text-accent" href="#how-it-works">How it works</a>
            <a className="hover:text-accent" href="#privacy">Privacy</a>
            <a className="hover:text-accent" href="#faq">FAQ</a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="shell grid items-center gap-10 py-12 sm:py-18 lg:grid-cols-2 lg:gap-12 lg:py-22" aria-labelledby="hero-heading">
          <div>
            <p className="eyebrow mb-5">Moby robot · in development</p>
            <h1 id="hero-heading" className="max-w-[12ch] text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] font-bold tracking-[-0.065em]">
              Your desktop companion robot.
            </h1>
            <p className="mt-6 max-w-[43ch] text-lg leading-relaxed text-subtle">
              Moby is being built to listen to your voice and help with tasks you approve on your Windows PC.
            </p>
            <a className="action mt-8 inline-flex items-center gap-3" href="#how-it-works">
              Meet Moby <span aria-hidden="true">↓</span>
            </a>
          </div>

          <figure className="hero-display">
            <MobyFace />
            <figcaption className="display-caption">
              <span>MOBY / CORE V1</span>
              <span>Concept</span>
            </figcaption>
          </figure>
        </section>

        <section id="how-it-works" className="border-y border-line bg-panel/45" aria-labelledby="how-it-works-heading">
          <div className="shell py-14 sm:py-20">
            <p className="eyebrow mb-3">Robot → PC → server</p>
            <h2 id="how-it-works-heading" className="section-title">How does Moby work?</h2>
            <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="bg-panel p-6 sm:p-7">
                  <span className="font-mono text-sm text-accent" aria-hidden="true">0{index + 1}</span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-subtle">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privacy" className="shell grid gap-6 py-14 sm:py-20 md:grid-cols-2 md:gap-12" aria-labelledby="privacy-heading">
          <div>
            <p className="eyebrow mb-3">Privacy</p>
            <h2 id="privacy-heading" className="section-title">Control your microphone and data</h2>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-panel px-6 leading-relaxed text-subtle">
            <li className="py-4">A physical switch disconnects the microphone’s data line.</li>
            <li className="py-4">Voice processing in the cloud requires your consent.</li>
            <li className="py-4">Moby is designed to keep conversation history on your PC.</li>
          </ul>
        </section>

        <section id="faq" className="border-t border-line" aria-labelledby="faq-heading">
          <div className="shell grid gap-6 py-14 sm:py-20 md:grid-cols-2 md:gap-12">
            <div>
              <p className="eyebrow mb-3">FAQ</p>
              <h2 id="faq-heading" className="section-title">Before you get started</h2>
            </div>
            <div className="divide-y divide-line border-y border-line">
              <details className="py-4">
                <summary className="cursor-pointer font-semibold">Which computers will Moby support?</summary>
                <p className="mt-3 leading-relaxed text-subtle">The first desktop release is planned for 64-bit Windows 10 and 11.</p>
              </details>
              <details className="py-4">
                <summary className="cursor-pointer font-semibold">Can I try Moby today?</summary>
                <p className="mt-3 leading-relaxed text-subtle">Moby is in development. A guest text demo and a Windows installer are planned for later milestones.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-subtle">
          <span>Moby · Product prototype</span>
          <a className="hover:text-accent" href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </footer>
    </>
  );
}
