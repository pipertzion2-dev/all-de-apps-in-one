"use client";

/**
 * Visual Orbit admin mission board — lanes for automation type + domain progress.
 * Admin-only surface (rendered inside /dashboard/launchpad).
 */

import { useMemo } from "react";
import {
  Zap,
  Key,
  MousePointerClick,
  CheckCircle2,
  Circle,
  Shield,
  CreditCard,
  Globe,
  Radar,
  Package,
  Lock,
} from "lucide-react";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

type Lane = "auto" | "credential" | "manual" | "done";

type MissionItem = {
  id: string;
  label: string;
  lane: Lane;
  done: boolean;
  hint?: string;
};

type MissionDomain = {
  id: string;
  title: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  items: MissionItem[];
};

type Props = {
  stepStatuses: Record<string, string>;
  orbitStatus?: Record<string, unknown> | null;
  svivvaTotal: number;
  svivvaDone: number;
  miniTotal: number;
  miniDone: number;
  index22Total: number;
  index22Done: number;
};

const LANE_META: Record<
  Lane,
  { label: string; sub: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  auto: {
    label: "Automated",
    sub: "Orbit runs these — click Gold Run or per-step",
    icon: Zap,
    color: TEAL,
  },
  credential: {
    label: "Keys → Auto",
    sub: "Save API keys once; autopilot publishes",
    icon: Key,
    color: "#f59e0b",
  },
  manual: {
    label: "Manual",
    sub: "One-click opens platform; you paste or confirm",
    icon: MousePointerClick,
    color: "#94a3b8",
  },
  done: {
    label: "Complete",
    sub: "Finished — compounding traffic",
    icon: CheckCircle2,
    color: "#4ade80",
  },
};

