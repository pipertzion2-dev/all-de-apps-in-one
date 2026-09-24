import { NextRequest, NextResponse } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import {
  TIMING_PLAN_STEPS,
  nextTimingStep,
  type TimingPlanStep,
} from "@/lib/orbit/timing-plan";
import { loadTimingState, saveTimingState, type TimingState } from "@/lib/orbit/timing-state";
import { runTimingAutomatedStep } from "@/lib/orbit/timing-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function hoursSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function canRunStep(step: TimingPlanStep, state: TimingState): { allowed: boolean; reason?: string } {
  const prev = TIMING_PLAN_STEPS.find((s) => s.order === step.order - 1);
  if (prev && !state.completedStepIds.includes(prev.id)) {
    return { allowed: false, reason: `Complete “${prev.title}” first.` };
  }
  if (step.minHoursAfterPrevious > 0 && state.lastCompletedAt) {
    const elapsed = hoursSince(state.lastCompletedAt);
    if (elapsed < step.minHoursAfterPrevious) {
      const waitH = Math.ceil(step.minHoursAfterPrevious - elapsed);
      return {
        allowed: false,
        reason: `Timing waits ${step.minHoursAfterPrevious}h between steps — try again in ~${waitH}h (avoids bulk indexing).`,
      };
    }
  }
  return { allowed: true };
}

export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const state = await loadTimingState();
  const next = nextTimingStep(state.completedStepIds);
  const gate = next ? canRunStep(next, state) : { allowed: false as const, reason: "Plan complete" };

  return NextResponse.json({
    planVersion: TIMING_PLAN_STEPS.length,
    steps: TIMING_PLAN_STEPS,
    state,
    nextStep: next,
    canRunNext: next ? gate.allowed : false,
    blockReason: gate.reason ?? null,
    completedCount: state.completedStepIds.length,
    totalSteps: TIMING_PLAN_STEPS.length,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: "run_next" | "complete_manual" | "reset";
    stepId?: string;
  };

  let state = await loadTimingState();

  if (body.action === "reset") {
    state = {
      version: state.version,
      completedStepIds: [],
      lastCompletedAt: null,
      logs: [],
    };
    await saveTimingState(state);
    return NextResponse.json({ ok: true, state, message: "Timing plan reset — start from step 1." });
  }

  const next = nextTimingStep(state.completedStepIds);
  if (!next) {
    return NextResponse.json({ ok: false, error: "Timing plan already complete. Reset to run again." });
  }

  if (body.action === "complete_manual") {
    if (next.kind !== "manual") {
      return NextResponse.json({ ok: false, error: "Current step is automated — use Run today's step." });
    }
    const at = new Date().toISOString();
    state.completedStepIds.push(next.id);
    state.lastCompletedAt = at;
    state.logs.unshift({
      stepId: next.id,
      at,
      ok: true,
      summary: "Marked complete manually.",
    });
    state.logs = state.logs.slice(0, 40);
    await saveTimingState(state);
    return NextResponse.json({
      ok: true,
      state,
      result: { ok: true, summary: `✓ ${next.title} marked done.` },
      nextStep: nextTimingStep(state.completedStepIds),
    });
  }

  const gate = canRunStep(next, state);
  if (!gate.allowed) {
    return NextResponse.json({ ok: false, error: gate.reason, nextStep: next, state });
  }

  if (next.kind === "manual") {
    return NextResponse.json({
      ok: false,
      error: "This step is manual — follow the instructions, then press “Mark done”.",
      nextStep: next,
      manual: true,
    });
  }

  const result = await runTimingAutomatedStep(next);
  const at = new Date().toISOString();
  if (result.ok) {
    state.completedStepIds.push(next.id);
    state.lastCompletedAt = at;
  }
  state.logs.unshift({
    stepId: next.id,
    at,
    ok: result.ok,
    summary: result.summary.slice(0, 2000),
  });
  state.logs = state.logs.slice(0, 40);
  await saveTimingState(state);

  return NextResponse.json({
    ok: result.ok,
    state,
    result,
    nextStep: nextTimingStep(state.completedStepIds),
    blockReason: result.ok ? null : "Fix issues above, then retry this step (Timing will not skip ahead).",
  });
}
