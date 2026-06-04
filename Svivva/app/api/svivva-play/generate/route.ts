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
import { applyChordEditsToAnalysis, playViewToAnalysis, parseRootFromKeyLabel, isMinorKeyLabel } from "@/lib/svivva-play/analysis-utils";
import {
  generateDeterministicChordStems,
  persistGenerationBundle,
  applyMeendToStems,
  type GeneratedStemResult,
} from "@/lib/svivva-play/generate-helpers";
import { normalizeMidiEvents } from "@/lib/svivva-play/midi-normalize";
import type { PlayAnalysisView } from "@/lib/svivva-play/instant-analysis";
import {
  composeStrategicReich,
  generateStrategicStems,
  voicePartsToStemResults,
  type HarmonicContextInput,
} from "@/lib/svivva-play/strategic-compose";
import {
  constrainGeneratedStems,
  resolveLockedGenerationKey,
  stabilizeHarmonicTimeline,
  melodicAnchorMidi,
  meendPitchbendForEvents,
  resolveCompositionScale,
} from "@/lib/svivva-play/scale-key-guard";
import { applySwingToStems } from "@/lib/svivva-play/swing-humanize";
import type { HocketGrooveStyle } from "@/lib/svivva-play/hocket-groove-v2";
import { type StyleName } from "@/lib/svivva-play/reich-engine";
import type { ChordSegment } from "@/lib/svivva-play/chord-from-chroma";

