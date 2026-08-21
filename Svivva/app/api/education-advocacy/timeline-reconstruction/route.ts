import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { buildEducationTimelineReconstruction } from "@/lib/education-advocacy/advocacy/timeline-reconstruction";

const laneSchema = z.enum([
  "student_experience",
  "education_attendance",
  "parent_guardian_actions",
  "school_knowledge_response",
  "employment",
  "housing",
  "records_evidence",
]);

const eventSchema = z.object({
  id: z.string().max(80).optional(),
  dateExactOrApproximate: z.string().min(1).max(200),
  event: z.string().min(1).max(4000),
  peopleOrganizations: z.array(z.string().max(200)).max(40).optional(),
  sourceKind: z
    .enum([
      "student_recollection",
      "attendance_record",
      "transcript",
      "text_message",
      "email",
      "employment_record",
      "school_form",
      "screenshot",
      "location_history",
      "witness",
      "agency_record",
      "other",
    ])
    .optional(),
  sourceDetail: z.string().max(500).optional(),
  evidenceStatus: z
    .enum([
      "documented",
      "partially_documented",
      "user_reported",
      "disputed",
      "unknown_needs_verification",
    ])
    .optional(),
  educationalConsequence: z.string().max(1000).optional(),
  educationalImpact: z.string().max(1000).optional(),
  causationLabel: z.enum(["supported", "possible_connection", "unknown"]).optional(),
  lanes: z.array(laneSchema).max(7).optional(),
  tags: z.array(z.string().max(80)).max(20).optional(),
});

const bodySchema = z.object({
  intake: z.object({
    stateProvince: z.string().max(80).optional(),
    country: z.string().max(8).optional(),
    district: z.string().max(120).optional(),
    schoolName: z.string().max(300).optional(),
    approximateSchoolYear: z.string().max(120).optional(),
    studentAgeAtTime: z.string().max(40).optional(),
    grade: z.string().max(40).optional(),
    expectedGraduationDate: z.string().max(120).optional(),
    lastNormalAttendance: z.string().max(300).optional(),
    housingLivingSituation: z.string().max(2000).optional(),
    employmentSituation: z.string().max(2000).optional(),
    majorFamilyHouseholdChanges: z.string().max(2000).optional(),
    periodsUnableToAttend: z.string().max(2000).optional(),
    transfersOrAlternativePrograms: z.string().max(2000).optional(),
    graduationOrOutcome: z.string().max(2000).optional(),
    freeformRecollection: z.string().max(20000).optional(),
  }),
  events: z.array(eventSchema).max(80).optional(),
  documents: z
    .array(
      z.object({
        name: z.string().max(260),
        kind: z.string().max(80).optional(),
        aiInterpretation: z.string().max(2000).optional(),
        originalPreserved: z.literal(true),
        datesMentioned: z.array(z.string().max(120)).max(40).optional(),
      }),
    )
    .max(40)
    .optional(),
  hiddenLanes: z.array(laneSchema).max(7).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid timeline-reconstruction request");
    const hasContent =
      (parsed.data.intake.freeformRecollection || "").trim().length >= 10 ||
      (parsed.data.events || []).length > 0 ||
      Object.values(parsed.data.intake).some((v) => typeof v === "string" && v.trim().length > 0);
    if (!hasContent) {
      return badRequest("Provide a recollection, intake fields, or at least one event — approximate dates are fine.");
    }
    const reconstruction = await buildEducationTimelineReconstruction(parsed.data);
    return ok({ reconstruction });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Reconstruction failed");
  }
}
