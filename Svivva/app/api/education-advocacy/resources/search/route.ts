import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { InMemoryResourceRegistry } from "@/lib/education-advocacy/resources/registry";

const bodySchema = z.object({
  jurisdiction: z.string().max(40).optional(),
  type: z.string().max(80).optional(),
  emergency: z.boolean().optional(),
  q: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid resource search");
    const registry = new InMemoryResourceRegistry();
    const resources = await registry.search(parsed.data);
    return ok({ resources });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Resource search failed");
  }
}
