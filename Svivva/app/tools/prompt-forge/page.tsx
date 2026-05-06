"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2, ArrowRight, Loader2, Copy, Check, Zap, Clock, Coins, RotateCcw } from "lucide-react";
import { TentpoleStickyBar, TentpoleBanner, TentpoleStepIndicator } from "@/app/components/tentpole-upgrade-cta";

const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", note: "Fast · Cheap" },
  { id: "gpt-4o",      label: "GPT-4o",      note: "Smart · Best" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo", note: "Powerful" },
];

const EXAMPLES = [
  { label: "Summariser", system: "Summarise the following text in 3 bullet points. Be concise.", user: "Artificial intelligence (AI) is transforming industries worldwide. From healthcare diagnostics to financial modeling, AI systems are now capable of performing tasks that once required human expertise. However, this rapid advancement raises important questions about ethics, employment, and the future of human-machine collaboration." },
  { label: "JSON extractor", system: "Extract structured data from the text and return valid JSON only. Schema: {name: string, email: string, company: string}", user: "Hi, I'm Sarah Chen from Acme Corp. You can reach me at sarah.chen@acme.com. Looking forward to our meeting." },
  { label: "Tone rewriter", system: "Rewrite the following text in a professional, concise business tone.", user: "hey so basically our product is like really cool and stuff and customers love it so much and we think you should def check it out asap!!" },
];

interface Result {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  model: string;
  error?: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50">
      {copied ? <><Check className="w-3 h-3 text-green-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  );
}

export default function PromptForgePage() {
  const [system, setSystem] = useState("");
  const [user, setUser]     = useState("");
  const [model, setModel]   = useState("gpt-4o-mini");
  const [temp, setTemp]     = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<Result | null>(null);

  const run = async () => {
    if (!user.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tools/prompt-forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: system, userMessage: user, model, temperature: temp }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ content: "", inputTokens: 0, outputTokens: 0, latencyMs: 0, costUsd: 0, model, error: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (ex: typeof EXAMPLES[0]) => { setSystem(ex.system); setUser(ex.user); setResult(null); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f1117] to-[#1a2035] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Link href="/tools" className="hover:text-white/70 transition-colors">Free Tools</Link>
              <span>/</span>
              <span className="text-white/60">PromptForge</span>
            </div>
            <TentpoleStepIndicator step={0} total={2} currentLabel="Test your prompt" nextLabel="Deploy as live API" />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5BA8A0] flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">PromptForge</h1>
              <p className="text-white/60 mt-1 text-lg">Test, refine and compare AI prompts instantly. No signup, no API key needed.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["GPT-4o", "GPT-4o mini", "GPT-4 Turbo", "Free to use", "Token counter"].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Examples */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Try an example:</span>
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => loadExample(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors">
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Prompt</span>
                <span className="text-xs text-muted-foreground">{system.length} chars</span>
              </div>
              <textarea value={system} onChange={e => setSystem(e.target.value)}
                placeholder="You are a helpful assistant. (Optional — defines AI behavior)"
                rows={5}
                className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/40" />
            </div>

            <div className="rounded-2xl border-2 border-[#5BA8A0]/40 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#5BA8A0]/20 bg-[#5BA8A0]/5">
                <span className="text-xs font-semibold text-[#5BA8A0] uppercase tracking-wide">User Message</span>
                <span className="text-xs text-muted-foreground">{user.length} chars</span>
              </div>
              <textarea value={user} onChange={e => setUser(e.target.value)}
                placeholder="Type your message here…"
                rows={7}
                className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/40" />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model</label>
                <select value={model} onChange={e => setModel(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:border-[#5BA8A0]">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label} — {m.note}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Temperature <span className="text-[#5BA8A0] font-bold">{temp}</span>
                </label>
                <input type="range" min={0} max={2} step={0.1} value={temp}
                  onChange={e => setTemp(Number(e.target.value))}
                  className="w-full mt-2 accent-[#5BA8A0]" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span><span>Creative</span>
                </div>
              </div>
            </div>

            <button onClick={run} disabled={!user.trim() || loading}
              data-testid="button-run-prompt"
              className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Running…</> : <><Zap className="w-4 h-4" />Run Prompt</>}
            </button>
          </div>

          {/* Output panel */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Output</span>
              <div className="flex items-center gap-2">
                {result?.content && <CopyBtn text={result.content} />}
                {result && <button onClick={() => setResult(null)} className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />Clear
                </button>}
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(91,168,160,0.15)", border: "1px solid rgba(91,168,160,0.3)" }}>
                  <Loader2 className="w-5 h-5 animate-spin text-[#5BA8A0]" />
                </div>
                <p className="text-sm">Calling {MODELS.find(m => m.id === model)?.label}…</p>
              </div>
            ) : result?.error ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-sm text-red-400 text-center">{result.error}</p>
              </div>
            ) : result?.content ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground overflow-auto" data-testid="text-prompt-output">
                  {result.content}
                </div>
                <div className="border-t border-border px-4 py-3 grid grid-cols-3 gap-2">
                  {[
                    { icon: Zap, label: "Tokens", value: `${result.inputTokens}↑ ${result.outputTokens}↓` },
                    { icon: Clock, label: "Latency", value: `${result.latencyMs}ms` },
                    { icon: Coins, label: "Cost", value: result.costUsd < 0.0001 ? "<$0.0001" : `$${result.costUsd.toFixed(4)}` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <s.icon className="w-3 h-3" />{s.label}
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground p-8 text-center">
                <Wand2 className="w-8 h-8 opacity-20" />
                <p className="text-sm">Your AI response will appear here</p>
                <p className="text-xs opacity-60">Enter a prompt and click Run</p>
              </div>
            )}
          </div>
        </div>

        <TentpoleBanner
          context={result?.content ? "ran" : undefined}
          headline={result?.content ? "Prompt working — now deploy it as a live API endpoint" : "Ready to go beyond testing?"}
          body="Svivva turns your prompt into a production-ready API in one click — with schema validation, auto-repair, model routing, versioning, and analytics. No backend required."
          ctaText="Deploy this prompt — free"
        />

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          {[
            { q: "Do I need an API key to use PromptForge?", a: "No — PromptForge is completely free to use. No signup, no API key, no credit card. It's powered by Svivva's infrastructure." },
            { q: "Which models are available?", a: "GPT-4o mini (fast and cheap, great for most tasks), GPT-4o (smarter, best quality), and GPT-4 Turbo (powerful, long context). More models coming soon." },
            { q: "What does temperature do?", a: "Temperature controls randomness. 0 = deterministic, precise answers. 2 = highly creative and varied. For factual tasks use 0–0.3. For creative tasks use 0.7–1.2." },
            { q: "How do I deploy my prompt to production?", a: "Once you're happy with your prompt, Svivva lets you deploy it as a live API endpoint in one click — with rate limiting, schema validation, and usage analytics built in." },
            { q: "Is there a rate limit?", a: "Free use is limited to 12 requests per minute per IP. For unlimited usage, sign up for Svivva." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">More free developer tools:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link href="/tools/ai-api-cost-calculator" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">AI API Cost Calculator</Link>
            <Link href="/tools/json-schema-validator" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">JSON Schema Validator</Link>
            <Link href="/tools" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1">All Tools <ArrowRight className="w-3 h-3" /></Link>
          </div>
        </div>
      </div>

      <TentpoleStickyBar toolName="prompt-forge" triggerAfterMs={20000}
        savingsLine={result?.content ? "Prompt tested — deploy it as a live API on Svivva in one click." : "PromptForge is Step 1. Step 2: deploy your prompt as a live API."} />
    </div>
  );
}
