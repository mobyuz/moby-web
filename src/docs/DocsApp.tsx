import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { Reveal } from "../motion";
import { SiteFooter, SiteHeader } from "../SiteChrome";
import { guides } from "./guides";
import { privacy, terms } from "./legal";
import type { DocPage } from "./ui";

const pages: DocPage[] = [privacy, terms, ...guides];
const groups = ["Documentation", "Legal"] as const;

function currentPage(): DocPage {
  const slug = document.getElementById("root")?.dataset.page;
  return pages.find((page) => page.slug === slug) ?? guides[0] as DocPage;
}

function policyVersion(page: DocPage) {
  if (page.versioned === "terms") return import.meta.env.VITE_MOBY_TERMS_VERSION || "dev-1";
  if (page.versioned === "privacy_policy") return import.meta.env.VITE_MOBY_PRIVACY_POLICY_VERSION || "dev-1";
  return null;
}

function useReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? Math.min(1, window.scrollY / height) : 0;
      bar.current?.style.setProperty("--progress", ratio.toFixed(4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return bar;
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      const first = ids.find((id) => visible.has(id));
      if (first) setActive(first);
    }, { rootMargin: "-18% 0px -64% 0px" });
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function DocsPage({ page }: { page: DocPage }) {
  const progress = useReadingProgress();
  const ids = page.sections.map((section) => section.id);
  const active = useActiveSection(ids);
  const version = policyVersion(page);
  const siblings = pages.filter((entry) => entry.group === page.group);
  const index = siblings.findIndex((entry) => entry.slug === page.slug);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];

  useEffect(() => {
    document.title = `${page.title} · Moby`;
  }, [page.title]);

  // Sections render after load, so the browser cannot jump to a #hash by itself.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <div className="site-layout">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="read-progress" ref={progress} aria-hidden="true" />
      <SiteHeader docs />
      <main id="main" tabIndex={-1} className="doc-shell">
        <div className="doc-hero-wrap">
          <div className="hero-aurora" aria-hidden="true"><i /><i /><i /></div>
          <header className="shell doc-hero">
            <nav className="doc-crumbs" aria-label="Breadcrumb">
              <a href="/">Moby</a><span aria-hidden="true">/</span>
              <a href="/docs/">{page.group === "Legal" ? "Legal" : "Docs"}</a><span aria-hidden="true">/</span>
              <span aria-current="page">{page.nav}</span>
            </nav>
            <p className="eyebrow">{page.kicker}</p>
            <h1>{page.title}</h1>
            <p className="doc-summary">{page.summary}</p>
            <ul className="doc-meta">
              <li><Icon name="clock" size={15} /> Updated {page.updated}</li>
              {version && <li><Icon name="shield" size={15} /> Version {version}</li>}
              <li><Icon name="globe" size={15} /> English</li>
              {page.group === "Legal" && <li><button type="button" onClick={() => window.print()}><Icon name="download" size={15} /> Print or save as PDF</button></li>}
            </ul>
            {page.highlights && (
              <dl className="doc-highlights">
                {page.highlights.map(([value, label], position) => (
                  <div key={label} style={{ animationDelay: `${300 + position * 90}ms` }}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            )}
          </header>
        </div>

        <div className="shell doc-layout">
          <aside className="doc-nav" aria-label="Documentation pages">
            {groups.map((group) => (
              <div key={group}>
                <p className="eyebrow">{group}</p>
                <ul>
                  {pages.filter((entry) => entry.group === group).map((entry) => (
                    <li key={entry.slug}>
                      <a href={entry.path} aria-current={entry.slug === page.slug ? "page" : undefined}>{entry.nav}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>

          <article className="doc-article">
            {page.sections.map((section, position) => (
              <Reveal as="section" id={section.id} className="doc-section" key={section.id}>
                <h2>
                  <span className="doc-section-number" aria-hidden="true">{String(position + 1).padStart(2, "0")}</span>
                  {section.title}
                  <a className="doc-anchor" href={`#${section.id}`} aria-label={`Link to ${section.title}`}>#</a>
                </h2>
                <div className="prose">{section.body}</div>
              </Reveal>
            ))}

            <nav className="doc-pager" aria-label="More pages">
              {previous ? <a href={previous.path}><small>Previous</small><span><Icon name="back" size={16} /> {previous.nav}</span></a> : <span />}
              {next ? <a href={next.path} data-next><small>Next</small><span>{next.nav} <Icon name="arrow" size={16} /></span></a> : <span />}
            </nav>
          </article>

          <aside className="doc-toc" aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ul>
              {page.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>{section.title}</a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function DocsApp() {
  return <DocsPage page={currentPage()} />;
}
