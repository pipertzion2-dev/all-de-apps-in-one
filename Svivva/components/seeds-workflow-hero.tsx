"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck, Layers, Loader2, ChevronRight } from "lucide-react";
import {
  SEEDS_WORKFLOW_STEPS,
  type SeedsWorkflowState,
  type SeedsWorkflowStep,
} from "@/lib/seeds-workflow-state";

const SeedsInteractiveCanvas = dynamic(
  () => import("@/components/seeds-interactive-canvas").then((m) => m.SeedsInteractiveCanvas),
  { ssr: false },
);

type Props = {
  state: SeedsWorkflowState;
  onUploadClick: () => void;
  uploading: boolean;
  onPodClick?: (podIndex: number) => void;
};

function stepStatus(step: SeedsWorkflowStep, state: SeedsWorkflowState): "done" | "active" | "pending" {
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

  if (state.activeStep === step) return "active";
  if (stepIdx < phaseIdx) return "done";
  if (stepIdx === phaseIdx) return "active";
  return "pending";
}

export function SeedsWorkflowHero({ state, onUploadClick, uploading, onPodClick }: Props) {
  const [focusedStep, setFocusedStep] = useState<SeedsWorkflowStep>("upload");
  const displayState = { ...state, activeStep: focusedStep };

  const scrollTo = (target: string) => {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStep = (step: (typeof SEEDS_WORKFLOW_STEPS)[number]) => {
    setFocusedStep(step.id);
    scrollTo(step.scrollTarget);
  };

  return (
    <section className="relative pt-5 pb-6 sm:pt-6 sm:pb-8" data-seeds-workflow-hero>
      <div className="max-w-5xl mx-auto px-4 space-y-5">
        <div className="text-center sm:text-left space-y-2">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]"
            data-testid="text-seeds-title"
          >
            <span className="text-foreground">ONE SPEC.</span>{" "}
            <span className="seeds-holo-text">MANY APPS.</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono max-w-xl">
            The cluster mirrors your pipeline — upload branches into pods, verify locks the spec, build
            deploys each app.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,1.1fr)] gap-4 lg:gap-6 items-stretch">
          <div className="flex flex-col gap-2 order-2 lg:order-1">
            {SEEDS_WORKFLOW_STEPS.map((step, i) => {
              const status = stepStatus(step.id, { ...displayState, activeStep: focusedStep });
              const isActive = focusedStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStep(step)}
                  className={`group text-left rounded-xl border px-4 py-3 transition-all ${
                    isActive
                      ? "border-[#5BA8A0]/60 bg-[#5BA8A0]/10 shadow-sm"
                      : "border-border/50 bg-card/30 hover:border-[#5BA8A0]/35 hover:bg-card/50"
                  }`}
                  data-testid={`seeds-workflow-step-${step.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        status === "done"
                          ? "bg-[#5BA8A0] text-white"
                          : status === "active"
                            ? "bg-[#6B2C4A] text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status === "done" ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-foreground">{step.label}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                      {step.id === "upload" && state.seedCount > 0 && (
                        <p className="text-[10px] font-mono text-[#5BA8A0] mt-1">
                          {state.seedCount} seed{state.seedCount === 1 ? "" : "s"} parsed
                        </p>
                      )}
                      {step.id === "build" && state.builtCount > 0 && (
                        <p className="text-[10px] font-mono text-green-500 mt-1">
                          {state.builtCount} built
                          {state.buildingCount > 0 ? ` · ${state.buildingCount} in progress` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                className="gap-2 bg-[#5BA8A0] flex-1 sm:flex-none"
                onClick={onUploadClick}
                disabled={uploading}
                data-testid="button-hero-upload-pdf"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Parsing…" : "Upload PDF"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 flex-1 sm:flex-none"
                onClick={() => handleStep(SEEDS_WORKFLOW_STEPS[1])}
              >
                <ShieldCheck className="w-4 h-4" />
                Verify
              </Button>
              {state.seedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none"
                  onClick={() => handleStep(SEEDS_WORKFLOW_STEPS[2])}
                >
                  <Layers className="w-4 h-4" />
                  View seeds
                </Button>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2 min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]">
            <SeedsInteractiveCanvas
              state={displayState}
              onPodClick={onPodClick}
              className="h-full min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
