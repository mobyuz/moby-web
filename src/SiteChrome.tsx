import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Reveal, useScrolled } from "./motion";
import "./chrome.css";

const project = "https://github.com/mobyuz/moby-web";

const links = [
  ["How it works", "how-it-works"],
  ["Privacy", "privacy"],
  ["Demo", "demo"],
  ["Download", "download"],
] as const;

export function Brand() {
  return (
    <a className="mc-brand" href="/" aria-label="Moby home">
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

/** The landing section that is crossing the middle of the screen, for the nav underline. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive((current) => (current === entry.target.id ? null : current));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(([, id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

type HeaderProps = {
  /** The landing page: section links stay on the page and the header floats over the hero. */
  home?: boolean;
  /** Marks the Docs link as the current page. */
  docs?: boolean;
  /** Replaces the Sign in button, for example with Sign out once signed in. */
  children?: ReactNode;
};

/** The one header for every page of the site. */
export function SiteHeader({ home = false, docs = false, children }: HeaderProps) {
  const scrolled = useScrolled(24);
  const active = useActiveSection(home);
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
    <header ref={header} id="top" className={home ? "mc-header mc-header--overlay" : "mc-header"} data-scrolled={scrolled || open || undefined}>
      <div className="shell mc-row">
        <Brand />
        <nav className="mc-nav" id="header-nav" aria-label="Main navigation" data-open={open || undefined}>
          {links.map(([label, id]) => (
            <a key={id} href={home ? `#${id}` : `/#${id}`} data-active={active === id || undefined}
              aria-current={active === id ? "location" : undefined} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="/docs/" data-active={docs || undefined} aria-current={docs ? "page" : undefined}>Docs</a>
        </nav>
        <div className="mc-actions">
          {children ?? <a className="mc-button mc-button--primary mc-button--small" href="/app/">Sign in</a>}
          <button ref={toggle} type="button" className="mc-menu" aria-expanded={open} aria-controls="header-nav" onClick={() => setOpen(!open)}>
            <span className="mc-sr">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/** The one footer for every page of the site. */
export function SiteFooter({ home = false }: { home?: boolean }) {
  const prefix = home ? "" : "/";
  return (
    <footer className="mc-footer">
      <div className="shell mc-footer-grid">
        <Reveal className="mc-footer-intro">
          <Brand />
          <p>A small desk robot with a face, and the Windows app that connects it to your PC. Open source.</p>
        </Reveal>
        <nav aria-label="Footer navigation" className="mc-footer-links">
          <Reveal delay={60}>
            <h2>Product</h2>
            <a href={`${prefix}#how-it-works`}>How it works</a>
            <a href={`${prefix}#demo`}>Guest demo</a>
            <a href={`${prefix}#download`}>Download</a>
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
      <div className="shell mc-footer-end">
        <span>© 2026 Moby contributors</span>
        <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
