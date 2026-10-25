import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember — a friend who checks in" },
      { name: "description", content: "A mental wellness companion that checks in on your body and mind, and talks with you whenever you need." },
      { property: "og:title", content: "Ember — a friend who checks in" },
      { property: "og:description", content: "Gentle check-ins and an always-there companion for your mental and physical well-being." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type CheckIn = { id: string; title: string; body: string; replies: string[] };

const CHECKINS: CheckIn[] = [
  { id: "mood", title: "Morning check-in", body: "Hey you. How are you feeling today?", replies: ["Good", "Okay", "Not great"] },
  { id: "water", title: "Body check", body: "Have you had some water in the last couple hours?", replies: ["Yes", "Not yet"] },
  { id: "sleep", title: "Rest", body: "How did you sleep last night?", replies: ["Well", "Restless", "Barely"] },
  { id: "stress", title: "Quick pause", body: "Your shoulders tense? Want to take 3 slow breaths with me?", replies: ["Let's do it", "Later"] },
  { id: "connect", title: "Thinking of you", body: "Anything weighing on you today?", replies: ["A little", "I'm fine"] },
];

function Index() {
  const [view, setView] = useState<"home" | "chat">("home");
  const [note, setNote] = useState<CheckIn | null>(null);
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    const t = setTimeout(() => setNote(CHECKINS[0] ?? null), 1500);
    return () => clearTimeout(t);
  }, []);

  const nextNote = () => {
    const n = (idx + 1) % CHECKINS.length;
    setIdx(n);
    setNote(null);
    setTimeout(() => setNote(CHECKINS[n] ?? null), 400);
  };

  const answer = (c: CheckIn, a: string) => {
    setLog((l) => [{ q: c.body, a }, ...l]);
    setNote(null);
    const heavy = ["Not great", "Barely", "A little", "Let's do it", "Restless"];
    if (heavy.includes(a)) {
      setView("chat");
      sendMessage({ text: `(Check-in: "${c.body}") My answer: ${a}` });
    }
  };

  const talk = (c?: CheckIn) => {
    setNote(null);
    setView("chat");
    if (c && messages.length === 0) sendMessage({ text: `(Check-in: "${c.body}") I'd like to talk.` });
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row items-center justify-center gap-12 p-6">
      <section className="max-w-sm space-y-4">
        <p className="font-display text-sm tracking-widest uppercase text-primary">Prototype</p>
        <h1 className="font-display text-5xl leading-tight">Ember checks in, so you don't have to ask.</h1>
        <p className="text-muted-foreground">
          Gentle nudges about your body and mind arrive as notifications. Answer with a tap — or open Ember and just talk, any time, for free.
        </p>
        <button onClick={nextNote} className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-soft hover:opacity-90 transition">
          Send next check-in
        </button>
        <p className="text-xs text-muted-foreground">
          Ember is not a replacement for professional care. In crisis? Call or text <strong>988</strong> (US) or your local emergency number.
        </p>
      </section>

      <div className="phone relative w-[360px] h-[720px] rounded-[3rem] border-8 border-foreground/90 bg-card overflow-hidden shadow-soft">
        {note && (
          <div className="absolute top-3 inset-x-3 z-20 animate-in slide-in-from-top-6 fade-in duration-500 rounded-2xl bg-popover/95 backdrop-blur border border-border p-3 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="ember-dot" /> EMBER · {note.title} <span className="ml-auto">now</span>
            </div>
            <p className="mt-1 text-sm font-medium">{note.body}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.replies.map((r) => (
                <button key={r} onClick={() => answer(note, r)} className="rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs hover:bg-accent">
                  {r}
                </button>
              ))}
              <button onClick={() => talk(note)} className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs">
                Talk to Ember
              </button>
            </div>
          </div>
        )}

        {view === "home" ? (
          <Home log={log} onTalk={() => talk()} />
        ) : (
          <Chat messages={messages} status={status} error={error} onSend={(t) => sendMessage({ text: t })} onBack={() => setView("home")} />
        )}
      </div>
    </main>
  );
}

function Home({ log, onTalk }: { log: { q: string; a: string }[]; onTalk: () => void }) {
  return (
    <div className="h-full flex flex-col pt-24 px-6 pb-6 bg-calm">
      <p className="text-sm text-muted-foreground">Good to see you</p>
      <h2 className="font-display text-3xl">How's your heart today?</h2>
      <button onClick={onTalk} className="mt-8 mx-auto ember-orb" aria-label="Talk to Ember" />
      <p className="text-center text-sm text-muted-foreground mt-3">Tap to talk</p>
      <div className="mt-8 flex-1 overflow-y-auto space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Today's check-ins</p>
        {log.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet — Ember will check in soon.</p>}
        {log.map((l, i) => (
          <div key={i} className="rounded-xl bg-card/80 border border-border p-3 text-sm">
            <p className="text-muted-foreground">{l.q}</p>
            <p className="font-medium">{l.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chat({ messages, status, error, onSend, onBack }: {
  messages: ReturnType<typeof useChat>["messages"];
  status: string; error?: Error | undefined; onSend: (t: string) => void; onBack: () => void;
}) {
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
  const busy = status === "submitted" || status === "streaming";
  return (
    <div className="h-full flex flex-col pt-10">
      <header className="flex items-center gap-3 px-4 pb-3 border-b border-border">
        <button onClick={onBack} className="text-sm text-muted-foreground">‹ Back</button>
        <span className="ember-dot" />
        <span className="font-display text-lg">Ember</span>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && <p className="text-sm text-muted-foreground text-center mt-10">I'm here. What's on your mind?</p>}
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (!text) return null;
          return m.role === "user" ? (
            <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm">{text}</div>
          ) : (
            <div key={m.id} className="max-w-[90%] text-sm leading-relaxed prose-chat"><ReactMarkdown>{text}</ReactMarkdown></div>
          );
        })}
        {status === "submitted" && <p className="text-sm text-muted-foreground animate-pulse">Ember is listening…</p>}
        {error && <p className="text-sm text-destructive">Couldn't reach Ember right now. Please try again.</p>}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (!input.trim() || busy) return; onSend(input); setInput(""); }}
        className="p-3 border-t border-border flex gap-2"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Say anything…" className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 ring-ring" />
        <button disabled={busy} className="rounded-full bg-primary text-primary-foreground px-4 text-sm disabled:opacity-50">Send</button>
      </form>
    </div>
  );
}
