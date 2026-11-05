import { useState, type ReactNode } from "react";
import { Icon } from "../Icon";

export type DocSection = { id: string; title: string; body: ReactNode };

export type DocPage = {
  slug: string;
  path: string;
  group: "Legal" | "Documentation";
  title: string;
  nav: string;
  kicker: string;
  summary: string;
  updated: string;
  versioned?: "terms" | "privacy_policy";
  highlights?: [string, string][];
  sections: DocSection[];
};

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn"; title: string; children: ReactNode }) {
  return (
    <aside className="callout" data-tone={tone}>
      <span className="callout-icon"><Icon name={tone === "warn" ? "shield" : "spark"} size={18} /></span>
      <div>
        <strong>{title}</strong>
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="doc-table-wrap" tabIndex={0} role="region" aria-label="Table">
      <table className="doc-table">
        <thead><tr>{head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, column) => column === 0
              ? <th key={column} scope="row">{cell}</th>
              : <td key={column}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="code-block">
      <figcaption>
        <span>{label}</span>
        <button type="button" onClick={() => void copy()} aria-live="polite">
          <Icon name={copied ? "check" : "download"} size={14} /> {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre tabIndex={0}><code>{children}</code></pre>
    </figure>
  );
}

export function Steps({ items }: { items: [string, ReactNode][] }) {
  return (
    <ol className="doc-steps">
      {items.map(([title, body], index) => (
        <li key={title}>
          <span className="doc-step-number">{index + 1}</span>
          <div><strong>{title}</strong><div>{body}</div></div>
        </li>
      ))}
    </ol>
  );
}

export function Flow({ nodes }: { nodes: [string, string][] }) {
  return (
    <ol className="flow" aria-label="Moby architecture">
      {nodes.map(([name, detail], index) => (
        <li key={name}>
          <span className="flow-node"><strong>{name}</strong><small>{detail}</small></span>
          {index < nodes.length - 1 && <span className="flow-link" aria-hidden="true"><i /></span>}
        </li>
      ))}
    </ol>
  );
}

export const project = "https://github.com/mobyuz/moby-web";
export const updated = "November 4, 2026";
