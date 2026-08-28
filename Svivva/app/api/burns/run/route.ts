import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { isCronSecretAuthorized, isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { runBurnsSystem } from "@/lib/burns/burns-runner";
import {
  loadBurnsProgress,
  recordBurnsAudit,
  saveBurnsRun,
  setBurnsProgress,
} from "@/lib/burns/burns-store";
import { getBurnsNode } from "@/lib/burns/burns-graph";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RunBody = {
  only?: unknown;
  /** When true (default for full manual runs), respond immediately and run in the background. */
  async?: unknown;
};

/**
 * Execute the Burns graph. Admin (UI button) or CRON_SECRET (scheduler).
 *
 * Body: { only?: string[], async?: boolean }
 * - Full manual run: async background job (202) — avoids Vercel/browser timeouts.
 * - Single-node retry: synchronous (200) with `{ run }` in the body.
 */
export async function POST(req: NextRequest) {
  const isCron = isCronSecretAuthorized(req);
  if (!isCron && !(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let only: string[] | undefined;
  let runAsync = false;
  try {
    const body = (await req.json()) as RunBody;
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
    runAsync = body?.async !== false && !isCron && !only;
  } catch {
    runAsync = !isCron;
  }

  if (runAsync) {
    const progress = await loadBurnsProgress();
    if (progress.status === "running") {
      return NextResponse.json({ error: "A Burns run is already in progress" }, { status: 409 });
    }

    const startedAt = new Date().toISOString();
    await setBurnsProgress({ status: "running", startedAt });

    after(async () => {
      try {
        const run = await runBurnsSystem({ trigger: "manual" });
        await saveBurnsRun(run);
        await recordBurnsAudit(run);
        await setBurnsProgress({ status: "complete", run });
      } catch (e) {
        await setBurnsProgress({
          status: "failed",
          startedAt,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });

    return NextResponse.json({ started: true, startedAt }, { status: 202 });
  }

  const run = await runBurnsSystem({ trigger: isCron ? "cron" : "manual", only });

  if (!only) {
    await saveBurnsRun(run);
    await recordBurnsAudit(run);
    await setBurnsProgress({ status: "complete", run });
  }

  return NextResponse.json({ success: run.ok, run });
}
