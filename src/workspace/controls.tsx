import { useRef, useState } from "react";

type Feedback = { kind: "success" | "error"; message: string };

export function useTask() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function run(action: () => Promise<string | void>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const message = await action();
      if (message) setFeedback({ kind: "success", message });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "The request failed.",
      });
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { busy, feedback, run, clear: () => setFeedback(null) };
}

export function TaskFeedback({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  return (
    <p className={feedback.kind === "error" ? "feedback error" : "feedback"} role={feedback.kind === "error" ? "alert" : "status"}>
      {feedback.message}
    </p>
  );
}

export function valueOf(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function saveDownload(blob: Blob, filename: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
