import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  BURNS_NODES,
  BURNS_STAGE_LABELS,
  burnsEdges,
  burnsEstimatedSeconds,
  burnsExecutionOrder,
} from "@/lib/burns/burns-graph";
import { loadBurnsProgress, loadBurnsRuns, resolveBurnsLastRun } from "@/lib/burns/burns-store";

export const dynamic = "force-dynamic";

/** Burns System graph + recent run history. Admin only. */
export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [runs, progress, lastRun] = await Promise.all([
    loadBurnsRuns(),
    loadBurnsProgress(),
    resolveBurnsLastRun(),
  ]);

  return NextResponse.json({
    nodes: BURNS_NODES,
    edges: burnsEdges(),
    stageLabels: BURNS_STAGE_LABELS,
    order: burnsExecutionOrder().map((n) => n.id),
    estimatedSeconds: burnsEstimatedSeconds(),
    schedule: "Daily 06:00 UTC",
    progress,
    lastRun,
    history: runs.slice(0, 7),
  });
}
