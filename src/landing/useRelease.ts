import { useEffect, useState } from "react";
import { DOWNLOAD_DIR, MANIFEST_URL, parseRelease, type Release } from "./release";

export type ReleaseState = { status: "loading" } | { status: "soon" } | { status: "ready"; release: Release };

/**
 * Reads the site's own release manifest. Anything unexpected means "coming soon": no manifest,
 * bad JSON, bad fields, or an installer that is not there.
 */
export function useRelease(): ReleaseState {
  const [state, setState] = useState<ReleaseState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(MANIFEST_URL, { cache: "no-store", signal: controller.signal });
        if (!response.ok || !(response.headers.get("content-type") ?? "").includes("json")) throw new Error("no manifest");
        const release = parseRelease(await response.json());
        if (!release) throw new Error("invalid manifest");
        const file = await fetch(`${DOWNLOAD_DIR}${release.file}`, { method: "HEAD", signal: controller.signal });
        if (!file.ok || (file.headers.get("content-type") ?? "").includes("text/html")) throw new Error("no installer");
        setState({ status: "ready", release });
      } catch {
        if (!controller.signal.aborted) setState({ status: "soon" });
      }
    })();
    return () => controller.abort();
  }, []);
  return state;
}
