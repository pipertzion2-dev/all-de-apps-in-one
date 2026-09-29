/** Model board / market lane — match agency rosters before you submit. */
export type ModelBoardLane = "fashion" | "commercial" | "editorial" | "plus" | "fitness" | "runway";

export type ModelMeasurements = {
  heightCm: number | null;
  bustCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  shoeUs: string;
  dressSize: string;
  hairColor: string;
  eyeColor: string;
};

export type ModelContact = {
  legalName: string;
  city: string;
  region: string;
  email: string;
  phone: string;
  age: number | null;
  instagram: string;
  portfolioUrl: string;
};

export type CompCardSlot = "hero" | "headshot" | "profile" | "threeQuarter" | "fullBody";

export type CompCardImages = Record<CompCardSlot, string | null>;

export type CompCardSource = "upload" | "built";

export type ModelAgencyDraft = {
  version: 1;
  updatedAt: string;
  source: CompCardSource;
  /** Uploaded comp card PDF or single composite image (data URL). */
  uploadedCompUrl: string | null;
  uploadedCompName: string | null;
  images: CompCardImages;
  contact: ModelContact;
  measurements: ModelMeasurements;
  lanes: ModelBoardLane[];
  selectedAgencyIds: string[];
  notes: string;
};

export const MODEL_AGENCY_DRAFT_STORAGE_KEY = "zzai-model-agency-draft-v1";

export const COMP_CARD_SLOTS: { id: CompCardSlot; label: string; hint: string }[] = [
  { id: "hero", label: "Hero", hint: "Strongest booking shot — often full body or editorial." },
  { id: "headshot", label: "Headshot", hint: "Clean face, minimal makeup, neutral background." },
  { id: "profile", label: "Profile", hint: "Side view — agencies check bone structure and hair." },
  { id: "threeQuarter", label: "3/4", hint: "Waist-up or three-quarter length." },
  { id: "fullBody", label: "Full body", hint: "Fitted neutrals, plain wall, natural light." },
];

export const MODEL_BOARD_LANES: { id: ModelBoardLane; label: string; blurb: string }[] = [
  {
    id: "fashion",
    label: "Fashion / editorial",
    blurb: "Runway-adjacent boards — height specs matter; calm, editorial digitals.",
  },
  {
    id: "commercial",
    label: "Commercial / print",
    blurb: "Warmth, range, and relatable looks for brands and catalog.",
  },
  {
    id: "editorial",
    label: "Editorial / unique",
    blurb: "Strong character, unconventional beauty, creative portfolios.",
  },
  {
    id: "plus",
    label: "Curve / plus",
    blurb: "Dedicated curve boards — accurate measurements and confidence on camera.",
  },
  {
    id: "fitness",
    label: "Fitness / athletic",
    blurb: "Athletic builds, movement clips, sportswear and wellness brands.",
  },
  {
    id: "runway",
    label: "Runway",
    blurb: "Strict height/walk standards — bring digitals and a short walk clip link.",
  },
];
