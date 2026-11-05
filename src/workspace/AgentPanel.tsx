import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { agentTurn } from "../api/agent-stream";
import type { BrowserSession, Model } from "../api/workspace";
import { Icon } from "../Icon";
import { TaskFeedback, useTask } from "./controls";
import type { Locale } from "./locale";

type Message = Extract<Model<"AgentMessage">, { text: string }>;

export function AgentPanel({ session, locale }: { session: BrowserSession; locale: Locale }) {
  const [history, setHistory] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const activeTurn = useRef<AbortController | null>(null);
  const task = useTask();

  const thread = useRef<HTMLOListElement>(null);

  useEffect(() => () => activeTurn.current?.abort(), []);

  useEffect(() => {
    thread.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [history.length, draft]);

  function sendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    void task.run(async () => {
      if (new TextEncoder().encode(message).byteLength > 8192) {
        throw new Error("Use a message under 8 KiB.");
      }
      const controller = new AbortController();
      activeTurn.current = controller;
      const messages: Message[] = [...history.slice(-62), { kind: "user", text: message }];
      setDraft("");
      try {
        const reply = await agentTurn(session, messages, locale, (delta) => setDraft((value) => value + delta), controller.signal);
        setHistory([...messages, { kind: "assistant", text: reply }]);
        setText("");
      } catch (error) {
        if (controller.signal.aborted) return "Turn canceled.";
        throw error;
      } finally {
        activeTurn.current = null;
        setDraft("");
      }
    });
  }

  return (
    <section className="workspace-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="workspace-title">Conversation</h2>
        <button type="button" className="workspace-button" disabled={!history.length || task.busy} onClick={() => {
          setHistory([]);
          setText("");
          task.clear();
        }}>New chat</button>
      </div>
      {!history.length && !task.busy && (
        <div className="conversation-empty">
          <span className="feature-icon"><Icon name="message" /></span>
          <h3>Start a conversation</h3>
          <p>Send Moby a message. Your conversation history stays in this tab.</p>
        </div>
      )}
      {(history.length > 0 || task.busy) && <ol ref={thread} className="conversation-thread" aria-label="Conversation">
        {history.map((item, index) => (
          <li key={index} className="conversation-message" data-author={item.kind}>
            <p className="mb-1 text-sm font-semibold text-accent">{item.kind === "user" ? "You" : "Moby"}</p>
            <p className="whitespace-pre-wrap wrap-anywhere">{item.text}</p>
          </li>
        ))}
        {task.busy && (
          <li className="conversation-message conversation-pending" data-author="assistant" aria-hidden="true">
            <p className="mb-1 text-sm font-semibold text-accent">Moby</p>
            {draft ? <p className="whitespace-pre-wrap wrap-anywhere">{draft}</p> : <span className="typing"><i /><i /><i /></span>}
          </li>
        )}
      </ol>}
      <p role="status" className="sr-only">
        {task.busy && (draft || "Waiting for Moby…")}
      </p>
      <form className="workspace-form" onSubmit={submit}>
        <label className="field">Message
          <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={sendOnEnter} rows={3} readOnly={task.busy} required
            placeholder="Ask Moby anything. Enter sends, Shift+Enter adds a line." />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="action" disabled={task.busy || !text.trim()}>Send to assistant <Icon name="send" size={17} /></button>
          {task.busy && <button type="button" className="workspace-button" onClick={() => activeTurn.current?.abort()}>Stop</button>}
        </div>
      </form>
      <TaskFeedback feedback={task.feedback} />
    </section>
  );
}
