import { useEffect, useRef, useState, type ReactNode } from "react";
import { MobyFace } from "@mobyuz/moby-ui";
import { Icon } from "./Icon";
import { useReducedMotion } from "./landing/hooks";
import { DOWNLOAD_DIR } from "./landing/release";
import { useRelease } from "./landing/useRelease";
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

type Scheme = "system" | "light" | "dark";

function readScheme(): Scheme {
  try {
    const value = localStorage.getItem("moby-scheme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyScheme(scheme: Scheme) {
  if (scheme === "system") delete document.documentElement.dataset.scheme;
  else document.documentElement.dataset.scheme = scheme;
}

// Apply a saved choice as soon as the script loads.
if (typeof document !== "undefined") applyScheme(readScheme());

const schemeIcons: Record<Scheme, string> = {
  light: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  dark: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  system: "M3 5h18v11H3V5Zm6 14h6m-3-3v3",
};

/** Light, dark or system. It controls the site theme on every page that follows the system setting. */
function ThemeToggle() {
  const [scheme, setScheme] = useState<Scheme>(readScheme);
  if (document.documentElement.dataset.theme === "mono") return null;
  const choose = (next: Scheme) => {
    setScheme(next);
    applyScheme(next);
    try {
      if (next === "system") localStorage.removeItem("moby-scheme");
      else localStorage.setItem("moby-scheme", next);
    } catch {
      /* The choice still applies for this visit. */
    }
  };
  return (
    <div className="mc-theme" role="group" aria-label="Theme">
      {(["light", "dark", "system"] as const).map((name) => (
        <button key={name} type="button" aria-pressed={scheme === name} onClick={() => choose(name)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={schemeIcons[name]} />
          </svg>
          <span className="mc-sr">{name === "system" ? "Use the system theme" : `${name === "light" ? "Light" : "Dark"} theme`}</span>
        </button>
      ))}
    </div>
  );
}

/** Moby's face in the footer. It blinks by itself, looks toward the pointer, and glances at a link you hover or focus. */
function FooterFace({ reduced }: { reduced: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const face = box.current?.querySelector<SVGElement>(".moby-face");
    const footer = box.current?.closest("footer");
    if (!face || !footer || reduced) return;
    let frame = 0;
    const look = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = face.getBoundingClientRect();
        const dx = x - (rect.left + rect.width / 2);
        const dy = y - (rect.top + rect.height / 2);
        const length = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, length / 240);
        face.style.setProperty("--look-x", `${((dx / length) * 10 * reach).toFixed(1)}px`);
        face.style.setProperty("--look-y", `${((dy / length) * 6 * reach).toFixed(1)}px`);
      });
    };
    const onMove = (event: PointerEvent) => look(event.clientX, event.clientY);
    const onLink = (event: Event) => {
      const link = (event.target as Element).closest("a, button");
      if (!link) return;
      const rect = link.getBoundingClientRect();
      look(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    footer.addEventListener("focusin", onLink);
    footer.addEventListener("pointerover", onLink);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      footer.removeEventListener("focusin", onLink);
      footer.removeEventListener("pointerover", onLink);
    };
  }, [reduced]);
  return (
    <div className="mc-face" ref={box} aria-hidden="true">
      <MobyFace expression="idle" size={104} decorative />
    </div>
  );
}

/** The one footer for every page of the site. */
export function SiteFooter({ home = false }: { home?: boolean }) {
  const prefix = home ? "" : "/";
  const release = useRelease();
  const reduced = useReducedMotion();
  return (
    <footer className="mc-footer" data-expression="idle">
      <div className="shell mc-closing">
        <Reveal className="mc-closing-inner">
          <h2>Try Moby in your browser.</h2>
          <p>The guest demo needs no account.</p>
          <div className="mc-closing-actions">
            <a className="mc-button mc-button--primary" href={`${prefix}#demo`}>Try the guest demo <Icon name="arrow" size={16} /></a>
            {release.status === "ready" ? (
              <a className="mc-button" href={`${DOWNLOAD_DIR}${release.release.file}`} download>Download for Windows</a>
            ) : (
              <span className="mc-button mc-button--ghost" aria-disabled="true">Windows app: coming soon</span>
            )}
          </div>
        </Reveal>
      </div>
      <div className="shell mc-footer-grid">
        <Reveal className="mc-footer-intro">
          <Brand />
          <p>A small desk robot with a face, and the Windows app that connects it to your PC. Open source.</p>
          <FooterFace reduced={reduced} />
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
        <div className="mc-footer-tools">
          <a className="mc-icon-link" href={project} aria-label="Moby on GitHub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.38-3.88-1.38-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
          </a>
          <ThemeToggle />
          <a className="mc-top" href="#top">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </div>
      <div className="mc-wordmark" aria-hidden="true"><span>moby</span></div>
    </footer>
  );
}
