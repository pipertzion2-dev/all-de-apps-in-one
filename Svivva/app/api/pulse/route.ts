import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, usageLogs, evalRuns, evalSuites } from "@/lib/schema";
import { eq, and, gte, sql, count, avg, sum, desc, inArray } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3 * 60 * 1000;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cached = cache.get(user.id);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.ownerId, user.id))
      .orderBy(desc(projects.updatedAt));

    const projectIds = userProjects.map((p) => p.id);

    let calls24h = 0;
    let calls7d = 0;
    let calls30d = 0;
    let avgLatency: number | null = null;
    let tokens30d = 0;
    let successRate: number | null = null;
    const perProject: Record<string, { calls7d: number; calls30d: number }> = {};

    if (projectIds.length > 0) {
      const [r24] = await db
        .select({ c: count() })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day1)));
      calls24h = r24?.c || 0;

      const [r7] = await db
        .select({ c: count(), lat: avg(usageLogs.latencyMs), tok: sum(usageLogs.tokensUsed) })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day7)));
      calls7d = r7?.c || 0;
      avgLatency = r7?.lat ? Math.round(Number(r7.lat)) : null;

      const [r30] = await db
        .select({ c: count(), tok: sum(usageLogs.tokensUsed) })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day30)));
      calls30d = r30?.c || 0;
      tokens30d = r30?.tok ? Number(r30.tok) : 0;

      const [succ] = await db
        .select({ c: count() })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day7), eq(usageLogs.status, "success")));
      successRate = calls7d > 0 ? Math.round(((succ?.c || 0) / calls7d) * 100) : null;

      const perProjRows = await db
        .select({ pid: usageLogs.projectId, c: count() })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day30)))
        .groupBy(usageLogs.projectId);

      const perProj7 = await db
        .select({ pid: usageLogs.projectId, c: count() })
        .from(usageLogs)
        .where(and(inArray(usageLogs.projectId, projectIds), gte(usageLogs.createdAt, day7)))
        .groupBy(usageLogs.projectId);

      for (const id of projectIds) {
        perProject[id] = {
          calls30d: perProjRows.find((r) => r.pid === id)?.c || 0,
          calls7d: perProj7.find((r) => r.pid === id)?.c || 0,
        };
      }
    }

    let evalPassRate: number | null = null;
    if (projectIds.length > 0) {
      const suites = await db
        .select({ id: evalSuites.id })
        .from(evalSuites)
        .where(inArray(evalSuites.projectId, projectIds));

      const suiteIds = suites.map((s) => s.id);
      if (suiteIds.length > 0) {
        const runs = await db
          .select({ passed: evalRuns.passedCases, total: evalRuns.totalCases })
          .from(evalRuns)
          .where(inArray(evalRuns.suiteId, suiteIds))
          .orderBy(desc(evalRuns.createdAt))
          .limit(20);

        let tp = 0;
        let tt = 0;
        for (const r of runs) {
          tp += r.passed || 0;
          tt += r.total || 0;
        }
        evalPassRate = tt > 0 ? Math.round((tp / tt) * 100) : null;
      }
    }

    const snapshot = {
      projects: userProjects.map((p) => ({
        name: p.name,
        status: p.status,
        calls7d: perProject[p.id]?.calls7d || 0,
        calls30d: perProject[p.id]?.calls30d || 0,
        age: Math.floor((now.getTime() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
      })),
      totals: { calls24h, calls7d, calls30d, avgLatency, tokens30d, successRate, evalPassRate },
    };

    let insights: { headline: string; items: { type: string; icon: string; title: string; body: string; action: string }[] } = {
      headline: "",
      items: [],
    };

    try {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are Pulse, Svivva's automated growth advisor. Analyze a user's account snapshot (projects, usage data, eval scores) and produce a concise, actionable intelligence briefing. Be specific — reference their actual project names and numbers. No fluff. Tone: calm, direct, insightful.

Rules:
- If no projects exist, suggest what to build based on trending API use-cases.
- If projects exist but have low usage, diagnose why and give concrete next steps.
- Always include at least one "growth opportunity" idea they haven't thought of.
- Include one "risk alert" if anything looks off (no evals, dropping usage, stale projects).
- Suggest one automation they could set up.`,
          },
          {
            role: "user",
            content: `Account snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nReturn JSON:\n{\n  "headline": "one-sentence summary of their account health",\n  "items": [\n    {\n      "type": "insight|opportunity|risk|action",\n      "icon": "emoji",\n      "title": "short title",\n      "body": "2-3 sentence explanation with specifics",\n      "action": "concrete next step"\n    }\n  ]\n}\n\nReturn 5-7 items. Mix types. Be specific to their data.`,
          },
        ],
      });

      const raw = completion.choices[0].message.content;
      try {
        const parsed = JSON.parse(raw || "{}");
        insights = {
          headline: parsed.headline || "",
          items: Array.isArray(parsed.items) ? parsed.items : [],
        };
      } catch {
        insights = { headline: "Pulse generated insights but couldn't parse them.", items: [] };
      }
    } catch (e) {
      console.error("Pulse AI error:", e);
      insights = { headline: "AI analysis temporarily unavailable.", items: [] };
    }

    const response = {
      snapshot: {
        projectCount: userProjects.length,
        calls24h,
        calls7d,
        calls30d,
        avgLatency,
        tokens30d,
        successRate,
        evalPassRate,
        projects: userProjects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          calls7d: perProject[p.id]?.calls7d || 0,
          calls30d: perProject[p.id]?.calls30d || 0,
        })),
      },
      insights,
    };

    cache.set(user.id, { data: response, ts: Date.now() });

    return NextResponse.json(response);
  } catch (e) {
    console.error("Pulse error:", e);
    return NextResponse.json({ error: "Failed to generate pulse" }, { status: 500 });
  }
}
