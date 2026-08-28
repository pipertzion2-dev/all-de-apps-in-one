"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Flame,
  Loader2,
  MinusCircle,
  Play,
  RefreshCw,
} from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { BurnsNode, BurnsStageId } from "@/lib/burns/burns-graph";
import type { BurnsNodeResult, BurnsNodeStatus, BurnsRunResult } from "@/lib/burns/burns-runner";

const TEAL = "#5B8DA8";
const BURG = "#6B2C4E";

const COL_W = 208;
const NODE_W = 170;
const NODE_H = 66;
const V_GAP = 24;
const PAD = 18;

type BurnsPayload = {
  nodes: BurnsNode[];
  edges: { from: string; to: string }[];
  stageLabels: Record<BurnsStageId, string>;
  order: string[];
  estimatedSeconds: number;
  schedule: string;
  progress?:
    | { status: "idle" }
    | { status: "running"; startedAt: string }
    | { status: "complete"; run: BurnsRunResult }
    | { status: "failed"; error: string; startedAt: string };
  lastRun: BurnsRunResult | null;
  history: BurnsRunResult[];
};

function pickNewerRun(a: BurnsRunResult | null, b: BurnsRunResult | null): BurnsRunResult | null {
  if (!a) return b;
  if (!b) return a;
  return a.startedAt >= b.startedAt ? a : b;
}

/** Merge a partial run (single-node retry) into the last full run for the graph. */
function mergeBurnsRuns(
  previous: BurnsRunResult | null,
  partial: BurnsRunResult,
  order: string[],
): BurnsRunResult {
  const byId = new Map<string, BurnsNodeResult>();
  for (const n of previous?.nodes ?? []) byId.set(n.id, n);
  for (const n of partial.nodes) byId.set(n.id, n);
  const nodes = order.map((id) => byId.get(id)).filter((n): n is BurnsNodeResult => Boolean(n));
  return {
    ...(previous ?? partial),
    ...partial,
    nodes: nodes.length ? nodes : partial.nodes,
  };
}

const STATUS_COLOR: Record<BurnsNodeStatus, string> = {
  ok: "#34d399",
  failed: "#f87171",
  blocked: "#fbbf24",
  skipped: "#94a3b8",
  pending: "#475569",
};

function StatusIcon({ status, className = "" }: { status: BurnsNodeStatus; className?: string }) {
  if (status === "ok") return <CheckCircle2 className={`text-emerald-400 ${className}`} />;
  if (status === "failed") return <AlertTriangle className={`text-red-400 ${className}`} />;
  if (status === "blocked") return <MinusCircle className={`text-amber-400 ${className}`} />;
  if (status === "skipped") return <Clock className={`text-slate-400 ${className}`} />;
  return <Circle className={`text-muted-foreground ${className}`} />;
}

