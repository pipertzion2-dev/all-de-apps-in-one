import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { orchestrateAdvocacyMix } from "@/lib/education-advocacy/orchestration/engine";
import {
  identityBusSchema,
  educationBusSchema,
  safetyBusSchema,
} from "@/lib/education-advocacy/buses/schemas";
import { CONSOLE_PRESETS } from "@/lib/education-advocacy/presets";

const bodySchema = z.object({
  userText: z.string().max(8000).optional(),
  presetId: z
    .enum([
      "education_comeback",
      "protect_my_education",
      "know_my_rights",
      "school_transfer",
      "graduation_recovery",
      "college_path",
      "scholarship_path",
      "document_incident",
      "talk_to_advocate",
      "find_legal_help",
      "i_need_help_now",
    ])
    .optional(),
  weightOverrides: z.record(z.string(), z.number()).optional(),
  enabledChannels: z.record(z.string(), z.boolean()).optional(),
  context: z
    .object({
      identity: identityBusSchema.partial().optional(),
      education: educationBusSchema.partial().optional(),
      safety: safetyBusSchema.partial().optional(),
    })
    .optional(),
});

export async function GET() {
  return ok({
    presets: CONSOLE_PRESETS.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      weights: p.weights,
      editable: p.editable,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid orchestration request");
    const result = orchestrateAdvocacyMix({
      userText: parsed.data.userText,
      presetId: parsed.data.presetId,
      weightOverrides: parsed.data.weightOverrides as never,
      enabledChannels: parsed.data.enabledChannels as never,
      context: parsed.data.context as never,
    });
    return ok(result);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Orchestration failed");
  }
}
