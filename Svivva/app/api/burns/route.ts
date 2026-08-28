import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  BURNS_NODES,
  BURNS_STAGE_LABELS,
  burnsEdges,
  burnsEstimatedSeconds,
  burnsExecutionOrder,
} from "@/lib/burns/burns-graph";
import { loadBurnsRuns } from "@/lib/burns/burns-store";

export const dynamic = "force-dynamic";

/** Burns System graph + recent run history. Admin only. */
export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const runs = await loadBurnsRuns();
  return NextResponse.json({
    nodes: BURNS_NODES,
    edges: burnsEdges(),
    stageLabels: BURNS_STAGE_LABELS,
    order: burnsExecutionOrder().map((n) => n.id),
    estimatedSeconds: burnsEstimatedSeconds(),
    schedule: "Daily 06:00 UTC",
    lastRun: runs[0] ?? null,
    history: runs.slice(0, 7),
  });
}
