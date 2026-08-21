import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { buildEducationAccessCoercionReview } from "@/lib/education-advocacy/advocacy/coercion-review";

const bodySchema = z.object({
  narrative: z.string().min(20).max(20000),
  country: z.string().max(8).optional().default("US"),
  stateProvince: z.string().max(80).optional().default("NY"),
  district: z.string().max(120).optional(),
  gradeContext: z.string().max(120).optional().default("high-school senior"),
  yearHint: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid coercion-review request");
    const brief = await buildEducationAccessCoercionReview({
      narrative: parsed.data.narrative,
      jurisdiction: {
        country: parsed.data.country,
        stateProvince: parsed.data.stateProvince,
        district: parsed.data.district,
      },
      gradeContext: parsed.data.gradeContext,
      yearHint: parsed.data.yearHint,
    });
    return ok({ brief });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Review failed");
  }
}
