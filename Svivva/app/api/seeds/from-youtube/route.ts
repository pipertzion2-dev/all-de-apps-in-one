import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedSessions, seeds } from "@/lib/schema";
import { parsePdfToSeeds } from "@/lib/llm/seeds";
import { v4 as uuidv4 } from "uuid";
import { requireUser } from "@/lib/auth/require-user";
import { badRequest, ok, serverError } from "@/lib/http-response";
import {
  buildYoutubeSeedDocument,
  collectYoutubeClipsForSeeds,
} from "@/lib/seeds/youtube-transcript";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (error || !user) return error!;

    const body = (await request.json()) as { url?: string };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (url.length < 8) {
      return badRequest("Paste a YouTube video or channel URL.");
    }

    const collected = await collectYoutubeClipsForSeeds(url);
    const document = buildYoutubeSeedDocument(collected);
    const result = await parsePdfToSeeds(document);

    if (!result.success || result.seeds.length === 0) {
      return badRequest(result.error || "Could not extract app specs from that transcript.");
    }

    const sessionId = uuidv4();
    const fileName = `youtube:${collected.sourceLabel}`.slice(0, 180);

    await db.insert(seedSessions).values({
      id: sessionId,
      userId: user.id,
      fileName,
      status: "parsing",
      seedCount: 0,
    });

    const seedRecords = result.seeds.map((spec) => ({
      id: uuidv4(),
      sessionId,
      appName: spec.appName,
      spec,
      status: "parsed" as const,
      buildProgress: 0,
    }));

    for (const record of seedRecords) {
      await db.insert(seeds).values(record);
    }

    await db
      .update(seedSessions)
      .set({
        status: "parsed",
        seedCount: seedRecords.length,
      })
      .where(eq(seedSessions.id, sessionId));

    return ok({
      sessionId,
      seedCount: seedRecords.length,
      sourceLabel: collected.sourceLabel,
      clipCount: collected.clips.length,
      seeds: seedRecords.map((r) => ({ id: r.id, appName: r.appName, status: r.status })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "YouTube transcript failed";
    if (
      /youtube|caption|channel|video|invalid|paste/i.test(message) &&
      !/ECONN|timeout|internal/i.test(message)
    ) {
      return badRequest(message);
    }
    console.error("Seeds from-youtube error:", err);
    return serverError(message);
  }
}
