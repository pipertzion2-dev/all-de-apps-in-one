"use client";

import { Bot, Terminal } from "lucide-react";

/** Explains how Cloud Agent uses this session's AI — no external API key. */
export function OrbitAgentModeCard() {
  return (
    <div
      id="orbit-agent-mode"
      data-testid="orbit-agent-mode"
      className="rounded-xl border-2 border-violet-500/40 bg-violet-500/8 p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-violet-500/15 shrink-0">
          <Bot className="w-5 h-5 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="font-bold text-sm tracking-tight text-foreground">
            Cursor Cloud Agent mode — no API key
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI model in your Cloud Agent session can write SEO pages and blog posts and publish
            them straight to your site. Orbit ingests agent-authored JSON — you never paste EasyPeasy
            or OpenAI keys.
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-card/60 border border-border/60 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-sans font-bold text-[10px] mb-1">
          <Terminal className="w-3 h-3" /> From this repo (agent or terminal)
        </div>
        cd Svivva
        <br />
        node scripts/orbit.mjs ingest scripts/orbit-agent-content.json
        <br />
        node scripts/orbit.mjs complete
      </div>
      <p className="text-[10px] text-muted-foreground">
        Ask your Cloud Agent: &quot;Write Orbit SEO content and ingest it&quot; — it uses{" "}
        <strong className="text-foreground">this session&apos;s model</strong>, not EasyPeasy.
      </p>
    </div>
  );
}
