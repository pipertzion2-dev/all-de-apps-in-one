import type { ChannelWeights } from "./types";
import { normalizeWeights } from "./channels";

export type ConsolePresetId =
  | "education_comeback"
  | "protect_my_education"
  | "know_my_rights"
  | "school_transfer"
  | "graduation_recovery"
  | "college_path"
  | "scholarship_path"
  | "document_incident"
  | "talk_to_advocate"
  | "find_legal_help"
  | "i_need_help_now";

export type ConsolePreset = {
  id: ConsolePresetId;
  label: string;
  description: string;
  weights: ChannelWeights;
  editable: true;
};

function preset(
  id: ConsolePresetId,
  label: string,
  description: string,
  weights: Partial<ChannelWeights>,
): ConsolePreset {
  return {
    id,
    label,
    description,
    weights: normalizeWeights(weights),
    editable: true,
  };
}

/** Console presets configure channel weighting but remain user-editable. */
export const CONSOLE_PRESETS: ConsolePreset[] = [
  preset(
    "education_comeback",
    "Education Comeback",
    "Plan a return to schooling after an interruption.",
    {
      education: 100,
      career_pathways: 70,
      opportunity_resources: 80,
      student_rights_law: 10,
      crisis_safety: 0,
      ai_guide: 60,
      story_timeline: 50,
      advocacy: 40,
    },
  ),
  preset(
    "protect_my_education",
    "Protect My Education",
    "Document an interruption or dispute and prepare an advocacy case file.",
    {
      education: 80,
      student_rights_law: 90,
      advocacy: 90,
      evidence_vault: 75,
      human_assistance: 60,
      cybersecurity: 70,
      story_timeline: 80,
      ai_guide: 55,
      verification_ledger: 40,
    },
  ),
  preset(
    "know_my_rights",
    "Know My Rights",
    "Explore jurisdiction-aware student rights information.",
    {
      student_rights_law: 100,
      education: 60,
      advocacy: 50,
      ai_guide: 70,
      human_assistance: 40,
      opportunity_resources: 20,
    },
  ),
  preset(
    "school_transfer",
    "School Transfer",
    "Navigate transfer, enrollment, and credit questions.",
    {
      education: 90,
      student_rights_law: 70,
      advocacy: 60,
      story_timeline: 50,
      human_assistance: 50,
      ai_guide: 55,
    },
  ),
  preset(
    "graduation_recovery",
    "Graduation Recovery",
    "Recover credits and pathways toward graduation.",
    {
      education: 100,
      career_pathways: 60,
      opportunity_resources: 70,
      advocacy: 40,
      ai_guide: 50,
    },
  ),
  preset("college_path", "College Path", "Align goals toward college enrollment.", {
    education: 80,
    career_pathways: 100,
    opportunity_resources: 90,
    ai_guide: 50,
    advocacy: 20,
  }),
  preset(
    "scholarship_path",
    "Scholarship Path",
    "Prepare selective materials for scholarship review.",
    {
      opportunity_resources: 100,
      education: 70,
      story_timeline: 80,
      evidence_vault: 40,
      career_pathways: 60,
    },
  ),
  preset(
    "document_incident",
    "Document an Incident",
    "Capture what happened with chain-of-custody discipline.",
    {
      evidence_vault: 100,
      story_timeline: 90,
      cybersecurity: 85,
      verification_ledger: 60,
      advocacy: 50,
      education: 40,
      ai_guide: 40,
    },
  ),
  preset("talk_to_advocate", "Talk to an Advocate", "Prepare for human advocacy conversations.", {
    human_assistance: 100,
    advocacy: 90,
    education: 50,
    student_rights_law: 40,
    evidence_vault: 30,
    ai_guide: 50,
  }),
  preset(
    "find_legal_help",
    "Find Legal Help",
    "Locate verified legal-aid and referral resources.",
    {
      student_rights_law: 90,
      human_assistance: 100,
      opportunity_resources: 70,
      advocacy: 60,
      ai_guide: 45,
    },
  ),
  preset(
    "i_need_help_now",
    "I Need Help Now",
    "Safety-first routing to verified crisis and human help resources.",
    {
      crisis_safety: 100,
      human_assistance: 100,
      ai_guide: 40,
      student_rights_law: 60,
      evidence_vault: 30,
      education: 20,
      advocacy: 40,
    },
  ),
];

export const PRESET_BY_ID = new Map(CONSOLE_PRESETS.map((p) => [p.id, p]));

export function getPreset(id: ConsolePresetId): ConsolePreset | undefined {
  return PRESET_BY_ID.get(id);
}
