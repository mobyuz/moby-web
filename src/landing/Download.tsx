import { useEffect, useRef, useState } from "react";
import { MobyFace } from "@mobyuz/moby-ui";
import { Icon } from "../Icon";
import { Reveal } from "../motion";
import { DOWNLOAD_DIR, formatSize } from "./release";
import { useRelease } from "./useRelease";

const org = "https://github.com/mobyuz";

function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* The hash is selectable text, so copying by hand still works. */
    }
  }
  return (
    <div className="hash">
      <code id="installer-sha256" tabIndex={0}>{hash}</code>
      <button type="button" className="button button-small" onClick={() => void copy()} aria-describedby="installer-sha256">
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status">{copied ? "SHA-256 copied" : ""}</span>
    </div>
  );
}

export function Download() {
  const state = useRelease();
  const release = state.status === "ready" ? state.release : null;
  const date = release ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${release.released}T00:00:00Z`)) : "";

  return (
    <section id="download" className="band" aria-labelledby="download-heading" data-release={state.status} aria-busy={state.status === "loading"}>
      <div className="shell download">
        <Reveal className="download-copy">
          <p className="eyebrow">Download</p>
          <h2 id="download-heading" className="section-title">{release ? "Moby for Windows." : "Moby for Windows is coming soon."}</h2>
          {release ? (
            <p className="section-intro">Version {release.version}. The app links to your robot over USB and keeps your conversations on your computer.</p>
          ) : (
            <p className="section-intro">
              There is no installer yet, so there is nothing to download today. You can try Moby right now in your browser: the guest demo needs no account.
            </p>
          )}
          <div className="cta-row">
            {release ? (
              <a className="button button-primary button-large" href={`${DOWNLOAD_DIR}${release.file}`} download>
                <Icon name="download" size={18} /> Download for Windows
              </a>
            ) : (
              <button type="button" className="button button-primary button-large" disabled aria-describedby="download-note">
                <Icon name="download" size={18} /> Download for Windows <span className="pill">Coming soon</span>
              </button>
            )}
            {!release && <a className="button button-large" href="#demo">Try the guest demo</a>}
            {release && <a className="button button-large" href="/app/">Open Moby Web</a>}
          </div>
          {!release && <p id="download-note" className="note">The Windows download will appear here when the first release is published.</p>}
        </Reveal>

        <Reveal className="download-card" delay={90}>
          <div className="download-screen" aria-hidden="true">
            <MobyFace expression={release ? "happy" : "idle"} size="100%" decorative />
          </div>
          {release ? (
            <>
              <dl className="release-meta">
                <div><dt>Version</dt><dd>{release.version}</dd></div>
                <div><dt>Size</dt><dd>{formatSize(release.size)}</dd></div>
                <div><dt>Released</dt><dd><time dateTime={release.released}>{date}</time></dd></div>
                <div><dt>Runs on</dt><dd>Windows 10 and 11, 64-bit</dd></div>
              </dl>
              <div className="verify">
                <h3>SHA-256</h3>
                <CopyHash hash={release.sha256} />
                <p>To check the download, run <code>Get-FileHash {release.file} -Algorithm SHA256</code> in PowerShell and compare the result.</p>
              </div>
              {!release.signed && (
                <p className="note">This build is not code-signed yet, so Windows SmartScreen may warn you. Continue only if the SHA-256 above matches.</p>
              )}
              {release.notes && <a className="text-link" href={release.notes}>Release notes <Icon name="arrow" size={14} /></a>}
            </>
          ) : (
            <p className="download-status"><span aria-hidden="true" /> Early development. Windows 10 and 11, 64-bit, when released.</p>
          )}
        </Reveal>
      </div>
      <p className="shell build-own">
        Want to build it yourself? The hardware design and the source are open:{" "}
        <a href={`${org}/3d-model`}>3D models</a>, <a href={`${org}/moby-desktop`}>desktop app</a>, <a href={`${org}/moby-firmware`}>firmware</a>.
      </p>
    </section>
  );
}
