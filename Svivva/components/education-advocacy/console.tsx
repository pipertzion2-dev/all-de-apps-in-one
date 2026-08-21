"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Scale,
  Megaphone,
  Bot,
  HeartPulse,
  Users,
  Compass,
  Briefcase,
  ScrollText,
  Shield,
  Archive,
  Link2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ADVOCACY_CHANNELS,
  CHANNEL_LABELS,
  type AdvocacyChannelId,
  type ChannelWeights,
} from "@/lib/education-advocacy/types";
import { ROLE_BOUNDARY, RISK_CLASSIFICATION_NOTICE } from "@/lib/education-advocacy/disclaimers";

const ICONS: Record<AdvocacyChannelId, typeof BookOpen> = {
  education: BookOpen,
  student_rights_law: Scale,
  advocacy: Megaphone,
  ai_guide: Bot,
  crisis_safety: HeartPulse,
  human_assistance: Users,
  opportunity_resources: Compass,
  career_pathways: Briefcase,
  story_timeline: ScrollText,
  cybersecurity: Shield,
  evidence_vault: Archive,
  verification_ledger: Link2,
};

const HREF: Partial<Record<AdvocacyChannelId, string>> = {
  education: "/dashboard/education-advocacy",
  student_rights_law: "/dashboard/education-advocacy/rights",
  advocacy: "/dashboard/education-advocacy/protect",
  ai_guide: "/dashboard/education-advocacy/chat",
  crisis_safety: "/dashboard/education-advocacy/crisis",
  human_assistance: "/dashboard/education-advocacy/help",
  opportunity_resources: "/dashboard/education-advocacy/help",
  career_pathways: "/dashboard/education-advocacy",
  story_timeline: "/dashboard/education-advocacy/timeline",
  cybersecurity: "/dashboard/security",
  evidence_vault: "/dashboard/education-advocacy/vault",
  verification_ledger: "/education/verify",
};

type PresetRow = {
  id: string;
  label: string;
  description: string;
  weights: ChannelWeights;
};

type MixResult = {
  weights: ChannelWeights;
  enabled: Record<AdvocacyChannelId, boolean>;
  reasons: Array<{ channel: string; reason: string; weightDelta: number }>;
  safetyOverride: boolean;
  notice: string;
  synthesisHints: string[];
};

const UX_PILLARS = [
  { label: "Your Education", href: "/dashboard/education-advocacy" },
  { label: "Your Rights", href: "/dashboard/education-advocacy/rights" },
  { label: "Access & Coercion Review", href: "/dashboard/education-advocacy/coercion-review" },
  { label: "Timeline Reconstruction", href: "/dashboard/education-advocacy/timeline" },
  { label: "Your Story", href: "/dashboard/education-advocacy/protect" },
  { label: "Your Evidence", href: "/dashboard/education-advocacy/vault" },
  { label: "Your Proof", href: "/education/verify" },
  { label: "Your Safety", href: "/dashboard/education-advocacy/crisis" },
  { label: "People Who Can Help", href: "/dashboard/education-advocacy/help" },
];

const ENTRY_PATHS = [
  {
    title: "I have a new situation",
    body: "Start blank. Reconstruct a timeline or review education access in your own words.",
    href: "/dashboard/education-advocacy/timeline",
    cta: "Start timeline",
  },
  {
    title: "I’m helping someone",
    body: "Support a student, parent, or peer with AI-guided documentation — keep their privacy in mind.",
    href: "/dashboard/education-advocacy/coercion-review",
    cta: "Open access review",
  },
  {
    title: "Explore advocacy with AI",
    body: "Learn rights, ask the guide, or browse verified help before sharing a full story.",
    href: "/dashboard/education-advocacy/chat",
    cta: "Open AI guide",
  },
];

