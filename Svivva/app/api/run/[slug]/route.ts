import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectVersions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { executeRuntime } from "@/lib/llm/runtime";
import type { JsonSchema } from "@/lib/spec";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const startTime = Date.now();
  const { slug } = await params;

  try {
    const projectRows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);

    if (!projectRows[0]) {
      return NextResponse.json({ error: "API not found", slug }, { status: 404 });
    }

    const project = projectRows[0];

    if (!["deployed", "active", "draft"].includes(project.status)) {
      return NextResponse.json(
        { error: "API is not deployed", status: project.status },
        { status: 403 },
      );
    }

    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, project.id))
      .orderBy(desc(projectVersions.version))
      .limit(1);

    if (!versions[0]) {
      return NextResponse.json({ error: "No version found" }, { status: 404 });
    }

    const version = versions[0];

    let body: { input?: string; [key: string]: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userInput = typeof body.input === "string" ? body.input : JSON.stringify(body);

    if (!userInput) {
      return NextResponse.json({ error: "input field is required" }, { status: 400 });
    }

    const result = await executeRuntime(userInput, {
      systemPrompt: version.systemPrompt,
      outputSchema: version.outputSchema as JsonSchema,
    });

    const latencyMs = Date.now() - startTime;

    // ── APEX: log call via raw SQL (table may not exist in all environments) ──
    db.execute(
      sql`
      INSERT INTO apex_call_logs (id, project_id, version_id, input, output, latency_ms, schema_valid, repaired, error_type)
      VALUES (
        ${nanoid()}, ${project.id}, ${version.id}, ${userInput},
        ${result.success ? JSON.stringify(result.output) : null}::jsonb,
        ${latencyMs}, ${result.success && !result.repaired}, ${result.repaired ?? false},
        ${result.success ? null : "execution_error"}
      )
    `,
    ).catch(() => {});
    // ─────────────────────────────────────────────────────────────────────────

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Execution failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        output: result.output,
        repaired: result.repaired,
        attempts: result.attempts,
        latencyMs,
        apiName: project.name,
        slug: project.slug,
        poweredBy: "Svivva — svivva.com",
        cardUrl: `/api-card/${project.id}`,
      },
      {
        headers: {
          "X-Powered-By": "Svivva",
          "X-API-Name": project.name,
          "X-Latency-Ms": String(latencyMs),
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  } catch (error) {
    console.error("Run error:", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
