import { useEffect, useRef, useState } from "react";

type TurnstileOptions = {
  sitekey: string;
  action: "demo_chat";
  language: "en";
  theme: "light";
  size: "compact";
  appearance: "interaction-only";
  retry: "never";
  "response-field": false;
  callback: (token: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

type TurnstileApi = {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoad: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptLoad ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timeout = window.setTimeout(fail, 12_000);

    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("Turnstile did not load"));
    }

    script.addEventListener("error", fail, { once: true });
    script.addEventListener("load", () => {
      const api = window.turnstile;
      if (!api) {
        fail();
        return;
      }
      api.ready(() => {
        window.clearTimeout(timeout);
        resolve(api);
      });
    }, { once: true });
    document.head.append(script);
  }).catch((error: unknown) => {
    scriptLoad = undefined;
    throw error;
  });
  return scriptLoad;
}

export function TurnstileWidget({ siteKey, onToken }: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"waiting" | "verified" | "failed">("waiting");

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let active = true;
    let removeWidget: (() => void) | undefined;

    function update(status: "waiting" | "verified" | "failed", token: string | null = null) {
      if (active) {
        onToken(token);
        setStatus(status);
      }
    }

    void loadTurnstile().then((api) => {
      if (!active) return;
      const id = api.render(element, {
        sitekey: siteKey,
        action: "demo_chat",
        language: "en",
        theme: "light",
        size: "compact",
        appearance: "interaction-only",
        retry: "never",
        "response-field": false,
        callback: (token) => update("verified", token),
        "expired-callback": () => update("waiting"),
        "error-callback": () => {
          update("failed");
          return true;
        },
        "timeout-callback": () => update("failed"),
      });
      removeWidget = () => api.remove(id);
    }).catch(() => update("failed"));

    return () => {
      active = false;
      removeWidget?.();
    };
  }, [siteKey, onToken, attempt]);

  return (
    <div className="text-sm text-subtle">
      <div ref={container} />
      <p role="status">
        {status === "waiting" && "Waiting for verification…"}
        {status === "verified" && "Verification complete."}
        {status === "failed" && "Verification could not finish."}
      </p>
      {status === "failed" && (
        <button className="mt-2 cursor-pointer text-accent underline" type="button" onClick={() => {
          setStatus("waiting");
          setAttempt(attempt + 1);
        }}>
          Retry verification
        </button>
      )}
    </div>
  );
}
