import type { ModelBoardLane } from "./types";

/** Educational shortlist — users still submit on each agency's own channel. */
export type AgencyTarget = {
  id: string;
  name: string;
  city: string;
  lanes: ModelBoardLane[];
  submissionUrl: string;
  submissionEmail: string | null;
  leadTimeWeeks: string;
  requiresOpenCall: boolean;
  scamSafeNote: string;
  checklist: string[];
};

export const AGENCY_DIRECTORY: AgencyTarget[] = [
  {
    id: "zzai-demo-fashion",
    name: "Demo Fashion Board (example)",
    city: "New York",
    lanes: ["fashion", "runway", "editorial"],
    submissionUrl: "https://example.com/submit-fashion",
    submissionEmail: "newfaces@example.com",
    leadTimeWeeks: "2–4",
    requiresOpenCall: false,
    scamSafeNote: "Never pay upfront representation fees — legit boards earn on commission.",
    checklist: [
      "Subject: Firstname Lastname | City | Height cm | Fashion",
      "Attach comp PDF under 5 MB + 2–3 digitals",
      "Paste measurements in cm and inches",
      "One portfolio link — no password gates",
    ],
  },
  {
    id: "zzai-demo-commercial",
    name: "Demo Commercial Board (example)",
    city: "Los Angeles",
    lanes: ["commercial", "fitness"],
    submissionUrl: "https://example.com/submit-commercial",
    submissionEmail: "scouting@example.com",
    leadTimeWeeks: "3–6",
    requiresOpenCall: true,
    scamSafeNote: "Open calls are free to attend; walk away from pay-to-play photo packages.",
    checklist: [
      "Bring printed comp + digitals on a phone backup",
      "Fitted neutrals, minimal makeup",
      "Know your union status (or none) before signing",
    ],
  },
  {
    id: "zzai-demo-curve",
    name: "Demo Curve Board (example)",
    city: "Chicago",
    lanes: ["plus", "commercial"],
    submissionUrl: "https://example.com/submit-curve",
    submissionEmail: "curve@example.com",
    leadTimeWeeks: "2–5",
    requiresOpenCall: false,
    scamSafeNote: "Curve boards should never charge for roster placement.",
    checklist: [
      "Include accurate hip/waist/dress stats",
      "Show movement and smile range in digitals",
      "Link a 15s walk or spin clip if you have one",
    ],
  },
];

export function agenciesForLanes(lanes: ModelBoardLane[]): AgencyTarget[] {
  if (lanes.length === 0) return AGENCY_DIRECTORY;
  return AGENCY_DIRECTORY.filter((a) => a.lanes.some((lane) => lanes.includes(lane)));
}
