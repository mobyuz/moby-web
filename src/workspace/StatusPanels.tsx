import { useEffect, useState } from "react";
import { apiJson, apiResponse, type BrowserSession, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { CountUp, Reveal } from "../motion";
import { TaskFeedback, useTask } from "./controls";

const meters = [
  { key: "llm_tokens_remaining", label: "Assistant tokens", icon: "message" },
  { key: "stt_seconds_remaining", label: "Transcription seconds", icon: "mic" },
  { key: "tts_chars_remaining", label: "Speech characters", icon: "spark" },
] as const;

function untilReset(resetAt: string) {
  const minutes = Math.max(0, Math.round((new Date(resetAt).getTime() - Date.now()) / 60_000));
  const hours = Math.floor(minutes / 60);
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours} h ${minutes % 60} min`;
  return `${minutes} min`;
}

export function UsagePanel({ session }: { session: BrowserSession }) {
  const [usage, setUsage] = useState<Model<"UsageInfo"> | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void session.json<Model<"UsageInfo">>("/v1/usage", { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setUsage(result);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not read usage.");
    });
    return () => controller.abort();
  }, [session, revision]);

  return (
    <section className="workspace-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="workspace-title">Usage</h2>
        <button type="button" className="workspace-button" onClick={() => {
          setError("");
          setUsage(null);
          setRevision((value) => value + 1);
        }}><Icon name="refresh" size={15} /> Refresh usage</button>
      </div>
      {error && <p className="feedback error" role="alert">{error}</p>}
      {usage ? (
        <>
          <dl className="meter-grid">
            {meters.map(({ key, label, icon }, index) => (
              <Reveal key={key} delay={index * 90} className="meter">
                <span className="meter-icon"><Icon name={icon} size={18} /></span>
                <dt>{label}</dt>
                <dd><CountUp value={usage[key]} /></dd>
              </Reveal>
            ))}
          </dl>
          <p className="reset-note">
            <Icon name="clock" size={16} />
            <span>Resets {new Date(usage.reset_at).toLocaleString("en")} · in {untilReset(usage.reset_at)}.</span>
          </p>
        </>
      ) : !error && (
        <div className="meter-grid" aria-hidden="true">
          {meters.map(({ key }) => <div key={key} className="meter skeleton" />)}
        </div>
      )}
      {!usage && !error && <p role="status" className="sr-only">Loading usage…</p>}
    </section>
  );
}

type Check = { label: string; state: "ok" | "bad"; detail: string; ms?: number };

export function ApiStatus() {
  const task = useTask();
  const [checks, setChecks] = useState<Check[]>([]);
  const [contract, setContract] = useState("");

  function check() {
    void task.run(async () => {
      const probes = [
        { path: "/health", label: "API process" },
        { path: "/ready", label: "Database readiness" },
      ];
      const results = await Promise.allSettled(probes.map(async ({ path }) => {
        const started = performance.now();
        const body = await apiJson<Model<"ProbeBody">>(path);
        return { body, ms: Math.round(performance.now() - started) };
      }));
      setChecks(results.map((result, index): Check => {
        const label = probes[index]?.label ?? "Probe";
        if (result.status === "fulfilled") return { label, state: "ok", detail: result.value.body.status, ms: result.value.ms };
        const reason: unknown = result.reason;
        return { label, state: "bad", detail: reason instanceof Error ? reason.message : "Unavailable" };
      }));

      try {
        const document: { info?: { title?: string; version?: string }; paths?: Record<string, unknown> } =
          await (await apiResponse("/openapi.json")).json();
        const count = Object.keys(document.paths ?? {}).length;
        setContract(`${document.info?.title ?? "Moby API"} ${document.info?.version ?? ""} · ${count} paths`.replace(/\s+/g, " "));
      } catch {
        setContract("");
      }
    });
  }

  return (
    <section className="workspace-card mt-4 status-card">
      <h2 className="workspace-title">API status</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="workspace-button" onClick={check} disabled={task.busy}>
          <Icon name="server" size={15} /> {task.busy ? "Checking…" : "Check API health"}
        </button>
        <a className="text-accent underline" href="/openapi.json" target="_blank" rel="noreferrer">OpenAPI contract</a>
      </div>
      <ul className="status-list" aria-live="polite">
        {checks.map((item) => (
          <li key={item.label} data-state={item.state}>
            <i aria-hidden="true" />
            <span>{item.label} · {item.detail}</span>
            {item.ms !== undefined && <small>{item.ms} ms</small>}
          </li>
        ))}
        {contract && <li data-state="ok"><i aria-hidden="true" /><span>{contract}</span></li>}
      </ul>
      <TaskFeedback feedback={task.feedback} />
    </section>
  );
}
