"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  HYBRIDIZATION_MOLECULES,
  labelGeometry,
  labelHybridization,
  type MoleculeSpec,
} from "@/lib/ap-science/chemistry/hybridization-model";
import {
  HYBRIDIZATION_CONCEPT,
  HYBRIDIZATION_QUESTIONS,
  MISCONCEPTION_COPY,
  guidedAnswersFor,
} from "@/lib/ap-science/chemistry/hybridization-content";
import { gradeChoice, recommendNext, summarizeConcept } from "@/lib/ap-science/mastery";
import type { AttemptRecord, Confidence, MisconceptionTag } from "@/lib/ap-science/types";
import {
  trackApLearnEvent,
  loadLocalAttempts,
  saveLocalAttempts,
} from "@/lib/ap-science/client-store";
import type { ViewMode } from "@/components/ap-science/hybridization-scene";

const HybridizationScene = dynamic(
  () => import("@/components/ap-science/hybridization-scene").then((m) => m.HybridizationScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] sm:h-[380px] rounded-xl border border-border/50 bg-muted/30 animate-pulse" />
    ),
  },
);

type ModeTab = "results" | "predict" | "practice";

const GUIDED_STEPS = [
  {
    key: "electron_geometry" as const,
    prompt: "Step 1 — Electron-domain geometry?",
    hint: "Count bonding regions + lone pairs on the starred atom.",
    options: ["linear", "trigonal_planar", "tetrahedral", "trigonal_bipyramidal"],
  },
  {
    key: "molecular_geometry" as const,
    prompt: "Step 2 — Molecular geometry (atom positions only)?",
    hint: "Ignore lone pairs when naming the molecular shape.",
    options: ["linear", "bent", "trigonal_planar", "trigonal_pyramidal", "tetrahedral"],
  },
  {
    key: "hybridization" as const,
    prompt: "Step 3 — Hybridization?",
    hint: "2 domains → sp · 3 → sp² · 4 → sp³",
    options: ["sp", "sp2", "sp3", "sp3d"],
  },
];

