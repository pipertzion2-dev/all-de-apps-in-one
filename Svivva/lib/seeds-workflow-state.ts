export type SeedsWorkflowStep = "upload" | "verify" | "build";

export type SeedsWorkflowPhase =
  | "idle"
  | "uploading"
  | "parsed"
  | "verifying"
  | "building"
  | "complete";

export type SeedsWorkflowInput = {
  uploading: boolean;
  seedCount: number;
  builtCount: number;
  buildingCount: number;
  avgBuildProgress: number;
  compiling: boolean;
  activeStep: SeedsWorkflowStep;
};

export type SeedsWorkflowState = SeedsWorkflowInput & {
  phase: SeedsWorkflowPhase;
  /** 0–4 pods lit from center — maps to seed apps branched from spec */
  activePods: number;
};

export function deriveSeedsWorkflowState(input: SeedsWorkflowInput): SeedsWorkflowState {
  let phase: SeedsWorkflowPhase = "idle";
  if (input.uploading) phase = "uploading";
  else if (input.compiling) phase = "verifying";
  else if (input.buildingCount > 0) phase = "building";
  else if (input.seedCount > 0 && input.builtCount === input.seedCount) phase = "complete";
  else if (input.seedCount > 0) phase = "parsed";

  const activePods = Math.min(8, Math.max(0, input.seedCount));

  return { ...input, phase, activePods };
}

export const SEEDS_WORKFLOW_STEPS: {
  id: SeedsWorkflowStep;
  label: string;
  detail: string;
  scrollTarget: string;
}[] = [
  {
    id: "upload",
    label: "Upload spec",
    detail: "PDF blueprint → parsed seeds",
    scrollTarget: "#seeds-upload",
  },
  {
    id: "verify",
    label: "Verify invariants",
    detail: "Formal checks before build",
    scrollTarget: "#seeds-invariant-compiler",
  },
  {
    id: "build",
    label: "Branch & build",
    detail: "Parallel apps from one spec",
    scrollTarget: "#seeds-list",
  },
];