function ProgressRing({
  pct,
  size = 88,
  stroke = 7,
  color = TEAL,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function OrbitAdminMissionBoard({
  stepStatuses,
  orbitStatus,
  svivvaTotal,
  svivvaDone,
  miniTotal,
  miniDone,
  index22Total,
  index22Done,
}: Props) {
  const s = orbitStatus ?? {};
  const stepDone = (id: string) => stepStatuses[id] === "done";

  const domains: MissionDomain[] = useMemo(
    () => [
      {
        id: "infra",
        title: "Infrastructure",
        icon: Shield,
        color: TEAL,
        items: [
          {
            id: "svivva-indexnow",
            label: "IndexNow key + ping",
            lane: "auto",
            done: stepDone("svivva-indexnow") || Boolean(s.indexNowKey),
            hint: "Bing, Yandex, Yahoo",
          },
          {
            id: "svivva-submit",
            label: "Sitemap + GSC API submit",
            lane: "credential",
            done: stepDone("svivva-submit"),
            hint: "GSC service account at /dashboard/gsc-connect",
          },
          {
            id: "stripe",
            label: "Stripe subscriber payments",
            lane: "credential",
            done: Boolean(s.stripeConnected),
            hint: "Connect in Orbit → Stripe tab",
          },
        ],
      },
      {
        id: "content",
        title: "Content engine",
        icon: Globe,
        color: BURG,
        items: [
          {
            id: "svivva-seo-pages",
            label: "40 SEO landing pages",
            lane: "auto",
            done: stepDone("svivva-seo-pages"),
          },
          {
            id: "svivva-comparisons",
            label: "20 competitor comparisons",
            lane: "auto",
            done: stepDone("svivva-comparisons"),
          },
          {
            id: "svivva-blog",
            label: "10 blog articles",
            lane: "auto",
            done: stepDone("svivva-blog"),
          },
          {
            id: "svivva-aeo",
            label: "15 AEO / AI search pages",
            lane: "auto",
            done: stepDone("svivva-aeo"),
          },
          {
            id: "svivva-schema",
            label: "Schema JSON-LD on homepage",
            lane: "manual",
            done: stepDone("svivva-schema"),
            hint: "Copy from Results → site <head>",
          },
        ],
      },
      {
        id: "distribution",
        title: "Distribution",
        icon: Package,
        color: "#c06010",
        items: [
          {
            id: "svivva-directories",
            label: "100+ directory listings (generated)",
            lane: "auto",
            done: stepDone("svivva-directories"),
          },
          {
            id: "dir-submit",
            label: "Submit to Product Hunt, G2, etc.",
            lane: "manual",
            done: false,
            hint: "Paste listings — cannot auto-sign-up",
          },
          {
            id: "svivva-parasite",
            label: "Dev.to / Medium articles (drafts)",
            lane: "auto",
            done: stepDone("svivva-parasite"),
          },
          {
            id: "pub-devto",
            label: "Dev.to + Hashnode publish",
            lane: "credential",
            done: false,
            hint: "Autopilot tab → API keys",
          },
          {
            id: "svivva-social",
            label: "Social launch pack",
            lane: "auto",
            done: stepDone("svivva-social"),
          },
          {
            id: "linkedin",
            label: "LinkedIn posts",
            lane: "manual",
            done: false,
            hint: "Manual only — not automated",
          },
        ],
      },
      {
        id: "index22",
        title: "Index 22 (production SEO)",
        icon: Radar,
        color: "#0ea5e9",
        items: [
          {
            id: "index22-batch",
            label: `${index22Done}/${index22Total} phases complete`,
            lane: "auto",
            done: index22Done >= index22Total,
            hint: "Gold Run or Index 22 tab",
          },
        ],
      },
      {
        id: "mini",
        title: "Mini-app traffic",
        icon: Zap,
        color: "#7c3aed",
        items: [
          {
            id: "mini-hub",
            label: `Mini apps hub + SEO (${miniDone}/${miniTotal})`,
            lane: "auto",
            done: miniDone >= miniTotal,
          },
        ],
      },
    ],
    [s, stepDone, index22Done, index22Total, miniDone, miniTotal],
  );

  const allItems = domains.flatMap((d) => d.items);

  const overallTotal = svivvaTotal + miniTotal + index22Total;
  const overallDone = svivvaDone + miniDone + index22Done;
  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1117] via-[#12151c] to-[#0d1117] overflow-hidden">
      <div className="px-4 py-4 border-b border-white/8 flex items-start gap-4">
        <div className="relative">
          <ProgressRing pct={overallPct} color={overallPct === 100 ? "#4ade80" : TEAL} />
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
            <span className="text-lg font-black text-white tabular-nums">{overallPct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-black text-white">Orbit mission board</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15">
              <Lock className="w-2.5 h-2.5" />
              Admin only
            </span>
          </div>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">
            {overallDone}/{overallTotal} pipeline steps · svivva {svivvaDone}/{svivvaTotal} · Index
            22 {index22Done}/{index22Total} · mini {miniDone}/{miniTotal}
          </p>
        </div>
      </div>

      {/* Lane legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-white/6 bg-black/20">
        {(["auto", "credential", "manual", "done"] as Lane[]).map((lane) => {
          const meta = LANE_META[lane];
          const Icon = meta.icon;
          const pending =
            lane === "done"
              ? allItems.filter((i) => i.done).length
              : allItems.filter((i) => !i.done && i.lane === lane).length;
          return (
            <div
              key={lane}
              className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: meta.color }}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-bold text-white/85">{meta.label}</span>
                <span
                  className="ml-auto text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
                  style={{ background: `${meta.color}18`, color: meta.color }}
                >
                  {lane === "done" ? allItems.filter((i) => i.done).length : pending}
                </span>
              </div>
              <p className="text-[10px] text-white/35 leading-snug">{meta.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Domain swimlanes */}
      <div className="p-3 space-y-3 max-h-[420px] overflow-y-auto">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const doneInDomain = domain.items.filter((i) => i.done).length;
          return (
            <div key={domain.id} className="rounded-xl border border-white/8 overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 border-b border-white/6"
                style={{ background: `${domain.color}10` }}
              >
                <span style={{ color: domain.color, display: "flex" }}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-white/90">{domain.title}</span>
                <span className="ml-auto text-[10px] text-white/40 tabular-nums">
                  {doneInDomain}/{domain.items.length}
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {domain.items.map((item) => {
                  const lane = item.done ? "done" : item.lane;
                  const meta = LANE_META[lane];
                  const LaneIcon = meta.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-3 py-2 ${item.done ? "opacity-55" : ""}`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[11px] font-medium truncate ${item.done ? "line-through text-white/40" : "text-white/80"}`}
                        >
                          {item.label}
                        </p>
                        {item.hint && (
                          <p className="text-[10px] text-white/30 truncate">{item.hint}</p>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${meta.color}15`, color: meta.color }}
                      >
                        <LaneIcon className="w-2.5 h-2.5" />
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-white/8 bg-black/30 flex flex-wrap items-center gap-3 text-[10px] text-white/40">
        <span className="inline-flex items-center gap-1">
          <span style={{ color: TEAL, display: "flex" }}>
            <CreditCard className="w-3 h-3" />
          </span>
          Stripe + GSC = connect once
        </span>
        <span>·</span>
        <span>Gold Run automates Index 22 → marketing batches</span>
        <span>·</span>
        <span>LinkedIn stays manual</span>
      </div>
    </div>
  );
}