export function HybridizationExplorer({ showUpgrade = true }: { showUpgrade?: boolean }) {
  const [moleculeId, setMoleculeId] = useState("ch4");
  const [viewMode, setViewMode] = useState<ViewMode>("ball_stick");
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [tab, setTab] = useState<ModeTab>("results");
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState<string | null>(null);
  const [guidedOk, setGuidedOk] = useState<boolean | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [lastMisconception, setLastMisconception] = useState<MisconceptionTag | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  const molecule = useMemo(
    () => HYBRIDIZATION_MOLECULES.find((m) => m.id === moleculeId) as MoleculeSpec,
    [moleculeId],
  );

  useEffect(() => {
    setAttempts(loadLocalAttempts(HYBRIDIZATION_CONCEPT.id));
    trackApLearnEvent("first_visualization_interaction", {
      concept_id: HYBRIDIZATION_CONCEPT.id,
      molecule_id: moleculeId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackApLearnEvent("visualization_molecule_change", { molecule_id: moleculeId });
    setGuidedIdx(0);
    setGuidedFeedback(null);
    setGuidedOk(null);
  }, [moleculeId]);

  const mastery = useMemo(() => summarizeConcept(HYBRIDIZATION_CONCEPT.id, attempts), [attempts]);
  const next = recommendNext(mastery);
  const question = HYBRIDIZATION_QUESTIONS[quizIdx % HYBRIDIZATION_QUESTIONS.length];
  const answers = guidedAnswersFor(moleculeId);

  function persist(nextAttempts: AttemptRecord[]) {
    setAttempts(nextAttempts);
    saveLocalAttempts(HYBRIDIZATION_CONCEPT.id, nextAttempts);
    void fetch("/api/learn/mastery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        conceptId: HYBRIDIZATION_CONCEPT.id,
        subject: "ap-chemistry",
        attempts: nextAttempts,
      }),
    }).catch(() => {});
  }

  function selectMolecule(id: string) {
    setMoleculeId(id);
    setTab("results");
  }

  function onGuidedAnswer(value: string) {
    if (!answers) return;
    const step = GUIDED_STEPS[guidedIdx];
    const expected = String(answers[step.key]);
    const ok = value === expected;
    trackApLearnEvent("guided_prediction", {
      molecule_id: moleculeId,
      step: step.key,
      correct: ok,
    });
    setGuidedOk(ok);
    if (ok) {
      setGuidedFeedback(`Correct: ${labelMaybe(step.key, expected)}.`);
    } else {
      const tag: MisconceptionTag =
        step.key === "molecular_geometry" || step.key === "electron_geometry"
          ? "electron_vs_molecular_geometry"
          : step.key === "hybridization"
            ? "generic"
            : "generic";
      setLastMisconception(tag);
      setGuidedFeedback(
        `Not quite. Answer: ${labelMaybe(step.key, expected)}. ${MISCONCEPTION_COPY[tag].explanation}`,
      );
    }
  }

  function revealGuidedAnswer() {
    if (!answers) return;
    const step = GUIDED_STEPS[guidedIdx];
    const expected = String(answers[step.key]);
    setGuidedOk(true);
    setGuidedFeedback(`Answer: ${labelMaybe(step.key, expected)}.`);
  }

  function nextGuidedStep() {
    setGuidedFeedback(null);
    setGuidedOk(null);
    if (guidedIdx < GUIDED_STEPS.length - 1) {
      setGuidedIdx((i) => i + 1);
    } else {
      setTab("results");
    }
  }

  function onQuizChoice(choiceId: string) {
    const started = performance.now();
    const graded = gradeChoice({
      correctChoiceId: question.correctChoiceId!,
      selectedId: choiceId,
      confidence,
      misconceptionByChoice: question.misconceptionByChoice,
    });
    const record: AttemptRecord = {
      questionId: question.id,
      conceptId: HYBRIDIZATION_CONCEPT.id,
      correct: graded.correct,
      confidence,
      misconception: graded.misconception,
      usedHint: false,
      responseMs: Math.round(performance.now() - started),
      at: new Date().toISOString(),
    };
    persist([...attempts, record]);
    trackApLearnEvent(graded.correct ? "first_correct_answer" : "question_incorrect", {
      question_id: question.id,
      confidence,
      misconception: graded.misconception,
    });
    trackApLearnEvent("first_question_answered", { question_id: question.id });
    if (graded.correct) {
      setLastMisconception(null);
      setQuizFeedback(`Correct. ${question.explanation}`);
    } else {
      setLastMisconception(graded.misconception ?? "generic");
      setQuizFeedback(
        `Incorrect. ${question.explanation} — ${MISCONCEPTION_COPY[graded.misconception ?? "generic"].explanation}`,
      );
    }
  }

  function nextQuiz() {
    setQuizFeedback(null);
    if (quizIdx >= 4) {
      setQuizDone(true);
    } else {
      setQuizIdx((i) => i + 1);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5" data-testid="hybridization-explorer">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold tracking-wide text-sky-400 uppercase">
          AP Chemistry · Hybridization lab
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Get clear VSEPR + σ/π results
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Pick a molecule → read the scientific readout → drag to rotate. Use Predict to test
          yourself, or stay on Results for the answer key.
        </p>
      </header>

      {/* Molecule picker — formula + name for clarity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="listbox" aria-label="Molecules">
        {HYBRIDIZATION_MOLECULES.map((m) => {
          const active = moleculeId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => selectMolecule(m.id)}
              className={`text-left rounded-xl border px-3 py-2.5 transition-colors min-h-[52px] ${
                active
                  ? "bg-sky-500/15 border-sky-500/50 ring-1 ring-sky-500/30"
                  : "bg-card/40 border-border/50 hover:border-border"
              }`}
            >
              <p className="text-sm font-bold text-foreground leading-none">{m.formula}</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{m.name}</p>
              <p className="text-[10px] font-semibold text-sky-300/90 mt-0.5">
                {labelHybridization(m.hybridization)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Always-visible scientific results strip */}
      <ScientificResultsPanel molecule={molecule} />

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
        <div className="space-y-3">
          <HybridizationScene
            molecule={molecule}
            mode={viewMode}
            showLabels={showLabels}
            autoRotate={autoRotate}
          />

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mr-1">
              View
            </span>
            {(
              [
                ["ball_stick", "Structure", "Atoms & bonds"],
                ["domains", "Domains", "VSEPR domains"],
                ["orbitals", "Orbitals", "Hybrid lobes"],
              ] as const
            ).map(([id, label, tip]) => (
              <button
                key={id}
                type="button"
                title={tip}
                onClick={() => setViewMode(id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border min-h-[40px] ${
                  viewMode === id
                    ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                    : "border-border/50 text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-border/50 text-muted-foreground min-h-[40px]"
            >
              Labels {showLabels ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-border/50 text-muted-foreground min-h-[40px]"
            >
              {autoRotate ? "Spinning" : "Drag to rotate"}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {viewMode === "ball_stick" &&
              "Single / double / triple bonds shown as 1 / 2 / 3 cylinders. Multiple bonds still count as one VSEPR domain."}
            {viewMode === "domains" &&
              "Yellow markers = electron domains (bonds + lone pairs). Domain count decides hybridization."}
            {viewMode === "orbitals" &&
              "Blue = hybrid orbital directions. Purple = leftover p orbital when sp or sp² (π bonding)."}
          </p>

          <BondLegend molecule={molecule} />
        </div>

        <aside className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-border/40">
            {(
              [
                ["results", "Results"],
                ["predict", "Predict"],
                ["practice", "Practice"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  if (id === "predict") {
                    trackApLearnEvent("guided_started", { molecule_id: moleculeId });
                  }
                }}
                className={`py-3 text-xs font-bold ${
                  tab === id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {tab === "results" && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">{molecule.name} — answer key</p>
                <ResultRow
                  label="Domains"
                  value={`${molecule.electronDomains} total (${molecule.bondingDomains} bonding + ${molecule.lonePairs} lone pair${molecule.lonePairs === 1 ? "" : "s"})`}
                />
                <ResultRow
                  label="Electron geometry"
                  value={labelGeometry(molecule.electronGeometry)}
                />
                <ResultRow
                  label="Molecular geometry"
                  value={labelGeometry(molecule.molecularGeometry)}
                />
                <ResultRow
                  label="Hybridization"
                  value={labelHybridization(molecule.hybridization)}
                />
                <ResultRow
                  label="σ / π bonds"
                  value={`${molecule.sigmaBonds} sigma · ${molecule.piBonds} pi`}
                />
                <ResultRow
                  label="Bond angle (approx.)"
                  value={`≈ ${molecule.approxBondAngleDeg}°`}
                />
                <ResultRow label="Polarity" value={molecule.polarity} />
                <div className="space-y-2 pt-1">
                  {molecule.teachingNotes.map((n) => (
                    <p
                      key={n}
                      className="text-xs text-muted-foreground leading-relaxed border-l-2 border-sky-500/40 pl-2"
                    >
                      {n}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTab("predict")}
                  className="w-full py-3 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 min-h-[44px]"
                >
                  Test yourself on this molecule
                </button>
              </div>
            )}

            {tab === "predict" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Step {guidedIdx + 1} of {GUIDED_STEPS.length}
                  </p>
                  <div className="flex gap-1">
                    {GUIDED_STEPS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-6 rounded-full ${
                          i < guidedIdx
                            ? "bg-emerald-400"
                            : i === guidedIdx
                              ? "bg-sky-400"
                              : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-semibold leading-snug">
                  {GUIDED_STEPS[guidedIdx].prompt}
                </p>
                <p className="text-[11px] text-muted-foreground">{GUIDED_STEPS[guidedIdx].hint}</p>
                <div className="grid gap-2">
                  {GUIDED_STEPS[guidedIdx].options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onGuidedAnswer(opt)}
                      className="text-left px-3 py-3 rounded-lg border border-border/50 text-sm hover:bg-muted/40 capitalize min-h-[44px]"
                    >
                      {opt.replace(/_/g, " ").replace("sp2", "sp²").replace("sp3", "sp³")}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={revealGuidedAnswer}
                    className="px-3 py-2 rounded-lg text-xs font-bold border border-border/60 min-h-[40px]"
                  >
                    Show answer
                  </button>
                  {guidedFeedback && (
                    <button
                      type="button"
                      onClick={nextGuidedStep}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 min-h-[40px]"
                    >
                      {guidedIdx < GUIDED_STEPS.length - 1 ? "Next step" : "Back to results"}
                    </button>
                  )}
                </div>
                {guidedFeedback && (
                  <p
                    className={`text-xs leading-relaxed rounded-lg p-3 border ${
                      guidedOk
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-100"
                        : "bg-amber-500/10 border-amber-500/25 text-amber-100"
                    }`}
                  >
                    {guidedFeedback}
                  </p>
                )}
              </div>
            )}

            {tab === "practice" && !quizDone && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Question {quizIdx + 1} of 5 · Mastery {mastery.score}%
                </p>
                <p className="text-sm font-semibold leading-snug">{question.prompt}</p>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1.5">
                    Confidence before answering
                  </p>
                  <div className="flex gap-1.5">
                    {(["low", "medium", "high"] as Confidence[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConfidence(c)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold capitalize border min-h-[40px] ${
                          confidence === c
                            ? "border-sky-400 text-sky-100 bg-sky-500/15"
                            : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  {question.choices?.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!!quizFeedback}
                      onClick={() => onQuizChoice(c.id)}
                      className="text-left px-3 py-3 rounded-lg border border-border/50 text-sm hover:bg-muted/40 disabled:opacity-60 min-h-[44px]"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {quizFeedback && (
                  <>
                    <p className="text-xs leading-relaxed rounded-lg p-3 border border-border/40 bg-muted/20">
                      {quizFeedback}
                    </p>
                    {lastMisconception && (
                      <p className="text-[11px] text-violet-300">
                        Focus next: {MISCONCEPTION_COPY[lastMisconception].nextFocus}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={nextQuiz}
                      className="w-full py-3 rounded-lg text-sm font-bold text-white bg-sky-600 min-h-[44px]"
                    >
                      {quizIdx >= 4 ? "See mastery summary" : "Next question"}
                    </button>
                  </>
                )}
              </div>
            )}

            {tab === "practice" && quizDone && (
              <div className="space-y-3 text-sm">
                <p className="text-lg font-bold text-foreground">Mastery: {mastery.score}%</p>
                <p className="text-xs text-muted-foreground">
                  {mastery.correct}/{mastery.attempts} correct
                  {mastery.confidenceWrong > 0
                    ? ` · ${mastery.confidenceWrong} high-confidence misses`
                    : ""}
                </p>
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">Next:</span> {next.action}
                </p>
                <p className="text-xs text-muted-foreground">{next.reason}</p>
                {showUpgrade && mastery.score >= 50 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-xs font-bold text-amber-200">
                      Unlock your complete AP Chemistry mastery plan
                    </p>
                    <Link
                      href="/dashboard/checkout?tier=pro&from=ap-science"
                      onClick={() =>
                        trackApLearnEvent("paywall_viewed", { source: "hybridization" })
                      }
                      className="inline-flex text-xs font-bold text-sky-300 underline"
                    >
                      View Pro options
                    </Link>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setQuizDone(false);
                    setQuizIdx(0);
                    setQuizFeedback(null);
                    setTab("results");
                  }}
                  className="w-full py-3 rounded-lg text-sm font-bold border border-border/50 min-h-[44px]"
                >
                  Back to molecule results
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ScientificResultsPanel({ molecule }: { molecule: MoleculeSpec }) {
  const [copied, setCopied] = useState(false);
  const cards = [
    {
      label: "Hybridization",
      value: labelHybridization(molecule.hybridization),
      accent: "text-sky-300",
    },
    {
      label: "Electron geom.",
      value: labelGeometry(molecule.electronGeometry),
      accent: "text-foreground",
    },
    {
      label: "Molecular geom.",
      value: labelGeometry(molecule.molecularGeometry),
      accent: "text-foreground",
    },
    {
      label: "σ · π",
      value: `${molecule.sigmaBonds} · ${molecule.piBonds}`,
      accent: "text-violet-300",
    },
    {
      label: "Angle",
      value: `≈${molecule.approxBondAngleDeg}°`,
      accent: "text-emerald-300",
    },
    {
      label: "Domains",
      value: String(molecule.electronDomains),
      accent: "text-amber-300",
    },
  ];

  async function copySummary() {
    const text = [
      `${molecule.name} (${molecule.formula})`,
      `Focus atom: ${molecule.focusAtomId}`,
      `Electron domains: ${molecule.electronDomains} (${molecule.bondingDomains} bonding + ${molecule.lonePairs} LP)`,
      `Electron geometry: ${labelGeometry(molecule.electronGeometry)}`,
      `Molecular geometry: ${labelGeometry(molecule.molecularGeometry)}`,
      `Hybridization: ${labelHybridization(molecule.hybridization)}`,
      `Bonds: ${molecule.sigmaBonds} σ · ${molecule.piBonds} π`,
      `Approx. bond angle: ${molecule.approxBondAngleDeg}°`,
      `Polarity: ${molecule.polarity}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      trackApLearnEvent("hybridization_results_copied", { molecule_id: molecule.id });
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3 sm:p-4"
      data-testid="hybridization-results-strip"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-sky-300">
          Scientific readout · {molecule.formula}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground hidden sm:block">
            Instant results · switch molecule to compare
          </p>
          <button
            type="button"
            onClick={() => void copySummary()}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-sky-500/40 text-sky-200 hover:bg-sky-500/15 min-h-[36px]"
          >
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-2 min-h-[64px]"
          >
            <p className="text-[10px] font-semibold text-muted-foreground leading-none">
              {c.label}
            </p>
            <p className={`text-sm font-bold mt-1.5 capitalize leading-snug ${c.accent}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BondLegend({ molecule }: { molecule: MoleculeSpec }) {
  const orders = Array.from(new Set(molecule.bonds.map((b) => b.order))).sort();
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
      <p className="font-bold text-foreground/80">Bond → σ/π for this molecule</p>
      <ul className="space-y-0.5">
        {orders.map((o) => (
          <li key={o}>
            {o === 1 && "Single bond = 1 σ"}
            {o === 2 && "Double bond = 1 σ + 1 π"}
            {o === 3 && "Triple bond = 1 σ + 2 π"}
          </li>
        ))}
        <li>
          Totals: {molecule.sigmaBonds} σ · {molecule.piBonds} π across all bonds
        </li>
      </ul>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs border-b border-border/30 pb-2">
      <span className="text-muted-foreground font-medium shrink-0">{label}</span>
      <span className="font-bold text-foreground text-right capitalize">{value}</span>
    </div>
  );
}

function labelMaybe(key: string, value: string) {
  if (key === "hybridization") {
    return labelHybridization(value as "sp" | "sp2" | "sp3" | "sp3d" | "sp3d2");
  }
  return value.replace(/_/g, " ");
}
