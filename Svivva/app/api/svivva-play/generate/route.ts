import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses, playGenerations, playStems, playPatches } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  runPlan,
  runMidiGeneration,
  runPatchDesign,
  type PlayMode,
  type PipelineSettings,
} from "@/lib/svivva-play/pipeline";
import type { Analysis } from "@/lib/svivva-play/schemas";
import { generateNeoSoulChords, getProgressionLabels } from "@/lib/svivva-play/chord-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      mode,
      stylePreset,
      quality,
      settings = {},
    } = body as {
      sessionId: string;
      mode: PlayMode;
      stylePreset: string;
      quality: "preview" | "full";
      settings: PipelineSettings;
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const sessions = await db.select().from(playSessions).where(eq(playSessions.id, sessionId));
    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    let analysisData: Analysis | null = null;
    if (session.analysisId) {
      const analyses = await db.select().from(playAnalyses).where(eq(playAnalyses.id, session.analysisId));
      if (analyses[0]) {
        const a = analyses[0];
        analysisData = {
          bpm: a.bpm || 120,
          time_signature: a.timeSignature || "4/4",
          key: a.key || "C major",
          key_confidence: a.keyConfidence || 75,
          chords: (a.chords as any) || [],
          sections: (a.sections as any) || [],
          downbeats: (a.downbeats as any) || [],
          style_compatibility: (a.styleCompatibility as any) || [],
          timbre_descriptors: (a.timbreDescriptors as any) || {},
        };
      }
    }

    if (!analysisData) {
      return NextResponse.json({ error: "No analysis found for this session" }, { status: 400 });
    }

    const generationId = uuidv4();
    const seed = settings.seed ?? Math.floor(Math.random() * 999999);

    await db.insert(playGenerations).values({
      id: generationId,
      sessionId,
      mode: mode || session.mode,
      status: "planning",
      renderQuality: quality || "preview",
      seed,
    });

    if (mode === "patch") {
      const patchResult = await runPatchDesign(analysisData, {
        ...settings,
        seed,
      });

      if (!patchResult.success || !patchResult.data) {
        await db.update(playGenerations).set({ status: "failed" }).where(eq(playGenerations.id, generationId));
        return NextResponse.json({ error: patchResult.error || "Patch design failed" }, { status: 500 });
      }

      const patchData = patchResult.data;
      const patchId = uuidv4();

      await db.insert(playPatches).values({
        id: patchId,
        sessionId,
        name: patchData.name || "Untitled Patch",
        synthFamily: patchData.synth_family || "subtractive",
        patchData: patchData as any,
        instructions: patchData.instructions || "",
        macros: patchData.macros as any,
        status: "complete",
      });

      await db.update(playGenerations).set({
        status: "complete",
        plan: patchData as any,
        completedAt: new Date(),
      }).where(eq(playGenerations.id, generationId));

      return NextResponse.json({
        generationId,
        patch: patchData,
        qualityTier: "professional",
        pipeline: { stage: "complete", stages: ["patch_design"] },
      });
    }

    // ── Deterministic chord engine (bypasses LLM) ──────────────────────────
    if (mode === "chords") {
      const progressionSeed = seed % 5;
      const totalBars = quality === "full" ? 16 : 8;
      const chordStems = generateNeoSoulChords({
        key: analysisData.key,
        bpm: analysisData.bpm,
        barsPerChord: 2,
        totalBars,
        pattern: "sustained_pads",
        progressionSeed,
        includeBass: true,
      });

      const chordNames = getProgressionLabels(analysisData.key, progressionSeed);

      const stemResults: {
        id: string;
        name: string;
        role: string;
        register: string;
        instrumentHint: string;
        muted: boolean;
        soloed: boolean;
        pan: number;
        gainDb: number;
        midiEvents: unknown[];
        expression: unknown;
        articulations: string[];
        qualityTier: string;
      }[] = [];

      for (const stem of chordStems) {
        const stemId = uuidv4();
        const events = stem.midiEvents.map(e => ({
          note: e.note,
          velocity: e.velocity,
          start_beat: e.startBeat,
          duration_beats: e.duration,
          channel: e.channel,
        }));

        await db.insert(playStems).values({
          id: stemId,
          generationId,
          name: stem.name,
          role: stem.role,
          instrumentHint: stem.instrumentHint,
          midiEvents: events as any,
          expression: {} as any,
          pan: stem.pan,
          gainDb: stem.gainDb,
          muted: false,
          soloed: false,
        });

        stemResults.push({
          id: stemId,
          name: stem.name,
          role: stem.role,
          register: stem.role === "bass" ? "low" : "mid",
          instrumentHint: stem.instrumentHint,
          muted: false,
          soloed: false,
          pan: stem.pan,
          gainDb: stem.gainDb,
          midiEvents: events,
          expression: {},
          articulations: [],
          qualityTier: "professional",
        });
      }

      await db.update(playGenerations).set({
        status: "complete",
        plan: { chordProgression: chordNames, key: analysisData.key, bpm: analysisData.bpm } as any,
        midiData: { stems: chordStems } as any,
        completedAt: new Date(),
      }).where(eq(playGenerations.id, generationId));

      return NextResponse.json({
        generationId,
        stems: stemResults,
        plan: {
          stemCount: stemResults.length,
          chordProgression: chordNames,
          key: analysisData.key,
          bpm: analysisData.bpm,
          form: { total_bars: totalBars },
          harmonyRules: `Neo-soul voicings in ${analysisData.key} (Glasper/Lins style)`,
          meendApplicableStems: [],
        },
        qualityTier: "professional",
        pipeline: { stage: "complete", stages: ["chord_engine"] },
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    const planResult = await runPlan(analysisData, mode, stylePreset, {
      ...settings,
      seed,
    });

    if (!planResult.success || !planResult.data) {
      await db.update(playGenerations).set({ status: "failed" }).where(eq(playGenerations.id, generationId));
      return NextResponse.json({ error: planResult.error || "Arrangement planning failed" }, { status: 500 });
    }

    const plan = planResult.data;

    await db.update(playGenerations).set({
      status: "generating_midi",
      plan: plan as any,
    }).where(eq(playGenerations.id, generationId));

    const barCount = quality === "full" ? (plan.form?.total_bars || 64) : 16;
    const midiResult = await runMidiGeneration(analysisData, plan, {
      startBar: 0,
      endBar: barCount,
    }, {
      ...settings,
      seed,
    });

    if (!midiResult.success || !midiResult.data) {
      await db.update(playGenerations).set({ status: "failed" }).where(eq(playGenerations.id, generationId));
      return NextResponse.json({ error: midiResult.error || "MIDI generation failed" }, { status: 500 });
    }

    const midiOutput = midiResult.data;

    const stemResults: {
      id: string;
      name: string;
      role: string;
      register: string;
      instrumentHint: string;
      muted: boolean;
      soloed: boolean;
      pan: number;
      gainDb: number;
      midiEvents: unknown[];
      expression: unknown;
      articulations: string[];
      qualityTier: string;
    }[] = [];

    for (let i = 0; i < midiOutput.stems.length; i++) {
      const midiStem = midiOutput.stems[i];
      const planStem = plan.stems[i] || plan.stems.find(s => s.name === midiStem.name);

      const stemId = uuidv4();
      const events = midiStem.midi_events;

      await db.insert(playStems).values({
        id: stemId,
        generationId,
        name: midiStem.name,
        role: planStem?.role || "melody",
        instrumentHint: planStem?.instrument_hint || "Piano",
        midiEvents: events as any,
        expression: midiStem.expression as any,
        pan: planStem?.pan || 0,
        gainDb: 0,
        muted: false,
        soloed: false,
      });

      stemResults.push({
        id: stemId,
        name: midiStem.name,
        role: planStem?.role || "melody",
        register: planStem?.register || "mid",
        instrumentHint: planStem?.instrument_hint || "Piano",
        muted: false,
        soloed: false,
        pan: planStem?.pan || 0,
        gainDb: 0,
        midiEvents: events,
        expression: midiStem.expression,
        articulations: planStem?.articulations || [],
        qualityTier: "professional",
      });
    }

    await db.update(playGenerations).set({
      status: "complete",
      midiData: { stems: midiOutput.stems } as any,
      completedAt: new Date(),
    }).where(eq(playGenerations.id, generationId));

    const isMeendApplicable = plan.meend_applicable_stems || [];

    return NextResponse.json({
      generationId,
      stems: stemResults,
      plan: {
        stemCount: plan.stems.length,
        form: plan.form,
        dynamics: plan.dynamics,
        harmonyRules: plan.harmony_rules,
        meendApplicableStems: isMeendApplicable,
      },
      qualityTier: "professional",
      qualityNote: "MIDI output is professional quality. Audio preview rendering is available as BETA.",
      pipeline: {
        stage: "complete",
        stages: ["plan", "midi_generation"],
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
