import type { ModelAgencyDraft } from "./types";
import { MODEL_AGENCY_DRAFT_STORAGE_KEY } from "./types";

export function emptyModelAgencyDraft(): ModelAgencyDraft {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: "built",
    uploadedCompUrl: null,
    uploadedCompName: null,
    images: {
      hero: null,
      headshot: null,
      profile: null,
      threeQuarter: null,
      fullBody: null,
    },
    contact: {
      legalName: "",
      city: "",
      region: "",
      email: "",
      phone: "",
      age: null,
      instagram: "",
      portfolioUrl: "",
    },
    measurements: {
      heightCm: null,
      bustCm: null,
      waistCm: null,
      hipsCm: null,
      shoeUs: "",
      dressSize: "",
      hairColor: "",
      eyeColor: "",
    },
    lanes: [],
    selectedAgencyIds: [],
    notes: "",
  };
}

export function loadModelAgencyDraft(): ModelAgencyDraft {
  if (typeof window === "undefined") return emptyModelAgencyDraft();
  try {
    const raw = window.localStorage.getItem(MODEL_AGENCY_DRAFT_STORAGE_KEY);
    if (!raw) return emptyModelAgencyDraft();
    const parsed = JSON.parse(raw) as ModelAgencyDraft;
    if (parsed?.version !== 1) return emptyModelAgencyDraft();
    return { ...emptyModelAgencyDraft(), ...parsed };
  } catch {
    return emptyModelAgencyDraft();
  }
}

export function saveModelAgencyDraft(draft: ModelAgencyDraft) {
  if (typeof window === "undefined") return;
  const next = { ...draft, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(MODEL_AGENCY_DRAFT_STORAGE_KEY, JSON.stringify(next));
}
