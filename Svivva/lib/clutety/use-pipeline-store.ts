"use client";

import { create } from "zustand";
import {
  mockCombine,
  mockHypotheses,
  mockMutate,
  mockRemedy,
  mockSimulate,
} from "@/lib/clutety/pipeline-mock";

function layoutGraph(graph: { nodes?: { node_id: string }[]; edges?: unknown[] }) {
  const nodes = graph?.nodes || [];
  const n = Math.max(nodes.length, 1);
  return nodes.map((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    const r = 2.6;
    return {
      ...node,
      position: [Math.cos(angle) * r, Math.sin(angle) * r, 0.35 * Math.sin(i * 1.9)] as [
        number,
        number,
        number,
      ],
    };
  });
}

const steps = [
  { id: "hypothesis", label: "Hypothesize" },
  { id: "combine", label: "Combine" },
  { id: "mutate", label: "Mutate" },
  { id: "simulate", label: "Simulate" },
  { id: "remedy", label: "Remedy" },
];

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type PipelineState = {
  system: string;
  error: string | null;
  busy: boolean;
  activeStepIndex: number;
  visualPhase: string;
  pipelineSteps: typeof steps;
  hypotheses: { hypothesis: string; confidence: number }[];
  combined: ReturnType<typeof mockCombine> | null;
  mutated: ReturnType<typeof mockMutate> | null;
  simulated: ReturnType<typeof mockSimulate> | null;
  remedy: ReturnType<typeof mockRemedy> | null;
  setSystem: (system: string) => void;
  resetResults: () => void;
  runPipeline: () => Promise<void>;
};

export const usePipelineStore = create<PipelineState>((set, get) => ({
  system: "",
  error: null,
  busy: false,
  activeStepIndex: -1,
  visualPhase: "IDLE",
  pipelineSteps: steps,
  hypotheses: [],
  combined: null,
  mutated: null,
  simulated: null,
  remedy: null,

  setSystem: (system) => set({ system }),

  resetResults: () =>
    set({
      error: null,
      hypotheses: [],
      combined: null,
      mutated: null,
      simulated: null,
      remedy: null,
      activeStepIndex: -1,
    }),

  runPipeline: async () => {
    const { system, resetResults } = get();
    const target = system.trim() || "feed.example.com";
    resetResults();
    set({ busy: true, error: null, visualPhase: "DISCOVERY", activeStepIndex: 0 });

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      let hy = await postJson<{ hypothesis: string; confidence: number }[]>(
        "/api/security/hypothesis",
        { system: target },
      ).catch(() => mockHypotheses(target));
      set({ hypotheses: hy, activeStepIndex: 1 });
      await delay(400);

      let co = await postJson<ReturnType<typeof mockCombine>>("/api/security/combine", {
        system: target,
      }).catch(() => mockCombine(target));
      set({ combined: co, activeStepIndex: 2 });
      layoutGraph(co.new_structure);
      await delay(400);

      let mu = await postJson<ReturnType<typeof mockMutate>>("/api/security/mutate", {
        system: co.new_structure,
      }).catch(() => mockMutate());
      set({ mutated: mu, activeStepIndex: 3 });
      await delay(400);

      set({ visualPhase: "ATTACK" });
      const primary = hy[0] || { hypothesis: "Feed manipulation surface", confidence: 0.7 };
      let sim = await postJson<ReturnType<typeof mockSimulate>>("/api/security/simulate", {
        hypothesis: primary,
      }).catch(() => mockSimulate(primary.hypothesis));
      set({ simulated: sim, activeStepIndex: 4 });
      await delay(400);

      let rem = await postJson<ReturnType<typeof mockRemedy>>("/api/security/remedy", {
        attack: {
          hypothesis: primary.hypothesis,
          attack_steps: sim.attack_steps,
          graph: co.new_structure,
        },
      }).catch(() =>
        mockRemedy({
          hypothesis: primary.hypothesis,
        }),
      );
      set({ remedy: rem, activeStepIndex: 5, visualPhase: "REMEDY" });
      setTimeout(() => set({ visualPhase: "IDLE" }), 1200);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Pipeline failed",
        visualPhase: "IDLE",
      });
    } finally {
      set({ busy: false });
    }
  },
}));
