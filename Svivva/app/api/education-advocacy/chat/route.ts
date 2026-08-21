import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { runAdvocacyChat } from "@/lib/education-advocacy/advocacy/chat";
import {
  identityBusSchema,
  educationBusSchema,
  legalContextBusSchema,
} from "@/lib/education-advocacy/buses/schemas";

const bodySchema = z.object({
  message: z.string().min(1).max(8000),
  presetId: z.string().max(80).optional(),
  context: z
    .object({
      identity: identityBusSchema.partial().optional(),
      education: educationBusSchema.partial().optional(),
      legal: legalContextBusSchema.partial().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid chat request");
    const result = await runAdvocacyChat({
      message: parsed.data.message,
      presetId: parsed.data.presetId as never,
      context: {
        identity: parsed.data.context?.identity
          ? {
              schemaVersion: "ZZAI-EduAdvocate/1.0",
              pseudonymousUserId: parsed.data.context.identity.pseudonymousUserId || "anon_session",
              ageRange: parsed.data.context.identity.ageRange || "unknown",
              preferences: parsed.data.context.identity.preferences || {},
              jurisdiction: parsed.data.context.identity.jurisdiction,
              consentState: parsed.data.context.identity.consentState,
            }
          : undefined,
        education: parsed.data.context?.education as never,
        legal: parsed.data.context?.legal as never,
      },
    });
    return ok(result);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Chat failed");
  }
}
