import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { loadLatestSeoWeeklyRoutine, runSeoWeeklyRoutine } from "@/lib/orbit/seo-weekly-routine";
import { buildSeoLearningRoadmap } from "@/lib/orbit/seo-learning-roadmap";
import { forbidden, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET — latest weekly routine result + learning roadmap */
export async function GET() {
  if (!(await isOrbitAdminAllowed())) return forbidden();

  const [saved, roadmap] = await Promise.all([
    loadLatestSeoWeeklyRoutine(),
    buildSeoLearningRoadmap(),
  ]);

  return ok({
    result: saved,
    roadmap,
    summary: saved?.summary ?? null,
    lastRunAt: saved?.finishedAt ?? null,
    implemented: true,
    agent: "orbit_seo_weekly_routine",
  });
}

/** POST — run the full 14-step SEO weekly routine */
export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = internalSecret && internalSecret === process.env.ORBIT_INTERNAL_SECRET;
  if (!isInternal && !(await isOrbitAdminAllowed(req))) return forbidden();

  const body = (await req.json().catch(() => ({}))) as {
    skipContentGeneration?: boolean;
    fusionPages?: number;
  };

  const result = await runSeoWeeklyRoutine({
    skipContentGeneration: body.skipContentGeneration,
    fusionPages: body.fusionPages,
  });

  return ok({
    ...result,
    implemented: true,
    agent: "orbit_seo_weekly_routine",
  });
}
