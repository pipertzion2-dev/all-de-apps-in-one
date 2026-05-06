import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses, playGenerations, playStems } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  runMidiGeneration,
  type PlayMode,
  type PipelineSettings,
} from "@/lib/svivva-play/pipeline";
import type { Analysis, Plan } from "@/lib/svivva-play/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, stemName, settings = {} } = body as {
      generationId: string;
      stemName: string;
      settings: PipelineSettings;
    };

    if (!generationId || !stemName) {
      return NextResponse.json({ error: "generationId and stemName required" }, { status: 400 });
    }

    const generations = await db.select().from(playGenerations).where(eq(playGenerations.id, generationId));
    if (generations.length === 0) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }
    const gen = generations[0];
    const plan = gen.plan as unknown as Plan;
    if (!plan) {
      return NextResponse.json({ error: "No plan found for this generation" }, { status: 400 });
    }

    const sessions = await db.select().from(playSessions).where(eq(playSessions.id, gen.sessionId));
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
      return NextResponse.json({ error: "No analysis found" }, { status: 400 });
    }

    const targetStemPlan = plan.stems.find(s => s.name === stemName);
    if (!targetStemPlan) {
      return NextResponse.json({ error: `Stem "${stemName}" not found in plan` }, { status: 400 });
    }

    const singleStemPlan: Plan = {
      ...plan,
      stems: [targetStemPlan],
    };

    const seed = settings.seed ?? Math.floor(Math.random() * 999999);
    const barCount = 16;

    const midiResult = await runMidiGeneration(analysisData, singleStemPlan, {
      startBar: 0,
      endBar: barCount,
    }, { ...settings, seed });

    if (!midiResult.success || !midiResult.data) {
      return NextResponse.json({ error: midiResult.error || "Stem regeneration failed" }, { status: 500 });
    }

    const newMidiStem = midiResult.data.stems[0];
    if (!newMidiStem) {
      return NextResponse.json({ error: "No MIDI events generated for stem" }, { status: 500 });
    }

    const existingStems = await db.select().from(playStems).where(eq(playStems.generationId, generationId));
    const oldStem = existingStems.find(s => s.name === stemName);

    const stemId = uuidv4();
    await db.insert(playStems).values({
      id: stemId,
      generationId,
      name: newMidiStem.name,
      role: targetStemPlan.role || "melody",
      instrumentHint: targetStemPlan.instrument_hint || "Piano",
      midiEvents: newMidiStem.midi_events as any,
      expression: newMidiStem.expression as any,
      pan: targetStemPlan.pan || 0,
      gainDb: 0,
      muted: false,
      soloed: false,
    });

    if (oldStem) {
      await db.delete(playStems).where(eq(playStems.id, oldStem.id));
    }

    return NextResponse.json({
      stemId,
      stem: {
        id: stemId,
        name: newMidiStem.name,
        role: targetStemPlan.role || "melody",
        register: targetStemPlan.register || "mid",
        instrumentHint: targetStemPlan.instrument_hint || "Piano",
        muted: false,
        soloed: false,
        pan: targetStemPlan.pan || 0,
        gainDb: 0,
        midiEvents: newMidiStem.midi_events,
        expression: newMidiStem.expression,
        articulations: targetStemPlan.articulations || [],
        qualityTier: "professional",
      },
      seed,
    });
  } catch (error) {
    console.error("Stem regeneration error:", error);
    return NextResponse.json({ error: "Stem regeneration failed" }, { status: 500 });
  }
}
