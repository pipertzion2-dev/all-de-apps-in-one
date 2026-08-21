import { z } from "zod";
import { randomUUID } from "crypto";
import { RECORDING_LAW_WARNING, ROLE_BOUNDARY } from "../disclaimers";
import { SCHEMA_VERSION } from "../types";

export const protectMyEducationInputSchema = z.object({
  whatHappened: z.string().min(1).max(8000),
  dateTime: z.string().max(80).optional(),
  school: z.string().max(300).optional(),
  peopleOrOrganizations: z.array(z.string().max(200)).max(40).optional().default([]),
  whatUserWanted: z.string().max(2000).optional(),
  whatOtherRequestedOrDecided: z.string().max(2000).optional(),
  whatSchoolCommunicated: z.string().max(4000).optional(),
  documents: z
    .array(
      z.object({
        name: z.string().max(260),
        kind: z.enum(["message", "screenshot", "pdf", "photograph", "audio", "other"]),
        contentHash: z
          .string()
          .regex(/^[a-f0-9]{64}$/i)
          .optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .max(40)
    .optional()
    .default([]),
  witnesses: z.array(z.string().max(200)).max(20).optional().default([]),
  desiredResolution: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
  audioExplicitlyPermitted: z.boolean().optional().default(false),
});

export type ProtectMyEducationInput = z.infer<typeof protectMyEducationInputSchema>;

export type EducationAdvocacyCaseFile = {
  protocol: "ZZAI-Education-Advocacy-Case/1.0";
  schemaVersion: string;
  caseId: string;
  createdAt: string;
  chronology: Array<{ at: string; entry: string; source: string }>;
  incident: ProtectMyEducationInput;
  warnings: string[];
  disclaimers: string[];
};

export function buildEducationAdvocacyCaseFile(
  input: ProtectMyEducationInput,
): EducationAdvocacyCaseFile {
  const createdAt = new Date().toISOString();
  const chronology: EducationAdvocacyCaseFile["chronology"] = [];
  if (input.dateTime) {
    chronology.push({
      at: input.dateTime,
      entry: input.whatHappened,
      source: "user_statement",
    });
  } else {
    chronology.push({
      at: createdAt,
      entry: input.whatHappened,
      source: "user_statement",
    });
  }
  if (input.whatSchoolCommunicated) {
    chronology.push({
      at: input.dateTime || createdAt,
      entry: `School communication: ${input.whatSchoolCommunicated}`,
      source: "school_communication",
    });
  }
  if (input.whatOtherRequestedOrDecided) {
    chronology.push({
      at: input.dateTime || createdAt,
      entry: `Other party request/decision: ${input.whatOtherRequestedOrDecided}`,
      source: "other_party",
    });
  }
  for (const doc of input.documents || []) {
    chronology.push({
      at: createdAt,
      entry: `Document noted: ${doc.name} (${doc.kind})${doc.contentHash ? ` hash=${doc.contentHash.slice(0, 12)}…` : ""}`,
      source: "document_index",
    });
  }

  const warnings = [RECORDING_LAW_WARNING];
  if ((input.documents || []).some((d) => d.kind === "audio") && !input.audioExplicitlyPermitted) {
    warnings.push(
      "Audio was listed but not marked as lawful and explicitly permitted — remove or confirm before sealing.",
    );
  }

  return {
    protocol: "ZZAI-Education-Advocacy-Case/1.0",
    schemaVersion: SCHEMA_VERSION,
    caseId: `case_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    createdAt,
    chronology,
    incident: input,
    warnings,
    disclaimers: [ROLE_BOUNDARY],
  };
}
