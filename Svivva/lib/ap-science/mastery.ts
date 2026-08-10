import type { AttemptRecord, ConceptMastery, Confidence, MisconceptionTag } from "./types";

/**
 * Mastery score blends accuracy, recency, confidence-weighted errors, and transfer success.
 * Returns 0–100.
 */
export function computeMasteryScore(attempts: AttemptRecord[]): number {
  if (attempts.length === 0) return 0;
  const recent = attempts.slice(-12);
  let weighted = 0;
  let weightSum = 0;
  recent.forEach((a, i) => {
    const recency = (i + 1) / recent.length;
    const confidencePenalty =
      !a.correct && a.confidence === "high"
        ? 0.55
        : !a.correct && a.confidence === "medium"
          ? 0.75
          : 1;
    const transferBonus = a.correct && a.questionId.includes("q7") ? 1.1 : 1;
    const hintPenalty = a.usedHint ? 0.9 : 1;
    const w = recency;
    weighted += (a.correct ? 1 : 0) * confidencePenalty * transferBonus * hintPenalty * w;
    weightSum += w;
  });
  const raw = weightSum ? weighted / weightSum : 0;
  return Math.round(Math.max(0, Math.min(100, raw * 100)));
}

export function summarizeConcept(conceptId: string, attempts: AttemptRecord[]): ConceptMastery {
  const mine = attempts.filter((a) => a.conceptId === conceptId);
  const correct = mine.filter((a) => a.correct).length;
  const confidenceWrong = mine.filter((a) => !a.correct && a.confidence === "high").length;
  const lastWrong = [...mine].reverse().find((a) => !a.correct);
  return {
    conceptId,
    score: computeMasteryScore(mine),
    attempts: mine.length,
    correct,
    confidenceWrong,
    lastMisconception: lastWrong?.misconception,
    updatedAt: new Date().toISOString(),
  };
}

export function recommendNext(mastery: ConceptMastery): {
  action: string;
  reason: string;
  misconception?: MisconceptionTag;
} {
  if (mastery.attempts === 0) {
    return {
      action: "Start Hybridization Explorer guided predictions",
      reason: "No attempts yet — begin with visualize → predict.",
    };
  }
  if (mastery.lastMisconception) {
    return {
      action: "Targeted practice for detected misconception",
      reason: "Recent errors share a tagged misconception pattern.",
      misconception: mastery.lastMisconception,
    };
  }
  if (mastery.score < 70) {
    return {
      action: "Retry AP-style hybridization set",
      reason: `Mastery at ${mastery.score}% — need ≥75% with transfer items.`,
    };
  }
  return {
    action: "Advance to polarity / IMFs (related concepts)",
    reason: "Hybridization mastery looks solid — transfer to related bonding topics.",
  };
}

export function gradeChoice(opts: {
  correctChoiceId: string;
  selectedId: string;
  confidence: Confidence;
  misconceptionByChoice?: Record<string, MisconceptionTag>;
}): { correct: boolean; misconception?: MisconceptionTag } {
  const correct = opts.selectedId === opts.correctChoiceId;
  if (correct) return { correct: true };
  return {
    correct: false,
    misconception: opts.misconceptionByChoice?.[opts.selectedId] ?? "generic",
  };
}
