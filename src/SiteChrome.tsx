import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useScrolled } from "./motion";

const project = "https://github.com/mobyuz/moby-web";

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Moby home">
      <img src="/moby.svg" width="31" height="31" alt="" />
      <span>Moby</span>
    </a>
  );
}

export function SiteHeader({ workspace = false, docs = false, children }: { workspace?: boolean; docs?: boolean; children?: ReactNode }) {
  const scrolled = useScrolled();
  return (
    <header id="top" className="site-header" data-scrolled={scrolled || undefined}>
      <div className="shell site-header-row">
        <Brand />
        {docs ? (
          <nav className="site-nav" aria-label="Main navigation">
            <a href="/docs/">Docs</a>
            <a href="/docs/api/">API</a>
            <a href="/legal/privacy/">Privacy</a>
            <a href="/legal/terms/">Terms</a>
          </nav>
        ) : !workspace && (
          <nav className="site-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#demo">Demo</a>
            <a href="/docs/">Docs</a>
            <a href="/legal/privacy/">Privacy</a>
            <a href="/legal/terms/">Terms</a>
          </nav>
        )}
        <div className="site-header-actions">
          {workspace ? (
            <>
              <a href="/" className="site-back"><Icon name="back" size={16} /> <span>Back to website</span></a>
              {children}
            </>
          ) : (
            <a href="/app/" className="action action-small">Open web app <Icon name="arrow" size={16} /></a>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const footer = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footer.current || typeof IntersectionObserver === "undefined") return;

    const threshold = 0.2;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < threshold) continue;

        entry.target.setAttribute("data-footer-revealed", "");
        observer.unobserve(entry.target);
      }
    }, { threshold });

    footer.current.querySelectorAll("[data-footer-reveal]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="site-footer" ref={footer}>
      <div className="shell">
        <div className="site-footer-main">
          <div className="site-footer-intro" data-footer-reveal>
            <Brand />
            <p>An open-source desktop companion for your Windows PC.</p>
            <span className="footer-project-note"><span aria-hidden="true" /> Built in the open.</span>
          </div>
          <nav className="site-footer-links" aria-label="Footer navigation">
            <div data-footer-reveal>
              <h2>Product</h2>
              <a href="/#how-it-works">How it works</a>
              <a href="/#demo">Guest demo</a>
              <a href="/docs/">Documentation</a>
            </div>
            <div data-footer-reveal>
              <h2>Account</h2>
              <a href="/app/">Open web app</a>
              <a href="/app/?view=register">Create an account</a>
              <a href="/app/?view=forgot">Reset password</a>
            </div>
            <div data-footer-reveal>
              <h2>Project</h2>
              <a href={project}>Source on GitHub <Icon name="external" size={15} /></a>
              <a href="/docs/api/">API reference</a>
              <a href="/app/#api-status">API status</a>
              <a href="/legal/privacy/">Privacy Policy</a>
              <a href="/legal/terms/">Terms of Service</a>
              <a href={`${project}/blob/main/LICENSE`}>Software license</a>
            </div>
          </nav>
        </div>
        <div className="site-footer-end" data-footer-reveal>
          <span>© 2026 Moby contributors</span>
          <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );
}
