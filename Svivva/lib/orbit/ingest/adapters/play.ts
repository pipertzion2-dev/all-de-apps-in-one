import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { playSessions, playAnalyses } from "@/lib/schema";
import type { IngestSnapshot } from "../types";

export async function loadPlaySessionForUser(sessionId: string, userId: string) {
  const [session] = await db
    .select()
    .from(playSessions)
    .where(and(eq(playSessions.id, sessionId), eq(playSessions.userId, userId)))
    .limit(1);
  if (!session) return null;

  const analyses = await db
    .select()
    .from(playAnalyses)
    .where(eq(playAnalyses.sessionId, sessionId))
    .limit(1);

  return { session, analysis: analyses[0] };
}

export function buildPlayIngestSnapshot(
  sessionId: string,
  session: {
    name: string;
    userPrompt?: string | null;
    stylePreset?: string | null;
    sourceAudioName?: string | null;
  },
  analysis?: {
    bpm?: number | null;
    key?: string | null;
    chords?: unknown;
    sections?: unknown;
  },
): IngestSnapshot {
  const releaseName = session.name || "Untitled Release";
  const songRef = "song";
  const releaseRef = "release";

  const entities = [
    {
      ref: releaseRef,
      entityType: "release" as const,
      name: releaseName,
      externalId: sessionId,
      description: session.userPrompt || undefined,
      metadata: {
        stylePreset: session.stylePreset,
        sourceAudioName: session.sourceAudioName,
      },
    },
    {
      ref: songRef,
      entityType: "song" as const,
      name: releaseName,
      externalId: sessionId,
      metadata: {
        bpm: analysis?.bpm,
        key: analysis?.key,
        hasAnalysis: Boolean(analysis),
      },
    },
  ];

  const links = [
    {
      fromRef: releaseRef,
      toRef: songRef,
      linkType: "has_asset" as const,
    },
  ];

  return {
    projectName: releaseName,
    description: session.userPrompt || undefined,
    productType: "play_release",
    summary: {
      playSessionId: sessionId,
      bpm: analysis?.bpm ?? null,
      key: analysis?.key ?? null,
      ingestedAt: new Date().toISOString(),
    },
    entities,
    links,
  };
}

export async function buildPlayIngestSnapshotForUser(
  sessionId: string,
  userId: string,
): Promise<IngestSnapshot> {
  const row = await loadPlaySessionForUser(sessionId, userId);
  if (!row) throw new Error("Play session not found or access denied");
  return buildPlayIngestSnapshot(sessionId, row.session, row.analysis);
}