export function EducationAdvocacyConsole() {
  const [presets, setPresets] = useState<PresetRow[]>([]);
  const [presetId, setPresetId] = useState<string>("protect_my_education");
  const [weights, setWeights] = useState<ChannelWeights | null>(null);
  const [enabled, setEnabled] = useState<Partial<Record<AdvocacyChannelId, boolean>>>({});
  const [situation, setSituation] = useState("");
  const [mix, setMix] = useState<MixResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/education-advocacy/orchestrate")
      .then((r) => r.json())
      .then((data) => {
        setPresets(data.presets || []);
        const protect = (data.presets || []).find(
          (p: PresetRow) => p.id === "protect_my_education",
        );
        if (protect) setWeights(protect.weights);
      })
      .catch(() => undefined);
  }, []);

  const applyPreset = useCallback(
    (id: string) => {
      setPresetId(id);
      const p = presets.find((x) => x.id === id);
      if (p) setWeights({ ...p.weights });
    },
    [presets],
  );

  const runMix = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/education-advocacy/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: situation,
          presetId,
          weightOverrides: weights || undefined,
          enabledChannels: enabled,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMix(data);
        setWeights(data.weights);
      }
    } finally {
      setBusy(false);
    }
  }, [situation, presetId, weights, enabled]);

  const ordered = useMemo(() => {
    if (!weights) return ADVOCACY_CHANNELS;
    return [...ADVOCACY_CHANNELS].sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
  }, [weights]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Advocate Bus · CH 17–24
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Education Advocacy Console
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
          Built for new situations — whether this happened to you, you’re helping someone else, or
          you want AI-guided education advocacy tools. Move from uncertainty to action: Understand →
          Document → Verify → Protect → Advocate → Find Human Help.
        </p>
        <p className="text-xs text-muted-foreground border-l-2 border-amber-500/50 pl-3">
          {ROLE_BOUNDARY}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ENTRY_PATHS.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md p-4 space-y-2 hover:border-[#5B8DA8]/50 transition-colors"
          >
            <p className="text-sm font-semibold tracking-tight">{p.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
            <p className="text-xs text-[#8EB8C8] pt-1">{p.cta} →</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {UX_PILLARS.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md border border-border/60 bg-background/40 hover:bg-muted/60 transition-colors"
          >
            {p.label}
          </Link>
        ))}
        <Link
          href="/dashboard/education-advocacy/crisis"
          className="text-xs sm:text-sm px-3 py-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 transition-colors inline-flex items-center gap-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> I Need Help Now
        </Link>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Console presets</CardTitle>
          <CardDescription>
            Each preset sets faders; you can still edit every channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={presetId === p.id ? "default" : "outline"}
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Describe a situation (optional)</CardTitle>
            <CardDescription>
              Leave blank to explore tools, or write a new situation in your own words. OaaS adjusts
              channel weighting from context — {RISK_CLASSIFICATION_NOTICE}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={5}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Example: I’m helping a student who missed three weeks of school after a housing change…"
              className="bg-background/50"
            />
            <Button onClick={() => void runMix()} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update mix
            </Button>
            {mix?.safetyOverride ? (
              <div className="text-sm rounded-md border border-rose-500/40 bg-rose-500/10 p-3">
                Safety-critical routing is elevated. Open{" "}
                <Link href="/dashboard/education-advocacy/crisis" className="underline">
                  I Need Help Now
                </Link>{" "}
                for verified resources.
              </div>
            ) : null}
            {mix?.synthesisHints?.length ? (
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                {mix.synthesisHints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick paths</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              ["AI Advocacy Guide", "/dashboard/education-advocacy/chat"],
              ["Timeline Reconstruction", "/dashboard/education-advocacy/timeline"],
              ["Access & Coercion Review", "/dashboard/education-advocacy/coercion-review"],
              ["Protect My Education", "/dashboard/education-advocacy/protect"],
              ["Know My Rights", "/dashboard/education-advocacy/rights"],
              ["Education Proof Vault", "/dashboard/education-advocacy/vault"],
              ["Verify a Proof Receipt", "/education/verify"],
              ["Human Assistance", "/dashboard/education-advocacy/help"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm px-3 py-2 rounded-md border border-border/50 hover:bg-muted/40 transition-colors"
              >
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ordered.map((id) => {
          const Icon = ICONS[id];
          const value = weights?.[id] ?? 0;
          const on = enabled[id] ?? true;
          const href = HREF[id];
          return (
            <div
              key={id}
              className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-[#5B8DA8]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{CHANNEL_LABELS[id]}</p>
                    {href ? (
                      <Link
                        href={href}
                        className="text-[11px] text-muted-foreground hover:underline"
                      >
                        Open channel
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {value}%
                  </Badge>
                  <Switch
                    checked={on}
                    onCheckedChange={(checked) =>
                      setEnabled((prev) => ({ ...prev, [id]: checked }))
                    }
                    aria-label={`Toggle ${CHANNEL_LABELS[id]}`}
                  />
                </div>
              </div>
              <Slider
                value={[value]}
                max={100}
                step={5}
                disabled={!on}
                onValueChange={([v]) =>
                  setWeights((prev) =>
                    prev ? { ...prev, [id]: v } : ({ [id]: v } as ChannelWeights),
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
