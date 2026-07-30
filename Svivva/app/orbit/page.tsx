"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCodeForm } from "@/components/admin-code-form";
import {
  Rocket,
  Globe,
  CheckCircle,
  ArrowRight,
  FileText,
  BarChart3,
  Search,
  Megaphone,
  Loader2,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#00E5FF";

const FUNNEL_STEPS = [
  {
    num: "1",
    icon: Globe,
    title: "Connect Your Project",
    description: "Orbit discovers pages, tools, and gaps against your live site URL.",
  },
  {
    num: "2",
    icon: FileText,
    title: "AI Generates SEO Content",
    description: "Landing pages, comparisons, and blog posts targeting high-intent keywords.",
  },
  {
    num: "3",
    icon: Search,
    title: "Search Engine Submission",
    description: "IndexNow + sitemap pings so indexing can start within hours.",
  },
  {
    num: "4",
    icon: Megaphone,
    title: "Social & Launch Pack",
    description: "Launch kit copy for Product Hunt, Show HN, LinkedIn, Reddit, and more.",
  },
  {
    num: "5",
    icon: BarChart3,
    title: "Track & Grow",
    description: "Mission Control gauges pages, index health, and autopilot tasks.",
  },
];

type OrbitStatus = {
  totalPages?: number;
  pagesPercent?: number;
  indexedPercent?: number;
  preflight?: { warnings?: string[]; orbitFreeAi?: boolean };
  error?: string;
};

export default function OrbitPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectUrl, setProjectUrl] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchSummary, setLaunchSummary] = useState<string | null>(null);

  const { data: me, isLoading: meLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });
  const isAdmin = me?.isAdmin ?? false;

  const { data: status, refetch: refetchStatus } = useQuery<OrbitStatus | null>({
    queryKey: ["/api/orbit/status", "public-orbit"],
    enabled: isAdmin,
    queryFn: async () => {
      const r = await fetch("/api/orbit/status", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
  });

  const handleLaunch = async () => {
    if (!isAdmin) {
      toast({
        title: "Unlock Orbit admin first",
        description: "Enter the admin code below, then launch.",
        duration: 4000,
      });
      return;
    }
    setLaunching(true);
    setLaunchSummary(null);
    try {
      const r = await fetch("/api/orbit/auto-complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUrl: projectUrl.trim() || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Launch failed");
      setLaunchSummary(data.summary || "Orbit auto-complete finished.");
      await refetchStatus();
      toast({
        title: "Orbit ran for real",
        description: "Marketing gaps filled / indexing steps executed.",
        duration: 5000,
      });
    } catch (e) {
      toast({
        title: "Orbit launch failed",
        description: e instanceof Error ? e.message : "Try Mission Control",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link href="/dashboard/orbit">
          <Button
            variant="outline"
            className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-700"
            size="sm"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Mission Control
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Marketing Autopilot
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Orbit</span>
            <span className="text-white"> — Launch for real</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Unlock with the admin code, then run the same auto-complete engine as Mission Control —
            not a simulated demo.
          </p>
        </div>

        {!isAdmin && !meLoading && (
          <div className="mb-10">
            <AdminCodeForm
              title="Unlock Orbit"
              description="Enter the 6-digit admin code to enable live Orbit APIs on this device."
              onSuccess={async () => {
                await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                await queryClient.invalidateQueries({ queryKey: ["/api/orbit/status"] });
                toast({ title: "Orbit unlocked", duration: 2500 });
              }}
            />
          </div>
        )}

        {isAdmin && (
          <div className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Admin unlocked</p>
              <p className="text-white/60 mt-1">
                Live status
                {status
                  ? `: ${status.totalPages ?? "—"} marketing pages · ${status.pagesPercent ?? 0}% of target · index ~${status.indexedPercent ?? 0}%`
                  : " loading…"}
              </p>
              {status?.preflight?.warnings?.length ? (
                <ul className="mt-2 space-y-1 text-amber-200/90">
                  {status.preflight.warnings.slice(0, 3).map((w) => (
                    <li key={w} className="flex gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 mb-10">
          <label className="text-sm text-white/70">Project URL (optional)</label>
          <Input
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://your-app.com"
            className="bg-slate-900/80 border-slate-700 text-white"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="gap-2 text-black font-semibold"
              style={{ background: TEAL }}
              disabled={launching || !isAdmin}
              onClick={() => void handleLaunch()}
              data-testid="button-orbit-launch-live"
            >
              {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              Run Orbit auto-complete
            </Button>
            <Link href="/dashboard/launchpad" className="sm:ml-auto">
              <Button variant="outline" className="w-full border-slate-600 text-white gap-2">
                <ListChecks className="w-4 h-4" /> Full Mission Control
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {launchSummary ? (
            <pre className="text-xs whitespace-pre-wrap text-white/70 bg-black/30 rounded-lg p-3 max-h-48 overflow-auto">
              {launchSummary}
            </pre>
          ) : null}
        </div>

        <div className="space-y-4 mb-12">
          {FUNNEL_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold"
                  style={{ background: `${TEAL}22`, color: TEAL }}
                >
                  {s.num}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="w-4 h-4" style={{ color: TEAL }} />
                    {s.title}
                  </div>
                  <p className="text-sm text-white/55 mt-1">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/40">
          Passcode unlocks cookie-based admin access for Orbit APIs. Use Mission Control for step-by-step
          autopilot, IndexNow, and growth tools.
        </p>
      </div>
    </div>
  );
}
