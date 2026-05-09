/**
 * APEX — Autonomous Prompt Evolution eXecutor
 *
 * Observe → Analyze → Hypothesize → Evaluate → (Promote | Skip) → Learn
 *
 * Runs continuously after deploy. No user input required.
 * Uses raw SQL for apex_call_logs and apex_cycles (tables managed outside schema.ts).
 */

import { db } from "@/lib/db";
import { projects, projectVersions, evalSuites, evalCases } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { executeRuntime } from "@/lib/llm/runtime";
import type { JsonSchema } from "@/lib/spec";
import { nanoid } from "nanoid";

const MIN_CALLS_REQUIRED = 5;
const MIN_IMPROVEMENT_DELTA = 5;
const MAX_EVAL_CASES = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point — runs one full APEX cycle for a project
// ─────────────────────────────────────────────────────────────────────────────
export async function runApexCycle(projectId: string): Promise<{
  cycleId: string;
  status: string;
  message: string;
}> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Project not found");

  const [version] = await db
    .select()
    .from(projectVersions)
    .where(eq(projectVersions.projectId, projectId))
    .orderBy(desc(projectVersions.version))
    .limit(1);

  const currentPrompt = version?.systemPrompt ?? project.systemPrompt;
  const outputSchema = (version?.outputSchema ?? project.outputSchema) as JsonSchema;

  const cycleId = nanoid();
  await db.execute(sql`
    INSERT INTO apex_cycles (id, project_id, prompt_before, status)
    VALUES (${cycleId}, ${projectId}, ${currentPrompt}, 'running')
  `);

  try {
    const logsResult = await db.execute(sql`
      SELECT id, input, output, schema_valid, repaired, error_type, created_at
      FROM apex_call_logs
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
      LIMIT 100
    `);
    const recentLogs = logsResult.rows as Array<{
      id: string;
      input: string;
      output: unknown;
      schema_valid: boolean;
      repaired: boolean;
      error_type: string | null;
      created_at: Date;
    }>;

    if (recentLogs.length < MIN_CALLS_REQUIRED) {
      return await finishCycle(
        cycleId,
        "skipped",
        currentPrompt,
        null,
        null,
        null,
        0,
        `Only ${recentLogs.length} calls logged — need at least ${MIN_CALLS_REQUIRED} to run APEX`,
      );
    }

    const failures = recentLogs.filter((l) => !l.schema_valid || l.error_type || l.repaired);
    const failureRate = Math.round((failures.length / recentLogs.length) * 100);
    const sampleFailures = failures.slice(0, 5).map((l) => l.input);
    const sampleSuccesses = recentLogs
      .filter((l) => l.schema_valid && !l.error_type)
      .slice(0, 3)
      .map((l) => l.input);

    const diagnosisResp = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert AI prompt engineer. Analyze these API call logs and identify the single most important failure pattern to fix.`,
        },
        {
          role: "user",
          content: `Current system prompt:\n${currentPrompt}\n\nFailing inputs (${failures.length} of ${recentLogs.length} recent calls):\n${sampleFailures.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nSuccessful inputs:\n${sampleSuccesses.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDescribe the failure pattern in one sentence, then write an improved system prompt that fixes it. Respond as JSON: { "failurePattern": "...", "improvedPrompt": "..." }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const diagnosis = JSON.parse(diagnosisResp.choices[0].message.content ?? "{}") as {
      failurePattern?: string;
      improvedPrompt?: string;
    };

    const failurePattern =
      diagnosis.failurePattern ?? `${failureRate}% of calls failing schema validation`;
    const improvedPrompt = diagnosis.improvedPrompt;

    if (!improvedPrompt || improvedPrompt.trim() === currentPrompt.trim()) {
      return await finishCycle(
        cycleId,
        "skipped",
        currentPrompt,
        improvedPrompt ?? null,
        null,
        null,
        0,
        "No meaningful prompt improvement found",
      );
    }

    const suites = await db
      .select()
      .from(evalSuites)
      .where(eq(evalSuites.projectId, projectId))
      .limit(1);
    let scoreBefore = 0;
    let scoreAfter = 0;
    let casesRun = 0;

    if (suites[0]) {
      const cases = await db
        .select()
        .from(evalCases)
        .where(and(eq(evalCases.suiteId, suites[0].id), eq(evalCases.isActive, true)))
        .limit(MAX_EVAL_CASES);

      casesRun = cases.length;

      if (cases.length > 0) {
        const [beforePassed, afterPassed] = await Promise.all([
          scorePrompt(currentPrompt, outputSchema, cases),
          scorePrompt(improvedPrompt, outputSchema, cases),
        ]);
        scoreBefore = Math.round((beforePassed / cases.length) * 100);
        scoreAfter = Math.round((afterPassed / cases.length) * 100);
      }
    }

    const shouldPromote =
      casesRun === 0 ? failureRate > 20 : scoreAfter - scoreBefore >= MIN_IMPROVEMENT_DELTA;

    if (!shouldPromote) {
      return await finishCycle(
        cycleId,
        "skipped",
        currentPrompt,
        improvedPrompt,
        scoreBefore,
        scoreAfter,
        casesRun,
        `Score delta insufficient (${scoreBefore}→${scoreAfter})`,
      );
    }

    const nextVersionNum = (version?.version ?? 0) + 1;
    const newVersionId = nanoid();

    await db.insert(projectVersions).values({
      id: newVersionId,
      projectId,
      version: nextVersionNum,
      systemPrompt: improvedPrompt,
      outputSchema: outputSchema as Record<string, unknown>,
      changeSummary: `APEX auto-improvement: ${failurePattern}`,
    });

    await db
      .update(projects)
      .set({ systemPrompt: improvedPrompt, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    await db.execute(sql`
      UPDATE apex_cycles SET sample_inputs = ${JSON.stringify(sampleFailures)}::jsonb WHERE id = ${cycleId}
    `);

    return await finishCycle(
      cycleId,
      "promoted",
      currentPrompt,
      improvedPrompt,
      scoreBefore,
      scoreAfter,
      casesRun,
      undefined,
      true,
      failurePattern,
    );
  } catch (err) {
    console.error("[APEX] cycle error:", err);
    await db.execute(sql`
      UPDATE apex_cycles SET status = 'failed', completed_at = NOW() WHERE id = ${cycleId}
    `);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback a promoted APEX cycle
// ─────────────────────────────────────────────────────────────────────────────
export async function rollbackApexCycle(cycleId: string) {
  const result = await db.execute(sql`
    SELECT * FROM apex_cycles WHERE id = ${cycleId} LIMIT 1
  `);
  const cycle = result.rows[0] as
    | {
        id: string;
        project_id: string;
        prompt_before: string;
        promoted: boolean;
        rolled_back: boolean;
      }
    | undefined;

  if (!cycle) throw new Error("Cycle not found");
  if (!cycle.promoted) throw new Error("Cycle was not promoted — nothing to rollback");
  if (cycle.rolled_back) throw new Error("Already rolled back");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, cycle.project_id))
    .limit(1);
  if (!project) throw new Error("Project not found");

  await db
    .update(projects)
    .set({ systemPrompt: cycle.prompt_before, updatedAt: new Date() })
    .where(eq(projects.id, cycle.project_id));

  await db.execute(sql`
    UPDATE apex_cycles SET rolled_back = TRUE WHERE id = ${cycleId}
  `);

  return { restored: true, prompt: cycle.prompt_before };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function scorePrompt(
  prompt: string,
  schema: JsonSchema,
  cases: Array<{ input: string; expectedOutput: Record<string, unknown> | null }>,
): Promise<number> {
  let passed = 0;
  await Promise.allSettled(
    cases.map(async (c) => {
      const res = await executeRuntime(c.input, { systemPrompt: prompt, outputSchema: schema });
      if (res.success) passed++;
    }),
  );
  return passed;
}

async function finishCycle(
  cycleId: string,
  status: string,
  _promptBefore: string,
  promptAfter: string | null,
  scoreBefore: number | null,
  scoreAfter: number | null,
  casesRun: number,
  skipReason?: string,
  promoted = false,
  failurePattern?: string,
) {
  await db.execute(sql`
    UPDATE apex_cycles SET
      status = ${status},
      completed_at = NOW(),
      prompt_after = ${promptAfter ?? null},
      score_before = ${scoreBefore ?? null},
      score_after = ${scoreAfter ?? null},
      cases_run = ${casesRun},
      promoted = ${promoted},
      skip_reason = ${skipReason ?? null},
      failure_pattern = ${failurePattern ?? null}
    WHERE id = ${cycleId}
  `);

  const messages: Record<string, string> = {
    promoted: `Promoted! Score: ${scoreBefore}→${scoreAfter}`,
    skipped: skipReason ?? "Skipped",
    failed: "Cycle failed",
  };

  return { cycleId, status, message: messages[status] ?? status };
}
