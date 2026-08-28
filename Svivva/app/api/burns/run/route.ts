import { NextRequest, NextResponse } from "next/server";
import { isCronSecretAuthorized, isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runBurnsSystem } from "@/lib/burns/burns-runner";
import { recordBurnsAudit, saveBurnsRun, setBurnsProgress } from "@/lib/burns/burns-store";
import { getBurnsNode } from "@/lib/burns/burns-graph";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Execute the Burns graph. Admin (UI button) or CRON_SECRET (scheduler).
 *
 * Body: { only?: string[] } — subset for single-node retry.
 * Returns `{ run }` with per-node status so the UI can paint the graph without
 * relying on a separate DB round-trip (history persistence is best-effort).
 */
export async function POST(req: NextRequest) {
  const isCron = isCronSecretAuthorized(req);
  if (!isCron && !(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let only: string[] | undefined;
  try {
    const body = (await req.json()) as { only?: unknown };
    if (Array.isArray(body?.only)) {
      only = body.only.filter((id): id is string => typeof id === "string");
      const unknown = only.filter((id) => !getBurnsNode(id));
      if (unknown.length) {
        return NextResponse.json(
          { error: `Unknown Burns nodes: ${unknown.join(", ")}` },
          { status: 400 },
        );
      }
      if (!only.length) only = undefined;
    }
  } catch {
    /* no body — run everything */
  }

  const run = await runBurnsSystem({ trigger: isCron ? "cron" : "manual", only });

  if (!only) {
    await saveBurnsRun(run);
    await recordBurnsAudit(run);
    await setBurnsProgress({ status: "complete", run });
  }

  return NextResponse.json({ success: run.ok, run });
}
