import { useEffect, useState, type FormEvent } from "react";
import { jsonBody, type BrowserSession, type Model } from "../api/workspace";
import { TaskFeedback, useTask, valueOf } from "./controls";
import type { Locale } from "./locale";

const maxWavBytes = 30 * 16_000 * 2 + 4096;

export function VoicePanel({ session, locale }: { session: BrowserSession; locale: Locale }) {
  const [transcript, setTranscript] = useState<Model<"Transcript"> | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const transcribing = useTask();
  const synthesizing = useTask();

  useEffect(() => {
    if (!audio) return;
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  function transcribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("audio");
    void transcribing.run(async () => {
      if (!(file instanceof File) || !file.size || file.size > maxWavBytes) {
        throw new Error("Choose a WAV clip up to 30 seconds long.");
      }
      const query = new URLSearchParams(locale);
      const result = await session.json<Model<"Transcript">>(`/v1/voice/stt?${query}`, {
        method: "POST",
        body: file,
        headers: { "Content-Type": "audio/wav" },
      });
      setTranscript(result);
    });
  }

  function synthesize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = valueOf(new FormData(event.currentTarget), "text").trim();
    void synthesizing.run(async () => {
      if (!text || [...text].length > 500) throw new Error("Enter 1 to 500 characters.");
      const response = await session.request("/v1/voice/tts", jsonBody({ text, ...locale } satisfies Model<"TtsRequest">));
      const clip = await response.blob();
      if (clip.type !== "audio/wav" || !clip.size) throw new Error("The API returned an invalid audio clip.");
      setAudio(clip);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="workspace-card">
        <h2 className="workspace-title">Speech to text</h2>
        <p className="text-subtle">Upload a mono, 16 kHz, 16-bit PCM WAV clip up to 30 seconds long. Grant cloud voice consent under Account first.</p>
        <form className="workspace-form" onSubmit={transcribe}>
          <label className="field">WAV audio<input type="file" name="audio" accept=".wav,audio/wav" required /></label>
          <button className="action" disabled={transcribing.busy}>{transcribing.busy ? "Transcribing…" : "Transcribe"}</button>
        </form>
        <TaskFeedback feedback={transcribing.feedback} />
        {transcript && (
          <div className="mt-4 rounded-lg border border-line bg-ink p-3" role="status">
            <p className="whitespace-pre-wrap wrap-anywhere">{transcript.text}</p>
            <p className="mt-2 text-sm text-subtle">
              {transcript.language} · {transcript.script} · {Math.round(transcript.confidence * 100)}% confidence
            </p>
          </div>
        )}
      </section>
      <section className="workspace-card">
        <h2 className="workspace-title">Text to speech</h2>
        <p className="text-subtle">Send up to 500 characters to the voice API and play the returned WAV clip.</p>
        <form className="workspace-form" onSubmit={synthesize}>
          <label className="field">Text to read<textarea name="text" rows={4} required /></label>
          <button className="action" disabled={synthesizing.busy}>{synthesizing.busy ? "Generating…" : "Generate audio"}</button>
        </form>
        <TaskFeedback feedback={synthesizing.feedback} />
        {audioUrl && (
          <div className="mt-4 grid gap-2">
            <audio src={audioUrl} className="w-full" aria-label="Generated speech" controls />
            <a className="w-fit text-accent underline" href={audioUrl} download="moby-speech.wav">Download WAV</a>
          </div>
        )}
      </section>
    </div>
  );
}