function pickIndianRagaScaleName(opts: { root: string; minor: boolean; seed: number }): string {
  const major = ["raga_bhairav", "raga_marwa", "raga_purvi"] as const;
  const minor = ["raga_todi", "raga_bhairavi"] as const;
  const list = opts.minor ? minor : major;
  return list[Math.abs(opts.seed) % list.length];
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
      harmonicContext,
      audioAnchorKey,
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
      harmonicContext?: HarmonicContextInput;
      audioAnchorKey?: string | null;
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

    const lockedKey = resolveLockedGenerationKey({
      manualKey,
      analysisKey: analysisData.key,
      audioAnchorKey,
      harmonicContext,
    });
    analysisData = {
      ...analysisData,
      key: lockedKey,
    };

    const sessionDurationSec =
      harmonicContext?.durationSec ??
      analysisData.sections?.[0]?.t1 ??
      (analysisData.chords.length ? analysisData.chords[analysisData.chords.length - 1]?.t1 : 64) ??
      64;

    const sessionChords: ChordSegment[] = stabilizeHarmonicTimeline(
      harmonicContext && harmonicContext.chords.length >= 1
        ? harmonicContext.chords
        : analysisData.chords.map((c) => ({
            t0: c.t0,
            t1: c.t1,
            symbol: c.symbol,
            confidence: c.confidence ?? 55,
            pitchClasses: [],
          })),
      sessionDurationSec,
      analysisData.bpm,
    );

    const melodicAnchor = harmonicContext
      ? melodicAnchorMidi(
          harmonicContext.melodyneNotes.length
            ? harmonicContext.melodyneNotes
            : harmonicContext.audioNotes,
        )
      : undefined;

    analysisData = {
      ...analysisData,
      chords: sessionChords.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: c.confidence ?? 70,
      })),
    };

    if (harmonicContext) {
      harmonicContext.chords = sessionChords;
      harmonicContext.key = lockedKey;
    }

    const generationId = uuidv4();
    const seed = settings.seed ?? Math.floor(Math.random() * 999999);
    const renderQuality = quality || "preview";

    const analysisForGeneration: Analysis =
      mode === "solo" && (settings.meend ?? false)
        ? {
            ...analysisData,
            key: `${parseRootFromKeyLabel(analysisData.key)} ${pickIndianRagaScaleName({
              root: parseRootFromKeyLabel(analysisData.key),
              minor: isMinorKeyLabel(analysisData.key),
              seed,
            })}`,
          }
        : analysisData;

    const compingPattern = (
      settings.compingPattern === "rhythmic_stabs" || settings.compingPattern === "arpeggiated"
        ? settings.compingPattern
        : "sustained_pads"
    ) as "sustained_pads" | "rhythmic_stabs" | "arpeggiated";

    const compositionScaleName =
      (settings.meend ?? false)
        ? pickIndianRagaScaleName({
            root: parseRootFromKeyLabel(lockedKey),
            minor: isMinorKeyLabel(manualKey ?? lockedKey),
            seed,
          })
        : (settings.reichScale as string | undefined) || "major";

    const finishWithStems = async (
      stems: GeneratedStemResult[],
      plan: Record<string, unknown>,
      pipeline: { stage: string; stages: string[] },
      extra?: Record<string, unknown>,
    ) => {
      const { scaleInfo } = resolveCompositionScale(
        lockedKey,
        compositionScaleName,
        manualKey,
        sessionChords,
      );
      const guardedStems = constrainGeneratedStems(
        stems,
        lockedKey,
        sessionChords,
        analysisData.bpm,
        { anchorMidi: melodicAnchor, scaleInfo },
      );
      if (resolvedSessionId) {
        try {
          await persistGenerationBundle(db, playGenerations, playStems, {
            generationId,
            sessionId: resolvedSessionId,
            mode: mode || "chords",
            quality: renderQuality,
            seed,
            stems: guardedStems,
            plan,
          });
        } catch (dbErr) {
          console.warn("⚠️ Generation DB persist failed (stems still returned):", dbErr);
        }
      }

      return NextResponse.json({
        generationId,
        stems: guardedStems,
        plan: { ...plan, key: lockedKey },
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

    const richHarmonic =
      harmonicContext &&
      (harmonicContext.chords.length >= 2 ||
        harmonicContext.melodyneNotes.length > 8 ||
        harmonicContext.audioNotes.length > 12);

    const runStrategic = () =>
      generateStrategicStems(analysisData, harmonicContext!, renderQuality, seed, {
        seed,
        density: settings.density,
        complexity: settings.complexity,
        compingPattern,
        harmonyMode: settings.harmonyMode,
      });

    const runReichComposition = () => {
      const scaleName =
        (settings.meend ?? false)
          ? pickIndianRagaScaleName({
              root: parseRootFromKeyLabel(lockedKey),
              minor: isMinorKeyLabel(manualKey ?? lockedKey),
              seed,
            })
          : (settings.reichScale as string | undefined) || "major";
      const { resolution: scale } = resolveCompositionScale(
        lockedKey,
        scaleName,
        manualKey,
        sessionChords,
      );
      const reichStyle = (settings.reichStyle || stylePreset || "reich_electric") as StyleName;
      const reichType = settings.reichType === "hocket" ? "hocket" : "counterpoint";
      const hocketGroove = (settings.hocketGroove as HocketGrooveStyle | undefined) ?? undefined;
      const voices = composeStrategicReich({
        durationSec: sessionDurationSec,
        bpm: analysisData.bpm,
        scale,
        style: reichStyle,
        seed,
        type: reichType,
        ctx: harmonicContext!,
        hocketGroove,
      });
      const hints =
        reichType === "hocket"
          ? ["vibraphone", "steel_drums", "piano", "marimba", "rhodes", "synth_lead"]
          : ["piano", "vibraphone", "marimba"];
      let stems = voicePartsToStemResults(voices, hints);
      if (settings.meend ?? false) stems = applyMeendToStems(stems);
      const { scaleInfo } = resolveCompositionScale(
        lockedKey,
        scaleName,
        manualKey,
        sessionChords,
      );
      let guardedStems = constrainGeneratedStems(stems, lockedKey, sessionChords, analysisData.bpm, {
        anchorMidi: melodicAnchor,
        scaleInfo,
      });
      const swingAmt = Math.max(0, Math.min(1, Number(settings.swingAmount ?? 0) / 100));
      if (swingAmt > 0) {
        guardedStems = applySwingToStems(guardedStems, analysisData.bpm, swingAmt);
      }
      return {
        stems: guardedStems,
        plan: {
          stemCount: guardedStems.length,
          key: lockedKey,
          bpm: analysisData.bpm,
          harmonyRules: `Reich ${reichType} (${reichStyle}) — interlocking cells from import harmony`,
          meendApplicableStems:
            (settings.meend ?? false) ? guardedStems.filter((_, i) => i === 0).map((s) => s.name) : [],
          composer: "reich",
          hocketGroove: hocketGroove ?? "reich_interlock",
          swingAmount: settings.swingAmount,
        },
        pipeline: { stage: "complete", stages: ["reich_listen", "reich_compose"] },
      };
    };

    // Composition mode: Reich interlocking voices (v-1 / v-2 style), not pad-stab strategic
    if (mode === "composition" && harmonicContext) {
      const reich = runReichComposition();
      return finishWithStems(reich.stems, reich.plan, reich.pipeline, { composer: "reich" });
    }

    // Strategic listen-first compose when harmonic session data is present
    if (richHarmonic && mode !== "solo" && mode !== "composition") {
      const strategic = runStrategic();
      if (harmonicContext) harmonicContext.key = lockedKey;
      return finishWithStems(strategic.stems, strategic.plan, strategic.pipeline, {
        composer: "strategic",
      });
    }

    // Deterministic chord engine — uses analysis chords when no harmonic context
    if (mode === "chords") {
      if (analysisData.chords.length >= 2) {
        const ctx: HarmonicContextInput = {
          chords: analysisData.chords.map((c) => ({
            t0: c.t0,
            t1: c.t1,
            symbol: c.symbol,
            confidence: c.confidence ?? 55,
            pitchClasses: [],
          })),
          audioNotes: [],
          melodyneNotes: [],
          durationSec: analysisData.sections?.[0]?.t1 ?? 64,
        };
        const strategic = generateStrategicStems(analysisData, ctx, renderQuality, seed, {
          seed,
          density: settings.density,
          compingPattern,
        });
        return finishWithStems(strategic.stems, strategic.plan, strategic.pipeline);
      }
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
      console.warn("LLM MIDI failed, using strategic/deterministic fallback:", midiResult.error);
      if (harmonicContext && harmonicContext.chords.length >= 2) {
        const strategic = runStrategic();
        return finishWithStems(strategic.stems, strategic.plan, strategic.pipeline);
      }
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
        (settings.meend ?? false) &&
        (mode === "solo" || mode === "composition") &&
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

    const { scaleInfo: llmScaleInfo } = resolveCompositionScale(
      lockedKey,
      compositionScaleName,
      manualKey,
      sessionChords,
    );
    const guardedStemResults = constrainGeneratedStems(
      stemResults,
      lockedKey,
      sessionChords,
      analysisData.bpm,
      { anchorMidi: melodicAnchor, scaleInfo: llmScaleInfo },
    );

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
      stems: guardedStemResults,
      plan: {
        stemCount: plan.stems.length,
        form: plan.form,
        dynamics: plan.dynamics,
        harmonyRules: plan.harmony_rules,
        meendApplicableStems: plan.meend_applicable_stems || [],
        key: lockedKey,
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
