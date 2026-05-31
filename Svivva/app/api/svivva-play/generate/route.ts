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
import { applyChordEditsToAnalysis, playViewToAnalysis } from "@/lib/svivva-play/analysis-utils";
import {
  generateDeterministicChordStems,
  persistGenerationBundle,
  type GeneratedStemResult,
} from "@/lib/svivva-play/generate-helpers";
import { normalizeMidiEvents } from "@/lib/svivva-play/midi-normalize";
import type { PlayAnalysisView } from "@/lib/svivva-play/instant-analysis";

function parseRootFromKey(key: string): string {
  const m = (key || "").match(/^([A-G][b#]?)/);
  return m ? m[1] : "C";
}

function isMinorKey(key: string): boolean {
  return /minor|(^|\s)m($|\s)/i.test(key || "");
}

function pickIndianRagaKeyLabel(opts: { root: string; minor: boolean; seed: number }): string {
  const major = ["raga_bhairav", "raga_marwa", "raga_purvi"] as const;
  const minor = ["raga_todi", "raga_bhairavi"] as const;
  const list = opts.minor ? minor : major;
  const picked = list[Math.abs(opts.seed) % list.length];
  return `${opts.root} ${picked}`;
}

function meendPitchbendForEvents(
  events: { startBeat: number; duration: number }[],
): { beat: number; value: number }[] {
  const out: { beat: number; value: number }[] = [];
  for (const e of events) {
    const d = Math.max(0.05, e.duration || 0.25);
    const start = Math.max(0, e.startBeat + d * 0.7);
    const mid = Math.max(0, e.startBeat + d * 0.85);
    const end = Math.max(0, e.startBeat + d * 0.98);
    out.push({ beat: start, value: 0 }, { beat: mid, value: 850 }, { beat: end, value: 0 });
  }
  out.sort((a, b) => a.beat - b.beat);
  const dedup: typeof out = [];
  for (const p of out) {
    const last = dedup[dedup.length - 1];
    if (!last || Math.abs(last.beat - p.beat) > 1e-4) dedup.push(p);
  }
  return dedup;
}

async function loadAnalysisFromSession(sessionId: string): Promise<Analysis | null> {
  const sessions = await db.select().from(playSessions).where(eq(playSessions.id, sessionId));
  if (sessions.length === 0) return null;
  const session = sessions[0];
  if (!session.analysisId) return null;

  const analyses = await db
    .select()
    .from(playAnalyses)
    .where(eq(playAnalyses.id, session.analysisId));
  if (!analyses[0]) return null;

  const a = analyses[0];
  return {
    bpm: a.bpm || 120,
    time_signature: a.timeSignature || "4/4",
    key: a.key || "C major",
    key_confidence: a.keyConfidence || 75,
    chords: (a.chords as Analysis["chords"]) || [],
    sections: (a.sections as Analysis["sections"]) || [],
    downbeats: (a.downbeats as number[]) || [],
    style_compatibility: (a.styleCompatibility as string[]) || [],
    timbre_descriptors: (a.timbreDescriptors as Record<string, unknown>) || {},
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      inlineAnalysis,
      mode,
      stylePreset,
      quality,
      settings = {},
      manualKey,
      manualTempo,
      chordEdits,
    } = body as {
      sessionId?: string;
      inlineAnalysis?: PlayAnalysisView;
      mode: PlayMode;
      stylePreset: string;
      quality: "preview" | "full";
      settings: PipelineSettings;
      manualKey?: string | null;
      manualTempo?: number | null;
      chordEdits?: Record<number, string>;
    };

    let analysisData: Analysis | null = null;
    let resolvedSessionId = sessionId ?? null;

    if (inlineAnalysis) {
      analysisData = playViewToAnalysis(inlineAnalysis, {
        bpm: manualTempo,
        key: manualKey,
      });
    } else if (sessionId) {
      analysisData = await loadAnalysisFromSession(sessionId);
    }

    if (!analysisData) {
      return NextResponse.json(
        { error: "No analysis found. Import audio and wait for analysis to finish." },
        { status: 400 },
      );
    }

    analysisData = applyChordEditsToAnalysis(analysisData, chordEdits);

    const generationId = uuidv4();
    const seed = settings.seed ?? Math.floor(Math.random() * 999999);
    const renderQuality = quality || "preview";

    const analysisForGeneration: Analysis =
      mode === "solo" && (settings.meend ?? false)
        ? {
            ...analysisData,
            key: pickIndianRagaKeyLabel({
              root: parseRootFromKey(analysisData.key),
              minor: isMinorKey(analysisData.key),
              seed,
            }),
          }
        : analysisData;

    const compingPattern = (
      settings.compingPattern === "rhythmic_stabs" || settings.compingPattern === "arpeggiated"
        ? settings.compingPattern
        : "sustained_pads"
    ) as "sustained_pads" | "rhythmic_stabs" | "arpeggiated";

    const finishWithStems = async (
      stems: GeneratedStemResult[],
      plan: Record<string, unknown>,
      pipeline: { stage: string; stages: string[] },
      extra?: Record<string, unknown>,
    ) => {
      if (resolvedSessionId) {
        try {
          await persistGenerationBundle(db, playGenerations, playStems, {
            generationId,
            sessionId: resolvedSessionId,
            mode: mode || "chords",
            quality: renderQuality,
            seed,
            stems,
            plan,
          });
        } catch (dbErr) {
          console.warn("⚠️ Generation DB persist failed (stems still returned):", dbErr);
        }
      }

      return NextResponse.json({
        generationId,
        stems,
        plan,
        qualityTier: "professional",
        pipeline,
        persisted: Boolean(resolvedSessionId),
        ...extra,
      });
    };

    if (mode === "patch") {
      if (!resolvedSessionId) {
        return NextResponse.json(
          { error: "Patch design requires a saved session. Re-import your audio." },
          { status: 400 },
        );
      }

      try {
        await db.insert(playGenerations).values({
          id: generationId,
          sessionId: resolvedSessionId,
          mode: mode || "patch",
          status: "planning",
          renderQuality,
          seed,
        });
      } catch (dbErr) {
        console.warn("⚠️ Patch generation record insert failed:", dbErr);
      }

      const patchResult = await runPatchDesign(analysisData, { ...settings, seed });
      if (!patchResult.success || !patchResult.data) {
        return NextResponse.json(
          { error: patchResult.error || "Patch design failed" },
          { status: 500 },
        );
      }

      const patchData = patchResult.data;
      const patchId = uuidv4();
      try {
        await db.insert(playPatches).values({
          id: patchId,
          sessionId: resolvedSessionId,
          name: patchData.name || "Untitled Patch",
          synthFamily: patchData.synth_family || "subtractive",
          patchData: patchData as any,
          instructions: patchData.instructions || "",
          macros: patchData.macros as any,
          status: "complete",
        });
        await db
          .update(playGenerations)
          .set({
            status: "complete",
            plan: patchData as Record<string, unknown>,
            completedAt: new Date(),
          })
          .where(eq(playGenerations.id, generationId));
      } catch (dbErr) {
        console.warn("⚠️ Patch persist failed:", dbErr);
      }

      return NextResponse.json({
        generationId,
        patch: patchData,
        qualityTier: "professional",
        pipeline: { stage: "complete", stages: ["patch_design"] },
      });
    }

    // Deterministic chord engine — always works without LLM
    if (mode === "chords") {
      const result = generateDeterministicChordStems(
        analysisData,
        renderQuality,
        seed,
        compingPattern,
      );
      return finishWithStems(result.stems, result.plan, result.pipeline);
    }

    // LLM path with deterministic fallback
    if (resolvedSessionId) {
      try {
        await db.insert(playGenerations).values({
          id: generationId,
          sessionId: resolvedSessionId,
          mode: mode || "composition",
          status: "planning",
          renderQuality,
          seed,
        });
      } catch (dbErr) {
        console.warn("⚠️ Generation record insert failed:", dbErr);
      }
    }

    const planResult = await runPlan(analysisForGeneration, mode, stylePreset, {
      ...settings,
      seed,
      stylePreset,
    });

    if (!planResult.success || !planResult.data) {
      console.warn("LLM plan failed, using deterministic chord arrangement:", planResult.error);
      const fallback = generateDeterministicChordStems(
        analysisData,
        renderQuality,
        seed,
        compingPattern,
      );
      return finishWithStems(
        fallback.stems,
        {
          ...fallback.plan,
          harmonyRules: `Deterministic fallback (LLM unavailable): ${fallback.plan.harmonyRules}`,
        },
        fallback.pipeline,
      );
    }

    const plan = planResult.data;

    if (resolvedSessionId) {
      try {
        await db
          .update(playGenerations)
          .set({ status: "generating_midi", plan: plan as Record<string, unknown> })
          .where(eq(playGenerations.id, generationId));
      } catch {
        /* non-fatal */
      }
    }

    const barCount = renderQuality === "full" ? plan.form?.total_bars || 64 : 16;
    const midiResult = await runMidiGeneration(
      analysisForGeneration,
      plan,
      { startBar: 0, endBar: barCount },
      { ...settings, seed, stylePreset },
    );

    if (!midiResult.success || !midiResult.data) {
      console.warn("LLM MIDI failed, using deterministic chord arrangement:", midiResult.error);
      const fallback = generateDeterministicChordStems(
        analysisData,
        renderQuality,
        seed,
        compingPattern,
      );
      return finishWithStems(
        fallback.stems,
        {
          ...fallback.plan,
          harmonyRules: `Deterministic fallback (MIDI LLM unavailable): ${fallback.plan.harmonyRules}`,
        },
        fallback.pipeline,
      );
    }

    const midiOutput = midiResult.data;
    const stemResults: GeneratedStemResult[] = [];

    for (let i = 0; i < midiOutput.stems.length; i++) {
      const midiStem = midiOutput.stems[i];
      const planStem = plan.stems[i] || plan.stems.find((s) => s.name === midiStem.name);

      if (
        mode === "solo" &&
        (settings.meend ?? false) &&
        (planStem?.role === "lead" ||
          planStem?.role === "melody" ||
          planStem?.role === "vocal" ||
          i === 0)
      ) {
        const pb = Array.isArray(
          (midiStem as { expression?: { pitchbend?: unknown[] } }).expression?.pitchbend,
        )
          ? (midiStem as { expression: { pitchbend: unknown[] } }).expression.pitchbend
          : [];
        const events = normalizeMidiEvents(midiStem.midi_events);
        if (pb.length === 0 && events.length > 0) {
          (midiStem as { expression?: Record<string, unknown> }).expression = {
            ...(midiStem as { expression?: Record<string, unknown> }).expression,
            pitchbend: meendPitchbendForEvents(events),
          };
        }
      }

      const stemId = uuidv4();
      const events = normalizeMidiEvents(midiStem.midi_events);

      if (resolvedSessionId) {
        try {
          await db.insert(playStems).values({
            id: stemId,
            generationId,
            name: midiStem.name,
            role: planStem?.role || "melody",
            instrumentHint: planStem?.instrument_hint || "Piano",
            midiEvents: events as unknown[],
            expression: midiStem.expression as any,
            pan: planStem?.pan || 0,
            gainDb: 0,
            muted: false,
            soloed: false,
          });
        } catch (dbErr) {
          console.warn("⚠️ Stem persist failed:", dbErr);
        }
      }

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
        expression: (midiStem.expression as Record<string, unknown>) || {},
        articulations: planStem?.articulations || [],
        qualityTier: "professional",
      });
    }

    if (resolvedSessionId) {
      try {
        await db
          .update(playGenerations)
          .set({
            status: "complete",
            midiData: { stems: midiOutput.stems } as Record<string, unknown>,
            completedAt: new Date(),
          })
          .where(eq(playGenerations.id, generationId));
      } catch {
        /* non-fatal */
      }
    }

    return NextResponse.json({
      generationId,
      stems: stemResults,
      plan: {
        stemCount: plan.stems.length,
        form: plan.form,
        dynamics: plan.dynamics,
        harmonyRules: plan.harmony_rules,
        meendApplicableStems: plan.meend_applicable_stems || [],
      },
      qualityTier: "professional",
      qualityNote:
        "MIDI output is professional quality. Audio preview rendering is available as BETA.",
      pipeline: { stage: "complete", stages: ["plan", "midi_generation"] },
      persisted: Boolean(resolvedSessionId),
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
