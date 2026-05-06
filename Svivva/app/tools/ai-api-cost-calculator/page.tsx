"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calculator, Zap, ArrowRight, ExternalLink, Info } from "lucide-react";
import { TentpoleStickyBar, TentpoleBanner, TentpoleStepIndicator } from "@/app/components/tentpole-upgrade-cta";


const MODELS = [
  { id: "gpt-4o",           name: "GPT-4o",              provider: "OpenAI",     input: 2.50,  output: 10.00, context: "128K", speed: "Fast"   },
  { id: "gpt-4o-mini",      name: "GPT-4o mini",         provider: "OpenAI",     input: 0.15,  output: 0.60,  context: "128K", speed: "Fast"   },
  { id: "gpt-4-turbo",      name: "GPT-4 Turbo",         provider: "OpenAI",     input: 10.00, output: 30.00, context: "128K", speed: "Medium" },
  { id: "o1",               name: "o1",                  provider: "OpenAI",     input: 15.00, output: 60.00, context: "200K", speed: "Slow"   },
  { id: "o1-mini",          name: "o1-mini",             provider: "OpenAI",     input: 3.00,  output: 12.00, context: "128K", speed: "Medium" },
  { id: "claude-3-5-sonnet",name: "Claude 3.5 Sonnet",   provider: "Anthropic",  input: 3.00,  output: 15.00, context: "200K", speed: "Fast"   },
  { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku",    provider: "Anthropic",  input: 0.80,  output: 4.00,  context: "200K", speed: "Fast"   },
  { id: "claude-3-opus",    name: "Claude 3 Opus",       provider: "Anthropic",  input: 15.00, output: 75.00, context: "200K", speed: "Slow"   },
  { id: "gemini-1-5-pro",   name: "Gemini 1.5 Pro",      provider: "Google",     input: 3.50,  output: 10.50, context: "1M",   speed: "Fast"   },
  { id: "gemini-1-5-flash", name: "Gemini 1.5 Flash",    provider: "Google",     input: 0.075, output: 0.30,  context: "1M",   speed: "Fast"   },
  { id: "gemini-2-0-flash", name: "Gemini 2.0 Flash",    provider: "Google",     input: 0.075, output: 0.30,  context: "1M",   speed: "Fast"   },
  { id: "llama-3-1-70b",    name: "Llama 3.1 70B",       provider: "Groq",       input: 0.59,  output: 0.79,  context: "128K", speed: "Fast"   },
  { id: "llama-3-3-70b",    name: "Llama 3.3 70B",       provider: "Groq",       input: 0.59,  output: 0.79,  context: "128K", speed: "Fast"   },
  { id: "mixtral-8x7b",     name: "Mixtral 8x7B",        provider: "Groq",       input: 0.24,  output: 0.24,  context: "32K",  speed: "Fast"   },
];

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10a37f",
  Anthropic: "#d4761b",
  Google: "#4285f4",
  Groq: "#f55036",
};

function fmt(n: number): string {
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 0.01)  return `$${n.toFixed(4)}`;
  if (n < 1)     return `$${n.toFixed(3)}`;
  if (n < 100)   return `$${n.toFixed(2)}`;
  return `$${n.toFixed(0)}`;
}

function numFmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function AiApiCostCalculatorPage() {
  const [inputTokens,  setInputTokens]  = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [callsPerDay,  setCallsPerDay]  = useState(1000);
  const [sortBy, setSortBy] = useState<"cost" | "name" | "provider">("cost");

  const results = useMemo(() => {
    return MODELS.map((m) => {
      const perCall     = (m.input  * inputTokens  / 1_000_000) + (m.output * outputTokens / 1_000_000);
      const daily       = perCall * callsPerDay;
      const monthly     = daily * 30;
      return { ...m, perCall, daily, monthly };
    }).sort((a, b) => {
      if (sortBy === "cost")     return a.monthly - b.monthly;
      if (sortBy === "name")     return a.name.localeCompare(b.name);
      if (sortBy === "provider") return a.provider.localeCompare(b.provider);
      return 0;
    });
  }, [inputTokens, outputTokens, callsPerDay, sortBy]);

  const cheapest = results[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f1117] to-[#1a2035] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Link href="/tools" className="hover:text-white/70 transition-colors">Free Tools</Link>
              <span>/</span>
              <span className="text-white/60">AI API Cost Calculator</span>
            </div>
            <TentpoleStepIndicator step={0} total={2} currentLabel="Calculate costs" nextLabel="Optimize with Svivva" />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5BA8A0] flex items-center justify-center flex-shrink-0">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">AI API Cost Calculator</h1>
              <p className="text-white/60 mt-1 text-lg">
                Compare real-time pricing across GPT-4o, Claude 3.5, Gemini, Llama and more. Free, no signup.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["GPT-4o", "Claude 3.5", "Gemini", "Llama", "14 models"].map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Calculator inputs */}
        <div className="rounded-2xl border-2 border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#5BA8A0]" /> Configure Your API Usage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Input tokens */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Input tokens per call
                <span className="ml-2 text-xl font-black text-[#5BA8A0]">{numFmt(inputTokens)}</span>
              </label>
              <input type="range" min={100} max={100000} step={100} value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                className="w-full accent-[#5BA8A0]" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span><span>10K</span><span>100K</span>
              </div>
              <p className="text-xs text-muted-foreground">Your system prompt + user message. ~750 words ≈ 1,000 tokens.</p>
            </div>

            {/* Output tokens */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Output tokens per call
                <span className="ml-2 text-xl font-black text-[#5BA8A0]">{numFmt(outputTokens)}</span>
              </label>
              <input type="range" min={50} max={32000} step={50} value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full accent-[#5BA8A0]" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50</span><span>4K</span><span>32K</span>
              </div>
              <p className="text-xs text-muted-foreground">AI response length. Short answer ≈ 100–300 tokens.</p>
            </div>

            {/* Calls per day */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                API calls per day
                <span className="ml-2 text-xl font-black text-[#5BA8A0]">{numFmt(callsPerDay)}</span>
              </label>
              <input type="range" min={10} max={1000000} step={100} value={callsPerDay}
                onChange={(e) => setCallsPerDay(Number(e.target.value))}
                className="w-full accent-[#5BA8A0]" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span><span>10K</span><span>1M</span>
              </div>
              <p className="text-xs text-muted-foreground">Total API calls across all users/endpoints.</p>
            </div>
          </div>

          {/* Quick summary */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Cheapest/month</p>
              <p className="text-xl font-black text-green-500">{fmt(cheapest?.monthly || 0)}</p>
              <p className="text-xs text-muted-foreground truncate">{cheapest?.name}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Median/month</p>
              <p className="text-xl font-black text-foreground">{fmt(results[Math.floor(results.length / 2)]?.monthly || 0)}</p>
              <p className="text-xs text-muted-foreground truncate">{results[Math.floor(results.length / 2)]?.name}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Most expensive</p>
              <p className="text-xl font-black text-red-500">{fmt(results[results.length - 1]?.monthly || 0)}</p>
              <p className="text-xs text-muted-foreground truncate">{results[results.length - 1]?.name}</p>
            </div>
          </div>
        </div>

        {/* Results table */}
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground">Cost Comparison — {MODELS.length} Models</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Sort by:
              {(["cost", "name", "provider"] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2 py-1 rounded-lg capitalize transition-colors ${sortBy === s ? "bg-[#5BA8A0] text-white font-semibold" : "bg-muted/50 hover:bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Model</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Per call</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Daily</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">Monthly</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Context</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Input $/1M</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Output $/1M</th>
                </tr>
              </thead>
              <tbody>
                {results.map((m, i) => (
                  <tr key={m.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i === 0 ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">Cheapest</span>}
                        <div>
                          <p className="font-semibold text-foreground">{m.name}</p>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ background: PROVIDER_COLORS[m.provider] || "#888" }}>
                            {m.provider}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-foreground">{fmt(m.perCall)}</td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-foreground">{fmt(m.daily)}</td>
                    <td className="text-right px-6 py-3 font-mono font-bold text-foreground"
                      style={{ color: m.monthly === cheapest?.monthly ? "#16a34a" : undefined }}>
                      {fmt(m.monthly)}
                    </td>
                    <td className="text-right px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{m.context}</td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">${m.input}</td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">${m.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-xs text-muted-foreground border-t border-border">
            <Info className="w-3 h-3 inline mr-1" />
            Prices updated Q1 2026. Always check official provider pricing pages for the latest rates.
          </p>
        </div>

        {/* Contextual upgrade CTA */}
        <TentpoleBanner
          context="calculated"
          headline={`You could save ${fmt(cheapest.monthly * 0.4)}–${fmt(cheapest.monthly * 0.8)}/month with auto-routing`}
          body={`At your current usage, Svivva's model router picks the cheapest model that meets your quality bar — cutting costs 40–80% without changing your prompts. Cheapest option right now: ${cheapest.name} at ${fmt(cheapest.monthly)}/mo.`}
          ctaText="Start saving — free"
        />

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
          {[
            { q: "How are AI API costs calculated?", a: "AI APIs charge per token — roughly 4 characters or ¾ of a word. You're billed separately for input tokens (your prompt) and output tokens (the AI's response). This calculator multiplies your token counts by the per-million-token rate for each model." },
            { q: "Which model gives the best price/performance ratio?", a: "GPT-4o mini, Claude 3.5 Haiku, and Gemini 1.5 Flash are generally the best value for most tasks. They're 10-50x cheaper than their premium counterparts with 80-90% of the quality for standard tasks." },
            { q: "How accurate is this calculator?", a: "Very accurate for planning purposes. Prices are sourced directly from provider pricing pages. Real usage may vary slightly if your token counts differ from estimates, or if providers run promotions." },
            { q: "What's a typical token count for a chatbot message?", a: "A short user message is 50-150 tokens. A detailed system prompt is 200-1,000 tokens. A typical API response is 100-500 tokens. Combined, a single chat turn costs roughly 300-1,500 tokens." },
            { q: "Can I reduce my AI API costs automatically?", a: "Yes — tools like Svivva can route requests to the cheapest model that meets a quality threshold, automatically falling back to premium models only when needed." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">More free developer tools:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link href="/tools/json-schema-validator" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground">
              JSON Schema Validator
            </Link>
            <Link href="/tools/prompt-forge" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground">
              PromptForge
            </Link>
            <Link href="/tools" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground flex items-center gap-1">
              All Tools <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
      <TentpoleStickyBar
        toolName="ai-api-cost-calculator"
        triggerAfterMs={15000}
        savingsLine={`Your cheapest option is ${cheapest.name} at ${fmt(cheapest.monthly)}/mo — Svivva can route there automatically.`}
      />
    </div>
  );
}
