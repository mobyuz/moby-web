import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { useScrolled } from "../motion";

const project = "https://github.com/mobyuz/moby-web";

const links = [
  ["How it works", "#how-it-works"],
  ["Privacy", "#privacy"],
  ["Tools", "#tools"],
  ["Languages", "#languages"],
  ["Demo", "#demo"],
  ["Docs", "/docs/"],
] as const;

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Moby home">
      <img src="/moby.svg" width="28" height="28" alt="" />
      <span>Moby</span>
    </a>
  );
}

export function LandingHeader() {
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header id="top" className="site-header" data-scrolled={scrolled || undefined}>
      <div className="shell header-row">
        <Brand />
        <nav className="header-nav" id="header-nav" aria-label="Main navigation" data-open={open || undefined}>
          {links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="button button-primary button-small" href="/app/">Open web app <Icon name="arrow" size={16} /></a>
          <button type="button" className="menu-button" aria-expanded={open} aria-controls="header-nav" onClick={() => setOpen(!open)}>
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
        <div className="footer-intro">
          <Brand />
          <p>A small open-source desk robot and its Windows app.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          <div>
            <h2>Product</h2>
            <a href="#how-it-works">How it works</a>
            <a href="#demo">Guest demo</a>
            <a href="/docs/">Documentation</a>
          </div>
          <div>
            <h2>Account</h2>
            <a href="/app/">Open web app</a>
            <a href="/app/?view=register">Create an account</a>
            <a href="/app/?view=forgot">Reset password</a>
          </div>
          <div>
            <h2>Project</h2>
            <a href={project}>Source on GitHub <Icon name="external" size={14} /></a>
            <a href="/docs/api/">API reference</a>
            <a href="/app/#api-status">API status</a>
            <a href={`${project}/blob/main/LICENSE`}>Software license</a>
          </div>
          <div>
            <h2>Legal</h2>
            <a href="/legal/privacy/">Privacy Policy</a>
            <a href="/legal/terms/">Terms of Service</a>
            <a href="/docs/security/">Security</a>
          </div>
        </nav>
      </div>
      <div className="shell footer-end">
        <span>© 2026 Moby contributors. Website GPL-3.0-only.</span>
        <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
