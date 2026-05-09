import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses, playGenerations, playStems, playPatches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Midi from "jsmidgen";

function buildMidiFile(stems: any[], bpm: number): Buffer {
  const file = new Midi.File();
  file.setTempo(bpm);

  for (const stem of stems) {
    const track = new Midi.Track();
    file.addTrack(track);

    // Set track name
    track.addEvent(
      new Midi.MetaEvent({
        type: Midi.MetaEvent.TRACK_NAME,
        data: stem.name || "Untitled",
      }),
    );

    // Set MIDI program for better DAW recognition
    const channel = 0;
    track.addEvent(
      new Midi.ControllerEvent({
        type: Midi.ControllerEvent.PROGRAM_CHANGE,
        channel: channel,
        param1: 0,
        param2: 0,
      }),
    );

    const events = Array.isArray(stem.midiEvents) ? stem.midiEvents : [];
    if (events.length === 0) continue;

    const sorted = [...events].sort((a: any, b: any) => (a.startBeat || 0) - (b.startBeat || 0));
    const ticksPerBeat = 480; // Standard MIDI resolution for better compatibility

    let currentTick = 0;
    for (const evt of sorted) {
      try {
        const startTick = Math.round((evt.startBeat || 0) * ticksPerBeat);
        const durationTick = Math.max(
          ticksPerBeat / 4,
          Math.round((evt.duration || 0.25) * ticksPerBeat),
        );
        const delay = Math.max(0, startTick - currentTick);

        const note = Math.max(0, Math.min(127, Math.round(evt.note || 60)));
        const velocity = Math.max(1, Math.min(127, Math.round(evt.velocity || 80)));

        // Add note on
        track.addNote(channel, note, durationTick, delay, velocity);
        currentTick = startTick + durationTick;
      } catch (e) {
        console.warn(`Error adding note to ${stem.name}:`, e);
      }
    }
  }

  return file.toBytes();
}

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

    let stems: any[] = [];
    if (latestGen) {
      stems = await db.select().from(playStems).where(eq(playStems.generationId, latestGen.id));
    }

    const patches = await db.select().from(playPatches).where(eq(playPatches.sessionId, sessionId));

    if (format === "midi" && stems.length > 0) {
      const midiBytes = buildMidiFile(stems, bpm);
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
      stems: stems.map((s: any) => ({
        name: s.name,
        role: s.role,
        instrument_hint: s.instrumentHint,
        midi: `midi/${s.name.replace(/\s+/g, "_").toLowerCase()}.mid`,
        pan: s.pan,
        gain_db: s.gainDb,
        expression: {
          mpe: false,
          meend: false,
        },
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