export function BurnsSystemGraph() {
  const [data, setData] = useState<BurnsPayload | null>(null);
  /** Client-side run snapshot — painted on the graph even when DB history is empty. */
  const [liveRun, setLiveRun] = useState<BurnsRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runNotice, setRunNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/burns");
      if (!res.ok) throw new Error(res.status === 403 ? "Admin access required" : "Failed to load");
      const payload = (await res.json()) as BurnsPayload;
      setData(payload);
      const fromApi =
        payload.progress?.status === "complete"
          ? payload.progress.run
          : payload.lastRun?.nodes?.length
            ? payload.lastRun
            : null;
      setLiveRun((prev) => pickNewerRun(prev, fromApi));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Burns System");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (only?: string[]) => {
      const isFullRun = !only?.length;
      setRunning(only?.length === 1 ? only[0] : "all");
      setError(null);
      setRunNotice(
        isFullRun ? "Running all nodes — keep this tab open. This can take several minutes." : null,
      );
      try {
        const res = await authFetch("/api/burns/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(only ? { only } : {}),
        });
        const json = (await res.json()) as { run?: BurnsRunResult; error?: string };
        if (!res.ok) throw new Error(json.error || "Run failed");
        if (!json.run?.nodes?.length) throw new Error("Run returned no node results");

        const merged = isFullRun
          ? json.run
          : mergeBurnsRuns(liveRun ?? data?.lastRun ?? null, json.run, data?.order ?? []);

        setLiveRun(merged);
        setData((prev) =>
          prev
            ? {
                ...prev,
                lastRun: merged,
                history: isFullRun ? [merged, ...prev.history].slice(0, 7) : prev.history,
              }
            : prev,
        );
        setRunNotice(
          merged.ok ? `Done — ${merged.summary}` : `Finished with issues — ${merged.summary}`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Run failed");
        setRunNotice(null);
      } finally {
        setRunning(null);
      }
    },
    [data?.lastRun, data?.order, liveRun],
  );

  const effectiveLastRun = liveRun ?? data?.lastRun ?? null;

  const ownerResult = effectiveLastRun?.nodes.find((n) => n.id === "owner");
  const showOwnerHint =
    ownerResult?.status === "failed" ||
    (ownerResult?.detail as { usedFallback?: boolean } | undefined)?.usedFallback;
  const showBlockedHint =
    (effectiveLastRun?.counts.blocked ?? 0) > 0 && ownerResult?.status !== "failed";

  const resultById = useMemo(() => {
    const map = new Map<string, BurnsNodeResult>();
    for (const n of effectiveLastRun?.nodes ?? []) map.set(n.id, n);
    return map;
  }, [effectiveLastRun]);

  const layout = useMemo(() => {
    if (!data) return null;
    const stages: BurnsStageId[] = [];
    for (const n of data.nodes) if (!stages.includes(n.stage)) stages.push(n.stage);

    const pos = new Map<string, { x: number; y: number }>();
    const columns = stages.map((stage, col) => {
      const nodes = data.nodes.filter((n) => n.stage === stage);
      nodes.forEach((n, row) => {
        pos.set(n.id, { x: PAD + col * COL_W, y: PAD + 26 + row * (NODE_H + V_GAP) });
      });
      return { stage, label: data.stageLabels[stage] ?? stage, x: PAD + col * COL_W, nodes };
    });

    const rows = Math.max(...columns.map((c) => c.nodes.length), 1);
    return {
      columns,
      pos,
      width: PAD * 2 + (stages.length - 1) * COL_W + NODE_W,
      height: PAD * 2 + 26 + rows * (NODE_H + V_GAP),
    };
  }, [data]);

  const selectedNode = data?.nodes.find((n) => n.id === selected) ?? null;
  const selectedResult = selected ? resultById.get(selected) : undefined;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading Burns System…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const showRunning = running !== null;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border-2 p-4 space-y-3"
        style={{
          borderColor: `${TEAL}44`,
          background: `linear-gradient(135deg,${TEAL}0a,${BURG}06)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Flame className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BURG }} />
            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground leading-tight">Burns System</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Every ZZAI feature run against zzaizzai.com itself, in dependency order.{" "}
                {data?.schedule ?? "Daily 06:00 UTC"} · {data?.nodes.length ?? 0} nodes · ~
                {Math.round((data?.estimatedSeconds ?? 0) / 60)} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => void run()}
              disabled={showRunning}
              className="gap-1.5 bg-[#6B2C4E] text-white"
              data-testid="button-burns-run-all"
            >
              {showRunning && running === "all" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {showRunning && running === "all" ? "Running…" : "Run now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={showRunning}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {effectiveLastRun ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span className="font-semibold text-foreground">
              Last run ({effectiveLastRun.trigger}): {effectiveLastRun.summary}
            </span>
            <span className="text-muted-foreground">
              {new Date(effectiveLastRun.finishedAt).toLocaleString()}
            </span>
            <span className="text-emerald-400">{effectiveLastRun.counts.ok} ok</span>
            {effectiveLastRun.counts.failed > 0 && (
              <span className="text-red-400">{effectiveLastRun.counts.failed} failed</span>
            )}
            {effectiveLastRun.counts.blocked > 0 && (
              <span className="text-amber-400">{effectiveLastRun.counts.blocked} blocked</span>
            )}
            {effectiveLastRun.counts.skipped > 0 && (
              <span className="text-slate-400">{effectiveLastRun.counts.skipped} skipped</span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            No run recorded yet — the scheduler runs at 06:00 UTC, or press Run now.
          </p>
        )}

        {error && <p className="text-[11px] text-destructive">{error}</p>}
        {runNotice && !error && (
          <p className="text-[11px] text-[#5B8DA8] font-medium">{runNotice}</p>
        )}

        {(showOwnerHint || showBlockedHint) && (
          <div
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] space-y-1.5"
            data-testid="burns-setup-hint"
          >
            {ownerResult?.status === "failed" ? (
              <>
                <p className="font-semibold text-amber-200">
                  Owner node failed — most downstream nodes are blocked.
                </p>
                <p className="text-muted-foreground">
                  Set <code className="bg-muted px-1 rounded">ADMIN_USER_ID</code> in Vercel to your
                  user id, or save Orbit credentials once from{" "}
                  <Link href="/dashboard/orbit" className="text-[#5B8DA8] underline">
                    Orbit
                  </Link>
                  .
                </p>
              </>
            ) : showOwnerHint ? (
              <>
                <p className="font-semibold text-amber-200">
                  Running as orbit-admin fallback — credentials may not match your account.
                </p>
                <p className="text-muted-foreground">
                  Set <code className="bg-muted px-1 rounded">ADMIN_USER_ID</code> in production for
                  your signed-in user, or connect GSC at{" "}
                  <Link href="/dashboard/gsc-connect" className="text-[#5B8DA8] underline">
                    GSC Connect
                  </Link>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-200">
                  {effectiveLastRun?.counts.blocked} node
                  {(effectiveLastRun?.counts.blocked ?? 0) === 1 ? "" : "s"} blocked by upstream
                  failures.
                </p>
                <p className="text-muted-foreground">
                  Click a red or amber node below for the error message, then fix the upstream node
                  and run again.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {layout && (
        <div
          className="rounded-2xl border border-border/60 bg-card/40 overflow-x-auto"
          data-testid="burns-graph"
        >
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label="Burns System task graph"
            className="min-w-full"
          >
            <defs>
              <marker
                id="burns-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={`${TEAL}99`} />
              </marker>
            </defs>

            {layout.columns.map((col) => (
              <text
                key={col.stage}
                x={col.x}
                y={PAD + 12}
                className="fill-muted-foreground"
                style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                {col.label}
              </text>
            ))}

            {data?.edges.map(({ from, to }) => {
              const a = layout.pos.get(from);
              const b = layout.pos.get(to);
              if (!a || !b) return null;
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              const active = selected === from || selected === to;
              return (
                <path
                  key={`${from}-${to}`}
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={active ? TEAL : `${TEAL}55`}
                  strokeWidth={active ? 2 : 1.25}
                  markerEnd="url(#burns-arrow)"
                />
              );
            })}

            {layout.columns.flatMap((col) =>
              col.nodes.map((node) => {
                const p = layout.pos.get(node.id)!;
                const result = resultById.get(node.id);
                const status: BurnsNodeStatus = result?.status ?? "pending";
                const isSel = selected === node.id;
                const isRunning = running === node.id || running === "all";
                return (
                  <g
                    key={node.id}
                    transform={`translate(${p.x},${p.y})`}
                    onClick={() => setSelected(isSel ? null : node.id)}
                    style={{ cursor: "pointer" }}
                    data-testid={`burns-node-${node.id}`}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={isSel ? `${TEAL}1f` : "rgba(15,23,42,0.55)"}
                      stroke={isSel ? TEAL : `${STATUS_COLOR[status]}88`}
                      strokeWidth={isSel ? 2 : 1.25}
                    />
                    <circle cx={13} cy={15} r={4} fill={STATUS_COLOR[status]}>
                      {isRunning && (
                        <animate
                          attributeName="opacity"
                          values="1;0.25;1"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>
                    <text
                      x={26}
                      y={18}
                      className="fill-foreground"
                      style={{ fontSize: 10.5, fontWeight: 700 }}
                    >
                      {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
                    </text>
                    <text x={13} y={36} className="fill-muted-foreground" style={{ fontSize: 9 }}>
                      ~{node.estimatedSeconds}s
                      {node.requires.length ? ` · ${node.requires.join(" ")}` : ""}
                    </text>
                    <text x={13} y={52} style={{ fontSize: 9, fill: STATUS_COLOR[status] }}>
                      {result
                        ? `${status}${result.durationMs ? ` · ${Math.round(result.durationMs / 100) / 10}s` : ""}`
                        : "not run"}
                    </text>
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      )}

      {selectedNode && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <StatusIcon status={selectedResult?.status ?? "pending"} className="w-4 h-4 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{selectedNode.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {selectedNode.stage} · ~{selectedNode.estimatedSeconds}s
                  {selectedNode.dependsOn.length
                    ? ` · after ${selectedNode.dependsOn.join(", ")}`
                    : " · no dependencies"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedNode.href && (
                <Link
                  href={selectedNode.href}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-[#5B8DA8]/40 text-[#5B8DA8]"
                >
                  Open <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void run([selectedNode.id])}
                disabled={running !== null}
                className="gap-1.5 text-[10px] h-7"
                data-testid="button-burns-run-node"
              >
                {running === selectedNode.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Run this node
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedNode.description}
          </p>
          {selectedResult && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1">
              <p className="text-[11px] text-foreground">{selectedResult.message}</p>
              {selectedResult.detail && (
                <pre className="text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedResult.detail, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {!!data?.history?.length && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
          <p className="text-[11px] font-black text-foreground mb-2">Recent runs</p>
          <ul className="space-y-1">
            {data.history.map((h) => (
              <li
                key={h.startedAt}
                className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground"
              >
                <StatusIcon status={h.ok ? "ok" : "failed"} className="w-3 h-3" />
                <span className="text-foreground">{new Date(h.startedAt).toLocaleString()}</span>
                <span>{h.trigger}</span>
                <span>{h.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
