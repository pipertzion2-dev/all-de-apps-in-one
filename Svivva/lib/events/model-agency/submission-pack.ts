import { agenciesForLanes } from "./agency-directory";
import type { ModelAgencyDraft, ModelBoardLane } from "./types";

function cmToIn(cm: number | null): string {
  if (cm == null || !Number.isFinite(cm)) return "—";
  return `${(cm / 2.54).toFixed(1)}"`;
}

function formatMeasurementsBlock(draft: ModelAgencyDraft): string {
  const m = draft.measurements;
  const lines = [
    `Height: ${m.heightCm ?? "—"} cm (${cmToIn(m.heightCm)})`,
    `Bust: ${m.bustCm ?? "—"} cm (${cmToIn(m.bustCm)})`,
    `Waist: ${m.waistCm ?? "—"} cm (${cmToIn(m.waistCm)})`,
    `Hips: ${m.hipsCm ?? "—"} cm (${cmToIn(m.hipsCm)})`,
    `Shoe: ${m.shoeUs || "—"} US`,
    `Dress: ${m.dressSize || "—"}`,
    `Hair / eyes: ${m.hairColor || "—"} / ${m.eyeColor || "—"}`,
  ];
  return lines.join("\n");
}

export function submissionEmailSubject(draft: ModelAgencyDraft, lane: ModelBoardLane): string {
  const name = draft.contact.legalName.trim() || "Model";
  const city = draft.contact.city.trim() || "City";
  const height = draft.measurements.heightCm ?? "";
  const laneLabel = lane.replace(/^\w/, (c) => c.toUpperCase());
  return `${name} | ${city} | ${height} cm | ${laneLabel}`;
}

export function submissionEmailBody(draft: ModelAgencyDraft): string {
  const c = draft.contact;
  const ageLine = c.age != null ? `${c.age} years old` : "Age on request";
  const lanes = draft.lanes.length ? draft.lanes.join(", ") : "open board";

  return [
    `Hello scouting team,`,
    ``,
    `I'm submitting for representation. I'm ${ageLine}, based in ${c.city}${c.region ? `, ${c.region}` : ""}, targeting ${lanes} work.`,
    ``,
    `Measurements:`,
    formatMeasurementsBlock(draft),
    ``,
    c.portfolioUrl ? `Portfolio: ${c.portfolioUrl}` : `Portfolio: (add link before sending)`,
    c.instagram ? `Instagram: ${c.instagram}` : null,
    ``,
    `Attached: comp card + digitals (PDF/JPG, under 5 MB each).`,
    ``,
    `Thank you,`,
    c.legalName || "—",
    c.phone ? c.phone : null,
    c.email || "—",
  ]
    .filter(Boolean)
    .join("\n");
}

export type SubmissionPack = {
  subject: string;
  body: string;
  checklist: string[];
  agencies: ReturnType<typeof agenciesForLanes>;
  warnings: string[];
};

export function buildSubmissionPack(draft: ModelAgencyDraft): SubmissionPack {
  const primaryLane = draft.lanes[0] ?? "commercial";
  const agencies = agenciesForLanes(draft.lanes).filter((a) =>
    draft.selectedAgencyIds.length ? draft.selectedAgencyIds.includes(a.id) : true,
  );

  const checklist = [
    "Comp card matches digitals (same hair, weight, and look)",
    "Files named Firstname-Lastname-Comp-Card.pdf — no final_final_v3",
    "Email under 5 MB per attachment; use a direct link if larger",
    "One polite follow-up after 3–4 weeks — then move on or resubmit",
    "Verify agency on social — real models tag their board",
  ];

  const warnings = [
    "Legitimate agencies do not charge upfront representation fees.",
    "Never share banking info or pay for a 'model school' to get signed.",
    "Research each board's roster before submitting — fit beats volume.",
  ];

  return {
    subject: submissionEmailSubject(draft, primaryLane),
    body: submissionEmailBody(draft),
    checklist,
    agencies,
    warnings,
  };
}

export function compCardReady(draft: ModelAgencyDraft): boolean {
  if (draft.source === "upload") {
    return Boolean(draft.uploadedCompUrl);
  }
  const { images } = draft;
  return Boolean(images.hero && images.fullBody && images.headshot);
}

export function draftCompletionPercent(draft: ModelAgencyDraft): number {
  let score = 0;
  const weights = [
    compCardReady(draft) ? 30 : 0,
    draft.contact.legalName && draft.contact.email ? 20 : 0,
    draft.measurements.heightCm ? 15 : 0,
    draft.lanes.length ? 15 : 0,
    draft.selectedAgencyIds.length ? 10 : 0,
    draft.contact.portfolioUrl || draft.contact.instagram ? 10 : 0,
  ];
  score = weights.reduce((a, b) => a + b, 0);
  return Math.min(100, score);
}
