import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Send, Wind, X } from "lucide-react";

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
  const [view, setView] = useState<"home" | "chat" | "breathe">("home");
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState<CheckIn | null>(null);
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    const t = setTimeout(() => setNote(CHECKINS[0] ?? null), 1500);
    return () => clearTimeout(t);
  }, []);

  const nextNote = () => {
    const n = (idx + 1) % CHECKINS.length;
    setIdx(n);
    setNote(CHECKINS[n] ?? null);
    setFeedback("");
  };

  const answer = (c: CheckIn, a: string) => {
    setLog((l) => [{ q: c.body, a }, ...l]);
    setNote(null);
    setFeedback(a === "Not yet" ? "A little water is a good place to start. I'll be here." : a === "Later" ? "Of course. Take a pause whenever you're ready." : "Thank you for checking in. I'm glad you're here.");
    if (a === "Let's do it") {
      setView("breathe");
      return;
    }
    const heavy = ["Not great", "Barely", "A little", "Let's do it", "Restless"];
    if (heavy.includes(a)) {
      setView("chat");
      void sendMessage({ text: `(Check-in: "${c.body}") My answer: ${a}` });
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
        <Button onClick={nextNote} className="rounded-full px-5 py-2.5 h-auto shadow-soft">
          Send next check-in
        </Button>
        <p className="text-xs text-muted-foreground">
          Ember is not a replacement for professional care. In crisis? Call or text <strong>988</strong> (US) or your local emergency number.
        </p>
      </section>

      <div className="phone relative w-full max-w-[360px] shrink-0 h-[720px] rounded-[3rem] border-8 border-foreground/90 bg-card overflow-hidden shadow-soft">
        {note && (
          <div className="absolute top-3 inset-x-3 z-20 animate-in slide-in-from-top-6 fade-in duration-500 rounded-2xl bg-popover/95 backdrop-blur border border-border p-3 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="ember-dot" /> EMBER · {note.title} <span className="ml-auto">now</span>
              <Button variant="ghost" size="icon" className="size-6" aria-label="Dismiss check-in" onClick={() => setNote(null)}><X /></Button>
            </div>
            <p className="mt-1 text-sm font-medium">{note.body}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.replies.map((r) => (
                <Button variant="secondary" size="sm" key={r} onClick={() => answer(note, r)} className="rounded-full px-3 py-1 text-xs">
                  {r}
                </Button>
              ))}
              <Button size="sm" onClick={() => talk(note)} className="rounded-full px-3 py-1 text-xs">
                Talk to Ember
              </Button>
            </div>
          </div>
        )}

        {view === "home" ? (
          <Home log={log} feedback={feedback} onAnswer={(a) => { const c = CHECKINS[0]; if (c) answer(c, a); }} onBreathe={() => { setNote(null); setView("breathe"); }} onTalk={() => talk()} />
        ) : view === "breathe" ? (
          <Breathing onBack={() => setView("home")} onComplete={() => { setFeedback("Three breaths, a little space. How do you feel now?"); setView("home"); }} />
        ) : (
          <Chat messages={messages} status={status} error={error} onRetry={() => { void regenerate(); }} onSend={(t) => { void sendMessage({ text: t }); }} onBack={() => setView("home")} />
        )}
      </div>
    </main>
  );
}

function Home({ log, feedback, onAnswer, onBreathe, onTalk }: { log: { q: string; a: string }[]; feedback: string; onAnswer: (a: string) => void; onBreathe: () => void; onTalk: () => void }) {
  return (
    <div className="h-full flex flex-col pt-24 px-6 pb-6 bg-calm">
      <p className="text-sm text-muted-foreground">Good to see you</p>
      <h2 className="font-display text-3xl">How's your heart today?</h2>
      <div className="flex justify-between gap-2 mt-5">
        {["Good", "Okay", "Not great"].map((a) => <Button key={a} variant="secondary" size="sm" onClick={() => onAnswer(a)}>{a}</Button>)}
      </div>
      <Button onClick={onTalk} className="mt-6 w-full h-12"><Heart /> Talk to Ember</Button>
      <Button variant="outline" onClick={onBreathe} className="mt-3 w-full h-12"><Wind /> Take a breath</Button>
      {feedback && <p role="status" className="mt-4 text-sm text-secondary-foreground leading-relaxed">{feedback}</p>}
      <div className="mt-6 flex-1 min-h-0 overflow-y-auto space-y-2">
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

function Breathing({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((s) => Math.min(s + 1, 30)), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const complete = seconds === 30;
  const inhale = seconds % 10 < 4;
  return <div className="h-full flex flex-col px-6 pt-10 pb-6">
    <Button variant="ghost" className="self-start" onClick={onBack}><ArrowLeft /> Back</Button>
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
      <Wind className="size-16 text-primary" />
      <h2 className="font-display text-3xl">{complete ? "A little more space." : running ? (inhale ? "Breathe in" : "Breathe out") : "A moment for you"}</h2>
      <p className="text-muted-foreground" aria-live="polite">{complete ? "You took three slow breaths." : running ? `Breath ${Math.floor(seconds / 10) + 1} of 3 · ${inhale ? 4 - seconds % 10 : 10 - seconds % 10}` : "Three gentle breaths, at your own pace."}</p>
      <progress className="w-full accent-primary" max={30} value={seconds} aria-label="Breathing progress" />
      {complete ? <Button onClick={onComplete}>Finish</Button> : <Button onClick={() => setRunning((v) => !v)}>{running ? "Pause" : seconds ? "Resume" : "Start breathing"}</Button>}
    </div>
  </div>;
}

function Chat({ messages, status, error, onSend, onBack, onRetry }: {
  messages: ReturnType<typeof useChat>["messages"];
  status: string; error?: Error | undefined; onSend: (t: string) => void; onBack: () => void; onRetry: () => void;
}) {
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const busy = status === "submitted" || status === "streaming";
  return (
    <div className="h-full flex flex-col pt-10">
      <header className="flex items-center gap-3 px-4 pb-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to check-ins"><ArrowLeft /></Button>
        <span className="ember-dot" />
        <span className="font-display text-lg">Ember</span>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && <div className="mt-10 space-y-3"><p className="text-sm text-muted-foreground text-center">I'm here. What's on your mind?</p>{["I'm feeling overwhelmed", "I need someone to listen"].map((t) => <Button key={t} variant="outline" className="w-full text-xs" disabled={busy} onClick={() => onSend(t)}>{t}</Button>)}</div>}
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
        {error && <div role="alert"><p className="text-sm text-destructive">Couldn't reach Ember right now.</p><Button variant="outline" size="sm" onClick={onRetry} disabled={busy}>Try again</Button></div>}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (!input.trim() || busy) return; onSend(input); setInput(""); }}
        className="p-3 border-t border-border flex gap-2"
      >
        <input aria-label="Message to Ember" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Say anything…" className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 ring-ring" />
        <Button type="submit" size="icon" aria-label="Send message" disabled={busy || !input.trim()} className="rounded-full"><Send /></Button>
      </form>
    </div>
  );
}
