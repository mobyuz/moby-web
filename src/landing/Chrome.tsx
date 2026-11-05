import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { Reveal, useScrolled } from "../motion";

const project = "https://github.com/mobyuz/moby-web";

const links = [
  ["How it works", "#how-it-works"],
  ["Privacy", "#privacy"],
  ["Demo", "#demo"],
  ["Download", "#download"],
  ["Docs", "/docs/"],
] as const;

const sectionIds = links.filter(([, href]) => href.startsWith("#")).map(([, href]) => href.slice(1));

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Moby home">
      <svg width="28" height="27" viewBox="159 159 936 906" aria-hidden="true">
        <g fill="currentColor">
          <circle cx="627" cy="259" r="82" />
          <path d="M597 321h60v105h-60z" />
          <path d="M627 408c110 0 180 3 245 56 69 56 110 141 110 229v52c0 104-41 185-112 238v7c0 33-27 59-60 59h-74c-26 0-47-21-47-47v-1H565v1c0 26-21 47-47 47h-74c-33 0-60-26-60-59v-7c-71-53-114-134-114-238v-52c0-88 42-173 111-229 65-53 136-56 246-56z" />
          <path d="M262 592c-49 7-88 65-88 133s39 122 88 130c-22-66-22-195 0-263zM991 592c49 7 88 65 88 133s-39 122-88 130c22-66 22-195 0-263z" />
        </g>
        <rect x="332" y="511" width="589" height="389" rx="187" fill="var(--canvas)" />
        <g fill="currentColor">
          <rect x="460" y="618" width="97" height="172" rx="48.5" />
          <rect x="696" y="618" width="97" height="172" rx="48.5" />
        </g>
      </svg>
      <span>Moby</span>
    </a>
  );
}

/** The section that is crossing the middle of the screen, for the nav underline. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive((current) => (current === entry.target.id ? null : current));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    sectionIds.forEach((id) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  return active;
}

export function LandingHeader() {
  const scrolled = useScrolled(24);
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to its button. Tab stays inside the open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !header.current) return;
      const items = [...header.current.querySelectorAll<HTMLElement>("a[href], button")].filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const onResize = () => { if (window.innerWidth > 992) setOpen(false); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, [open]);

  return (
    <header ref={header} id="top" className="site-header" data-scrolled={scrolled || open || undefined}>
      <div className="shell header-row">
        <Brand />
        <nav className="header-nav" id="header-nav" aria-label="Main navigation" data-open={open || undefined}>
          {links.map(([label, href]) => (
            <a key={label} href={href} data-active={active === href.slice(1) || undefined}
              aria-current={active === href.slice(1) ? "location" : undefined} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="button button-primary button-small" href="/app/">Sign in</a>
          <button ref={toggle} type="button" className="menu-button" aria-expanded={open} aria-controls="header-nav" onClick={() => setOpen(!open)}>
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <Reveal className="footer-intro">
          <Brand />
          <p>A small desk robot with a face, and the Windows app that connects it to your PC. Open source.</p>
        </Reveal>
        <nav aria-label="Footer navigation" className="footer-links">
          <Reveal delay={60}>
            <h2>Product</h2>
            <a href="#how-it-works">How it works</a>
            <a href="#demo">Guest demo</a>
            <a href="#download">Download</a>
          </Reveal>
          <Reveal delay={120}>
            <h2>Resources</h2>
            <a href="/docs/">Documentation</a>
            <a href={project}>Source on GitHub <Icon name="external" size={14} /></a>
          </Reveal>
          <Reveal delay={180}>
            <h2>Legal</h2>
            <a href="/legal/privacy/">Privacy Policy</a>
            <a href="/legal/terms/">Terms of Service</a>
            <a href={`${project}/blob/main/LICENSE`}>Software license</a>
          </Reveal>
        </nav>
      </div>
      <div className="shell footer-end">
        <span>© 2026 Moby contributors</span>
        <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
