import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { RightsLawEngine } from "@/lib/education-advocacy/legal/engine";

const querySchema = z.object({
  country: z.string().max(8).optional(),
  stateProvince: z.string().max(80).optional(),
  district: z.string().max(120).optional(),
  topic: z.string().max(200).optional(),
  tags: z.array(z.string()).max(20).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid legal search");
    const engine = new RightsLawEngine();
    const result = await engine.query(parsed.data);
    return ok(result);
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Legal search failed");
  }
}
