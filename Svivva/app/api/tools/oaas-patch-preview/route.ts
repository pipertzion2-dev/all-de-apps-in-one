import { NextRequest } from "next/server";
import { z } from "zod";
import { suggestFeaturesByKeywords } from "@/lib/platform/feature-suggestions";
import { formatPatchRoute } from "@/lib/platform/feature-graph";
import { badRequest, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  goal: z.string().min(8).max(400),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Describe a goal in a short sentence.");

  const result = suggestFeaturesByKeywords({
    goal: parsed.data.goal,
    limit: 5,
    includeAdmin: false,
  });

  return ok({
    goal: result.goal,
    summary: result.summary,
    workflow: result.workflow,
    patch: formatPatchRoute(result.workflow),
    picks: result.suggestions.slice(0, 4).map((s) => ({
      title: s.title,
      href: s.href,
      reason: s.reason,
    })),
    nextHref: "/#oaas",
    slice: "Keyword patch only. Open OaaS on zzaizzai.com for the full mixing-board hub.",
  });
}
