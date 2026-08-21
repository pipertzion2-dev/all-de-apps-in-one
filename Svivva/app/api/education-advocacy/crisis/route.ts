import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { routeCrisisHelp, CRISIS_CATEGORIES } from "@/lib/education-advocacy/crisis/router";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  jurisdiction: z.string().max(40).optional(),
  category: z.enum(CRISIS_CATEGORIES).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid crisis request");
    const result = await routeCrisisHelp(parsed.data);
    return ok(result);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Crisis routing failed");
  }
}
