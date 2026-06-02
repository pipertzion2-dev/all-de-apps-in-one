import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses, playGenerations, playStems, playPatches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { TranscribedNote } from "@/lib/svivva-play/audio-transcription";
import { buildMidiFile } from "@/lib/svivva-play/midi-export";
import { buildStemMidiZipBuffer } from "@/lib/svivva-play/midi-stems-zip";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const format = request.nextUrl.searchParams.get("format") || "json";

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const sessions = await db.select().from(playSessions).where(eq(playSessions.id, sessionId));
    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    const analyses = session.analysisId
      ? await db.select().from(playAnalyses).where(eq(playAnalyses.id, session.analysisId))
      : [];
    const analysis = analyses[0] || null;
    const bpm = analysis?.bpm || 120;

    const generations = await db
      .select()
      .from(playGenerations)
      .where(eq(playGenerations.sessionId, sessionId));
    const latestGen = generations[generations.length - 1];

    let stems: {
      name: string;
      role: string;
      instrumentHint: string | null;
      midiEvents: unknown;
      pan: number;
      gainDb: number;
    }[] = [];
    if (latestGen) {
      stems = await db.select().from(playStems).where(eq(playStems.generationId, latestGen.id));
    }

    const patches = await db.select().from(playPatches).where(eq(playPatches.sessionId, sessionId));

    if ((format === "midi" || format === "midi-zip") && stems.length > 0) {
      if (format === "midi-zip") {
        const zipBuffer = await buildStemMidiZipBuffer({
          bpm,
          stems: stems.map((s) => ({
            name: s.name,
            role: s.role,
            midiEvents: Array.isArray(s.midiEvents) ? s.midiEvents : [],
          })),
          projectName: `svivva-play-${sessionId}`,
        });
        return new NextResponse(zipBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="svivva-play-stems-${sessionId}.zip"`,
          },
        });
      }
      const midiBytes = buildMidiFile(
        stems.map((s) => ({
          name: s.name,
          midiEvents: Array.isArray(s.midiEvents) ? s.midiEvents : [],
        })),
        bpm,
      );
      const buffer = Buffer.from(midiBytes);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/midi",
          "Content-Disposition": `attachment; filename="svivva-play-${sessionId}.mid"`,
        },
      });
    }

    if (format === "patch" && patches.length > 0) {
      const patchExport = patches.map((p) => ({
        name: p.name,
        synth_family: p.synthFamily,
        ...(p.patchData as Record<string, unknown>),
        instructions: p.instructions,
        macros: p.macros,
      }));
      return new NextResponse(JSON.stringify(patchExport, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="svivva-patch-${sessionId}.json"`,
        },
      });
    }

    const sessionExport = {
      svivva_play_version: "2.0",
      project_id: sessionId,
      exported_at: new Date().toISOString(),
      source_audio: {
        name: session.sourceAudioName || "Unknown",
        duration_s: session.sourceAudioDuration || null,
      },
      analysis: analysis
        ? {
            bpm: analysis.bpm,
            time_signature: analysis.timeSignature,
            key: analysis.key,
            key_confidence: analysis.keyConfidence,
            chords: analysis.chords,
            sections: analysis.sections,
            downbeats: analysis.downbeats,
            style_compatibility: analysis.styleCompatibility,
            timbre_descriptors: analysis.timbreDescriptors,
          }
        : null,
      mode: session.mode,
      style: {
        preset: latestGen?.mode || session.mode,
        seed: latestGen?.seed || null,
      },
      plan: latestGen?.plan || null,
      stems: stems.map((s) => ({
        name: s.name,
        role: s.role,
        instrument_hint: s.instrumentHint,
        midi: `midi/${s.name.replace(/\s+/g, "_").toLowerCase()}.mid`,
        pan: s.pan,
        gain_db: s.gainDb,
        expression: { mpe: false, meend: false },
        midi_events: s.midiEvents,
      })),
      patches: patches.map((p) => ({
        name: p.name,
        synth_family: p.synthFamily,
        patch_data: p.patchData,
        instructions: p.instructions,
        macros: p.macros,
      })),
      quality_tier: "professional",
      quality_note:
        "MIDI output is professional quality. Audio rendering is available as BETA preview only.",
    };

    return new NextResponse(JSON.stringify(sessionExport, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="svivva-play-session-${sessionId}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

/** Export MIDI from client-side stems when no DB session exists. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stems,
      bpm = 120,
      filename = "svivva-play",
      format = "midi-zip",
      melodyneNotes,
    } = body as {
      stems?: { name: string; role?: string; midiEvents?: unknown[] }[];
      bpm?: number;
      filename?: string;
      format?: "midi" | "midi-zip";
      melodyneNotes?: TranscribedNote[];
    };

    const hasStems = stems?.some((s) => Array.isArray(s.midiEvents) && s.midiEvents.length > 0);
    const hasMelodyne = Array.isArray(melodyneNotes) && melodyneNotes.length > 0;

    if (!hasStems && !hasMelodyne) {
      return NextResponse.json({ error: "No MIDI to export — generate stems or load Melodyne" }, { status: 400 });
    }

    if (format === "midi-zip") {
      const zipBuffer = await buildStemMidiZipBuffer({
        bpm,
        stems: stems ?? [],
        melodyneNotes: hasMelodyne ? melodyneNotes : undefined,
        projectName: filename,
      });
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}-ableton-stems.zip"`,
        },
      });
    }

    const midiBytes = buildMidiFile(stems ?? [], bpm);
    const buffer = Buffer.from(midiBytes);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/midi",
        "Content-Disposition": `attachment; filename="${filename}.mid"`,
      },
    });
  } catch (error) {
    console.error("Inline export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
