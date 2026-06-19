"use client";

import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck, Layers, Loader2 } from "lucide-react";
import {
  SEEDS_WORKFLOW_STEPS,
  type SeedsWorkflowState,
  type SeedsWorkflowStep,
} from "@/lib/seeds-workflow-state";

type Props = {
  state: SeedsWorkflowState;
  onUploadClick: () => void;
  uploading: boolean;
};

const PHASE_HINT: Record<SeedsWorkflowState["phase"], string> = {
  idle: "Spec tree dormant — upload PDF to grow the trunk",
  uploading: "Ingesting spec pages into the parse core",
  parsed: `${0} branches ready on the canopy — verify invariants`,
  verifying: "Proof gate active — checks climbing the trunk",
  building: "Seed pods filling on each branch in parallel",
  complete: "Canopy complete — every pod bloomed",
};

function stepStatus(
  step: SeedsWorkflowStep,
  state: SeedsWorkflowState,
): "done" | "active" | "pending" {
  const order: SeedsWorkflowStep[] = ["upload", "verify", "build"];
  const stepIdx = order.indexOf(step);
  const phaseIdx =
    state.phase === "complete" || state.builtCount > 0
      ? 2
      : state.phase === "building" || state.phase === "verifying"
        ? state.phase === "verifying"
          ? 1
          : 2
        : state.seedCount > 0
          ? 1
          : state.phase === "uploading"
            ? 0
            : -1;

  if (stepIdx < phaseIdx) return "done";
  if (stepIdx === phaseIdx) return "active";
  return "pending";
}

export function SeedsWorkflowHero({ state, onUploadClick, uploading }: Props) {
  const scrollTo = (target: string) => {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hint =
    state.phase === "parsed"
      ? `${state.seedCount} app${state.seedCount === 1 ? "" : "s"} branched from your spec — verify, then build`
      : state.phase === "building"
        ? `Filling ${state.buildingCount} seed pod${state.buildingCount === 1 ? "" : "s"}…`
        : PHASE_HINT[state.phase];

  return (
    <section className="relative pt-4 pb-3 sm:pt-8 sm:pb-5" data-seeds-workflow-hero>
      <div className="mx-auto max-w-5xl space-y-3 px-3 sm:space-y-4 sm:px-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h1
            className="text-[1.65rem] font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl"
            data-testid="text-seeds-title"
          >
            <span className="text-foreground">ONE SPEC.</span>{" "}
            <span className="seeds-holo-text">MANY APPS.</span>
          </h1>
          <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {hint}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {SEEDS_WORKFLOW_STEPS.map((step, i) => {
              const status = stepStatus(step.id, state);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => scrollTo(step.scrollTarget)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${
                    status === "active"
                      ? "border-[#5BA8A0]/70 bg-[#5BA8A0]/15 text-foreground"
                      : status === "done"
                        ? "border-[#5BA8A0]/40 bg-[#5BA8A0]/08 text-[#5BA8A0]"
                        : "border-border/50 bg-background/25 text-muted-foreground hover:border-[#5BA8A0]/35"
                  }`}
                  data-testid={`seeds-workflow-step-${step.id}`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold sm:h-5 sm:w-5 sm:text-[10px] ${
                      status === "done"
                        ? "bg-[#5BA8A0] text-white"
                        : status === "active"
                          ? "bg-[#6B2C4A] text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "done" ? "✓" : i + 1}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-[#5BA8A0] px-3 text-xs sm:gap-2"
              onClick={onUploadClick}
              disabled={uploading}
              data-testid="button-hero-upload-pdf"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 shrink-0" />
              )}
              {uploading ? "Parsing…" : "Upload PDF"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-3 text-xs sm:gap-2"
              onClick={() => scrollTo(SEEDS_WORKFLOW_STEPS[1].scrollTarget)}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Verify
            </Button>
            {state.seedCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-3 text-xs sm:gap-2"
                onClick={() => scrollTo(SEEDS_WORKFLOW_STEPS[2].scrollTarget)}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                {state.seedCount} seed{state.seedCount === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
