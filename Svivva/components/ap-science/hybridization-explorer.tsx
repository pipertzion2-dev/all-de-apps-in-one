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
      <div className="w-full h-[320px] sm:h-[420px] rounded-xl border border-border/50 bg-muted/30 animate-pulse" />
    ),
  },
);

type Stage = "explore" | "guided" | "quiz" | "summary";

const GUIDED_STEPS = [
  {
    key: "electron_geometry" as const,
    prompt: "What is the electron-domain geometry?",
    options: ["linear", "trigonal_planar", "tetrahedral", "trigonal_bipyramidal"],
  },
  {
    key: "molecular_geometry" as const,
    prompt: "What molecular geometry does this create?",
    options: ["linear", "bent", "trigonal_planar", "trigonal_pyramidal", "tetrahedral"],
  },
  {
    key: "hybridization" as const,
    prompt: "What hybridization would you predict?",
    options: ["sp", "sp2", "sp3", "sp3d"],
  },
];

export function HybridizationExplorer({ showUpgrade = true }: { showUpgrade?: boolean }) {
  const [moleculeId, setMoleculeId] = useState("ch4");
  const [mode, setMode] = useState<ViewMode>("ball_stick");
  const [showLabels, setShowLabels] = useState(true);
  const [stage, setStage] = useState<Stage>("explore");
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState<string | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [lastMisconception, setLastMisconception] = useState<MisconceptionTag | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

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
    // Mount-only: first interaction signal for funnel analytics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackApLearnEvent("visualization_molecule_change", { molecule_id: moleculeId });
  }, [moleculeId]);

  const mastery = useMemo(() => summarizeConcept(HYBRIDIZATION_CONCEPT.id, attempts), [attempts]);
  const next = recommendNext(mastery);
  const question = HYBRIDIZATION_QUESTIONS[quizIdx % HYBRIDIZATION_QUESTIONS.length];

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

  function onGuidedAnswer(value: string) {
    const answers = guidedAnswersFor(moleculeId);
    if (!answers) return;
    const step = GUIDED_STEPS[guidedIdx];
    const expected = String(answers[step.key]);
    const ok = value === expected;
    trackApLearnEvent("guided_prediction", {
      molecule_id: moleculeId,
      step: step.key,
      correct: ok,
    });
    if (ok) {
      setGuidedFeedback(`Correct — ${labelMaybe(step.key, expected)}.`);
      if (guidedIdx < GUIDED_STEPS.length - 1) {
        setTimeout(() => {
          setGuidedIdx((i) => i + 1);
          setGuidedFeedback(null);
        }, 700);
      } else {
        setGuidedFeedback(
          `Nice. σ=${molecule.sigmaBonds}, π=${molecule.piBonds}, angle ≈ ${molecule.approxBondAngleDeg}°. Continue to AP-style questions.`,
        );
        setTimeout(() => setStage("quiz"), 900);
      }
    } else {
      const tag: MisconceptionTag =
        step.key === "molecular_geometry" || step.key === "electron_geometry"
          ? "electron_vs_molecular_geometry"
          : "generic";
      setLastMisconception(tag);
      setGuidedFeedback(MISCONCEPTION_COPY[tag].explanation);
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
    const nextAttempts = [...attempts, record];
    persist(nextAttempts);
    trackApLearnEvent(graded.correct ? "first_correct_answer" : "question_incorrect", {
      question_id: question.id,
      confidence,
      misconception: graded.misconception,
    });
    trackApLearnEvent("first_question_answered", { question_id: question.id });
    if (graded.correct) {
      setQuizFeedback(question.explanation);
      setLastMisconception(null);
      setTimeout(() => {
        setQuizFeedback(null);
        if (quizIdx >= 4) setStage("summary");
        else setQuizIdx((i) => i + 1);
      }, 900);
    } else {
      setLastMisconception(graded.misconception ?? "generic");
      setQuizFeedback(
        `${question.explanation} — ${MISCONCEPTION_COPY[graded.misconception ?? "generic"].explanation}`,
      );
    }
  }

  return (
    <div className="space-y-5" data-testid="hybridization-explorer">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-sky-400 uppercase">
          AP Chemistry · Reference lab
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Hybridization Explorer
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {HYBRIDIZATION_CONCEPT.explanation}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {HYBRIDIZATION_MOLECULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMoleculeId(m.id);
              setGuidedIdx(0);
              setGuidedFeedback(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              moleculeId === m.id
                ? "bg-sky-500/20 border-sky-500/50 text-sky-200"
                : "bg-card/40 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.formula}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="space-y-3">
          <HybridizationScene molecule={molecule} mode={mode} showLabels={showLabels} />
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["ball_stick", "Structure"],
                ["domains", "Domains"],
                ["orbitals", "Orbitals"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                  mode === id
                    ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                    : "border-border/50 text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowLabels((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-border/50 text-muted-foreground"
            >
              Labels {showLabels ? "on" : "off"}
            </button>
          </div>
        </div>

        <aside className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
          <div className="flex gap-2 text-[11px] font-bold">
            {(["explore", "guided", "quiz", "summary"] as Stage[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`px-2 py-1 rounded-md capitalize ${
                  stage === s ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {stage === "explore" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-foreground">
                {molecule.name} ({molecule.formula})
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  Electron geometry:{" "}
                  <span className="text-foreground">
                    {labelGeometry(molecule.electronGeometry)}
                  </span>
                </li>
                <li>
                  Molecular geometry:{" "}
                  <span className="text-foreground">
                    {labelGeometry(molecule.molecularGeometry)}
                  </span>
                </li>
                <li>
                  Hybridization:{" "}
                  <span className="text-foreground">
                    {labelHybridization(molecule.hybridization)}
                  </span>
                </li>
                <li>
                  Bonds:{" "}
                  <span className="text-foreground">
                    {molecule.sigmaBonds} σ · {molecule.piBonds} π · ≈{molecule.approxBondAngleDeg}°
                  </span>
                </li>
              </ul>
              {molecule.teachingNotes.map((n) => (
                <p key={n} className="text-xs text-muted-foreground leading-relaxed">
                  {n}
                </p>
              ))}
              <button
                type="button"
                onClick={() => {
                  setStage("guided");
                  trackApLearnEvent("guided_started", { molecule_id: moleculeId });
                }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-500"
              >
                Predict → Explain loop
              </button>
            </div>
          )}

          {stage === "guided" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{GUIDED_STEPS[guidedIdx].prompt}</p>
              <div className="grid gap-2">
                {GUIDED_STEPS[guidedIdx].options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onGuidedAnswer(opt)}
                    className="text-left px-3 py-2 rounded-lg border border-border/50 text-xs hover:bg-muted/40 capitalize"
                  >
                    {opt.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              {guidedFeedback && (
                <p className="text-xs leading-relaxed text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  {guidedFeedback}
                </p>
              )}
            </div>
          )}

          {stage === "quiz" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold leading-snug">{question.prompt}</p>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as Confidence[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConfidence(c)}
                    className={`px-2 py-1 rounded text-[10px] font-bold capitalize border ${
                      confidence === c
                        ? "border-sky-400 text-sky-200 bg-sky-500/15"
                        : "border-border/40 text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                {question.choices?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onQuizChoice(c.id)}
                    className="text-left px-3 py-2 rounded-lg border border-border/50 text-xs hover:bg-muted/40"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {quizFeedback && (
                <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 border border-border/40 rounded-lg p-2">
                  {quizFeedback}
                </p>
              )}
              {lastMisconception && (
                <p className="text-[11px] text-violet-300">
                  Next focus: {MISCONCEPTION_COPY[lastMisconception].nextFocus}
                </p>
              )}
            </div>
          )}

          {stage === "summary" && (
            <div className="space-y-3 text-sm">
              <p className="font-bold text-foreground">Mastery: {mastery.score}%</p>
              <p className="text-xs text-muted-foreground">
                {mastery.correct}/{mastery.attempts} correct · confidently wrong:{" "}
                {mastery.confidenceWrong}
              </p>
              <p className="text-xs leading-relaxed">
                <span className="font-semibold text-foreground">Next:</span> {next.action}
              </p>
              <p className="text-xs text-muted-foreground">{next.reason}</p>
              {showUpgrade && mastery.score >= 50 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-200">
                    Unlock your complete AP Chemistry mastery plan
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Continue weak-area practice, polarity/IMFs, and full exam packs on Pro.
                  </p>
                  <Link
                    href="/dashboard/checkout?tier=pro&from=ap-science"
                    onClick={() => trackApLearnEvent("paywall_viewed", { source: "hybridization" })}
                    className="inline-flex text-xs font-bold text-sky-300 underline"
                  >
                    View Pro options
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setStage("explore");
                  setQuizIdx(0);
                }}
                className="w-full py-2 rounded-lg text-xs font-bold border border-border/50"
              >
                Keep exploring
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function labelMaybe(key: string, value: string) {
  if (key === "hybridization") return labelHybridization(value as "sp" | "sp2" | "sp3");
  return value.replace(/_/g, " ");
}
