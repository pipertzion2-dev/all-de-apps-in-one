/**
 * Content quality gate — rejects thin/duplicate/low-gain pages at generation time.
 * Hard rules: no doorway pages, no keyword stuffing, minimum information gain.
 */

export type ContentQualityInput = {
  title: string;
  content: string;
  benefits?: string[];
  howItWorks?: string;
  whoItsFor?: string;
  relatedCount?: number;
  hasFaq?: boolean;
  hasComparison?: boolean;
};

export type ContentQualityScores = {
  semanticDepth: number;
  uniqueness: number;
  informationGain: number;
  overall: number;
  passed: boolean;
  reasons: string[];
};

const MIN_WORDS = 280;
const MIN_OVERALL = 0.55;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function keywordDensity(text: string, keyword: string): number {
  if (!keyword.trim()) return 0;
  const words = wordCount(text);
  if (words === 0) return 0;
  const k = keyword.toLowerCase();
  const matches = text.toLowerCase().split(k).length - 1;
  return matches / words;
}

export function scorePageContent(input: ContentQualityInput): ContentQualityScores {
  const reasons: string[] = [];
  const words = wordCount(input.content);
  const sections = [input.howItWorks, input.whoItsFor, ...(input.benefits ?? [])].filter(
    Boolean,
  ).length;

  let semanticDepth = 0.2;
  if (words >= MIN_WORDS) semanticDepth += 0.35;
  else reasons.push(`Content under ${MIN_WORDS} words (${words})`);
  if (sections >= 2) semanticDepth += 0.2;
  if (input.hasFaq) semanticDepth += 0.15;
  if (input.hasComparison) semanticDepth += 0.1;
  semanticDepth = Math.min(1, semanticDepth);

  const titleWords = new Set(input.title.toLowerCase().split(/\W+/));
  const contentWords = input.content.toLowerCase().split(/\W+/);
  const overlap =
    contentWords.filter((w) => titleWords.has(w) && w.length > 3).length /
    Math.max(titleWords.size, 1);
  let uniqueness = 0.5 + (1 - Math.min(overlap, 0.8)) * 0.4;
  if (words < 150) {
    uniqueness *= 0.6;
    reasons.push("Very short content reduces uniqueness score");
  }
  uniqueness = Math.min(1, uniqueness);

  let informationGain = 0.25;
  if (words >= 400) informationGain += 0.25;
  if ((input.relatedCount ?? 0) >= 2) informationGain += 0.15;
  if (input.hasFaq) informationGain += 0.15;
  if (sections >= 3) informationGain += 0.2;
  informationGain = Math.min(1, informationGain);

  const density = keywordDensity(input.content, input.title);
  if (density > 0.04) {
    reasons.push(`Possible keyword stuffing (density ${(density * 100).toFixed(1)}%)`);
    uniqueness *= 0.7;
  }

  const overall = Math.round(((semanticDepth + uniqueness + informationGain) / 3) * 100) / 100;

  const passed = overall >= MIN_OVERALL && words >= MIN_WORDS && density <= 0.045;

  return {
    semanticDepth: Math.round(semanticDepth * 100) / 100,
    uniqueness: Math.round(uniqueness * 100) / 100,
    informationGain: Math.round(informationGain * 100) / 100,
    overall,
    passed,
    reasons,
  };
}

export function assertContentQuality(input: ContentQualityInput): void {
  const scores = scorePageContent(input);
  if (!scores.passed) {
    throw new Error(
      `Content quality gate failed for "${input.title}": ${scores.reasons.join("; ") || `overall ${scores.overall}`}`,
    );
  }
}
