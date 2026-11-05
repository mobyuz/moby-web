import { useEffect, useState, type FormEvent } from "react";
import { jsonBody, type BrowserSession, type Model } from "../api/workspace";
import { Icon } from "../Icon";
import { saveDownload, TaskFeedback, useTask, valueOf } from "./controls";
import { googleAvailableHere, googleProof } from "./google";

const consentLabels: Record<Model<"ConsentKind">, string> = {
  terms: "Terms",
  privacy_policy: "Privacy policy",
  cloud_voice: "Cloud voice processing",
};

type Account = {
  profile: Model<"Profile">;
  installations: Model<"Installation">[];
  consents: Model<"Consents">;
};

export function AccountPanel({ session }: { session: BrowserSession }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const task = useTask();

  useEffect(() => {
    const controller = new AbortController();
    const init = { signal: controller.signal };
    void Promise.all([
      session.json<Model<"Profile">>("/v1/me", init),
      session.json<Model<"Installation">[]>("/v1/installations", init),
      session.json<Model<"Consents">>("/v1/consents", init),
    ]).then(([profile, installations, consents]) => {
      if (!controller.signal.aborted) setAccount({ profile, installations, consents });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load your account.");
    });
    return () => controller.abort();
  }, [session, loadAttempt]);

  if (!account) return (
    <section className="workspace-card">
      <h2 className="workspace-title">Account</h2>
      <p className="text-subtle" role={loadError ? "alert" : "status"}>{loadError || "Loading your account…"}</p>
      {loadError && <button type="button" className="workspace-button mt-3" onClick={() => {
        setLoadError("");
        setLoadAttempt((attempt) => attempt + 1);
      }}>Retry</button>}
    </section>
  );

  const { profile, installations, consents } = account;
  const policyVersions = {
    terms_version: consents.current_versions.terms,
    privacy_policy_version: consents.current_versions.privacy_policy,
  };

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = valueOf(new FormData(event.currentTarget), "display_name").trim();
    void task.run(async () => {
      const updated = await session.json<Model<"Profile">>("/v1/me", jsonBody({
        display_name: displayName || null,
      } satisfies Model<"UpdateProfile">, "PATCH"));
      setAccount((current) => current && { ...current, profile: updated });
      return "Profile saved.";
    });
  }

  function addInstallation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const body: Model<"NewInstallation"> = {
      name: valueOf(form, "name").trim(),
      app_version: valueOf(form, "app_version").trim() || null,
    };
    void task.run(async () => {
      const installation = await session.json<Model<"Installation">>("/v1/installations", jsonBody(body));
      setAccount((current) => current && { ...current, installations: [...current.installations, installation] });
      element.reset();
      return "Installation registered.";
    });
  }

  function revoke(installation: Model<"Installation">) {
    if (!window.confirm(`Revoke ${installation.name} and end its sessions?`)) return;
    void task.run(async () => {
      const isCurrent = installation.id === session.installationId;
      await session.request(`/v1/installations/${encodeURIComponent(installation.id)}`, { method: "DELETE" });
      if (isCurrent) session.end();
      else setAccount((current) => current && {
        ...current,
        installations: current.installations.map((entry) => entry.id === installation.id ? { ...entry, revoked: true } : entry),
      });
      return "Installation revoked.";
    });
  }

  function updateConsent(type: Model<"ConsentKind">, version: string, accepted: boolean) {
    void task.run(async () => {
      await session.request("/v1/consents", jsonBody({ type, version, accepted } satisfies Model<"SetConsent">));
      const updated = await session.json<Model<"Consents">>("/v1/consents");
      setAccount((current) => current && { ...current, consents: updated });
      return accepted ? "Consent recorded." : "Consent withdrawn.";
    });
  }

  function linkGoogle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const password = valueOf(new FormData(element), "password");
    element.reset();
    void task.run(async () => {
      const proof = await googleProof(policyVersions);
      await session.request("/v1/auth/google/link", jsonBody({ ...proof, password } satisfies Model<"Link">));
      return "Google was linked to this account.";
    });
  }

  function deleteAccount(proof: () => Promise<Model<"DeleteAccount">>) {
    if (!window.confirm("Permanently delete your Moby account and its stored records?")) return;
    void task.run(async () => {
      await session.request("/v1/me", jsonBody(await proof(), "DELETE"));
      session.end();
    });
  }

  return (
    <div className="account-grid">
      {task.feedback && <div className="account-wide sticky top-2 z-10"><TaskFeedback feedback={task.feedback} /></div>}
      <section className="workspace-card">
        <div className="profile-head">
          <span className="avatar" aria-hidden="true">{(profile.display_name || profile.email).trim().charAt(0).toUpperCase()}</span>
          <div>
            <h2 className="workspace-title">Profile</h2>
            <p className="text-subtle wrap-anywhere">{profile.email}</p>
          </div>
        </div>
        <form className="workspace-form" onSubmit={saveProfile}>
          <label className="field">Display name
            <input name="display_name" autoComplete="nickname" defaultValue={profile.display_name ?? ""} maxLength={100} />
          </label>
          <button className="action" disabled={task.busy}>Save profile</button>
        </form>
        <button type="button" className="workspace-button mt-4" disabled={task.busy} onClick={() => void task.run(async () => {
          const response = await session.request("/v1/me/export", { method: "POST" });
          saveDownload(await response.blob(), "moby-account-export.json");
          return "Account export downloaded.";
        })}><Icon name="download" size={15} /> Export account data</button>
      </section>

      <section className="workspace-card">
        <h2 className="workspace-title">Installations</h2>
        <ul className="divide-y divide-line">
          {installations.map((installation) => (
            <li key={installation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{installation.name}{installation.id === profile.installation_id && " · Current"}</p>
                <p className="text-sm text-subtle capitalize">{installation.os}{installation.app_version && ` · ${installation.app_version}`}</p>
                <code className="wrap-anywhere text-xs text-subtle">{installation.id}</code>
              </div>
              {installation.revoked ? <span className="text-sm text-subtle">Revoked</span> : (
                <button type="button" className="workspace-button" disabled={task.busy} onClick={() => revoke(installation)}>Revoke</button>
              )}
            </li>
          ))}
        </ul>
        <form className="workspace-form" onSubmit={addInstallation}>
          <label className="field">Installation name<input name="name" required maxLength={100} /></label>
          <label className="field">App version (optional)<input name="app_version" maxLength={64} /></label>
          <button className="action" disabled={task.busy}>Register installation</button>
        </form>
      </section>

      <section className="workspace-card">
        <h2 className="workspace-title">Consent</h2>
        <p className="text-subtle">With cloud voice consent, the web app can send uploaded audio and text to the API for speech processing.</p>
        <ul className="mt-3 divide-y divide-line">
          {(Object.keys(consentLabels) as Model<"ConsentKind">[]).map((kind) => {
            const version = consents.current_versions[kind];
            const granted = consents.records.some((record) => record.type === kind && record.version === version && !record.revoked_at);
            return (
              <li key={kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{consentLabels[kind]} · {version} · {granted ? "Granted" : "Pending"}</span>
                <button type="button" className="workspace-button" disabled={task.busy} onClick={() => updateConsent(kind, version, !granted)}>
                  {granted ? "Withdraw" : "Grant"} {consentLabels[kind].toLowerCase()}
                </button>
              </li>
            );
          })}
          {consents.records.filter((record) => record.version !== consents.current_versions[record.type]).map((record) => (
            <li key={`${record.type}:${record.version}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-subtle">
              <span>{consentLabels[record.type]} · {record.version} · {record.revoked_at ? "Withdrawn" : "Previous version"}</span>
              {!record.revoked_at && <button type="button" className="workspace-button" disabled={task.busy}
                onClick={() => updateConsent(record.type, record.version, false)}>Withdraw previous consent</button>}
            </li>
          ))}
        </ul>
      </section>

      <section className="workspace-card">
        <h2 className="workspace-title">Link Google</h2>
        <form className="workspace-form" onSubmit={linkGoogle}>
          <label className="field">Current password
            <input type="password" name="password" autoComplete="current-password" required minLength={15} maxLength={128} />
          </label>
          <button className="action" disabled={task.busy || !googleAvailableHere}>Link Google</button>
          {!googleAvailableHere && <p className="text-sm text-subtle">Available in the local web app at 127.0.0.1.</p>}
        </form>
      </section>

      <section className="workspace-card account-wide workspace-danger">
        <h2 className="workspace-title">Delete account</h2>
        <p className="text-subtle">This permanently removes your account and its stored records.</p>
        <form className="workspace-form" onSubmit={(event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const password = valueOf(new FormData(element), "password");
          element.reset();
          deleteAccount(() => Promise.resolve({ password }));
        }}>
          <label className="field">Confirm with password
            <input type="password" name="password" autoComplete="current-password" required minLength={15} maxLength={128} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="workspace-button danger" disabled={task.busy}>Delete with password</button>
            <button type="button" className="workspace-button danger" disabled={task.busy || !googleAvailableHere}
              onClick={() => deleteAccount(() => googleProof(policyVersions))}>Delete with Google</button>
          </div>
        </form>
      </section>
    </div>
  );
}
