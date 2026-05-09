"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface ApexCycle {
  id: string;
  triggeredAt: string;
  completedAt: string | null;
  status: string;
  failurePattern: string | null;
  sampleInputs: string[] | null;
  promptBefore: string;
  promptAfter: string | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
  casesRun: number;
  promoted: boolean;
  rolledBack: boolean;
  skipReason: string | null;
}

interface CyclesResponse {
  cycles: ApexCycle[];
  totalCalls: number;
  project: { name: string; id: string };
}

function StatusBadge({ status, rolledBack }: { status: string; rolledBack: boolean }) {
  if (rolledBack)
    return (
      <Badge variant="outline" className="border-orange-400 text-orange-400">
        Rolled Back
      </Badge>
    );
  if (status === "promoted") return <Badge className="bg-teal-600 text-white">Promoted</Badge>;
  if (status === "skipped")
    return (
      <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
        Skipped
      </Badge>
    );
  if (status === "running")
    return (
      <Badge variant="outline" className="border-blue-400 text-blue-400 animate-pulse">
        Running
      </Badge>
    );
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function ScoreDelta({ before, after }: { before: number | null; after: number | null }) {
  if (before === null || after === null)
    return <span className="text-muted-foreground text-sm">—</span>;
  const delta = after - before;
  const color = delta > 0 ? "text-teal-500" : delta < 0 ? "text-red-400" : "text-muted-foreground";
  return (
    <span className={`font-mono text-sm font-bold ${color}`}>
      {before}% → {after}% ({delta > 0 ? "+" : ""}
      {delta}pts)
    </span>
  );
}

function CycleCard({ cycle, projectId }: { cycle: ApexCycle; projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const rollback = useMutation({
    mutationFn: () =>
      fetch(`/api/apex/${projectId}/rollback/${cycle.id}`, { method: "POST" }).then((r) =>
        r.json(),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/apex", projectId, "cycles"] }),
  });

  const ts = new Date(cycle.triggeredAt).toLocaleString();

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={cycle.status} rolledBack={cycle.rolledBack} />
            <span className="text-xs text-muted-foreground">{ts}</span>
            {cycle.casesRun > 0 && (
              <span className="text-xs text-muted-foreground">{cycle.casesRun} eval cases</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cycle.promoted && !cycle.rolledBack && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-orange-400 text-orange-400 hover:bg-orange-400/10"
                      onClick={() => rollback.mutate()}
                      disabled={rollback.isPending}
                      data-testid={`rollback-cycle-${cycle.id}`}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      {rollback.isPending ? "Rolling back…" : "Rollback"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restore the prompt from before this cycle</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {cycle.failurePattern && (
          <p className="text-sm text-foreground/80 mt-1 font-medium">⚡ {cycle.failurePattern}</p>
        )}
        {cycle.skipReason && (
          <p className="text-sm text-muted-foreground mt-1 italic">{cycle.skipReason}</p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {(cycle.scoreBefore !== null || cycle.scoreAfter !== null) && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Eval Score
              </p>
              <ScoreDelta before={cycle.scoreBefore} after={cycle.scoreAfter} />
            </div>
          )}

          {cycle.sampleInputs && cycle.sampleInputs.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Sample Failing Inputs
              </p>
              <ul className="space-y-1">
                {cycle.sampleInputs.map((inp, i) => (
                  <li key={i} className="text-xs bg-muted/40 rounded px-2 py-1 font-mono truncate">
                    {inp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cycle.promptAfter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Prompt Before
                </p>
                <pre className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                  {cycle.promptBefore}
                </pre>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Prompt After
                </p>
                <pre className="text-xs bg-teal-900/20 border border-teal-600/30 rounded p-2 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                  {cycle.promptAfter}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ApexPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CyclesResponse>({
    queryKey: ["/api/apex", projectId, "cycles"],
    queryFn: () => fetch(`/api/apex/${projectId}/cycles`).then((r) => r.json()),
    refetchInterval: 8000,
  });

  const triggerCycle = useMutation({
    mutationFn: () =>
      fetch(`/api/apex/${projectId}/cycle`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/apex", projectId, "cycles"] }),
  });

  const cycles = data?.cycles ?? [];
  const promotedCount = cycles.filter((c) => c.promoted && !c.rolledBack).length;
  const totalCalls = data?.totalCalls ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-500" />
            <h1 className="text-xl font-bold">APEX</h1>
            <Badge variant="outline" className="text-xs border-teal-600/50 text-teal-500 font-mono">
              Autonomous Prompt Evolution eXecutor
            </Badge>
          </div>
          {data?.project && (
            <p className="text-sm text-muted-foreground mt-0.5">{data.project.name}</p>
          )}
        </div>
      </div>

      {/* What is APEX */}
      <Card className="border border-teal-600/30 bg-teal-950/10">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            <span className="font-semibold text-teal-400">
              APEX runs autonomously after deploy.
            </span>{" "}
            It watches every live API call, detects failure patterns, generates an improved prompt,
            evaluates it against your test suite, and promotes it only if quality improves — all
            without you lifting a finger. Each cycle is fully reversible.
          </p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Activity, label: "Calls Logged", value: totalCalls.toLocaleString() },
          { icon: TrendingUp, label: "Auto-Promotions", value: promotedCount },
          { icon: CheckCircle, label: "Cycles Run", value: cycles.length },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border border-border/50">
            <CardContent className="pt-4 pb-3 text-center">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Evolution Cycles</h2>
          <p className="text-xs text-muted-foreground">
            Cycles run automatically as traffic grows. Trigger one manually anytime.
          </p>
        </div>
        <Button
          onClick={() => triggerCycle.mutate()}
          disabled={triggerCycle.isPending}
          className="bg-teal-700 hover:bg-teal-600 text-white"
          data-testid="trigger-apex-cycle"
        >
          <Zap className="w-4 h-4 mr-2" />
          {triggerCycle.isPending ? "Running Cycle…" : "Run APEX Cycle"}
        </Button>
      </div>

      {/* Pending result */}
      {triggerCycle.data && (
        <Card
          className={`border ${triggerCycle.data.status === "promoted" ? "border-teal-600/60 bg-teal-950/10" : "border-border/50"}`}
        >
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            {triggerCycle.data.status === "promoted" ? (
              <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
            ) : triggerCycle.data.status === "skipped" ? (
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold capitalize">{triggerCycle.data.status}</p>
              <p className="text-xs text-muted-foreground">{triggerCycle.data.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cycle list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : cycles.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40">
          <CardContent className="py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No cycles yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              APEX needs at least 5 live API calls before it can analyze and improve your prompt.
              Make some calls to your deployed endpoint, then run a cycle.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
