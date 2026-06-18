"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Music,
  Waves,
  Piano,
  Mic2,
  Settings2,
  Users,
  Sparkles,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
  FileAudio,
  X,
  Sliders,
  Zap,
  RotateCcw,
  AlertTriangle,
  Wand2,
  ChevronRight,
  ChevronDown,
  Info,
  Lock,
  Unlock,
  Hash,
  Archive,
  Disc3,
  BrainCircuit,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { GiSaxophone } from "react-icons/gi";
import { getSoundEngine, type StemPlayback } from "@/lib/svivva-play/sound-engine";
import {
  barAlignedDurationAtMostSec,
  barAlignedDurationSec,
} from "@/lib/svivva-play/session-duration";
import {
  constrainGeneratedStems,
  meendPitchbendForEvents,
  melodicAnchorMidi,
  resolveCompositionKey,
  resolveCompositionScale,
  stabilizeHarmonicTimeline,
} from "@/lib/svivva-play/scale-key-guard";
import {
  applyMeendToStems,
  applyMeendToOrchestralMelodyStems,
} from "@/lib/svivva-play/generate-helpers";
import { applyPlayDynamicsToStems } from "@/lib/svivva-play/play-dynamics";
import {
  buildMeendAccentPlaybacks,
  buildOrchestralMeendAccentPlaybacks,
  meendAccentSourceName,
} from "@/lib/svivva-play/meend-showcase-stem";
import {
  isIndianRagaScaleName,
  resolveMeendScaleName,
  stableGenerationSeed,
} from "@/lib/svivva-play/indian-raga-scale";
import { applySwingToStems } from "@/lib/svivva-play/swing-humanize";
import type { HocketGrooveStyle } from "@/lib/svivva-play/hocket-groove-v2";
import { suggestCompositionScale, type ScaleSuggestion } from "@/lib/svivva-play/scale-suggest";
import { buildStemPackZipBlobClient } from "@/lib/svivva-play/stem-pack-client";
import { prepareStemsForMidiExport } from "@/lib/svivva-play/stem-export-prep";
import {
  lookupScaleLocal,
  type ScaleLookupResult,
  type ScaleLookupMatch,
} from "@/lib/svivva-play/scale-lookup";
import {
  ORCHESTRAL_STYLE_PRESET_ID,
  BJORK_LINS_ORCHESTRAL_PRESET,
  isOrchestralPreset,
} from "@/lib/svivva-play/prompts/orchestral-composer";
import type { PatternLength } from "@/lib/svivva-play/pattern-length";
import { HolographicNoise } from "@/components/holographic-noise";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import svivvaCrateClosed from "@/attached_assets/CC8F1D0D-DB63-46FD-8F9A-AC9A1FAB40DE_1770908649745.png";
import svivvaCrateOpen from "@/attached_assets/Svivva_Crate_1770908797554.png";
import * as ChordKit from "@/lib/svivva-play/chordkit";
import {
  composeCounterpoint,
  composeHocket,
  listScales,
  scaleNoteNames,
  type VoicePart,
  type StyleName as ReichStyle,
} from "@/lib/svivva-play/reich-engine";
import { SvivvaPlayStagePanel } from "@/components/svivva-play-stage-panel";
import PlayCreativeTools, { scrollToMidiEvolution } from "@/components/play-creative-tools";
import type { PlayStageModel } from "@/components/svivva-play-stage-3d";
import type { TranscribedNote } from "@/lib/svivva-play/audio-transcription";
import { applyOffsetToNotes } from "@/lib/svivva-play/midi-alignment";
import { composeWithChordProgression } from "@/lib/svivva-play/compose-from-chords";
import {
  attachMelodyneToSession,
  buildHarmonicSession,
  splitSessionFiles,
  type HarmonicSession,
} from "@/lib/svivva-play/harmonic-session";
import {
  composeStrategicReich,
  generateStrategicStems,
  voicePartsToStemResults,
} from "@/lib/svivva-play/strategic-compose";
import { normalizeMidiEvents } from "@/lib/svivva-play/midi-normalize";
import {
  isMinorKeyLabel,
  keyToSelectValue,
  normalizeKeyLabel,
  parseRootFromKeyLabel,
} from "@/lib/svivva-play/analysis-utils";
import { stemMidiFilename } from "@/lib/svivva-play/midi-filenames";
import { buildClientSessionExport } from "@/lib/svivva-play/session-export";

const COMING_SOON_MODES: PlayMode[] = ["interpolation", "solo", "patch", "chords", "ensemble"];

function stemTimelineDurationSec(stems: { midiEvents: unknown[] }[], bpm: number): number {
  if (bpm <= 0) return 0;
  let maxBeat = 0;
  for (const stem of stems) {
    for (const evt of normalizeMidiEvents(stem.midiEvents)) {
      maxBeat = Math.max(maxBeat, evt.startBeat + evt.duration);
    }
  }
  if (maxBeat <= 0) return 0;
  return (maxBeat * 60) / bpm + 0.5;
}

function resolvePlaybackDurationSec(engineDur: number, importDur: number, stemDur: number): number {
  const timeline = Math.max(engineDur, stemDur);
  if (importDur > 0) {
    // Hear full generated MIDI even when import analysis window is shorter
    return Math.max(importDur, timeline > 0 ? timeline : importDur);
  }
  return timeline > 0 ? timeline : 8;
}

type PlayMode = "composition" | "interpolation" | "chords" | "solo" | "patch" | "ensemble";

interface AnalysisResult {
  bpm: number;
  timeSignature: string;
  key: string;
  keyConfidence: number;
  chords: { t0: number; t1: number; symbol: string; roman?: string; confidence?: number }[];
  sections: { name: string; t0: number; t1: number; bars?: number }[];
  downbeats: number[];
  styleCompatibility: string[];
  timbreDescriptors?: Record<string, unknown>;
}

interface StemData {
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
}

interface PlanInfo {
  stemCount: number;
  form: { sections?: string[]; total_bars?: number };
  dynamics: { section: string; level: string }[];
  harmonyRules: { mode?: string; tension?: number } | string;
  meendApplicableStems: string[];
  chordProgression?: string[];
  key?: string;
  bpm?: number;
}

interface PatchData {
  name: string;
  synth_family: string;
  oscillators: { shape: string; oct: number; fine: number; mix: number; pw?: number }[];
  filter: {
    type: string;
    cutoff_hz: number;
    resonance: number;
    drive?: number;
    key_track?: number;
  };
  env: {
    amp: { A: number; D: number; S: number; R: number };
    filter: { A: number; D: number; S: number; R: number; amount: number };
  };
  lfo: { wave: string; rate_hz: number; dest: string; amount: number }[];
  unison?: { voices?: number; detune_cents?: number };
  mono_poly?: string;
  fx: { type: string; mix: number }[];
  macros: { brightness: number; movement: number; bite: number; space: number };
  instructions: string;
  mappings?: { midi_cc?: Record<string, number>; [key: string]: unknown };
}

const MODE_CONFIG: Record<
  PlayMode,
  {
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    qualityTier: string;
  }
> = {
  composition: {
    label: "Composition",
    shortLabel: "Comp",
    icon: Music,
    description: "Counterpoint & hocketing — interlocking canons, phased textures",
    qualityTier: "professional",
  },
  interpolation: {
    label: "Interpolation",
    shortLabel: "Interp",
    icon: Waves,
    description: "Style-transfer loops preserving rhythmic/harmonic DNA",
    qualityTier: "professional",
  },
  chords: {
    label: "Chord Player",
    shortLabel: "Chords",
    icon: Piano,
    description: "Advanced voicings, reharmonization, and comping patterns",
    qualityTier: "professional",
  },
  solo: {
    label: "Solo Prompt",
    shortLabel: "Solo",
    icon: GiSaxophone,
    description: "AI soloist with phrasing development and harmonic awareness",
    qualityTier: "professional",
  },
  patch: {
    label: "Patch Creator",
    shortLabel: "Patch",
    icon: Settings2,
    description: "Universal synth patch design from audio analysis",
    qualityTier: "professional",
  },
  ensemble: {
    label: "Ensemble",
    shortLabel: "Ens",
    icon: Users,
    description: "Coming soon — use Composition hocket for Reich interlock + Meend",
    qualityTier: "professional",
  },
};

/** Lets algorithmic composition run before import (key/BPM editable like a scratch session). */
const FALLBACK_ANALYSIS: AnalysisResult = {
  bpm: 120,
  key: "C major",
  keyConfidence: 0,
  timeSignature: "4/4",
  chords: [],
  sections: [],
  downbeats: [],
  styleCompatibility: [],
};

const STYLE_PRESETS: Record<PlayMode, { id: string; label: string; desc: string }[]> = {
  composition: [
    {
      id: "interlocking_minimalism",
      label: "Interlocking Counterpoint",
      desc: "Complementary rhythmic patterns, phasing",
    },
    {
      id: "hocketed_texture",
      label: "Hocketed Texture",
      desc: "Alternating note distribution, staggered entrances",
    },
    { id: "phase_motion", label: "Phase Motion", desc: "Gradual timing shifts, downbeat anchors" },
    { id: "tone_row", label: "Tone Row Etude", desc: "12-tone with P/I/R/RI transformations" },
    { id: "sonification", label: "Sonification", desc: "Map audio features to music parameters" },
    { id: "automata", label: "Automata / Chaos", desc: "Rule-based generative state machine" },
    {
      id: "rational_melody",
      label: "Rational Melody",
      desc: "Limited pitch set with counting rules",
    },
    {
      id: "counting_process",
      label: "Counting Process",
      desc: "Arithmetic-generated note structures",
    },
    {
      id: "combinatorial",
      label: "Combinatorial Harmony",
      desc: "Chord set traversal and catalog",
    },
    {
      id: ORCHESTRAL_STYLE_PRESET_ID,
      label: "Prompt Orchestral",
      desc: "Reich phasing × Shaw intimacy — hyper-real stems",
    },
  ],
  interpolation: [
    { id: "genre_transfer", label: "Genre Transfer", desc: "Transform genre while keeping DNA" },
    {
      id: "texture_transfer",
      label: "Texture Transfer",
      desc: "Same harmony, entirely new timbres",
    },
    { id: "rhythm_transfer", label: "Rhythm Transfer", desc: "New groove, same melodic motifs" },
  ],
  chords: [
    { id: "neo_soul", label: "Neo-Soul Extended", desc: "9/11/13 chords, smooth voice leading" },
    { id: "jazz_fusion", label: "Jazz-Fusion Voicings", desc: "Quartal stacks, upper structures" },
    {
      id: "sophisticated_pop",
      label: "Sophisticated Pop",
      desc: "Color chords with melodic hooks",
    },
    { id: "cinematic_modal", label: "Cinematic Modal", desc: "Pedal points, modal interchange" },
    { id: "complex_jazz", label: "Complex Jazz Matrix", desc: "Tritone subs, chromatic approach" },
  ],
  solo: [
    { id: "modal_jazz", label: "Modal Jazz Lead", desc: "Smooth motifs, space, dynamics" },
    { id: "bebop", label: "Bebop Improviser", desc: "Fast chromatic enclosures, resolutions" },
    { id: "blues_fusion", label: "Blues Fusion Lead", desc: "Bends, vibrato, pentatonic + color" },
    { id: "raga_inspired", label: "Raga-Inspired", desc: "Ornaments, meend, drone sensitivity" },
    { id: "vocal_scat", label: "Vocal Scat", desc: "Syllable engine + harmony stacks" },
  ],
  patch: [
    { id: "subtractive", label: "Subtractive Analog", desc: "Ladder/SEM filter warmth" },
    { id: "fm", label: "FM Electric", desc: "DX7-style metallic, electric piano" },
    { id: "wavetable", label: "Wavetable Modern", desc: "Evolving digital textures" },
    { id: "granular", label: "Granular Texture", desc: "Ambient pads, atmosphere" },
  ],
  ensemble: [
    {
      id: BJORK_LINS_ORCHESTRAL_PRESET,
      label: "Björk × Ivan Lins Strings",
      desc: "Brazilian phrasing, jazz voice-leading — interlocking string orchestra",
    },
    {
      id: ORCHESTRAL_STYLE_PRESET_ID,
      label: "Hyperreal Orchestral",
      desc: "Reich phasing × Shaw intimacy — classically voice-led stems",
    },
    {
      id: "cinematic_orchestra",
      label: "Cinematic Orchestra",
      desc: "Long-bow sustains, dynamic swells — film-score orchestration",
    },
  ],
};

import dynamic from "next/dynamic";
import { FeatureScrollToTop } from "@/components/feature-scroll-to-top";
const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);

export default function SvivvaPlayPage() {
  const [mode, setMode] = useState<PlayMode>("composition");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const effectiveAnalysis =
    analysis ??
    ((mode === "composition" || mode === "ensemble") && !audioFile ? FALLBACK_ANALYSIS : null);
  const compositionFallback = mode === "composition" ? FALLBACK_ANALYSIS : null;
  const [manualTempo, setManualTempo] = useState<number | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [audioAnchorKey, setAudioAnchorKey] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStage, setPipelineStage] = useState("");
  const [stems, setStems] = useState<StemData[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [patchResult, setPatchResult] = useState<PatchData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInputPlaying, setIsInputPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [importSeq, setImportSeq] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const [density, setDensity] = useState(50);
  const [complexity, setComplexity] = useState(50);
  const [harmonyMode, setHarmonyMode] = useState<"match" | "reharmonize">("match");
  const [meend, setMeend] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");

  const [tension, setTension] = useState(40);
  const [rootMovement, setRootMovement] = useState(50);
  const [voiceLeading, setVoiceLeading] = useState<"smooth" | "moderate" | "jumpy">("smooth");
  const [compingPattern, setCompingPattern] = useState("sustained_pads");

  const [risk, setRisk] = useState(30);
  const [callResponse, setCallResponse] = useState(false);
  const [soloType, setSoloType] = useState("instrument");

  const [styleStrength, setStyleStrength] = useState(50);
  const [keepHarmony, setKeepHarmony] = useState(true);

  const [synthFamily, setSynthFamily] = useState("subtractive");
  const [macroBrightness, setMacroBrightness] = useState(0.5);
  const [macroMovement, setMacroMovement] = useState(0.5);
  const [macroBite, setMacroBite] = useState(0.3);
  const [macroSpace, setMacroSpace] = useState(0.5);

  const [vocalistEnabled, setVocalistEnabled] = useState(false);

  const [showGuidedBuilder, setShowGuidedBuilder] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [scaleSearchQuery, setScaleSearchQuery] = useState("");
  const [scaleLookupBusy, setScaleLookupBusy] = useState(false);
  const [scaleLookupResult, setScaleLookupResult] = useState<ScaleLookupResult | null>(null);
  const [crateState, setCrateState] = useState<"closed" | "opening" | "open">("closed");
  const [betaAcknowledged, setBetaAcknowledged] = useState(
    () =>
      typeof window !== "undefined" && window.localStorage.getItem("svivva-play-beta-ack") === "1",
  );

  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999));
  const [useSeed, setUseSeed] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<
    {
      id: string;
      seed: number;
      stemsCount: number;
      timestamp: number;
      label: string;
      stems: StemData[];
      plan: PlanInfo | null;
      patch: PatchData | null;
    }[]
  >([]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [regeneratingStem, setRegeneratingStem] = useState<string | null>(null);
  const [editingChord, setEditingChord] = useState<number | null>(null);
  const [chordEdits, setChordEdits] = useState<Record<number, string>>({});
  const [lockedStems, setLockedStems] = useState<Set<string>>(new Set());
  const [soloTakes, setSoloTakes] = useState<{ stems: StemData[]; seed: number }[]>([]);
  const [activeTake, setActiveTake] = useState(0);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(100);
  const [showChordEditor, setShowChordEditor] = useState(false);

  const [chordTagFilter, setChordTagFilter] = useState("");
  const [chordSearch, setChordSearch] = useState("");
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [chordRoot, setChordRoot] = useState("C");
  const [chordInversion, setChordInversion] = useState(0);
  const [reichVoices, setReichVoices] = useState<VoicePart[]>([]);
  const [reichScale, setReichScale] = useState("major");
  const [scaleSuggestionApplied, setScaleSuggestionApplied] = useState(false);
  const [reichType, setReichType] = useState<"counterpoint" | "hocket">("counterpoint");
  const [reichStyle, setReichStyle] = useState<ReichStyle>("reich_electric");
  const [reichDuration, setReichDuration] = useState(16);
  const [swingAmount, setSwingAmount] = useState(0);
  const [hocketGroove, setHocketGroove] = useState<HocketGrooveStyle>("reich_interlock");
  const [patternLength, setPatternLength] = useState<PatternLength>("standard");

  const [transcription, setTranscription] = useState<HarmonicSession | null>(null);
  const [melodyneFile, setMelodyneFile] = useState<File | null>(null);
  const [midiRawNotes, setMidiRawNotes] = useState<TranscribedNote[]>([]);
  const [midiReferenceNotes, setMidiReferenceNotes] = useState<TranscribedNote[]>([]);
  const [alignOffsetSec, setAlignOffsetSec] = useState(0);
  const [alignScore, setAlignScore] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const analysisBusy = isAnalyzing || isTranscribing || isEnriching;
  const generationKeyLabel = useMemo(() => {
    const chordSegments =
      transcription?.chords?.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: ("confidence" in c ? c.confidence : 55) ?? 55,
        pitchClasses: "pitchClasses" in c ? (c.pitchClasses as number[]) : [],
      })) ??
      effectiveAnalysis?.chords?.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: c.confidence ?? 55,
        pitchClasses: [] as number[],
      })) ??
      [];

    return resolveCompositionKey({
      manualKey,
      analysisKey: effectiveAnalysis?.key ?? "C major",
      audioAnchorKey:
        audioAnchorKey ??
        (effectiveAnalysis?.key && !effectiveAnalysis.key.startsWith("Detecting")
          ? normalizeKeyLabel(effectiveAnalysis.key)
          : null),
      harmonicContext: transcription
        ? {
            key: transcription.harmonicKey,
            keySource: transcription.harmonicKeySource,
            sources: transcription.sources,
          }
        : null,
      chords: chordSegments,
    });
  }, [manualKey, effectiveAnalysis?.key, effectiveAnalysis?.chords, transcription, audioAnchorKey]);
  const generationScaleLookup = useMemo(() => {
    const chordSegments =
      effectiveAnalysis?.chords?.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: c.confidence ?? 55,
        pitchClasses: [] as number[],
      })) ?? [];
    const { scaleInfo, resolution } = resolveCompositionScale(
      generationKeyLabel,
      reichScale,
      manualKey,
      chordSegments,
    );
    const root = parseRootFromKeyLabel(generationKeyLabel);
    return {
      scaleInfo,
      noteNames: scaleNoteNames(resolution.scaleName, root),
      label: resolution.scaleName.replace(/_/g, " "),
    };
  }, [generationKeyLabel, reichScale, manualKey, effectiveAnalysis?.chords]);

  const aiScaleSuggestion = useMemo((): ScaleSuggestion | null => {
    if (!effectiveAnalysis) return null;
    const chords =
      transcription?.chords?.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: ("confidence" in c ? c.confidence : 55) ?? 55,
        pitchClasses: "pitchClasses" in c ? (c.pitchClasses as number[]) : [],
      })) ??
      effectiveAnalysis.chords?.map((c) => ({
        t0: c.t0,
        t1: c.t1,
        symbol: c.symbol,
        confidence: c.confidence ?? 55,
        pitchClasses: [] as number[],
      })) ??
      [];
    return suggestCompositionScale({
      analysisKey: manualKey ?? effectiveAnalysis.key,
      chords,
      melodyneNotes: transcription?.melodyneNotes,
      audioNotes: [],
    });
  }, [effectiveAnalysis, manualKey, transcription]);

  const applyAiScaleSuggestion = useCallback(() => {
    if (!aiScaleSuggestion) return;
    setReichScale(aiScaleSuggestion.scaleName);
    setManualKey(aiScaleSuggestion.keyLabel);
    setScaleSuggestionApplied(true);
    setWarningMsg(
      `Scale set to ${aiScaleSuggestion.keyLabel} · ${aiScaleSuggestion.scaleName.replace(/_/g, " ")} (${aiScaleSuggestion.confidence}% match).`,
    );
  }, [aiScaleSuggestion]);

  const applyScaleLookupMatch = useCallback((match: ScaleLookupMatch) => {
    setReichScale(match.scaleId);
    setScaleSuggestionApplied(true);
    setWarningMsg(`Scale set to ${match.label} (${match.source}, ${match.confidence}% match).`);
  }, []);

  const runScaleLookup = useCallback(async () => {
    const q = scaleSearchQuery.trim();
    if (!q) return;
    setScaleLookupBusy(true);
    setErrorMsg("");
    const root = parseRootFromKeyLabel(generationKeyLabel);
    const local = lookupScaleLocal(q, root);
    setScaleLookupResult(local);
    if (local.resolved) {
      applyScaleLookupMatch(local.resolved);
      setScaleLookupBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/svivva-play/scale-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, key: generationKeyLabel, useAi: true }),
      });
      if (res.ok) {
        const remote = (await res.json()) as ScaleLookupResult;
        setScaleLookupResult(remote);
        if (remote.resolved) applyScaleLookupMatch(remote.resolved);
      } else {
        setErrorMsg("Scale lookup failed — try a different spelling.");
      }
    } catch {
      setErrorMsg("Scale lookup failed — check connection.");
    } finally {
      setScaleLookupBusy(false);
    }
  }, [scaleSearchQuery, generationKeyLabel, applyScaleLookupMatch]);

  const [stagePlaybackSec, setStagePlaybackSec] = useState(0);
  const [midiFileName, setMidiFileName] = useState("");

  const playStageModel = useMemo<PlayStageModel>(() => {
    if (mode === "patch") return "moog";
    if (mode !== "composition") return "notebook";
    if (reichStyle === "phase_canon") return "v1";
    if (reichStyle === "shaw_interlace") return reichType === "hocket" ? "steelpan" : "vibraphone";
    return reichType === "hocket" ? "vibraphone" : "piano";
  }, [mode, reichStyle, reichType]);

  const [showNeuralPanel, setShowNeuralPanel] = useState(false);
  const [neuralPromptResult, setNeuralPromptResult] = useState<{
    prompt: string;
    tags: string[];
    qualityScore: number;
    modelSettings: { steps: number; cfgScale: number; duration: number };
    promptProfile?: "standard" | "orchestral";
    orchestrationBrief?: string;
    stemLayout?: string[];
    humanizationNotes?: string;
    mixRouting?: string;
  } | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [neuralPromptProfile, setNeuralPromptProfile] = useState<"standard" | "orchestral">(
    "standard",
  );
  const [neuralGenre, setNeuralGenre] = useState("");
  const [neuralMood, setNeuralMood] = useState("");
  const [neuralEnergy, setNeuralEnergy] = useState("medium");
  const [neuralQuality, setNeuralQuality] = useState("high");
  const [promptCopied, setPromptCopied] = useState(false);

  const [engineReady, setEngineReady] = useState(false);
  const [engineLoading, setEngineLoading] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const melodyneInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const importDurationSecRef = useRef(0);
  const audioImportCapSecRef = useRef(0);
  const modeRef = useRef(mode);
  const userPromptRef = useRef(userPrompt);
  const analysisRunRef = useRef(0);
  const engineLoadGenRef = useRef(0);
  const engineStemsKeyRef = useRef("");
  const melodyneKeyRef = useRef<string | null>(null);
  const audioKeyRef = useRef<string | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "ensemble") setMode("composition");
  }, [mode]);

  useEffect(() => {
    userPromptRef.current = userPrompt;
  }, [userPrompt]);

  const resolveImportDurationSec = useCallback((): number => {
    const bpm = manualTempo ?? analysis?.bpm ?? 120;
    const audioDur =
      audioRef.current?.duration && Number.isFinite(audioRef.current.duration)
        ? audioRef.current.duration
        : 0;
    if (audioDur > 0) return barAlignedDurationAtMostSec(audioDur, bpm);
    if (transcription?.durationSec && transcription.durationSec > 0) {
      return barAlignedDurationAtMostSec(transcription.durationSec, bpm);
    }
    if (reichDuration > 0) return barAlignedDurationSec(reichDuration, bpm);
    return 0;
  }, [manualTempo, analysis?.bpm, transcription?.durationSec, reichDuration]);

  const syncPlaybackDuration = useCallback(() => {
    const importDur = resolveImportDurationSec();
    const stemDur = stemTimelineDurationSec(
      stems,
      manualTempo ?? effectiveAnalysis?.bpm ?? analysis?.bpm ?? 120,
    );
    audioImportCapSecRef.current = importDur;
    importDurationSecRef.current = Math.max(importDur > 0 ? importDur : 0, stemDur);
    if (importDur <= 0 && stemDur <= 0) return;
    if (engineReady) {
      const engineDur = getSoundEngine().getDuration();
      setPlaybackDuration(resolvePlaybackDurationSec(engineDur, importDur, stemDur));
    } else {
      setPlaybackDuration(resolvePlaybackDurationSec(0, importDur, stemDur));
    }
  }, [
    resolveImportDurationSec,
    engineReady,
    stems,
    manualTempo,
    effectiveAnalysis?.bpm,
    analysis?.bpm,
  ]);

  useEffect(() => {
    syncPlaybackDuration();
  }, [syncPlaybackDuration, transcription?.durationSec, reichDuration, manualTempo, analysis?.bpm]);

  const handleImportAudio = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

  const applyHarmonicSession = useCallback((session: HarmonicSession) => {
    setTranscription(session);
    setMidiRawNotes(session.melodyneRawNotes);
    setMidiReferenceNotes(session.melodyneNotes);
    setAlignOffsetSec(session.alignOffsetSec);
    setAlignScore(session.alignScore);
    if (session.durationSec > 0) {
      setReichDuration(Math.round(session.durationSec));
    }
    setAnalysis((prev) => {
      const base = prev ?? {
        bpm: 120,
        timeSignature: "4/4",
        key: "C major",
        keyConfidence: 50,
        chords: [],
        sections: [],
        downbeats: [],
        styleCompatibility: [],
      };
      const prevKey =
        base.key && !base.key.startsWith("Detecting") ? normalizeKeyLabel(base.key) : null;
      const audioAnchor = audioKeyRef.current ?? prevKey;
      const sessionKey = session.harmonicKey ? normalizeKeyLabel(session.harmonicKey) : null;
      const midiConf = session.harmonicKeyConfidence ?? 0;
      const prevConf = base.keyConfidence ?? 50;
      const cMajorTrap = sessionKey === "C major" && audioAnchor && audioAnchor !== "C major";
      const bForATrap = sessionKey === "B major" && audioAnchor === "A major";
      const csForATrap = sessionKey === "C# major" && audioAnchor === "A major";
      const melodyneMisreadTrap = bForATrap || csForATrap || cMajorTrap;
      const keepAudioKey =
        session.harmonicKeySource === "audio" ||
        melodyneMisreadTrap ||
        (Boolean(audioAnchor) &&
          prevConf >= 48 &&
          sessionKey !== audioAnchor &&
          (midiConf < 80 || melodyneMisreadTrap));
      const useMidiKey =
        !keepAudioKey &&
        Boolean(
          session.sources.melodyneMidi &&
          sessionKey &&
          session.harmonicKeySource === "midi" &&
          midiConf >= 80 &&
          !melodyneMisreadTrap,
        );
      const resolvedKey = keepAudioKey
        ? (audioAnchor ?? sessionKey ?? base.key)
        : useMidiKey
          ? sessionKey!
          : (audioAnchor ?? sessionKey ?? base.key);
      if (session.sources.melodyneMidi && resolvedKey) {
        melodyneKeyRef.current = resolvedKey;
      }
      const resolvedConf = keepAudioKey
        ? Math.max(prevConf, audioKeyRef.current ? prevConf : 0, midiConf)
        : useMidiKey
          ? Math.min(92, midiConf)
          : Math.max(prevConf, midiConf);
      return {
        ...base,
        key: resolvedKey,
        keyConfidence: resolvedConf,
        chords: session.chords.map((c) => ({
          t0: c.t0,
          t1: c.t1,
          symbol: c.symbol,
          confidence: c.confidence,
        })),
      };
    });
  }, []);

  const acceptAudioAndMelodyne = useCallback((audio: File, melodyne?: File | null) => {
    if (audioInputRef.current) audioInputRef.current.value = "";

    setAudioFile(audio);
    setAudioName(audio.name);
    setMelodyneFile(melodyne ?? null);
    setMidiFileName(melodyne?.name ?? "");
    setAnalysis(null);
    setSessionId(null);
    setStems([]);
    setPatchResult(null);
    setPlanInfo(null);
    setErrorMsg("");
    setManualTempo(null);
    setManualKey(null);
    setAudioAnchorKey(null);
    setIsEnriching(false);
    setTranscription(null);
    setMidiRawNotes([]);
    setMidiReferenceNotes([]);
    setAlignOffsetSec(0);
    setAlignScore(0);
    setIsTranscribing(false);
    melodyneKeyRef.current = null;
    audioKeyRef.current = null;
    setIsAnalyzing(true);
    setIsTranscribing(Boolean(melodyne));
    setAudioUrl(URL.createObjectURL(audio));
    setImportSeq((n) => n + 1);
  }, []);

  const handleImportMelodyne = useCallback(() => {
    if (!audioFile) {
      setErrorMsg("Import your audio file first, then add the matching Melodyne .mid export.");
      return;
    }
    melodyneInputRef.current?.click();
  }, [audioFile]);

  const handleAddMelodyneOnly = useCallback(
    async (file: File) => {
      if (!audioFile) {
        setErrorMsg("Import your audio file first, then add the matching Melodyne .mid export.");
        return;
      }
      if (!analysis && !transcription) {
        setWarningMsg(
          "Wait for audio analysis to finish, then add your Melodyne .mid (or drop both files on the bar).",
        );
        return;
      }
      setErrorMsg("");
      setWarningMsg("");
      setMelodyneFile(file);
      setMidiFileName(file.name);
      setIsTranscribing(true);
      const bpm = manualTempo ?? analysis?.bpm ?? 120;
      const key =
        manualKey ??
        audioKeyRef.current ??
        (analysis?.key && !analysis.key.startsWith("Detecting") ? analysis.key : null) ??
        "C major";
      const keyConfidence = Math.max(
        analysis?.keyConfidence ?? 0,
        audioKeyRef.current ? 70 : 0,
        65,
      );
      try {
        const updated = transcription
          ? await attachMelodyneToSession(transcription, file, bpm, key, keyConfidence)
          : await buildHarmonicSession({
              audioFile,
              melodyneFile: file,
              bpm,
              key,
              keyConfidence,
              keyHint: userPrompt,
            });
        if (!updated?.melodyneNotes?.length) {
          setWarningMsg(
            "Could not read notes from this .mid — in Melodyne, export harmonic tracks (not just audio) as Standard MIDI File (.mid).",
          );
          return;
        }
        applyHarmonicSession(updated);
        setWarningMsg(
          `Melodyne loaded: ${updated.melodyneNotes.length} notes, ${updated.chords.length} chord regions — key ${updated.harmonicKey ?? key}.`,
        );
      } catch (err) {
        console.warn("Melodyne MIDI import failed:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to parse Melodyne MIDI file.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [audioFile, transcription, analysis, manualTempo, manualKey, userPrompt, applyHarmonicSession],
  );

  const handleAlignOffsetChange = useCallback(
    (sec: number) => {
      setAlignOffsetSec(sec);
      if (!midiRawNotes.length) return;
      setMidiReferenceNotes(applyOffsetToNotes(midiRawNotes, sec));
    },
    [midiRawNotes],
  );

  const handleAudioFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (!file) return;
      acceptAudioAndMelodyne(file, null);
    },
    [acceptAudioAndMelodyne],
  );

  const handleMelodyneFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (melodyneInputRef.current) melodyneInputRef.current.value = "";
      if (!file) return;
      if (!audioFile) {
        setErrorMsg("Import your audio file first, then add the matching Melodyne .mid export.");
        return;
      }
      void handleAddMelodyneOnly(file);
    },
    [handleAddMelodyneOnly],
  );

  const handleDropImport = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const { audio, melodyne, extras } = splitSessionFiles(e.dataTransfer.files);
      if (!audio) {
        if (melodyne) {
          setErrorMsg("Drop your audio file together with the Melodyne MIDI export.");
        } else {
          setErrorMsg("Drop audio + Melodyne MIDI (.mid) together for full harmonic analysis.");
        }
        return;
      }
      if (extras.length) {
        setWarningMsg(`Ignored ${extras.length} extra file(s).`);
      }
      acceptAudioAndMelodyne(audio, melodyne);
    },
    [acceptAudioAndMelodyne],
  );

  useEffect(() => {
    if (!audioFile || importSeq === 0) return;

    const runId = ++analysisRunRef.current;
    let cancelled = false;

    (async () => {
      setIsAnalyzing(true);
      setIsTranscribing(true);
      setIsEnriching(false);
      setErrorMsg("");
      setWarningMsg("");

      void import("@/lib/svivva-play/sound-engine")
        .then(({ getSoundEngine }) => getSoundEngine().init())
        .catch(() => {});

      const { runImportAnalysis } = await import("@/lib/svivva-play/run-import-analysis");
      const result = await runImportAnalysis({
        file: audioFile,
        melodyneFile,
        bpm: manualTempo ?? analysis?.bpm ?? FALLBACK_ANALYSIS.bpm,
        key: manualKey ?? analysis?.key ?? FALLBACK_ANALYSIS.key,
        userHint: userPromptRef.current,
        onInstantResult: (instant) => {
          if (cancelled || runId !== analysisRunRef.current) return;
          setAnalysis((prev) => ({
            ...instant,
            key: manualKey ?? instant.key,
            bpm: manualTempo ?? instant.bpm,
            chords: prev?.chords?.length ? prev.chords : instant.chords,
          }));
          setIsAnalyzing(false);
        },
        onTranscription: (session) => {
          if (cancelled || runId !== analysisRunRef.current) return;
          applyHarmonicSession(session);
        },
      });

      if (cancelled || runId !== analysisRunRef.current) return;

      if (result.transcription) {
        applyHarmonicSession(result.transcription);
      }
      setIsTranscribing(false);
      if (result.analysis) {
        const sessionKey = result.transcription?.harmonicKey
          ? normalizeKeyLabel(result.transcription.harmonicKey)
          : null;
        setAnalysis((prev) => ({
          ...result.analysis!,
          key: manualKey ?? sessionKey ?? prev?.key ?? result.analysis!.key,
          bpm: manualTempo ?? result.analysis!.bpm,
          chords: result.transcription?.chords?.length
            ? result.transcription.chords.map((c) => ({
                t0: c.t0,
                t1: c.t1,
                symbol: c.symbol,
                confidence: c.confidence,
              }))
            : (prev?.chords ?? result.analysis!.chords),
        }));
        if (sessionKey && result.transcription?.harmonicKeySource === "midi") {
          melodyneKeyRef.current = sessionKey;
        }
      }
      if (result.warning) setWarningMsg(result.warning);
      if (result.error) setErrorMsg(result.error);
      setIsAnalyzing(false);
      setIsEnriching(false);
    })().finally(() => {
      if (cancelled || runId !== analysisRunRef.current) return;
      setIsAnalyzing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [audioFile, melodyneFile, importSeq, applyHarmonicSession]);

  const buildSettings = useCallback(() => {
    const lockedKey = generationKeyLabel;
    const currentSeed = stableGenerationSeed({
      useSeed,
      seed,
      lockedKey,
      importSeq,
    });
    if (!useSeed) setSeed(currentSeed);
    const effectiveReichScale = resolveMeendScaleName({
      lockedKey,
      reichScale,
      seed: currentSeed,
      meend,
    });
    const base = {
      density,
      complexity,
      harmonyMode,
      meend,
      userPrompt: userPrompt || undefined,
      seed: currentSeed,
    };
    switch (mode) {
      case "chords":
        return { ...base, tension, rootMovement, voiceLeading, compingPattern };
      case "solo":
        return { ...base, risk, callResponse, soloType };
      case "interpolation":
        return { ...base, styleStrength, keepHarmony };
      case "patch":
        return {
          ...base,
          synthFamily,
          macros: {
            brightness: macroBrightness,
            movement: macroMovement,
            bite: macroBite,
            space: macroSpace,
          },
        };
      case "ensemble":
        return {
          ...base,
          meend,
          patternLength,
          ensembleSize: 13,
          reichScale: isMinorKeyLabel(manualKey ?? generationKeyLabel) ? "natural_minor" : "major",
        };
      default:
        return {
          ...base,
          reichStyle,
          reichType,
          reichScale: effectiveReichScale,
          swingAmount,
          hocketGroove,
          patternLength,
        };
    }
  }, [
    mode,
    density,
    complexity,
    harmonyMode,
    meend,
    userPrompt,
    useSeed,
    seed,
    reichStyle,
    reichType,
    reichScale,
    swingAmount,
    hocketGroove,
    patternLength,
    tension,
    rootMovement,
    voiceLeading,
    compingPattern,
    risk,
    callResponse,
    soloType,
    styleStrength,
    keepHarmony,
    synthFamily,
    macroBrightness,
    macroMovement,
    macroBite,
    macroSpace,
    vocalistEnabled,
    selectedPreset,
    generationKeyLabel,
    manualKey,
    importSeq,
  ]);

  const handleGenerate = useCallback(
    async (quality: "preview" | "full" = "preview") => {
      const activeAnalysis = analysis ?? effectiveAnalysis ?? FALLBACK_ANALYSIS;
      if (!activeAnalysis) {
        setErrorMsg(
          "Import audio (and Melodyne .mid for best results), then set key/tempo under Manual Overrides.",
        );
        return;
      }
      setIsGenerating(true);
      setPipelineStage(
        mode === "patch"
          ? "Designing patch..."
          : transcription
            ? "Strategic compose — from your audio + Melodyne chords…"
            : "Stage 1: Planning arrangement...",
      );
      setStems([]);
      setPatchResult(null);
      setPlanInfo(null);
      setErrorMsg("");
      setWarningMsg("");
      setEngineReady(false);
      setEngineLoading(false);
      setPlaybackPos(0);
      setSoloTakes([]);
      setActiveTake(0);

      try {
        const settings = buildSettings();

        const lockedKey = generationKeyLabel;
        const composeKey = manualKey ? normalizeKeyLabel(manualKey) : lockedKey;
        const harmonicContext = transcription
          ? {
              chords: stabilizeHarmonicTimeline(
                transcription.chords,
                transcription.durationSec,
                manualTempo ?? activeAnalysis.bpm ?? 120,
              ),
              audioNotes: [],
              melodyneNotes: transcription.melodyneNotes ?? [],
              durationSec: transcription.durationSec,
              key: composeKey,
              keySource: transcription.sources?.melodyneMidi
                ? ("midi" as const)
                : transcription.harmonicKeySource,
              sources: transcription.sources,
              melodyneMixOnly: Boolean(transcription.sources?.melodyneMidi),
            }
          : undefined;

        const generatePayload = {
          sessionId: sessionId ?? undefined,
          inlineAnalysis: { ...activeAnalysis, key: composeKey },
          mode,
          stylePreset: selectedPreset || STYLE_PRESETS[mode][0]?.id,
          quality,
          manualKey: manualKey ?? undefined,
          manualTempo,
          settings,
          chordEdits: Object.keys(chordEdits).length > 0 ? chordEdits : undefined,
          harmonicContext,
          audioAnchorKey: audioKeyRef.current,
        };

        if (mode === "solo") {
          setPipelineStage("Generating solo takes...");
          const takes: { stems: StemData[]; seed: number }[] = [];
          for (let i = 0; i < 3; i++) {
            const takeSeed = useSeed && i === 0 ? settings.seed : settings.seed + i * 7919;
            const res = await fetch("/api/svivva-play/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...generatePayload,
                settings: { ...settings, seed: takeSeed },
              }),
            });
            const data = await res.json();
            if (data.stems) {
              takes.push({ stems: data.stems, seed: takeSeed });
              if (i === 0) {
                setGenerationId(data.generationId);
                setPlanInfo(data.plan || null);
              }
            }
            setPipelineStage(`Generated take ${i + 1} of 3...`);
          }
          if (takes.length > 0) {
            setSoloTakes(takes);
            setStems(takes[0].stems);
            setActiveTake(0);
            setPipelineStage("Complete");
            const ver = {
              id: String(Date.now()),
              seed: settings.seed,
              stemsCount: takes[0].stems.length,
              timestamp: Date.now(),
              label: `Solo v${versionHistory.length + 1}`,
              stems: takes[0].stems,
              plan: null,
              patch: null,
            };
            setVersionHistory((prev) => [...prev, ver]);
            setActiveVersion(versionHistory.length);
          } else {
            setErrorMsg("Failed to generate solo takes.");
          }
        } else {
          setPipelineStage(mode === "patch" ? "Designing patch..." : "Stage 2: Generating MIDI...");
          const res = await fetch("/api/svivva-play/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(generatePayload),
          });
          const data = await res.json();
          if (data.error) {
            setErrorMsg(data.error);
          } else if (data.stems) {
            setStems(data.stems);
            setPlanInfo(data.plan || null);
            setGenerationId(data.generationId);
            setPipelineStage("Complete");
            const ver = {
              id: data.generationId || String(Date.now()),
              seed: settings.seed,
              stemsCount: data.stems.length,
              timestamp: Date.now(),
              label: `${MODE_CONFIG[mode].label} v${versionHistory.length + 1}`,
              stems: data.stems,
              plan: data.plan || null,
              patch: null,
            };
            setVersionHistory((prev) => [...prev, ver]);
            setActiveVersion(versionHistory.length);
          } else if (data.patch) {
            setPatchResult(data.patch);
            setPipelineStage("Complete");
            const ver = {
              id: String(Date.now()),
              seed: settings.seed,
              stemsCount: 0,
              timestamp: Date.now(),
              label: `Patch v${versionHistory.length + 1}`,
              stems: [],
              plan: null,
              patch: data.patch,
            };
            setVersionHistory((prev) => [...prev, ver]);
            setActiveVersion(versionHistory.length);
          }
        }
      } catch (err) {
        setErrorMsg("Generation failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [
      sessionId,
      analysis,
      effectiveAnalysis,
      mode,
      selectedPreset,
      buildSettings,
      useSeed,
      versionHistory,
      chordEdits,
      manualKey,
      manualTempo,
      transcription,
      aiScaleSuggestion,
      scaleSuggestionApplied,
      applyAiScaleSuggestion,
    ],
  );

  const handleRegenerateStem = useCallback(
    async (stemName: string) => {
      if (!generationId) return;
      setRegeneratingStem(stemName);
      try {
        const settings = buildSettings();
        const regenSeed = settings.seed;
        const res = await fetch("/api/svivva-play/regenerate-stem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationId,
            stemName,
            settings: { ...settings, seed: regenSeed },
            lockedStems: Array.from(lockedStems),
            chordEdits,
          }),
        });
        const data = await res.json();
        if (data.stem) {
          setStems((prev) => prev.map((s) => (s.name === stemName ? data.stem : s)));
        } else if (data.error) {
          setErrorMsg(data.error);
        }
      } catch (err) {
        setErrorMsg("Stem regeneration failed.");
      } finally {
        setRegeneratingStem(null);
      }
    },
    [generationId, buildSettings, useSeed, seed, lockedStems, chordEdits],
  );

  const handleVersionSwitch = useCallback(
    (vi: number) => {
      setActiveVersion(vi);
      const ver = versionHistory[vi];
      if (!ver) return;
      if (ver.stems.length > 0) {
        setStems(ver.stems);
        setPlanInfo(ver.plan);
        setPatchResult(ver.patch);
      } else if (ver.patch) {
        setStems([]);
        setPatchResult(ver.patch);
        setPlanInfo(ver.plan);
      }
      setSeed(ver.seed);
    },
    [versionHistory],
  );

  const toggleStemLock = useCallback((stemName: string) => {
    setLockedStems((prev) => {
      const next = new Set(prev);
      if (next.has(stemName)) {
        next.delete(stemName);
      } else {
        next.add(stemName);
      }
      return next;
    });
  }, []);

  const handleChordEdit = useCallback(
    (index: number, newSymbol: string) => {
      setChordEdits((prev) => ({ ...prev, [index]: newSymbol }));
      if (analysis) {
        setAnalysis({
          ...analysis,
          chords: analysis.chords.map((c, i) => (i === index ? { ...c, symbol: newSymbol } : c)),
        });
      }
    },
    [analysis],
  );

  const downloadMidiBlob = useCallback((blob: Blob, filename: string): boolean => {
    if (!blob || blob.size < 22) {
      setErrorMsg("Export produced an empty file — generate stems again, then retry.");
      return false;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      window.setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 4000);
    });
    return true;
  }, []);

  const sniffBlobMagic = useCallback(async (blob: Blob, n = 4): Promise<string> => {
    try {
      const buf = await blob.slice(0, n).arrayBuffer();
      return String.fromCharCode(...new Uint8Array(buf));
    } catch {
      return "";
    }
  }, []);

  const handleDownloadStemMidi = useCallback(
    async (stem: StemData, stemIndex: number) => {
      const bpm = manualTempo ?? effectiveAnalysis?.bpm ?? analysis?.bpm ?? 120;
      if (!stem.midiEvents?.length) {
        setWarningMsg("This stem has no MIDI notes yet.");
        return;
      }
      const [exportStem] = prepareStemsForMidiExport(
        [
          {
            name: stem.name,
            role: stem.role,
            instrumentHint: stem.instrumentHint,
            midiEvents: stem.midiEvents,
            expression: stem.expression as Record<string, unknown> | undefined,
            pan: stem.pan,
          },
        ],
        { meend, includeAccentLayers: false, ensembleOrchestral: mode === "ensemble" },
      );
      if (!exportStem) {
        setWarningMsg("This stem has no MIDI notes yet.");
        return;
      }
      try {
        const res = await fetch("/api/svivva-play/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format: "midi",
            stems: [exportStem],
            bpm,
            filename: stem.name.replace(/\s+/g, "_"),
          }),
        });
        if (!res.ok) {
          setErrorMsg("Stem MIDI download failed.");
          return;
        }
        const blob = await res.blob();
        const magic = await sniffBlobMagic(blob, 4);
        if (magic !== "MThd") {
          const peek = await res
            .clone()
            .text()
            .catch(() => "");
          console.warn("Stem MIDI download invalid file:", { magic, peek: peek.slice(0, 200) });
          setErrorMsg("Stem export failed — server returned a non-MIDI file.");
          return;
        }
        downloadMidiBlob(blob, stemMidiFilename(stem.name, stem.role, stemIndex));
        setWarningMsg(
          `Downloaded ${stemMidiFilename(stem.name, stem.role, stemIndex)} — drag into your DAW.`,
        );
      } catch (err) {
        console.error("Stem MIDI download failed:", err);
        setErrorMsg("Stem MIDI download failed.");
      }
    },
    [analysis, effectiveAnalysis?.bpm, manualTempo, meend, downloadMidiBlob, sniffBlobMagic],
  );

  const handleDownloadMelodyneMidi = useCallback(async () => {
    const notes = transcription?.melodyneNotes ?? [];
    if (!notes.length) {
      setWarningMsg("Load your Melodyne .mid first.");
      return;
    }
    const bpm = manualTempo ?? analysis?.bpm ?? 120;
    try {
      const res = await fetch("/api/svivva-play/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "midi-zip",
          stems: [],
          melodyneNotes: notes,
          bpm,
          filename: "melodyne-reference",
        }),
      });
      if (!res.ok) {
        setErrorMsg("Melodyne MIDI export failed.");
        return;
      }
      const blob = await res.blob();
      const magic = await sniffBlobMagic(blob, 2);
      if (magic !== "PK") {
        const peek = await res
          .clone()
          .text()
          .catch(() => "");
        console.warn("Melodyne export invalid zip:", { magic, peek: peek.slice(0, 200) });
        setErrorMsg("Melodyne export failed — server returned a non-zip file.");
        return;
      }
      downloadMidiBlob(blob, "melodyne_reference.zip");
      setWarningMsg("STEM pack downloaded — unzip and drag melodyne_reference.mid into your DAW.");
    } catch (err) {
      console.error("Melodyne MIDI export failed:", err);
      setErrorMsg("Melodyne MIDI export failed.");
    }
  }, [transcription, analysis, manualTempo, downloadMidiBlob, sniffBlobMagic]);

  const handleExport = useCallback(async () => {
    const bpm = manualTempo ?? analysis?.bpm ?? 120;
    const downloadName = `svivva-play-${mode}-${Date.now()}`;
    const filename = `${downloadName}-export.zip`;

    if (stems.length === 0 && !transcription?.melodyneNotes?.length) {
      setErrorMsg("Generate stems or import Melodyne before exporting.");
      return;
    }

    setIsExporting(true);
    setErrorMsg("");

    const stemPayload = prepareStemsForMidiExport(
      stems.map((s) => ({
        name: s.name,
        role: s.role,
        instrumentHint: s.instrumentHint,
        midiEvents: s.midiEvents,
        expression: s.expression as Record<string, unknown> | undefined,
        pan: s.pan,
      })),
      { meend, includeAccentLayers: meend, ensembleOrchestral: mode === "ensemble" },
    );

    const sessionJson =
      analysis && transcription
        ? buildClientSessionExport({
            mode,
            audioName,
            analysis,
            transcription,
            stems,
          })
        : analysis
          ? buildClientSessionExport({
              mode,
              audioName,
              analysis,
              transcription: null,
              stems,
            })
          : undefined;

    try {
      try {
        const blob = await buildStemPackZipBlobClient({
          bpm,
          stems: stemPayload,
          melodyneNotes: transcription?.melodyneNotes,
          projectName: downloadName,
          sessionJson,
        });
        if (downloadMidiBlob(blob, filename)) {
          setWarningMsg(
            "Full export downloaded — zip includes all MIDI stems (with Meend bends), session JSON, and Melodyne reference.",
          );
        }
        return;
      } catch (clientErr) {
        console.warn("Client export zip failed, trying server:", clientErr);
      }

      const res = await fetch("/api/svivva-play/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "midi-zip",
          stems: stemPayload,
          melodyneNotes: transcription?.melodyneNotes ?? [],
          bpm,
          filename: downloadName,
          sessionJson,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        setErrorMsg((errBody as { error?: string } | null)?.error ?? "Export failed.");
        return;
      }
      const contentType = res.headers.get("Content-Type") ?? "";
      if (!contentType.includes("zip") && !contentType.includes("octet-stream")) {
        const peek = await res.clone().text();
        if (peek.trimStart().startsWith("{")) {
          try {
            const errJson = JSON.parse(peek) as { error?: string };
            setErrorMsg(errJson.error ?? "Export failed.");
          } catch {
            setErrorMsg("Export failed — server returned an invalid file.");
          }
          return;
        }
      }
      const blob = await res.blob();
      if (downloadMidiBlob(blob, filename)) {
        setWarningMsg("Full export downloaded — unzip for MIDI stems, session JSON, and README.");
      }
    } catch (err) {
      console.error("Export failed:", err);
      setErrorMsg("Export failed — check connection and try again.");
    } finally {
      setIsExporting(false);
    }
  }, [
    stems,
    analysis,
    transcription,
    audioName,
    mode,
    manualTempo,
    meend,
    downloadMidiBlob,
    setErrorMsg,
    setWarningMsg,
  ]);

  const buildStemPlaybacks = useCallback(
    (currentStems: StemData[]): StemPlayback[] => {
      const tempo =
        manualTempo ??
        effectiveAnalysis?.bpm ??
        analysis?.bpm ??
        (mode === "composition" ? FALLBACK_ANALYSIS.bpm : 120);

      let prepared = currentStems.map((s) => ({
        ...s,
        midiEvents: normalizeMidiEvents(s.midiEvents),
      }));

      if (meend && prepared.some((s) => s.midiEvents.length > 0)) {
        const applyMeend =
          mode === "ensemble" ? applyMeendToOrchestralMelodyStems : applyMeendToStems;
        prepared = applyMeend(
          prepared as Parameters<typeof applyMeendToStems>[0],
        ) as typeof prepared;
      }

      let playbacks: StemPlayback[] = prepared.map((s) => ({
        name: s.name,
        role: s.role,
        instrumentHint: s.instrumentHint,
        midiEvents: s.midiEvents,
        expression: s.expression as StemPlayback["expression"],
        muted: s.muted,
        soloed: s.soloed,
        pan: s.pan,
        gainDb: s.gainDb,
      }));

      if (meend && mode === "ensemble") {
        const accents = buildOrchestralMeendAccentPlaybacks(
          prepared.map((s) => ({
            name: s.name,
            role: s.role,
            instrumentHint: s.instrumentHint,
            midiEvents: s.midiEvents,
            pan: s.pan,
          })),
        );
        if (accents.length > 0) {
          playbacks = playbacks.map((p) =>
            accents.some((a) => meendAccentSourceName(a.name) === p.name)
              ? { ...p, gainDb: (p.gainDb || 0) - 2 }
              : p,
          );
          playbacks.push(...accents);
        }
      }

      if (meend && mode !== "ensemble") {
        const accents = buildMeendAccentPlaybacks(
          prepared.map((s) => ({
            name: s.name,
            role: s.role,
            instrumentHint: s.instrumentHint,
            midiEvents: s.midiEvents,
            pan: s.pan,
          })),
        );
        if (accents.length > 0) {
          const accented = new Set(
            accents
              .map((a) => meendAccentSourceName(a.name))
              .filter((n): n is string => Boolean(n)),
          );
          playbacks = playbacks.map((p) =>
            accented.has(p.name) ? { ...p, gainDb: (p.gainDb || 0) - 1 } : p,
          );
          playbacks.push(...accents);
        }
      }

      return playbacks;
    },
    [meend, manualTempo, effectiveAnalysis?.bpm, analysis?.bpm, mode],
  );

  const buildEngineSoloState = useCallback(
    (currentStems: StemData[]) => {
      const base = currentStems.map((s) => ({
        name: s.name,
        soloed: s.soloed,
        muted: s.muted,
        gainDb: s.gainDb,
      }));
      if (!meend || mode === "ensemble") {
        if (meend && mode === "ensemble") {
          const accents = buildOrchestralMeendAccentPlaybacks(
            currentStems.map((s) => ({
              name: s.name,
              role: s.role,
              instrumentHint: s.instrumentHint,
              midiEvents: normalizeMidiEvents(s.midiEvents),
              pan: s.pan,
            })),
          );
          if (accents.length > 0) {
            return [
              ...base,
              ...accents.map((a) => ({
                name: a.name,
                soloed: false,
                muted: false,
                gainDb: a.gainDb,
              })),
            ];
          }
        }
        return base;
      }
      const accents = buildMeendAccentPlaybacks(
        currentStems.map((s) => ({
          name: s.name,
          role: s.role,
          instrumentHint: s.instrumentHint,
          midiEvents: normalizeMidiEvents(s.midiEvents),
          pan: s.pan,
        })),
      );
      if (accents.length === 0) return base;
      const anySoloed = currentStems.some((s) => s.soloed);
      const accentStates = accents.map((accent) => {
        const sourceName = meendAccentSourceName(accent.name);
        const source = sourceName ? currentStems.find((s) => s.name === sourceName) : undefined;
        return {
          name: accent.name,
          soloed: false,
          muted: Boolean(source?.muted) || (anySoloed && !source?.soloed),
          gainDb: accent.gainDb,
        };
      });
      return [...base, ...accentStates];
    },
    [meend, manualTempo, effectiveAnalysis?.bpm, analysis?.bpm, mode],
  );

  const loadStemsIntoEngine = useCallback(
    async (currentStems: StemData[], bpm: number, opts?: { skipWarmUp?: boolean }) => {
      const loadGen = ++engineLoadGenRef.current;
      setIsPlaying(false);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      try {
        getSoundEngine().pause();
      } catch {
        /* engine may not be loaded yet */
      }
      const tempo = bpm > 0 ? bpm : 120;
      const engine = getSoundEngine();
      try {
        await engine.warmUpForPlayback({ skipWarmUp: opts?.skipWarmUp });
        engine.init();
        engine.setBpm(tempo);
        await engine.loadStems(buildStemPlaybacks(currentStems), { forceMeend: meend });
        if (loadGen !== engineLoadGenRef.current) return;
        engine.setMasterVolume(masterVolume);
        engine.applySoloState(buildEngineSoloState(currentStems));

        const engineDur = engine.getDuration();
        const importDur = resolveImportDurationSec();
        const stemDur = stemTimelineDurationSec(currentStems, tempo);
        audioImportCapSecRef.current = importDur;
        importDurationSecRef.current = Math.max(importDur > 0 ? importDur : 0, stemDur, engineDur);
        setPlaybackDuration(resolvePlaybackDurationSec(engineDur, importDur, stemDur));
        setEngineReady(true);
        setErrorMsg("");
      } catch (err) {
        console.error("Stem engine load failed:", err);
        engineStemsKeyRef.current = "";
        setEngineReady(false);
        throw err;
      }
    },
    [buildStemPlaybacks, buildEngineSoloState, resolveImportDurationSec, masterVolume, meend, mode],
  );

  const stemsPlaybackKey = useCallback(
    (currentStems: StemData[], bpm: number) =>
      `${bpm}|meend:${meend ? 1 : 0}|swing:${swingAmount}|${currentStems.map((s) => `${s.id}:${s.muted}:${s.soloed}:${s.pan}:${s.gainDb}`).join(";")}`,
    [meend, swingAmount],
  );

  useEffect(() => {
    if (stems.length === 0) {
      setEngineReady(false);
      setEngineLoading(false);
      engineStemsKeyRef.current = "";
      return;
    }
    const baseBpm =
      manualTempo ??
      effectiveAnalysis?.bpm ??
      analysis?.bpm ??
      (mode === "composition" ? FALLBACK_ANALYSIS.bpm : 120);
    if (baseBpm == null || baseBpm <= 0) return;

    const tempo = baseBpm;
    const importDur = resolveImportDurationSec();
    const stemDur = stemTimelineDurationSec(stems, tempo);
    audioImportCapSecRef.current = importDur;
    importDurationSecRef.current = Math.max(importDur > 0 ? importDur : 0, stemDur);
    setPlaybackDuration(resolvePlaybackDurationSec(0, importDur, stemDur));

    const hasNotes = stems.some((s) => normalizeMidiEvents(s.midiEvents).length > 0);
    setEngineReady(hasNotes);
    engineStemsKeyRef.current = "";
    if (!hasNotes) {
      setErrorMsg("Generated stems have no MIDI notes. Try generating again.");
    }
  }, [stems, effectiveAnalysis?.bpm, analysis?.bpm, manualTempo, mode, resolveImportDurationSec]);

  useEffect(() => {
    if (!meend || stems.length === 0) return;
    const baseBpm =
      manualTempo ??
      effectiveAnalysis?.bpm ??
      analysis?.bpm ??
      (mode === "composition" ? FALLBACK_ANALYSIS.bpm : 120);
    if (baseBpm == null || baseBpm <= 0) return;
    const hasNotes = stems.some((s) => normalizeMidiEvents(s.midiEvents).length > 0);
    if (!hasNotes) return;

    const tempo = baseBpm;
    let cancelled = false;
    setEngineLoading(true);
    void loadStemsIntoEngine(stems, tempo, { skipWarmUp: true })
      .then(() => {
        if (cancelled) return;
        engineStemsKeyRef.current = stemsPlaybackKey(stems, tempo);
      })
      .catch((err) => {
        if (!cancelled) console.error("Meend preload failed:", err);
      })
      .finally(() => {
        if (!cancelled) setEngineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    meend,
    stems,
    manualTempo,
    effectiveAnalysis?.bpm,
    analysis?.bpm,
    mode,
    loadStemsIntoEngine,
    stemsPlaybackKey,
  ]);

  useEffect(() => {
    if (!engineStemsKeyRef.current) return;
    const engine = getSoundEngine();
    engine.applySoloState(buildEngineSoloState(stems));
  }, [stems, buildEngineSoloState]);

  const stopPositionTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startPositionTracking = useCallback(() => {
    const update = () => {
      const engine = getSoundEngine();
      const cap = Math.max(importDurationSecRef.current, engine.getDuration(), playbackDuration);
      let pos = engine.getPosition();
      if (cap > 0 && pos >= cap - 0.02) {
        engine.pause();
        engine.seek(cap);
        setPlaybackPos(cap);
        stopPositionTracking();
        setIsPlaying(false);
        return;
      }
      setPlaybackPos(pos);
      if (engine.getPlayState()) {
        animFrameRef.current = requestAnimationFrame(update);
      }
    };
    animFrameRef.current = requestAnimationFrame(update);
  }, [stopPositionTracking, playbackDuration]);

  const pauseInputAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsInputPlaying(false);
  }, []);

  const pauseComposition = useCallback(() => {
    try {
      getSoundEngine().pause();
    } catch {
      /* engine may not be loaded */
    }
    stopPositionTracking();
    setIsPlaying(false);
  }, [stopPositionTracking]);

  const toggleInputPlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;
    if (isInputPlaying) {
      pauseInputAudio();
      return;
    }
    pauseComposition();
    try {
      await audioRef.current.play();
      setIsInputPlaying(true);
    } catch (err) {
      console.error("Input audio playback blocked:", err);
    }
  }, [audioUrl, isInputPlaying, pauseInputAudio, pauseComposition]);

  const toggleCompositionPlay = useCallback(async () => {
    if (stems.length === 0 || !engineReady) return;
    const engine = getSoundEngine();
    if (isPlaying) {
      pauseComposition();
      return;
    }
    pauseInputAudio();
    const tempo =
      manualTempo ??
      effectiveAnalysis?.bpm ??
      analysis?.bpm ??
      (mode === "composition" ? FALLBACK_ANALYSIS.bpm : 120);
    const playbackKey = stemsPlaybackKey(stems, tempo);
    setEngineLoading(true);
    try {
      const needsReload = engineStemsKeyRef.current !== playbackKey || !engine.hasStems();
      if (needsReload) {
        await loadStemsIntoEngine(stems, tempo);
        engineStemsKeyRef.current = playbackKey;
      }
      engine.setMasterVolume(masterVolume);
      await engine.play();
      startPositionTracking();
      setIsPlaying(true);
    } catch (err) {
      console.error("Composition playback failed:", err);
      engineStemsKeyRef.current = "";
      const playable = stems.filter((s) => normalizeMidiEvents(s.midiEvents).length > 0);
      setErrorMsg(
        playable.length === 0
          ? "Generated stems have no MIDI notes. Try generating again."
          : "Synth preview failed to start. Tap play again.",
      );
      alert(
        playable.length === 0
          ? "Generated stems have no MIDI notes. Try generating again."
          : "Synth preview failed to start. Tap play again.",
      );
    } finally {
      setEngineLoading(false);
    }
  }, [
    isPlaying,
    stems,
    stems.length,
    engineReady,
    manualTempo,
    effectiveAnalysis?.bpm,
    analysis?.bpm,
    mode,
    masterVolume,
    pauseComposition,
    pauseInputAudio,
    startPositionTracking,
    loadStemsIntoEngine,
    stemsPlaybackKey,
  ]);

  const stopPlayback = useCallback(() => {
    const engine = getSoundEngine();
    engine.stop();
    stopPositionTracking();
    setIsPlaying(false);
    setPlaybackPos(0);
  }, [stopPositionTracking]);

  const handleRenderWav = useCallback(async () => {
    if (stems.length === 0) return;
    setIsRendering(true);
    try {
      const engine = getSoundEngine();
      const playbacks = buildStemPlaybacks(stems);
      const anySoloed = stems.some((s) => s.soloed);
      const filteredPlaybacks = playbacks.map((p) => {
        const stem = stems.find((s) => s.name === p.name);
        if (!stem) return p;
        if (anySoloed && !stem.soloed) return { ...p, muted: true };
        return p;
      });
      const blob = await engine.renderOffline(filteredPlaybacks, playbackDuration || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `svivva-play_${mode}_seed-${seed}_${new Date().toISOString().slice(0, 10)}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("WAV render failed:", err);
      setErrorMsg("WAV rendering failed. Try again.");
    } finally {
      setIsRendering(false);
    }
  }, [stems, buildStemPlaybacks, playbackDuration, mode, seed]);

  const clearAudio = useCallback(() => {
    setAudioFile(null);
    setAudioUrl(null);
    setAudioName("");
    setAnalysis(null);
    setTranscription(null);
    setMidiRawNotes([]);
    setMidiReferenceNotes([]);
    setAlignOffsetSec(0);
    setAlignScore(0);
    setMidiFileName("");
    setIsTranscribing(false);
    setManualTempo(null);
    setManualKey(null);
    setAudioAnchorKey(null);
    setStems([]);
    setPatchResult(null);
    setPlanInfo(null);
    setSessionId(null);
    setIsPlaying(false);
    setIsInputPlaying(false);
    setErrorMsg("");
    setWarningMsg("");
    setEngineReady(false);
    setEngineLoading(false);
    engineStemsKeyRef.current = "";
    engineLoadGenRef.current += 1;
    setPlaybackPos(0);
    setPlaybackDuration(0);
    stopPositionTracking();
    try {
      getSoundEngine().dispose();
    } catch {}
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [stopPositionTracking]);

  useEffect(() => {
    return () => {
      stopPositionTracking();
      try {
        getSoundEngine().dispose();
      } catch {}
    };
  }, [stopPositionTracking]);

  const handleGenerateNeuralPrompt = useCallback(async () => {
    if (!analysis || stems.length === 0) return;
    setIsGeneratingPrompt(true);
    setNeuralPromptResult(null);
    try {
      const res = await fetch("/api/svivva-play/neural-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: {
            bpm: manualTempo ?? analysis.bpm,
            key: manualKey ?? analysis.key,
            timeSignature: analysis.timeSignature,
            chords: analysis.chords?.slice(0, 16),
            sections: analysis.sections,
          },
          stems: stems.map((s) => ({
            name: s.name,
            role: s.role,
            instrumentHint: s.instrumentHint,
            midiEvents: (s.midiEvents || []).slice(0, 20),
          })),
          mode,
          style: selectedPreset,
          config: {
            genre: neuralGenre || undefined,
            mood: neuralMood || undefined,
            energy: neuralEnergy,
            quality: neuralQuality,
            promptProfile:
              neuralPromptProfile === "orchestral" || isOrchestralPreset(selectedPreset)
                ? "orchestral"
                : "standard",
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setNeuralPromptResult(data);
      }
    } catch {
      setErrorMsg("Neural prompt generation failed.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [
    analysis,
    stems,
    mode,
    selectedPreset,
    neuralGenre,
    neuralMood,
    neuralEnergy,
    neuralQuality,
    neuralPromptProfile,
    manualKey,
    manualTempo,
  ]);

  useEffect(() => {
    if (!isOrchestralPreset(selectedPreset)) return;
    setNeuralPromptProfile("orchestral");
    setNeuralGenre((g) => g || "contemporary orchestral");
    setNeuralMood((m) => m || "fragile, hypnotic, unresolved");
    setUserPrompt(
      (p) =>
        p ||
        "Reich phasing + Shaw fragile modernism. Hyper-real stems, humanized MIDI, no trailer clichés.",
    );
  }, [selectedPreset]);

  const copyNeuralPrompt = useCallback(() => {
    if (!neuralPromptResult) return;
    navigator.clipboard.writeText(neuralPromptResult.prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }, [neuralPromptResult]);

  useEffect(() => {
    setSelectedPreset(STYLE_PRESETS[mode][0]?.id || "");
    setStems([]);
    setPatchResult(null);
    setPlanInfo(null);
    setPipelineStage("");
    setErrorMsg("");
    setIsPlaying(false);
    setPlaybackPos(0);
    setPlaybackDuration(0);
    setEngineReady(false);
    setEngineLoading(false);
    engineStemsKeyRef.current = "";
    engineLoadGenRef.current += 1;
    setVersionHistory([]);
    setActiveVersion(0);
    setSoloTakes([]);
    setActiveTake(0);
    setLockedStems(new Set());
    setChordEdits({});
    setEditingChord(null);
    setGenerationId(null);
    setRegeneratingStem(null);
    setShowSettings(false);
    setShowChordEditor(false);
    setShowNeuralPanel(false);
    setNeuralPromptResult(null);
    stopPositionTracking();
    try {
      getSoundEngine().stop();
      getSoundEngine().dispose();
    } catch {}
  }, [mode, stopPositionTracking]);

  useEffect(() => {
    const keySrc = analysis ?? compositionFallback;
    if (!keySrc) return;
    const keyStr = manualKey ?? keySrc.key;
    const rootMatch = keyStr.match(/^([A-G][b#]?)/);
    if (rootMatch) setChordRoot(rootMatch[1]);
  }, [analysis, compositionFallback, manualKey]);

  const prevMeendRef = useRef(false);
  useEffect(() => {
    prevMeendRef.current = meend;
  }, [meend]);

  const handleLocalCompositionGenerate = useCallback(() => {
    setIsGenerating(true);
    setPipelineStage(
      transcription
        ? "Strategic compose — voice-leading from your audio + chord map…"
        : "Composing locally…",
    );
    setStems([]);
    setErrorMsg("");
    setReichVoices([]);
    try {
      const lockedKey = generationKeyLabel;
      const currentSeed = stableGenerationSeed({
        useSeed,
        seed,
        lockedKey,
        importSeq,
      });
      if (!useSeed) setSeed(currentSeed);
      const effectiveScaleName = resolveMeendScaleName({
        lockedKey,
        reichScale,
        seed: currentSeed,
        meend,
      });
      const bpm = manualTempo ?? analysis?.bpm ?? 120;
      const audioSampleSec =
        audioRef.current?.duration && Number.isFinite(audioRef.current.duration)
          ? audioRef.current.duration
          : 0;
      const durationSec = audioSampleSec
        ? barAlignedDurationAtMostSec(audioSampleSec, bpm)
        : barAlignedDurationSec(transcription?.durationSec || reichDuration, bpm);
      const chordSourceRaw =
        (analysis?.chords?.length ? analysis.chords : transcription?.chords)?.map((c, i) => ({
          t0: c.t0,
          t1: c.t1,
          symbol: chordEdits[i] ?? c.symbol,
          confidence: ("confidence" in c ? c.confidence : 55) ?? 55,
          pitchClasses: "pitchClasses" in c ? (c.pitchClasses as number[]) : [],
        })) ?? [];
      const chordSource = stabilizeHarmonicTimeline(chordSourceRaw, durationSec, bpm);
      const { resolution: scale, scaleInfo } = resolveCompositionScale(
        lockedKey,
        effectiveScaleName,
        manualKey,
        chordSource,
      );
      const anchorMidi = melodicAnchorMidi(transcription?.melodyneNotes ?? []);

      const harmonicCtx = transcription
        ? {
            chords: chordSource,
            audioNotes: [],
            melodyneNotes: transcription.melodyneNotes ?? [],
            durationSec,
            sources: transcription.sources,
            melodyneMixOnly: Boolean(transcription.sources?.melodyneMidi),
          }
        : null;

      const voices =
        harmonicCtx && chordSource.length >= 1
          ? composeStrategicReich({
              durationSec,
              bpm,
              scale,
              style: reichStyle,
              seed: currentSeed,
              type: reichType,
              ctx: harmonicCtx,
              hocketGroove: reichType === "hocket" ? hocketGroove : undefined,
              patternLength,
            })
          : chordSource.length >= 1
            ? composeWithChordProgression({
                durationSec,
                bpm,
                scale,
                style: reichStyle,
                seed: currentSeed,
                type: reichType,
                chords: chordSource,
                melodyneNotes: transcription?.melodyneNotes ?? [],
                audioNotes: transcription?.audioNotes ?? transcription?.notes ?? [],
                hocketGroove: reichType === "hocket" ? hocketGroove : undefined,
                patternLength,
              })
            : reichType === "counterpoint"
              ? composeCounterpoint({
                  durationSec,
                  bpm,
                  scale,
                  style: reichStyle,
                  seed: currentSeed,
                  patternLength,
                })
              : composeHocket({
                  durationSec,
                  bpm,
                  scale,
                  style: reichStyle,
                  seed: currentSeed,
                  hocketGroove: reichType === "hocket" ? hocketGroove : undefined,
                  patternLength,
                });
      setReichVoices(voices);

      const hintRot =
        reichType === "hocket"
          ? ["vibraphone", "marimba", "piano", "rhodes", "vibraphone", "marimba"]
          : ["piano", "vibraphone", "marimba"];
      let rawStems: StemData[] = voices.map((v, i) => {
        const midiEvents = v.notes.map((n) => ({
          note: n.note,
          velocity: n.velocity,
          startBeat: n.startBeat,
          duration: n.duration,
        }));

        return {
          id: `voice-${i}`,
          name: v.name,
          role: reichType === "hocket" ? "hocket" : i === 0 ? "melody" : "harmony",
          register: reichType === "hocket" ? "mid" : i < 2 ? "mid" : "high",
          instrumentHint: hintRot[i % hintRot.length],
          muted: false,
          soloed: false,
          pan: Math.round((i / Math.max(voices.length - 1, 1)) * 200 - 100),
          gainDb: 0,
          midiEvents,
          expression: {},
          articulations: [],
          qualityTier: "professional",
        };
      });
      if (meend && rawStems.length > 0) {
        rawStems = applyMeendToStems(
          rawStems as Parameters<typeof applyMeendToStems>[0],
        ) as typeof rawStems;
      }
      let newStems = constrainGeneratedStems(
        rawStems as unknown as Parameters<typeof constrainGeneratedStems>[0],
        lockedKey,
        chordSource,
        bpm,
        {
          anchorMidi: reichType === "hocket" ? undefined : anchorMidi,
          scaleInfo,
        },
      ) as unknown as StemData[];
      newStems = applyPlayDynamicsToStems(
        newStems.map((s) => ({ ...s, midiEvents: normalizeMidiEvents(s.midiEvents) })),
        bpm,
        { strength: 0.38, phraseBeats: 16 },
      ) as unknown as StemData[];
      const swingAmt = Math.max(0, Math.min(1, swingAmount / 100));
      if (swingAmt > 0) {
        newStems = applySwingToStems(
          newStems.map((s) => ({ ...s, midiEvents: normalizeMidiEvents(s.midiEvents) })),
          bpm,
          swingAmt,
        ) as unknown as StemData[];
      }
      setStems(newStems);
      setPipelineStage("Complete");
      setVersionHistory((prev) => {
        const labelPrefix = reichType === "counterpoint" ? "Counterpoint" : "Hocket";
        const ver = {
          id: String(Date.now()),
          seed: currentSeed,
          stemsCount: newStems.length,
          timestamp: Date.now(),
          label: `${labelPrefix} v${prev.length + 1}`,
          stems: newStems,
          plan: null,
          patch: null,
        };
        const next = [...prev, ver];
        setActiveVersion(next.length - 1);
        return next;
      });
    } catch (err) {
      setErrorMsg(
        "Composition generation failed: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    analysis,
    generationKeyLabel,
    manualTempo,
    reichScale,
    reichType,
    reichStyle,
    reichDuration,
    seed,
    useSeed,
    meend,
    transcription,
    chordEdits,
    importSeq,
    aiScaleSuggestion,
    scaleSuggestionApplied,
    applyAiScaleSuggestion,
    swingAmount,
    hocketGroove,
    patternLength,
  ]);

  useEffect(() => {
    if (stems.length > 0) pauseInputAudio();
  }, [stems.length, pauseInputAudio]);

  useEffect(() => {
    if (!audioUrl) return;
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || !isInputPlaying) return;
      const cap = audioImportCapSecRef.current || playbackDuration;
      const t = cap > 0 ? Math.min(audio.currentTime, cap) : audio.currentTime;
      setStagePlaybackSec(t);
      if (cap > 0 && audio.currentTime >= cap - 0.05) {
        audio.pause();
        audio.currentTime = cap;
        setStagePlaybackSec(cap);
        setIsInputPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    if (isInputPlaying) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInputPlaying, audioUrl, playbackDuration]);

  const ModeIcon = MODE_CONFIG[mode].icon;

  const renderModeSettings = () => {
    switch (mode) {
      case "composition":
        return (
          <div className="space-y-3">
            <SliderControl label="Density" value={density} onChange={setDensity} />
            <SliderControl label="Complexity" value={complexity} onChange={setComplexity} />
            <div className="flex items-center gap-4">
              <RadioOption
                label="Match Harmony"
                checked={harmonyMode === "match"}
                onChange={() => setHarmonyMode("match")}
              />
              <RadioOption
                label="Reharmonize"
                checked={harmonyMode === "reharmonize"}
                onChange={() => setHarmonyMode("reharmonize")}
              />
            </div>
            <CheckboxOption
              label="Indian Meend (continuous pitch bend)"
              checked={meend}
              onChange={setMeend}
            />
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Repeating pattern length
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(
                  [
                    ["standard", "Standard (12/24)"],
                    ["extended", "Extended (24/48)"],
                    ["long", "Long (36/72)"],
                  ] as const
                ).map(([v, label]) => (
                  <RadioOption
                    key={v}
                    label={label}
                    checked={patternLength === v}
                    onChange={() => setPatternLength(v)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case "ensemble":
        return (
          <div className="space-y-3">
            <SliderControl label="Density" value={density} onChange={setDensity} />
            <SliderControl label="Complexity" value={complexity} onChange={setComplexity} />
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Repeating pattern length
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(
                  [
                    ["standard", "Standard"],
                    ["extended", "Extended"],
                    ["long", "Long"],
                  ] as const
                ).map(([v, label]) => (
                  <RadioOption
                    key={v}
                    label={label}
                    checked={patternLength === v}
                    onChange={() => setPatternLength(v)}
                  />
                ))}
              </div>
            </div>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              Three orchestral presets only. Stems map to Ableton Orchestral — assign Violin, Viola,
              Cello, Contrabass, Harp, Flute, Oboe, Timpani per track name.
            </p>
            <CheckboxOption
              label="Indian Meend — off by default (Violin 1, Solo Violin, Flute, Oboe only)"
              checked={meend}
              onChange={setMeend}
            />
            {meend && (
              <p className="text-[9px] text-gray-500 mt-1">
                Pitch bends on lyrical stems only — preview and MIDI export.
              </p>
            )}
            <div className="flex items-center gap-4">
              <RadioOption
                label="Match Harmony"
                checked={harmonyMode === "match"}
                onChange={() => setHarmonyMode("match")}
              />
              <RadioOption
                label="Reharmonize"
                checked={harmonyMode === "reharmonize"}
                onChange={() => setHarmonyMode("reharmonize")}
              />
            </div>
          </div>
        );
      case "chords":
        return (
          <div className="space-y-3">
            <SliderControl label="Tension" value={tension} onChange={setTension} />
            <SliderControl
              label="Root Movement (stable \u2194 adventurous)"
              value={rootMovement}
              onChange={setRootMovement}
            />
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Voice Leading
              </label>
              <div className="flex items-center gap-3 mt-1">
                {(["smooth", "moderate", "jumpy"] as const).map((v) => (
                  <RadioOption
                    key={v}
                    label={v.charAt(0).toUpperCase() + v.slice(1)}
                    checked={voiceLeading === v}
                    onChange={() => setVoiceLeading(v)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Comping Pattern
              </label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {["sustained_pads", "rhythmic_stabs", "arpeggiated", "guitar_like"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setCompingPattern(p)}
                    className={`text-[10px] px-2 py-1.5 rounded border transition-colors ${compingPattern === p ? "border-[#A05068] bg-[#A05068]/5 holo-text" : "border-gray-700 text-gray-500"}`}
                    data-testid={`button-comping-${p}`}
                  >
                    {p.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <CheckboxOption
              label="Meend (usually off for chords)"
              checked={meend}
              onChange={setMeend}
            />
          </div>
        );
      case "solo":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Solo Type
              </label>
              <div className="flex items-center gap-3 mt-1">
                {[
                  { v: "instrument", l: "Instrument" },
                  { v: "vocal_scat", l: "Vocal Scat" },
                  { v: "harmony_solo", l: "Harmony Solo" },
                ].map((t) => (
                  <RadioOption
                    key={t.v}
                    label={t.l}
                    checked={soloType === t.v}
                    onChange={() => setSoloType(t.v)}
                  />
                ))}
              </div>
              {soloType === "vocal_scat" && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600">
                    Audio preview for vocal scat is BETA quality
                  </span>
                </div>
              )}
            </div>
            <SliderControl label="Risk (inside \u2194 outside)" value={risk} onChange={setRisk} />
            <SliderControl label="Density" value={density} onChange={setDensity} />
            <CheckboxOption
              label="Call-and-Response"
              checked={callResponse}
              onChange={setCallResponse}
            />
            <CheckboxOption
              label="Meend (continuous pitch bend)"
              checked={meend}
              onChange={setMeend}
            />
          </div>
        );
      case "interpolation":
        return (
          <div className="space-y-3">
            <SliderControl
              label="Style Strength (0=original, 100=full transform)"
              value={styleStrength}
              onChange={setStyleStrength}
            />
            <CheckboxOption
              label="Keep Original Harmony"
              checked={keepHarmony}
              onChange={setKeepHarmony}
            />
            <SliderControl label="Density" value={density} onChange={setDensity} />
          </div>
        );
      case "patch":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Synth Family
              </label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {["subtractive", "fm", "wavetable", "granular"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSynthFamily(f)}
                    className={`text-[10px] px-2 py-1.5 rounded border transition-colors ${synthFamily === f ? "border-[#A05068] bg-[#A05068]/5 holo-text" : "border-gray-700 text-gray-500"}`}
                    data-testid={`button-synth-${f}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl
              label="Brightness"
              value={Math.round(macroBrightness * 100)}
              onChange={(v) => setMacroBrightness(v / 100)}
            />
            <SliderControl
              label="Movement"
              value={Math.round(macroMovement * 100)}
              onChange={(v) => setMacroMovement(v / 100)}
            />
            <SliderControl
              label="Bite"
              value={Math.round(macroBite * 100)}
              onChange={(v) => setMacroBite(v / 100)}
            />
            <SliderControl
              label="Space"
              value={Math.round(macroSpace * 100)}
              onChange={(v) => setMacroSpace(v / 100)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const acknowledgeBeta = useCallback(() => {
    try {
      window.localStorage.setItem("svivva-play-beta-ack", "1");
    } catch {
      /* private mode */
    }
    setBetaAcknowledged(true);
  }, []);

  const handleCrateClick = useCallback(() => {
    if (crateState !== "closed") return;
    setCrateState("opening");
    setTimeout(() => setCrateState("open"), 1200);
  }, [crateState]);

  const playBetaBanner = (
    <div
      className="w-full shrink-0 border-b-2 border-amber-500 bg-amber-50 px-4 py-3 text-center"
      role="status"
      data-testid="banner-play-beta"
    >
      <p className="text-sm font-semibold text-amber-950">
        <span className="inline-block rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white mr-2 align-middle">
          BETA
        </span>
        Svivva Play is in beta — preview audio, meend, swing, and AI tools may change or fail.
        Exports may differ from what you hear in the browser.
      </p>
    </div>
  );

  if (crateState !== "open") {
    return (
      <div
        className="h-[100dvh] bg-white flex flex-col overflow-hidden"
        style={{ colorScheme: "light" }}
      >
        {playBetaBanner}
        {!betaAcknowledged ? (
          <div
            className="flex-1 flex flex-col items-center justify-center px-6 pb-8"
            data-testid="gate-play-beta"
          >
            <div className="max-w-lg w-full rounded-2xl border-2 border-amber-400 bg-white shadow-lg p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Svivva Play — Beta</h1>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                You are entering an experimental studio. Features break, shift, and improve often.
                If the page fails to load, refresh or try again later. MIDI export is the most
                reliable output; in-browser preview is best-effort only.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={acknowledgeBeta}
                data-testid="button-play-beta-ack"
              >
                I understand — continue to Svivva Play
              </Button>
              <Link
                href="/"
                className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-800 underline"
              >
                Back to Svivva home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className={`relative cursor-pointer select-none transition-transform duration-700 ${crateState === "opening" ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
              onClick={handleCrateClick}
              data-testid="button-crate-open"
            >
              <Image
                src={crateState === "opening" ? svivvaCrateOpen : svivvaCrateClosed}
                alt="Svivva Play"
                width={360}
                height={360}
                className={`object-contain transition-opacity duration-500 max-w-[60vw] max-h-[50dvh] w-auto h-auto ${crateState === "opening" ? "animate-pulse" : ""}`}
                priority
              />
              {crateState === "opening" && (
                <div className="absolute inset-0 flex items-end justify-center pb-4">
                  <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                    <span className="text-gray-500 text-xs font-medium tracking-wider">
                      Loading instrument...
                    </span>
                  </div>
                </div>
              )}
            </div>
            {crateState === "closed" && (
              <p className="mt-8 text-gray-500 text-xs tracking-widest uppercase animate-pulse">
                Tap to open
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col text-gray-900 relative bg-transparent overflow-x-hidden"
      style={{ colorScheme: "light" }}
      data-feature-page
    >
      <FeatureScrollToTop />
      <FeatureThreeBg variant="play" dramatic scope="page" />
      {playBetaBanner}
      <style>{`
        .holo-gradient {
          position: relative;
          overflow: hidden;
        }
        .holo-text {
          background:
            radial-gradient(circle at 20% 40%, rgba(255,255,255,0.9) 0%, transparent 2%),
            radial-gradient(circle at 65% 25%, rgba(255,250,245,0.85) 0%, transparent 1.5%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.8) 0%, transparent 2.5%),
            radial-gradient(circle at 40% 80%, rgba(255,248,240,0.75) 0%, transparent 1.8%),
            radial-gradient(circle at 10% 60%, rgba(255,255,255,0.7) 0%, transparent 1.2%),
            radial-gradient(circle at 90% 45%, rgba(255,252,248,0.65) 0%, transparent 2%),
            linear-gradient(135deg, #6B2C4A 0%, #A05068 10%, #8B4578 22%, #C48A8A 34%, #7E5090 46%, #B87888 56%, #6BBFBF 68%, #9E6DA0 78%, #6B2C4A 88%, #A05068 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 300%;
          animation: holo-text-sparkle 5s ease infinite;
        }
        @keyframes holo-text-sparkle {
          0% { background-position: 0% 0%; }
          25% { background-position: 100% 30%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 100% 50%; }
          100% { background-position: 0% 0%; }
        }
        .holo-icon {
          display: inline-flex;
        }
        .holo-icon svg path,
        .holo-icon svg line,
        .holo-icon svg circle,
        .holo-icon svg polyline,
        .holo-icon svg rect,
        .holo-icon svg polygon {
          stroke: url(#holo-icon-grad) !important;
        }
      `}</style>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="holo-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B2C4A" />
            <stop offset="12%" stopColor="#A05068" />
            <stop offset="24%" stopColor="#8B4578" />
            <stop offset="36%" stopColor="#C48A8A" />
            <stop offset="48%" stopColor="#7E5090" />
            <stop offset="60%" stopColor="#B87888" />
            <stop offset="72%" stopColor="#6BBFBF" />
            <stop offset="84%" stopColor="#6B2C4A" />
            <stop offset="100%" stopColor="#A05068" />
          </linearGradient>
        </defs>
      </svg>
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/aac,audio/m4a,audio/flac,.mp3,.wav,.ogg,.m4a,.aac"
        className="hidden"
        onChange={handleAudioFileChange}
        data-testid="input-audio-file"
      />
      <input
        ref={melodyneInputRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        className="hidden"
        onChange={handleMelodyneFileChange}
        data-testid="input-melodyne-file"
      />
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={() => {
            const d = audioRef.current?.duration;
            if (!d || !Number.isFinite(d) || d <= 0) return;
            const bpm = manualTempo ?? analysis?.bpm ?? 120;
            const barDur = barAlignedDurationAtMostSec(d, bpm);
            setReichDuration(Math.round(barDur));
            importDurationSecRef.current = barDur;
            syncPlaybackDuration();
          }}
          onEnded={() => setIsInputPlaying(false)}
        />
      )}

      <nav className="h-11 sm:h-12 border-b border-gray-200 flex-shrink-0 z-50 bg-white">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/">
              <Image
                src={svivvaLogo}
                alt="Svivva"
                width={100}
                height={32}
                className="h-5 w-auto object-contain"
              />
            </Link>
            <span className="text-gray-300 hidden sm:inline">/</span>
            <span className="font-semibold text-gray-900 text-xs sm:text-sm">Play</span>
            <Badge className="bg-[#A05068]/10 text-[#B87888] text-[8px] sm:text-[9px] border-[#A05068]/30 hidden sm:flex">
              MIDI: Professional
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 text-[8px] sm:text-[9px] border-amber-200 hidden md:flex">
              Audio: Beta
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              onClick={() => scrollToMidiEvolution()}
              variant="outline"
              size="sm"
              className="gap-1 border-[#A05068]/40 text-[#A05068] text-[10px] sm:text-xs hover:bg-[#A05068]/5"
              data-testid="button-midi-evolution"
            >
              MIDI Evolution
            </Button>
            <Button
              onClick={() => setShowGuidedBuilder(true)}
              variant="outline"
              size="sm"
              className="gap-1 border-gray-300 text-gray-600 text-[10px] sm:text-xs hidden sm:flex hover:bg-gray-50"
              data-testid="button-guided-builder"
            >
              <Wand2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Guided Builder
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-gray-300 text-gray-600 text-[10px] sm:text-xs hover:bg-gray-50"
                data-testid="button-back-home"
              >
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <PlayCreativeTools />
          </div>

          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3 px-1">
            Studio — import &amp; generate stems
          </p>

          <div
            className="rounded-xl flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #2a2a2a, #1e1e1e)",
              border: "3px solid #3a3a3a",
            }}
          >
            <div
              className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 flex-shrink-0"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDropImport}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex-1 rounded-md px-3 py-1.5 sm:py-2 flex flex-col gap-1 min-w-0 transition-colors ${isDragOver ? "ring-2 ring-[#A05068]/60" : ""}`}
                  style={{
                    background: "linear-gradient(180deg, #111, #0a0a0a)",
                    boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.8)",
                    border: "2px solid #222",
                  }}
                >
                  {audioName ? (
                    <>
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 text-[9px] sm:text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-gray-500 uppercase tracking-wide flex-shrink-0 w-14">
                              Audio
                            </span>
                            <FileAudio className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span
                              className="font-mono text-gray-200 truncate"
                              data-testid="text-audio-name"
                            >
                              {audioName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-gray-500 uppercase tracking-wide flex-shrink-0 w-14">
                              Melodyne
                            </span>
                            <Piano className="w-3 h-3 text-[#5BA8A0] flex-shrink-0" />
                            <span
                              className={`font-mono truncate ${midiFileName ? "text-[#5BA8A0]" : "text-gray-600 italic"}`}
                              data-testid="text-melodyne-name"
                            >
                              {midiFileName || "Add .mid — harmonic tracks from Melodyne"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAnalyzing && (
                            <Badge className="bg-amber-900/30 text-amber-300 text-[8px] border-amber-700/40 py-0 animate-pulse">
                              Analyzing…
                            </Badge>
                          )}
                          {effectiveAnalysis && (
                            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                              <Badge className="bg-[#A05068]/20 text-[#B87888] text-[8px] border-[#A05068]/30 py-0">
                                {manualKey ?? effectiveAnalysis.key}
                              </Badge>
                              <Badge className="bg-gray-700/20 text-gray-300 text-[8px] border-gray-600/30 py-0">
                                {manualTempo ?? effectiveAnalysis.bpm} BPM
                              </Badge>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => void toggleInputPlay()}
                            disabled={!audioUrl}
                            className="p-1.5 rounded-md text-gray-200 disabled:opacity-30 transition-all active:translate-y-[1px]"
                            style={{
                              background: "linear-gradient(180deg, #444, #333)",
                              boxShadow:
                                "2px 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                              border: "2px solid #555",
                            }}
                            title="Play imported audio"
                            data-testid="button-input-play-pause"
                          >
                            {isInputPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={clearAudio}
                            className="text-gray-500 hover:text-gray-400"
                            data-testid="button-clear-audio"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-[1px] w-full h-6"
                        data-testid="audio-waveform"
                      >
                        {Array.from({ length: 150 }).map((_, i) => {
                          const h = Math.abs(
                            Math.sin(i * 0.25 + 0.3) * 0.7 +
                              Math.cos(i * 0.55 + 1.2) * 0.4 +
                              Math.sin(i * 0.9 + 2) * 0.25,
                          );
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-[1px] bg-[#A05068]"
                              style={{
                                height: `${Math.max(8, h * 100)}%`,
                                opacity: 0.35 + h * 0.55,
                                animation: isInputPlaying
                                  ? `waveformPulse 0.6s ease-in-out ${i * 0.015}s infinite alternate`
                                  : "none",
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-gray-500 italic">
                      No audio imported
                    </span>
                  )}
                </div>
                <button
                  onClick={handleImportAudio}
                  className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-200 flex-shrink-0 transition-all active:translate-y-[1px]"
                  style={{
                    background: "linear-gradient(180deg, #444, #333)",
                    boxShadow: "2px 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                    border: "2px solid #555",
                  }}
                  data-testid="button-import-audio"
                  title="Your mix or bounce (MP3, WAV, etc.)"
                >
                  <Upload className="w-3.5 h-3.5" /> Audio
                </button>
                <button
                  onClick={handleImportMelodyne}
                  className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-200 flex-shrink-0 transition-all"
                  style={{
                    background: "linear-gradient(180deg, #2a3a38, #1e2a28)",
                    border: "2px solid #3a5550",
                  }}
                  data-testid="button-import-melodyne"
                  title={
                    midiFileName ||
                    "Matching Melodyne export (.mid) — import audio first, then add this file"
                  }
                >
                  <Piano className="w-3.5 h-3.5" /> Melodyne MIDI
                </button>
                {transcription?.melodyneNotes?.length ? (
                  <button
                    type="button"
                    onClick={() => void handleDownloadMelodyneMidi()}
                    className="flex items-center gap-1 px-2 py-2 sm:py-2.5 rounded-md text-[10px] sm:text-xs font-semibold text-[#5BA8A0] flex-shrink-0 border border-[#3a5550] hover:bg-[#1e2a28]"
                    title="Download aligned Melodyne as STEM pack (.zip)"
                    data-testid="button-download-melodyne-midi"
                  >
                    <Download className="w-3 h-3" />
                    .mid
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row px-3 sm:px-5 pb-2 sm:pb-3 gap-3">
              <div
                className="flex-1 min-w-0 flex flex-col rounded-lg overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, #111, #0a0a0a)",
                  boxShadow:
                    "inset 3px 3px 10px rgba(0,0,0,0.7), inset -1px -1px 4px rgba(255,255,255,0.03)",
                  border: "2px solid #222",
                }}
              >
                <div className="border-b border-gray-700/50 px-2 sm:px-3 flex-shrink-0">
                  <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                    {(Object.keys(MODE_CONFIG) as PlayMode[]).map((m) => {
                      const cfg = MODE_CONFIG[m];
                      const Icon = cfg.icon;
                      const isActive = mode === m;
                      const isComingSoon = COMING_SOON_MODES.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            if (!isComingSoon) setMode(m);
                          }}
                          className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            isComingSoon
                              ? "text-gray-600 cursor-not-allowed opacity-50"
                              : isActive
                                ? "text-[#B87888]"
                                : "text-gray-500 hover:text-gray-400"
                          }`}
                          disabled={isComingSoon}
                          data-testid={`button-mode-${m}`}
                        >
                          <span className={isActive && !isComingSoon ? "holo-icon" : ""}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span
                            className={`sm:hidden ${isActive && !isComingSoon ? "holo-text" : ""}`}
                          >
                            {cfg.shortLabel}
                          </span>
                          <span
                            className={`hidden sm:inline ${isActive && !isComingSoon ? "holo-text" : ""}`}
                          >
                            {cfg.label}
                          </span>
                          {isComingSoon && <Lock className="w-2.5 h-2.5 ml-0.5 text-gray-600" />}
                          {isActive && !isComingSoon && (
                            <span
                              className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full holo-gradient"
                              style={{
                                background:
                                  "linear-gradient(90deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                              }}
                            >
                              <HolographicNoise />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="m-2 sm:m-3 rounded-md flex-1 flex flex-col"
                  style={{
                    background: "#0a0a0a",
                    boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.5)",
                    border: "1px solid #1a1a1a",
                  }}
                >
                  {!audioFile && !isAnalyzing && stems.length === 0 && !patchResult && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                        <ModeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-1">
                        {MODE_CONFIG[mode].label}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-3 sm:mb-4">
                        {MODE_CONFIG[mode].description}
                      </p>

                      {mode !== "composition" && (
                        <div className="w-full max-w-lg mb-3 sm:mb-4">
                          <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Describe what you want to create... e.g. 'ethereal ambient pads with shimmering arpeggios in D minor'"
                            className="w-full border border-gray-700 rounded-lg p-2 sm:p-3 text-xs sm:text-sm resize-none h-16 sm:h-20 focus:outline-none focus:border-[#A05068] text-center text-gray-200 placeholder:text-gray-600 bg-[#1a1a1a]/50"
                            data-testid="input-prompt-home"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleImportAudio}
                        className="mb-3 px-5 py-2.5 rounded-lg border-2 border-dashed border-gray-600 hover:border-[#A05068] text-xs text-gray-400 hover:text-gray-200 transition-colors"
                        data-testid="button-drop-import"
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Import audio + optional Melodyne .mid
                        <span className="block text-[9px] text-gray-500 font-normal mt-1 normal-case tracking-normal">
                          Melodyne MIDI gives reliable key/chords. Audio-only key/tempo is
                          experimental — set Manual Overrides before composing.
                        </span>
                      </button>

                      <p className="text-[10px] text-gray-500 max-w-sm">
                        Use Audio and Melodyne MIDI buttons on the bar, or drag both files onto it.
                      </p>
                    </div>
                  )}

                  {audioFile && !effectiveAnalysis && !analysisBusy && !isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-200 mb-1">
                        Analysis Incomplete
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 max-w-sm">
                        {errorMsg ||
                          "Could not read tempo or key from this file. Try MP3/WAV, or a shorter clip."}
                      </p>
                      <button
                        onClick={handleImportAudio}
                        className="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-gray-200"
                        style={{
                          background: "linear-gradient(180deg, #444, #333)",
                          border: "2px solid #555",
                        }}
                      >
                        Try Another File
                      </button>
                    </div>
                  )}

                  {analysisBusy && !effectiveAnalysis && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <Loader2 className="w-10 h-10 text-[#B87888] animate-spin mb-4" />
                      <h3 className="text-lg font-semibold text-gray-200 mb-1">
                        {isTranscribing && melodyneFile
                          ? "Analyzing Audio + Melodyne"
                          : "Analyzing Audio"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Building harmonic session (pitch map + chords)…
                        <span className="block text-[11px] text-gray-500 mt-1">
                          Verify key and BPM under Manual Overrides — auto-detect without Melodyne
                          is not production-accurate.
                        </span>
                      </p>
                    </div>
                  )}

                  {warningMsg && !isAnalyzing && !isGenerating && (
                    <div className="mx-4 mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-300/90">{warningMsg}</p>
                    </div>
                  )}

                  {errorMsg && !isAnalyzing && !isGenerating && (
                    <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-400 font-medium">Error</p>
                        <p className="text-xs text-red-400/80 mt-0.5">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  {!isAnalyzing &&
                    effectiveAnalysis &&
                    stems.length === 0 &&
                    !patchResult &&
                    !isGenerating && (
                      <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto">
                        {isEnriching && (
                          <div className="mb-3 p-2.5 rounded-lg bg-[#A05068]/10 border border-[#A05068]/25 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-[#B87888] animate-spin flex-shrink-0" />
                            <p className="text-[11px] text-gray-400">
                              Saving session and refining chords in the background…
                            </p>
                          </div>
                        )}
                        {audioFile && (
                          <div className="mb-4">
                            <div className="mb-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void toggleInputPlay()}
                                disabled={!audioUrl}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold text-gray-200 disabled:opacity-40"
                                style={{
                                  background: "linear-gradient(180deg, #444, #333)",
                                  border: "2px solid #555",
                                }}
                                data-testid="button-input-play-stage"
                              >
                                {isInputPlaying ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                Play import
                              </button>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {transcription?.durationSec
                                  ? `${formatTime(stagePlaybackSec)} / ${formatTime(transcription.durationSec)}`
                                  : "Imported audio"}
                              </span>
                            </div>
                            <SvivvaPlayStagePanel
                              model={playStageModel}
                              waveformPeaks={transcription?.waveformPeaks ?? []}
                              audioNotes={transcription?.audioNotes ?? transcription?.notes ?? []}
                              midiNotes={midiReferenceNotes}
                              chords={transcription?.chords ?? []}
                              durationSec={transcription?.durationSec ?? 0}
                              bpm={manualTempo ?? effectiveAnalysis?.bpm ?? 120}
                              playbackSec={stagePlaybackSec}
                              alignOffsetSec={alignOffsetSec}
                              alignScore={alignScore}
                              onAlignOffsetChange={handleAlignOffsetChange}
                              isTranscribing={isTranscribing || isAnalyzing}
                              audioName={audioName}
                              hasMelodyne={Boolean(transcription?.sources.melodyneMidi)}
                              hasAudioTrack={Boolean(transcription?.sources.audioTranscription)}
                            />
                          </div>
                        )}
                        <div className="mb-5">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Analysis
                          </h3>
                          {audioFile && analysis && (
                            <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                              Combined harmonic model: audio pitch track + Melodyne MIDI (when
                              provided). Chords prefer Melodyne harmony; composition follows the
                              merged progression.
                            </p>
                          )}
                          {transcription?.sources && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {transcription.sources.audioTranscription && (
                                <Badge className="bg-[#A05068]/15 text-[#B87888] text-[8px] border-[#A05068]/30">
                                  Audio pitch map
                                </Badge>
                              )}
                              {transcription.sources.melodyneMidi && (
                                <Badge className="bg-[#5BA8A0]/15 text-[#5BA8A0] text-[8px] border-[#5BA8A0]/30">
                                  Melodyne harmonics
                                </Badge>
                              )}
                              {!transcription.sources.melodyneMidi && (
                                <Badge
                                  variant="secondary"
                                  className="text-[8px] text-amber-400/90 border-amber-700/40"
                                >
                                  Add Melodyne .mid for full harmonic data
                                </Badge>
                              )}
                            </div>
                          )}
                          {!manualKey &&
                            !transcription?.sources?.melodyneMidi &&
                            effectiveAnalysis.keyConfidence < 65 && (
                              <div className="mb-3 p-2.5 rounded-lg bg-amber-900/20 border border-amber-700/30">
                                <p className="text-[11px] text-amber-300/90">
                                  Auto key/tempo without Melodyne MIDI is unreliable. Set Manual
                                  Overrides below before generating.
                                </p>
                              </div>
                            )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <AnalysisCard
                              label="Key"
                              value={manualKey ?? effectiveAnalysis.key}
                              sub={
                                manualKey
                                  ? "manual override"
                                  : effectiveAnalysis.keyConfidence >= 65
                                    ? `${effectiveAnalysis.keyConfidence}% confidence`
                                    : "estimate — set manually"
                              }
                              color="#A05068"
                            />
                            <AnalysisCard
                              label="BPM"
                              value={String(manualTempo ?? effectiveAnalysis.bpm)}
                              sub={
                                manualTempo
                                  ? "manual override"
                                  : transcription?.sources?.melodyneMidi
                                    ? "from MIDI"
                                    : "estimate — set manually"
                              }
                              color="#A05068"
                            />
                            <AnalysisCard
                              label="Time"
                              value={effectiveAnalysis.timeSignature}
                              sub="signature"
                              color="#555"
                            />
                            <AnalysisCard
                              label="Sections"
                              value={String(effectiveAnalysis.sections?.length || 0)}
                              sub="detected"
                              color="#555"
                            />
                          </div>
                        </div>

                        <div className="mb-5 p-3 rounded-lg bg-[#0a1a1a] border border-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Manual Overrides
                            </h3>
                            <span className="text-[9px] text-gray-500">
                              Recommended without Melodyne
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                Tempo (BPM)
                              </label>
                              <input
                                type="number"
                                min="30"
                                max="300"
                                value={manualTempo ?? effectiveAnalysis.bpm}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (!raw) {
                                    setManualTempo(null);
                                    return;
                                  }
                                  const n = parseInt(raw, 10);
                                  if (!Number.isNaN(n)) setManualTempo(n);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") e.preventDefault();
                                }}
                                className="w-full px-2 py-1.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-[#A05068]"
                                placeholder={String(effectiveAnalysis.bpm)}
                                data-testid="input-manual-tempo"
                              />
                              <span className="text-[9px] text-gray-500">
                                {manualTempo
                                  ? `Custom: ${manualTempo}`
                                  : `Detected: ${effectiveAnalysis.bpm}`}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Key
                                </label>
                                {effectiveAnalysis.keyConfidence > 0 && (
                                  <span className="text-[8px] text-gray-500">
                                    {effectiveAnalysis.keyConfidence}% confidence
                                  </span>
                                )}
                              </div>
                              <select
                                value={keyToSelectValue(manualKey ?? effectiveAnalysis.key)}
                                onChange={(e) =>
                                  setManualKey(
                                    e.target.value ? normalizeKeyLabel(e.target.value) : null,
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-[#A05068]"
                                data-testid="select-manual-key"
                              >
                                <optgroup label="Major Keys">
                                  <option value="C">C Major</option>
                                  <option value="C#">C# Major</option>
                                  <option value="Db">Db Major</option>
                                  <option value="D">D Major</option>
                                  <option value="D#">D# Major</option>
                                  <option value="Eb">Eb Major</option>
                                  <option value="E">E Major</option>
                                  <option value="F">F Major</option>
                                  <option value="F#">F# Major</option>
                                  <option value="Gb">Gb Major</option>
                                  <option value="G">G Major</option>
                                  <option value="G#">G# Major</option>
                                  <option value="Ab">Ab Major</option>
                                  <option value="A">A Major</option>
                                  <option value="A#">A# Major</option>
                                  <option value="Bb">Bb Major</option>
                                  <option value="B">B Major</option>
                                </optgroup>
                                <optgroup label="Minor Keys">
                                  <option value="Am">A Minor</option>
                                  <option value="A#m">A# Minor</option>
                                  <option value="Bbm">Bb Minor</option>
                                  <option value="Bm">B Minor</option>
                                  <option value="Cm">C Minor</option>
                                  <option value="C#m">C# Minor</option>
                                  <option value="Dbm">Db Minor</option>
                                  <option value="Dm">D Minor</option>
                                  <option value="D#m">D# Minor</option>
                                  <option value="Ebm">Eb Minor</option>
                                  <option value="Em">E Minor</option>
                                  <option value="Fm">F Minor</option>
                                  <option value="F#m">F# Minor</option>
                                  <option value="Gbm">Gb Minor</option>
                                  <option value="Gm">G Minor</option>
                                  <option value="G#m">G# Minor</option>
                                  <option value="Abm">Ab Minor</option>
                                </optgroup>
                              </select>
                              <span className="text-[9px] text-gray-500">
                                {manualKey
                                  ? `Custom: ${manualKey}`
                                  : `Detected: ${effectiveAnalysis.key}`}
                              </span>
                            </div>
                            <div className="col-span-2 flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                Scale (generation)
                              </label>
                              <select
                                value={reichScale}
                                onChange={(e) => setReichScale(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-[#A05068]"
                                data-testid="select-generation-scale"
                              >
                                {listScales().map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                              <div
                                className="rounded border border-[#A05068]/35 bg-[#0d0d0d] px-2 py-2"
                                data-testid="scale-lookup-panel"
                              >
                                <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                                  Scale lookup (any name)
                                </div>
                                <div className="flex gap-1 mb-1.5">
                                  <input
                                    value={scaleSearchQuery}
                                    onChange={(e) => setScaleSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") void runScaleLookup();
                                    }}
                                    placeholder="e.g. brazilian, hungarian minor, raga yaman"
                                    className="flex-1 text-[10px] bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#A05068]"
                                    data-testid="input-scale-lookup"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void runScaleLookup()}
                                    disabled={scaleLookupBusy || !scaleSearchQuery.trim()}
                                    className="px-2 rounded border border-[#A05068]/50 text-[#B87888] hover:bg-[#A05068]/10 disabled:opacity-40"
                                    data-testid="button-scale-lookup-search"
                                  >
                                    {scaleLookupBusy ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Search className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                {scaleLookupResult?.resolved ? (
                                  <p className="text-[10px] text-emerald-500/90 mb-1">
                                    {scaleLookupResult.resolved.label} ·{" "}
                                    {scaleLookupResult.resolved.confidence}% (
                                    {scaleLookupResult.resolved.source})
                                  </p>
                                ) : scaleLookupResult?.suggestions.length ? (
                                  <div className="mb-1">
                                    <p className="text-[9px] text-amber-500/90 mb-1">
                                      Did you mean:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {scaleLookupResult.suggestions.slice(0, 6).map((s) => (
                                        <button
                                          key={s.scaleId}
                                          type="button"
                                          onClick={() => applyScaleLookupMatch(s)}
                                          className="text-[9px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-300 hover:border-[#A05068]"
                                        >
                                          {s.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                <div className="text-[11px] text-gray-300">
                                  Active: {parseRootFromKeyLabel(generationKeyLabel)}{" "}
                                  {generationScaleLookup.label}
                                </div>
                                <div className="mt-1 font-mono text-[10px] text-[#A05068] tracking-wide">
                                  {generationScaleLookup.noteNames.join(" · ")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {effectiveAnalysis.chords && effectiveAnalysis.chords.length > 0 && (
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Chord Timeline
                              </h3>
                              <button
                                onClick={() => setShowChordEditor(!showChordEditor)}
                                className="text-[10px] holo-text font-medium"
                                data-testid="button-toggle-chord-editor"
                              >
                                {showChordEditor ? "Done Editing" : "Edit Chords"}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {effectiveAnalysis.chords.slice(0, 32).map((chord, i) =>
                                showChordEditor && editingChord === i ? (
                                  <input
                                    key={i}
                                    autoFocus
                                    defaultValue={chord.symbol}
                                    className="w-16 text-[10px] font-mono px-1.5 py-0.5 border border-[#A05068] rounded text-center focus:outline-none bg-[#1a1a1a] text-gray-200"
                                    onBlur={(e) => {
                                      handleChordEdit(i, e.target.value);
                                      setEditingChord(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleChordEdit(i, (e.target as HTMLInputElement).value);
                                        setEditingChord(null);
                                      }
                                    }}
                                    data-testid={`input-chord-edit-${i}`}
                                  />
                                ) : (
                                  <button
                                    key={i}
                                    onClick={() => showChordEditor && setEditingChord(i)}
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                                      chordEdits[i]
                                        ? "bg-[#A05068]/10 border-[#A05068]/30 holo-text"
                                        : showChordEditor
                                          ? "bg-gray-800 border-gray-700 text-gray-400 hover:border-[#A05068]"
                                          : "bg-gray-800 border-gray-700 text-gray-400"
                                    }`}
                                    data-testid={`button-chord-${i}`}
                                  >
                                    {chord.symbol}
                                    {chord.roman && !showChordEditor ? ` (${chord.roman})` : ""}
                                  </button>
                                ),
                              )}
                              {effectiveAnalysis.chords.length > 32 && (
                                <Badge variant="secondary" className="text-[10px] text-gray-400">
                                  +{effectiveAnalysis.chords.length - 32} more
                                </Badge>
                              )}
                            </div>
                            {showChordEditor && (
                              <p className="text-[9px] text-gray-400 mt-1.5">
                                Click any chord to edit. Edits persist through regeneration.
                              </p>
                            )}
                          </div>
                        )}

                        {effectiveAnalysis.sections && effectiveAnalysis.sections.length > 0 && (
                          <div className="mb-5">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Sections
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {effectiveAnalysis.sections.map((sec, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded border border-gray-700"
                                >
                                  <span className="text-[10px] font-semibold text-gray-200">
                                    {sec.name}
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    {Math.round(sec.t0)}s-{Math.round(sec.t1)}s
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mode === "chords" && (
                          <div className="mb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Chord Browser
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <select
                                value={chordRoot}
                                onChange={(e) => setChordRoot(e.target.value)}
                                className="text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-[#A05068]"
                                data-testid="select-chord-root"
                              >
                                {[
                                  "C",
                                  "C#",
                                  "D",
                                  "Eb",
                                  "E",
                                  "F",
                                  "F#",
                                  "G",
                                  "Ab",
                                  "A",
                                  "Bb",
                                  "B",
                                ].map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={chordTagFilter}
                                onChange={(e) => setChordTagFilter(e.target.value)}
                                className="text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-[#A05068]"
                                data-testid="select-chord-tag"
                              >
                                <option value="">All Styles</option>
                                {[
                                  "neo-soul",
                                  "jazz",
                                  "brazilian",
                                  "gospel",
                                  "quartal",
                                  "steely-dan",
                                  "minimal",
                                  "altered",
                                ].map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={chordSearch}
                                onChange={(e) => setChordSearch(e.target.value)}
                                placeholder="Search chords..."
                                className="flex-1 min-w-[100px] text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#A05068]"
                                data-testid="input-chord-search"
                              />
                            </div>
                            <div className="mb-3 p-3 rounded-lg bg-[#0a1a1a] border border-gray-800">
                              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Diatonic Chords in {manualKey ?? effectiveAnalysis.key}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {ChordKit.chordsInKey(
                                  chordRoot,
                                  /minor|m$/i.test(manualKey ?? effectiveAnalysis.key)
                                    ? "minor"
                                    : "major",
                                ).map((dc) => {
                                  const v = ChordKit.voicing(dc.rootPc, dc.chordId, { octave: 3 });
                                  return (
                                    <button
                                      key={dc.degree}
                                      onClick={() => {
                                        setSelectedChordId(dc.chordId);
                                        setChordRoot(ChordKit.rootLabel(dc.rootPc));
                                      }}
                                      className={`flex flex-col items-center p-2 rounded-lg border transition-colors min-w-[56px] ${selectedChordId === dc.chordId && chordRoot === ChordKit.rootLabel(dc.rootPc) ? "border-[#A05068] bg-[#A05068]/10" : "border-gray-700 hover:border-gray-500"}`}
                                      data-testid={`button-diatonic-${dc.degree}`}
                                    >
                                      <span className="text-[10px] font-semibold text-gray-300">
                                        {dc.roman}
                                      </span>
                                      <span className="text-[9px] text-gray-500 mt-0.5">
                                        {dc.symbol}
                                      </span>
                                      {v && (
                                        <span className="text-[8px] text-gray-600 mt-0.5 font-mono">
                                          {v.notes.join(" ")}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div
                              className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5"
                              data-testid="chord-browser-grid"
                            >
                              {ChordKit.list({
                                tag: chordTagFilter || undefined,
                                q: chordSearch || undefined,
                              })
                                .slice(0, 48)
                                .map((c) => {
                                  const sym = ChordKit.displaySymbol(chordRoot, c.id);
                                  const isSelected = selectedChordId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        setSelectedChordId(c.id);
                                        setChordInversion(0);
                                      }}
                                      className={`text-left p-2 rounded-lg border transition-colors ${isSelected ? "border-[#A05068] bg-[#A05068]/10" : "border-gray-700/50 hover:border-gray-500"}`}
                                      data-testid={`button-chord-pick-${c.id}`}
                                    >
                                      <div className="text-xs font-medium text-gray-200">{sym}</div>
                                      <div className="text-[9px] text-gray-500 truncate">
                                        {c.name}
                                      </div>
                                      <div className="flex flex-wrap gap-0.5 mt-1">
                                        {c.tags.slice(0, 3).map((t) => (
                                          <span
                                            key={t}
                                            className="text-[7px] px-1 py-0.5 bg-gray-800 rounded text-gray-500"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                            {selectedChordId &&
                              (() => {
                                const v = ChordKit.voicing(chordRoot, selectedChordId, {
                                  inversion: chordInversion,
                                  octave: 3,
                                });
                                if (!v) return null;
                                return (
                                  <div className="mt-3 p-3 rounded-lg bg-[#0d1a1a] border border-[#A05068]/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-semibold text-gray-200">
                                        {ChordKit.displaySymbol(chordRoot, selectedChordId)}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <label className="text-[9px] text-gray-400">
                                          Inversion
                                        </label>
                                        <select
                                          value={chordInversion}
                                          onChange={(e) =>
                                            setChordInversion(Number(e.target.value))
                                          }
                                          className="text-[10px] bg-[#1a1a1a] border border-gray-700 rounded px-1.5 py-0.5 text-gray-200"
                                          data-testid="select-chord-inversion"
                                        >
                                          {[0, 1, 2, 3].map((i) => (
                                            <option key={i} value={i}>
                                              {i === 0
                                                ? "Root"
                                                : `${i}${i === 1 ? "st" : i === 2 ? "nd" : "rd"}`}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-1">
                                      {v.notes.map((n, i) => (
                                        <span
                                          key={i}
                                          className="text-xs font-mono px-1.5 py-0.5 bg-gray-800 rounded text-[#B87888]"
                                        >
                                          {n}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-mono">
                                      MIDI: {v.midi.join(", ")}
                                    </div>
                                  </div>
                                );
                              })()}
                          </div>
                        )}

                        {mode === "composition" && (
                          <div className="mb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Counterpoint & Hocketing
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <button
                                onClick={() => setReichType("counterpoint")}
                                className={`p-2.5 rounded-lg border transition-colors text-left ${reichType === "counterpoint" ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-700 hover:border-gray-500"}`}
                                data-testid="button-counterpoint-type"
                              >
                                <div className="text-xs font-medium text-gray-200">
                                  Counterpoint
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  3-voice interlocking canons
                                </div>
                              </button>
                              <button
                                onClick={() => setReichType("hocket")}
                                className={`p-2.5 rounded-lg border transition-colors text-left ${reichType === "hocket" ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-700 hover:border-gray-500"}`}
                                data-testid="button-hocket-type"
                              >
                                <div className="text-xs font-medium text-gray-200">Hocketing</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  6-voice alternating texture
                                </div>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Style
                                </label>
                                <select
                                  value={reichStyle}
                                  onChange={(e) => setReichStyle(e.target.value as ReichStyle)}
                                  className="text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-[#A05068]"
                                  data-testid="select-reich-style"
                                >
                                  <option value="reich_electric">Electric Counterpoint</option>
                                  <option value="shaw_interlace">Shaw Interlace</option>
                                  <option value="phase_canon">Phase Canon</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Scale
                                </label>
                                <select
                                  value={reichScale}
                                  onChange={(e) => {
                                    setReichScale(e.target.value);
                                    setScaleSuggestionApplied(false);
                                  }}
                                  className="text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-[#A05068]"
                                  data-testid="select-reich-scale"
                                >
                                  {listScales().map((s) => (
                                    <option key={s} value={s}>
                                      {s.replace(/_/g, " ")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Jazz swing (BLUES JAWN)
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={swingAmount}
                                  onChange={(e) => setSwingAmount(Number(e.target.value))}
                                  className="w-full accent-[#5BA8A0]"
                                  data-testid="slider-swing"
                                />
                                <span className="text-[9px] text-gray-500">
                                  {swingAmount === 0
                                    ? "Straight 16ths — regenerate after changing"
                                    : `${swingAmount}% swing — regenerate to apply`}
                                </span>
                              </div>
                              {reichType === "hocket" && (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                    Hocket groove (AI V-2)
                                  </label>
                                  <select
                                    value={hocketGroove}
                                    onChange={(e) =>
                                      setHocketGroove(e.target.value as HocketGrooveStyle)
                                    }
                                    className="text-xs bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-[#A05068]"
                                    data-testid="select-hocket-groove"
                                  >
                                    <option value="reich_interlock">Reich v2 interlock</option>
                                    <option value="reich_phase">Reich phase shift</option>
                                    <option value="shaw_interlock">Shaw interlock</option>
                                    <option value="minimalist_cells">Minimalist cells</option>
                                    <option value="polyrhythmic">Polyrhythmic</option>
                                    <option value="asymmetric">Asymmetric</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            <div
                              className="mb-3 rounded-lg border border-[#A05068]/40 bg-[#1a1018] p-3"
                              data-testid="ai-scale-lookup-panel"
                            >
                              <div className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide mb-2">
                                Scale lookup (search any scale)
                              </div>
                              <div className="flex gap-1 mb-2">
                                <input
                                  value={scaleSearchQuery}
                                  onChange={(e) => setScaleSearchQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") void runScaleLookup();
                                  }}
                                  placeholder="brazilian, hungarian minor, raga yaman…"
                                  className="flex-1 text-[10px] bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#A05068]"
                                  data-testid="input-scale-lookup-composition"
                                />
                                <button
                                  type="button"
                                  onClick={() => void runScaleLookup()}
                                  disabled={scaleLookupBusy || !scaleSearchQuery.trim()}
                                  className="px-2 rounded border border-[#A05068]/50 text-[#B87888] hover:bg-[#A05068]/10 disabled:opacity-40"
                                  data-testid="button-scale-lookup-search-composition"
                                >
                                  {scaleLookupBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Search className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {scaleLookupResult?.alternates &&
                              scaleLookupResult.alternates.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="text-[9px] text-gray-500 w-full">
                                    Alternates:
                                  </span>
                                  {scaleLookupResult.alternates.map((alt) => (
                                    <button
                                      key={alt.scaleId}
                                      type="button"
                                      onClick={() =>
                                        applyScaleLookupMatch({
                                          scaleId: alt.scaleId,
                                          label: alt.label,
                                          source: "ollama",
                                          confidence: 80,
                                          relativeSteps: alt.relativeSteps,
                                        })
                                      }
                                      className="text-[9px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#A05068]"
                                    >
                                      {alt.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                              {scaleLookupResult?.suggestions.length &&
                              !scaleLookupResult.resolved ? (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="text-[9px] text-amber-500/90 w-full">
                                    Did you mean:
                                  </span>
                                  {scaleLookupResult.suggestions.slice(0, 5).map((s) => (
                                    <button
                                      key={s.scaleId}
                                      type="button"
                                      onClick={() => applyScaleLookupMatch(s)}
                                      className="text-[9px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#A05068]"
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                              <div className="flex items-center justify-between gap-2 mb-2 pt-1 border-t border-gray-800">
                                <div className="flex items-center gap-1.5">
                                  <BrainCircuit className="w-3.5 h-3.5 text-[#A05068]" />
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                    From your audio
                                  </span>
                                </div>
                                {aiScaleSuggestion && (
                                  <span className="text-[9px] text-gray-500">
                                    {aiScaleSuggestion.confidence}% match
                                  </span>
                                )}
                              </div>
                              {aiScaleSuggestion ? (
                                <>
                                  <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                                    {aiScaleSuggestion.reason}
                                  </p>
                                  <div className="text-xs text-gray-200 mb-1">
                                    Suggested:{" "}
                                    <span className="font-semibold text-[#B87888]">
                                      {aiScaleSuggestion.keyLabel} ·{" "}
                                      {aiScaleSuggestion.scaleName.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <div className="font-mono text-[10px] text-[#A05068] tracking-wide mb-2">
                                    {aiScaleSuggestion.noteNames.join(" · ")}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={applyAiScaleSuggestion}
                                    className="w-full py-2 rounded-md text-[10px] font-bold uppercase tracking-wide text-white holo-gradient"
                                    data-testid="button-apply-ai-scale"
                                  >
                                    Use suggested scale before generate
                                  </button>
                                  {scaleSuggestionApplied && (
                                    <p className="text-[9px] text-emerald-500/90 mt-1.5 text-center">
                                      Applied — hocket will use this scale
                                    </p>
                                  )}
                                  {!scaleSuggestionApplied && (
                                    <p className="text-[9px] text-amber-500/90 mt-1.5 text-center">
                                      Apply before Generate to avoid minor/major mismatch
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-[10px] text-gray-500">
                                  Import audio (and Melodyne .mid if you have it) to unlock AI scale
                                  lookup.
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 mb-3">
                              <CheckboxOption
                                label="Indian Meend (continuous pitch bend)"
                                checked={meend}
                                onChange={setMeend}
                              />
                              <p className="text-[9px] text-gray-500">
                                Tempo and key are manual — Melodyne MIDI syncs pitch/chords only.
                              </p>
                              <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Repeating pattern length
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(
                                    [
                                      ["standard", "Standard"],
                                      ["extended", "Extended"],
                                      ["long", "Long"],
                                    ] as const
                                  ).map(([v, label]) => (
                                    <RadioOption
                                      key={v}
                                      label={label}
                                      checked={patternLength === v}
                                      onChange={() => setPatternLength(v)}
                                    />
                                  ))}
                                </div>
                              </div>
                              <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                Duration (bar-aligned to sample)
                              </label>
                              <input
                                type="range"
                                min="4"
                                max={Math.max(
                                  60,
                                  Math.ceil(transcription?.durationSec ?? reichDuration),
                                )}
                                value={Math.round(transcription?.durationSec ?? reichDuration)}
                                onChange={(e) => setReichDuration(Number(e.target.value))}
                                disabled={Boolean(transcription?.durationSec && audioFile)}
                                className="accent-[#A05068] disabled:opacity-50"
                                data-testid="slider-reich-duration"
                              />
                              <span className="text-[9px] text-gray-500">
                                {Math.round(transcription?.durationSec ?? reichDuration)}s
                                {transcription?.durationSec && audioFile
                                  ? " — locked to your audio"
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-relaxed mb-3">
                              Use the play stage above for waveform, pitch map, and chord grid.
                              Generate uses transcribed chords when available.
                            </p>
                            <div className="mb-3 p-3 rounded-lg bg-[#0d0a12] border border-[#A05068]/25">
                              <h4 className="text-[10px] font-semibold text-[#B87888] uppercase tracking-wider mb-1.5">
                                Add‑ons integrated (clean)
                              </h4>
                              <p className="text-[9px] text-gray-400">
                                Turn on <span className="text-gray-300">Indian Meend</span> for raga
                                scales and V-1-style pitch slides (preview matches MIDI export). In
                                Ableton set each instrument Pitch Bend Range to 12 semitones.
                              </p>
                            </div>
                          </div>
                        )}

                        {mode === "ensemble" && (
                          <div className="mb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Ensemble options
                            </h3>
                            <div className="flex flex-col gap-1.5 mb-3 p-3 rounded-lg border border-[#A05068]/25 bg-[#0d0a12]">
                              <CheckboxOption
                                label="Indian Meend (Violin 1, Solo Violin, Flute, Oboe)"
                                checked={meend}
                                onChange={setMeend}
                                data-testid="checkbox-ensemble-meend"
                              />
                              {meend && (
                                <p className="text-[9px] text-gray-500">
                                  Pitch slides on melody stems only. Set Ableton Pitch Bend Range to
                                  12 semitones.
                                </p>
                              )}
                              <p className="text-[9px] text-gray-500">
                                Tempo and key are manual — Melodyne MIDI syncs pitch/chords only.
                              </p>
                              <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">
                                  Repeating pattern length
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(
                                    [
                                      ["standard", "Standard"],
                                      ["extended", "Extended"],
                                      ["long", "Long"],
                                    ] as const
                                  ).map(([v, label]) => (
                                    <RadioOption
                                      key={v}
                                      label={label}
                                      checked={patternLength === v}
                                      onChange={() => setPatternLength(v)}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-500 leading-relaxed">
                                13 stems — Reich canon (Violin 1 &amp; 2), Shaw woodwinds (Viola,
                                Flute), Lins harmony (Cello, Harp), Björk lyric (Solo Violin, Oboe),
                                Contrabass foundation, Timpani, Suspended Cymbal, Triangle, and
                                Cabasa (each its own MIDI track).
                              </p>
                            </div>
                          </div>
                        )}

                        {mode !== "chords" && (
                          <>
                            <div className="mb-4">
                              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Style Preset
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {STYLE_PRESETS[mode].map((preset) => (
                                  <button
                                    key={preset.id}
                                    onClick={() => setSelectedPreset(preset.id)}
                                    className={`text-left p-2.5 rounded-lg border transition-colors ${selectedPreset === preset.id ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-700 hover:border-gray-500"}`}
                                    data-testid={`button-preset-${preset.id}`}
                                  >
                                    <div className="text-xs font-medium text-gray-200">
                                      {preset.label}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {preset.desc}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Seed Control
                            </span>
                            <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useSeed}
                                onChange={(e) => setUseSeed(e.target.checked)}
                                className="accent-[#A05068]"
                                data-testid="checkbox-use-seed"
                              />
                              Lock seed
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={seed}
                              onChange={(e) => setSeed(Number(e.target.value))}
                              className="flex-1 text-xs font-mono bg-[#1a1a1a]/50 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-[#A05068] text-gray-200"
                              disabled={!useSeed}
                              data-testid="input-seed"
                            />
                            <button
                              onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                              className="text-[10px] holo-text font-medium"
                              disabled={!useSeed}
                              data-testid="button-randomize-seed"
                            >
                              Randomize
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-1">
                            {useSeed
                              ? "Same seed = reproducible output"
                              : "Random seed each generation"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 sm:pt-3">
                          {mode === "composition" ? (
                            <Button
                              onClick={handleLocalCompositionGenerate}
                              className="gap-1.5 sm:gap-2 text-white text-xs sm:text-sm holo-gradient"
                              style={{
                                background:
                                  "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                              }}
                              disabled={isGenerating}
                              data-testid="button-generate-composition"
                            >
                              <HolographicNoise />
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Generate{" "}
                              {reichType === "counterpoint" ? "Counterpoint" : "Hocket"}
                            </Button>
                          ) : mode === "chords" ? (
                            <>
                              <Button
                                onClick={() => handleGenerate("preview")}
                                className="gap-1.5 sm:gap-2 text-white text-xs sm:text-sm holo-gradient"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                                }}
                                disabled={isGenerating || !analysis}
                                data-testid="button-generate-chords-preview"
                              >
                                <HolographicNoise />
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Generate Chords
                                (16 bars)
                              </Button>
                              <Button
                                onClick={() => handleGenerate("full")}
                                variant="outline"
                                className="gap-1.5 sm:gap-2 border-gray-700 text-xs sm:text-sm"
                                disabled={isGenerating || !analysis}
                                data-testid="button-generate-chords-full"
                              >
                                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Full (16 bars)
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleGenerate("preview")}
                                className="gap-1.5 sm:gap-2 text-white text-xs sm:text-sm holo-gradient"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                                }}
                                disabled={isGenerating || !analysis}
                                data-testid="button-generate-preview"
                              >
                                <HolographicNoise />
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Preview (8-16
                                bars)
                              </Button>
                              <Button
                                onClick={() => handleGenerate("full")}
                                variant="outline"
                                className="gap-1.5 sm:gap-2 border-gray-700 text-xs sm:text-sm"
                                disabled={isGenerating || !analysis}
                                data-testid="button-generate-full"
                              >
                                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Full Render
                              </Button>
                            </>
                          )}
                          <Button
                            onClick={() => setShowSettings(!showSettings)}
                            variant="outline"
                            size="icon"
                            className="border-gray-700 ml-auto"
                            data-testid="button-toggle-settings"
                          >
                            <Sliders className="w-4 h-4" />
                          </Button>
                        </div>

                        {showSettings && (
                          <div className="mt-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              {MODE_CONFIG[mode].label} Settings
                            </h4>
                            {renderModeSettings()}
                          </div>
                        )}
                      </div>
                    )}

                  {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <Loader2 className="w-10 h-10 text-[#B87888] animate-spin mb-4" />
                      <h3 className="text-lg font-semibold text-gray-200 mb-1">Generating</h3>
                      <p className="text-sm text-gray-400 mb-3">{pipelineStage}</p>
                      <div className="w-64 space-y-1 mb-4">
                        <PipelineStep
                          label="Analysis"
                          done
                          active={pipelineStage.includes("Analyzing")}
                        />
                        <PipelineStep
                          label="Arrangement Planning"
                          done={
                            pipelineStage.includes("MIDI") ||
                            pipelineStage.includes("Complete") ||
                            pipelineStage.includes("take")
                          }
                          active={pipelineStage.includes("Planning")}
                        />
                        <PipelineStep
                          label={
                            mode === "patch"
                              ? "Patch Design"
                              : mode === "solo"
                                ? "Solo Takes (3x)"
                                : "MIDI Generation"
                          }
                          done={pipelineStage === "Complete"}
                          active={
                            pipelineStage.includes("MIDI") ||
                            pipelineStage.includes("Designing") ||
                            pipelineStage.includes("take") ||
                            pipelineStage.includes("solo")
                          }
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setIsGenerating(false);
                          setPipelineStage("Cancelled");
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-gray-700 text-gray-400"
                        data-testid="button-cancel-generation"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </Button>
                    </div>
                  )}

                  {stems.length > 0 && !isGenerating && (
                    <div className="flex-1 flex flex-col p-2 sm:p-4 overflow-y-auto">
                      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-200">
                            Generated Stems ({stems.length})
                          </h3>
                          {planInfo?.chordProgression && planInfo.chordProgression.length > 0 ? (
                            <p className="text-[9px] sm:text-[10px] text-[#5BA8A0] mt-0.5 font-mono tracking-wide">
                              {planInfo.chordProgression.join(" → ")}
                            </p>
                          ) : (
                            planInfo && (
                              <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 truncate">
                                {planInfo.form?.total_bars || "16"} bars | seed: {seed}
                              </p>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <Badge className="bg-[#A05068]/20 text-[#B87888] text-[8px] sm:text-[9px] border-[#A05068]/30 hidden sm:flex">
                            MIDI: Professional
                          </Badge>
                          <Button
                            onClick={() => handleGenerate("preview")}
                            variant="outline"
                            size="sm"
                            className="text-[10px] sm:text-xs gap-1 border-gray-700"
                            data-testid="button-regenerate"
                          >
                            <RotateCcw className="w-3 h-3" />{" "}
                            <span className="hidden sm:inline">Regenerate All</span>
                            <span className="sm:hidden">Regen</span>
                          </Button>
                        </div>
                      </div>

                      {versionHistory.length > 1 && (
                        <div className="mb-3 p-2 bg-gray-800/30 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Version History
                            </span>
                            <Badge variant="secondary" className="text-[9px]">
                              {versionHistory.length} versions
                            </Badge>
                          </div>
                          <div className="flex gap-1 overflow-x-auto">
                            {versionHistory.map((ver, vi) => (
                              <button
                                key={ver.id}
                                onClick={() => handleVersionSwitch(vi)}
                                className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                                  vi === activeVersion
                                    ? "bg-[#A05068]/20 border-[#A05068] holo-text"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                                }`}
                                data-testid={`button-version-${vi}`}
                              >
                                {ver.label} (s:{ver.seed})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {mode === "solo" && soloTakes.length > 1 && (
                        <div className="mb-3 p-2 bg-[#A05068]/10 rounded-lg border border-[#A05068]/30">
                          <span className="text-[10px] font-semibold holo-text uppercase tracking-wider block mb-1.5">
                            Solo Takes
                          </span>
                          <div className="flex gap-1.5">
                            {soloTakes.map((take, ti) => (
                              <button
                                key={ti}
                                onClick={() => {
                                  setActiveTake(ti);
                                  setStems(take.stems);
                                }}
                                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                                  ti === activeTake
                                    ? "bg-[#A05068]/20 border-[#A05068] holo-text"
                                    : "bg-gray-800 border-gray-700 text-gray-400"
                                }`}
                                data-testid={`button-take-${ti}`}
                              >
                                Take {ti + 1}
                                <span className="block text-[9px] font-mono text-gray-400">
                                  seed: {take.seed}
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-400 mt-1.5">
                            Compare takes and pick the best solo variation
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        {stems.map((stem, i) => (
                          <div
                            key={stem.id || i}
                            className={`flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2.5 rounded-lg border transition-colors ${
                              stem.muted
                                ? "bg-gray-800/30 border-gray-700 opacity-50"
                                : lockedStems.has(stem.name)
                                  ? "bg-[#A05068]/10 border-[#A05068]/30"
                                  : "bg-gray-800/20 border-gray-700"
                            }`}
                            data-testid={`stem-${i}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${lockedStems.has(stem.name) ? "bg-[#A05068]" : "bg-[#A05068]"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] sm:text-xs font-medium text-gray-200 truncate">
                                {stem.name}
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                                {stem.instrumentHint} / {stem.role}
                              </div>
                            </div>
                            {stem.articulations && stem.articulations.length > 0 && (
                              <div className="hidden md:flex items-center gap-1">
                                {stem.articulations.slice(0, 2).map((a, j) => (
                                  <Badge key={j} variant="secondary" className="text-[8px]">
                                    {a}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-0">
                              <button
                                onClick={() => toggleStemLock(stem.name)}
                                className={`p-0.5 sm:p-1 rounded ${lockedStems.has(stem.name) ? "" : "text-gray-600"}`}
                                title={lockedStems.has(stem.name) ? "Unlock stem" : "Lock stem"}
                                data-testid={`button-lock-stem-${i}`}
                              >
                                {lockedStems.has(stem.name) ? (
                                  <span className="holo-icon">
                                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </span>
                                ) : (
                                  <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => void handleDownloadStemMidi(stem, i)}
                                disabled={!stem.midiEvents?.length}
                                className="p-0.5 sm:p-1 rounded text-gray-400 hover:text-[#5BA8A0] disabled:opacity-30"
                                title="Download this stem as .mid for your DAW"
                                data-testid={`button-download-stem-midi-${i}`}
                              >
                                <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </button>
                              <button
                                onClick={() => handleRegenerateStem(stem.name)}
                                disabled={
                                  lockedStems.has(stem.name) || regeneratingStem === stem.name
                                }
                                className={`p-0.5 sm:p-1 rounded ${lockedStems.has(stem.name) ? "text-gray-200" : "text-gray-400 hover:text-[#B87888]"}`}
                                title="Regenerate this stem"
                                data-testid={`button-regen-stem-${i}`}
                              >
                                {regeneratingStem === stem.name ? (
                                  <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const u = [...stems];
                                  u[i] = { ...u[i], muted: !u[i].muted };
                                  setStems(u);
                                }}
                                className={`p-0.5 sm:p-1 rounded ${stem.muted ? "text-red-400" : "text-gray-400"}`}
                                title={stem.muted ? "Unmute" : "Mute"}
                              >
                                {stem.muted ? (
                                  <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                ) : (
                                  <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const u = [...stems];
                                  u[i] = { ...u[i], soloed: !u[i].soloed };
                                  setStems(u);
                                }}
                                className={`p-0.5 sm:p-1 rounded text-[9px] sm:text-[10px] font-bold ${stem.soloed ? "holo-text" : "text-gray-400"}`}
                                title="Solo"
                              >
                                S
                              </button>
                            </div>
                            <div className="w-14 hidden sm:block">
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={stem.pan}
                                onChange={(e) => {
                                  const pan = Number(e.target.value);
                                  const u = [...stems];
                                  u[i] = { ...u[i], pan };
                                  setStems(u);
                                  if (engineReady) getSoundEngine().updateMix(stem.name, { pan });
                                }}
                                className="w-full accent-[#A05068]"
                                title={`Pan: ${stem.pan}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {planInfo?.meendApplicableStems &&
                        planInfo.meendApplicableStems.length > 0 &&
                        meend && (
                          <div className="mt-3 p-2 bg-[#A05068]/10 rounded border border-[#A05068]/30">
                            <p className="text-[10px] holo-text">
                              Meend (continuous pitch bend) applied to:{" "}
                              {planInfo.meendApplicableStems.join(", ")}
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {patchResult && !isGenerating && (
                    <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto">
                      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-200">
                            {patchResult.name}
                          </h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {patchResult.synth_family} | {patchResult.mono_poly || "poly"}
                          </p>
                        </div>
                        <Badge className="bg-[#A05068]/20 holo-text text-[9px] border-[#A05068]/30">
                          Professional
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                        {Object.entries(patchResult.macros).map(([key, val]) => (
                          <div key={key} className="bg-gray-800/50 rounded-lg p-3 text-center">
                            <div className="w-10 h-10 mx-auto rounded-full border-[2px] border-gray-700 flex items-center justify-center relative mb-1.5">
                              <div
                                className="absolute w-0.5 h-4 bg-[#A05068] rounded-full origin-bottom"
                                style={{
                                  transform: `rotate(${(val as number) * 270 - 135}deg)`,
                                  bottom: "50%",
                                }}
                              />
                            </div>
                            <div className="text-[10px] font-medium text-gray-200 capitalize">
                              {key}
                            </div>
                            <div className="text-[9px] text-gray-500">
                              {Math.round((val as number) * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Oscillators
                          </h4>
                          <div className="space-y-1">
                            {patchResult.oscillators.map((osc, i) => (
                              <div
                                key={i}
                                className="bg-gray-800/50 rounded px-2 py-1.5 text-[10px] font-mono flex items-center gap-2"
                              >
                                <span className="holo-text font-semibold">{osc.shape}</span>
                                <span className="text-gray-400">
                                  Oct {osc.oct > 0 ? `+${osc.oct}` : osc.oct}
                                </span>
                                <span className="text-gray-400">
                                  Mix {Math.round(osc.mix * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Filter
                          </h4>
                          <div className="bg-gray-800/50 rounded px-2 py-1.5 text-[10px] font-mono space-y-0.5">
                            <div>
                              {patchResult.filter.type} | {patchResult.filter.cutoff_hz}Hz
                            </div>
                            <div>
                              Res: {Math.round(patchResult.filter.resonance * 100)}% | Drive:{" "}
                              {Math.round((patchResult.filter.drive || 0) * 100)}%
                            </div>
                          </div>
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 mt-3">
                            Envelope
                          </h4>
                          <div className="bg-gray-800/50 rounded px-2 py-1.5 text-[10px] font-mono space-y-0.5">
                            <div>
                              Amp: A{patchResult.env.amp.A} D{patchResult.env.amp.D} S
                              {patchResult.env.amp.S} R{patchResult.env.amp.R}
                            </div>
                            <div>
                              Filt: A{patchResult.env.filter.A} D{patchResult.env.filter.D} S
                              {patchResult.env.filter.S} R{patchResult.env.filter.R}
                            </div>
                          </div>
                        </div>
                      </div>

                      {patchResult.instructions && (
                        <div className="mb-4">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Playing Instructions
                          </h4>
                          <div className="bg-gray-800/50 rounded p-3 text-[11px] text-gray-400 whitespace-pre-wrap leading-relaxed">
                            {patchResult.instructions}
                          </div>
                        </div>
                      )}

                      {patchResult.mappings?.midi_cc &&
                        typeof patchResult.mappings.midi_cc === "object" && (
                          <MidiCcMappings
                            data={patchResult.mappings.midi_cc as Record<string, number>}
                          />
                        )}

                      <div className="flex items-center gap-2 mt-auto pt-3">
                        <Button
                          onClick={() => handleGenerate("preview")}
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 border-gray-700"
                          data-testid="button-regenerate-patch"
                        >
                          <RotateCcw className="w-3 h-3" /> Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden lg:flex w-48 xl:w-56 p-3 xl:p-4 flex-col gap-3 flex-shrink-0 overflow-y-auto">
                {effectiveAnalysis && (
                  <div className="hidden md:block mt-3 lg:mt-4 space-y-2 lg:space-y-3">
                    <h4 className="text-[9px] lg:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Track info
                    </h4>
                    <div className="space-y-1.5 text-[11px]">
                      <InfoRow label="Mode" value={MODE_CONFIG[mode].label} />
                      <InfoRow label="Key" value={manualKey ?? effectiveAnalysis.key} />
                      <InfoRow label="BPM" value={String(manualTempo ?? effectiveAnalysis.bpm)} />
                      <InfoRow label="Time" value={effectiveAnalysis.timeSignature} />
                      {stems.length > 0 && <InfoRow label="Stems" value={String(stems.length)} />}
                      {stems.length > 0 && <InfoRow label="Seed" value={String(seed)} />}
                      {versionHistory.length > 0 && (
                        <InfoRow label="Versions" value={String(versionHistory.length)} />
                      )}
                      <InfoRow label="MIDI" value="Professional" />
                      <InfoRow label="Audio" value={engineReady ? "Synth Ready" : "Beta"} />
                    </div>
                  </div>
                )}

                <div className="hidden lg:block mt-4 pt-3 border-t border-gray-700/50">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Quality Tiers
                  </h4>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A05068] mt-1 flex-shrink-0" />
                      <span className="text-gray-400">
                        <span className="font-medium">Professional:</span> MIDI, analysis, patches
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-400">
                        <span className="font-medium">Beta:</span> Synth audio & WAV export
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-400">
                        <span className="font-medium">Unavailable:</span> Vocal Swap
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded border bg-gray-800/30 border-gray-700/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Mic2 className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-400">Vocal Swap</span>
                      <Badge variant="secondary" className="text-[8px] bg-gray-700 text-gray-400">
                        ROADMAP
                      </Badge>
                    </div>
                    <p className="text-[9px] text-gray-500">
                      Real-time vocal timbre conversion. Coming soon.
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <button
                      onClick={() => setShowNeuralPanel(!showNeuralPanel)}
                      className="flex items-center gap-1.5 w-full text-left"
                      data-testid="button-toggle-neural"
                    >
                      <span className="holo-icon">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Neural Audio
                      </span>
                      <Badge
                        className="text-[7px] text-white ml-auto holo-gradient"
                        style={{
                          background:
                            "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                        }}
                      >
                        <HolographicNoise />
                        AI
                      </Badge>
                    </button>
                    {showNeuralPanel && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="text-[9px] text-gray-400">Prompt engineer</label>
                          <select
                            value={neuralPromptProfile}
                            onChange={(e) =>
                              setNeuralPromptProfile(
                                e.target.value === "orchestral" ? "orchestral" : "standard",
                              )
                            }
                            className="w-full border border-gray-600 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-[#A05068] mt-0.5 bg-gray-800/50 text-gray-200"
                            data-testid="select-neural-prompt-profile"
                          >
                            <option value="standard">Standard (Suno / Udio)</option>
                            <option value="orchestral">Prompt orchestral (Reich × Shaw)</option>
                          </select>
                          {neuralPromptProfile === "orchestral" && (
                            <p className="text-[8px] text-gray-500 mt-1 leading-relaxed">
                              Full stem roster, articulation maps, humanization, and DAW routing
                              metadata in the neural response. Use style preset{" "}
                              <span className="text-gray-400">Prompt Orchestral</span> when
                              generating MIDI.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400">Genre</label>
                          <input
                            value={neuralGenre}
                            onChange={(e) => setNeuralGenre(e.target.value)}
                            placeholder="e.g. lo-fi hip hop, ambient"
                            className="w-full border border-gray-600 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-[#A05068] mt-0.5 bg-gray-800/50 text-gray-200"
                            data-testid="input-neural-genre"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400">Mood</label>
                          <input
                            value={neuralMood}
                            onChange={(e) => setNeuralMood(e.target.value)}
                            placeholder="e.g. dreamy, energetic"
                            className="w-full border border-gray-600 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-[#A05068] mt-0.5 bg-gray-800/50 text-gray-200"
                            data-testid="input-neural-mood"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400">Energy</label>
                          <select
                            value={neuralEnergy}
                            onChange={(e) => setNeuralEnergy(e.target.value)}
                            className="w-full border border-gray-600 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-[#A05068] mt-0.5 bg-gray-800/50 text-gray-200"
                            data-testid="select-neural-energy"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="explosive">Explosive</option>
                          </select>
                        </div>
                        <Button
                          onClick={handleGenerateNeuralPrompt}
                          disabled={isGeneratingPrompt || stems.length === 0}
                          className="w-full text-[10px] text-white gap-1 holo-gradient"
                          style={{
                            background:
                              "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                          }}
                          size="sm"
                          data-testid="button-generate-neural-prompt"
                        >
                          <HolographicNoise />
                          {isGeneratingPrompt ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <BrainCircuit className="w-3 h-3" />
                          )}
                          {isGeneratingPrompt
                            ? "Generating..."
                            : neuralPromptProfile === "orchestral"
                              ? "Prompt orchestral"
                              : "Generate Neural Prompt"}
                        </Button>
                        {stems.length === 0 && (
                          <p className="text-[9px] text-gray-500">
                            Generate stems first to create a neural audio prompt.
                          </p>
                        )}
                        {neuralPromptResult && (
                          <div className="space-y-1.5 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-gray-400">
                                Generated Prompt
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge
                                  className="text-[7px] text-white holo-gradient"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                                  }}
                                >
                                  <HolographicNoise />
                                  Score: {neuralPromptResult.qualityScore}
                                </Badge>
                                <button
                                  onClick={copyNeuralPrompt}
                                  className="p-0.5 text-gray-400 hover:text-[#B87888]"
                                  data-testid="button-copy-neural-prompt"
                                >
                                  {promptCopied ? (
                                    <span className="holo-icon">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="bg-gray-800/30 border border-gray-600 rounded p-2 text-[9px] text-gray-300 leading-relaxed max-h-28 overflow-y-auto">
                              {neuralPromptResult.prompt}
                            </div>
                            <div className="flex flex-wrap gap-0.5">
                              {neuralPromptResult.tags.slice(0, 6).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-[7px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="text-[8px] text-gray-500 space-y-0.5">
                              <div>
                                Steps: {neuralPromptResult.modelSettings.steps} | CFG:{" "}
                                {neuralPromptResult.modelSettings.cfgScale}
                              </div>
                              <div>Duration: {neuralPromptResult.modelSettings.duration}s</div>
                            </div>
                            {(neuralPromptResult.promptProfile === "orchestral" ||
                              neuralPromptProfile === "orchestral") && (
                              <div className="space-y-1.5 pt-1 border-t border-gray-700/50">
                                {neuralPromptResult.orchestrationBrief && (
                                  <div>
                                    <span className="text-[8px] font-medium text-gray-400 uppercase">
                                      Orchestration
                                    </span>
                                    <p className="text-[8px] text-gray-400 leading-relaxed mt-0.5">
                                      {neuralPromptResult.orchestrationBrief}
                                    </p>
                                  </div>
                                )}
                                {neuralPromptResult.humanizationNotes && (
                                  <div>
                                    <span className="text-[8px] font-medium text-gray-400 uppercase">
                                      Humanization
                                    </span>
                                    <p className="text-[8px] text-gray-400 leading-relaxed mt-0.5">
                                      {neuralPromptResult.humanizationNotes}
                                    </p>
                                  </div>
                                )}
                                {neuralPromptResult.mixRouting && (
                                  <div>
                                    <span className="text-[8px] font-medium text-gray-400 uppercase">
                                      Mix / stems
                                    </span>
                                    <p className="text-[8px] text-gray-400 leading-relaxed mt-0.5">
                                      {neuralPromptResult.mixRouting}
                                    </p>
                                  </div>
                                )}
                                {neuralPromptResult.stemLayout &&
                                  neuralPromptResult.stemLayout.length > 0 && (
                                    <div className="max-h-20 overflow-y-auto text-[7px] text-gray-500 font-mono space-y-0.5">
                                      {neuralPromptResult.stemLayout.slice(0, 12).map((line, i) => (
                                        <div key={i}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        )}
                        <a
                          href="/dashboard/neural-audio"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] holo-text hover:underline mt-1"
                          data-testid="link-neural-dashboard"
                        >
                          Manage Training Data
                          <ChevronRight className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 sm:px-5 pt-1">
              <button
                onClick={() => void handleExport()}
                disabled={
                  (stems.length === 0 && !transcription?.melodyneNotes?.length) || isExporting
                }
                className="flex w-full items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-200 disabled:text-gray-500 disabled:opacity-40 transition-all active:translate-y-[1px]"
                style={{
                  background:
                    stems.length > 0 || transcription?.melodyneNotes?.length
                      ? "linear-gradient(180deg, #5BA8A0, #4A8890)"
                      : "linear-gradient(180deg, #444, #333)",
                  boxShadow: "2px 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                  border:
                    "2px solid " +
                    (stems.length > 0 || transcription?.melodyneNotes?.length ? "#5BA8A0" : "#555"),
                }}
                data-testid="button-export-stem-pack"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? "packaging…" : "download full export"}
              </button>
              <p className="text-[9px] text-gray-500 text-center mt-1">
                Zip: all MIDI stems (Meend bends), multitrack, Melodyne, session JSON
              </p>
            </div>

            <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-1 flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex items-center gap-1">
                {[
                  {
                    onClick: () => {
                      if (!engineReady || stems.length === 0) return;
                      const engine = getSoundEngine();
                      engine.seek(Math.max(0, engine.getPosition() - 5));
                      setPlaybackPos(engine.getPosition());
                    },
                    disabled: !engineReady || stems.length === 0,
                    icon: <SkipBack className="w-4 h-4" />,
                    testId: "button-skip-back",
                  },
                  {
                    onClick: () => void toggleCompositionPlay(),
                    disabled: !engineReady || stems.length === 0,
                    icon: isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />,
                    testId: "button-play-pause",
                  },
                  {
                    onClick: stopPlayback,
                    disabled: !engineReady || stems.length === 0,
                    icon: <Square className="w-3.5 h-3.5" />,
                    testId: "button-stop",
                  },
                  {
                    onClick: () => {
                      if (!engineReady || stems.length === 0) return;
                      const engine = getSoundEngine();
                      engine.seek(Math.min(playbackDuration, engine.getPosition() + 5));
                      setPlaybackPos(engine.getPosition());
                    },
                    disabled: !engineReady || stems.length === 0,
                    icon: <SkipForward className="w-4 h-4" />,
                    testId: "button-skip-forward",
                  },
                ].map((btn) => (
                  <button
                    key={btn.testId}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    className="p-1.5 sm:p-2 rounded-md text-gray-200 disabled:opacity-30 transition-all active:translate-y-[1px]"
                    style={{
                      background: "linear-gradient(180deg, #444, #333)",
                      boxShadow: "2px 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                      border: "2px solid #555",
                    }}
                    data-testid={btn.testId}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-gray-300 font-mono flex-shrink-0 font-bold">
                {engineReady && stems.length > 0 && playbackDuration > 0
                  ? `${formatTime(playbackPos)}/${formatTime(playbackDuration)}`
                  : engineLoading
                    ? "Loading…"
                    : stems.length > 0
                      ? "Preparing…"
                      : "Generate to play"}
              </div>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, #333, #444)",
                  boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => {
                  if (!engineReady || stems.length === 0 || playbackDuration <= 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const engine = getSoundEngine();
                  engine.seek(pct * playbackDuration);
                  setPlaybackPos(pct * playbackDuration);
                }}
                data-testid="progress-bar"
              >
                <div
                  className="h-full rounded-full transition-all holo-gradient"
                  style={{
                    background:
                      "linear-gradient(90deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                    width:
                      playbackDuration > 0
                        ? `${(Math.min(playbackPos, playbackDuration) / playbackDuration) * 100}%`
                        : "0%",
                  }}
                >
                  <HolographicNoise />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  className="w-14 accent-[#A05068]"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMasterVolume(val);
                    if (engineReady) getSoundEngine().setMasterVolume(val);
                    if (audioRef.current) audioRef.current.volume = val / 100;
                  }}
                  data-testid="slider-volume"
                />
              </div>
              {engineReady && stems.length > 0 && (
                <Badge variant="secondary" className="text-[9px] hidden sm:flex gap-1">
                  <Disc3 className={`w-3 h-3 ${isPlaying ? "animate-spin" : ""}`} /> Synth
                </Badge>
              )}
              {pipelineStage && (
                <Badge variant="secondary" className="text-[10px] hidden sm:flex">
                  {pipelineStage}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </main>

      {showGuidedBuilder && (
        <GuidedPromptBuilder
          onClose={() => setShowGuidedBuilder(false)}
          onApply={(prompt) => {
            setUserPrompt(prompt);
            setMeend(/\bmeend\b/i.test(prompt));
            setShowGuidedBuilder(false);
          }}
          currentMode={mode}
        />
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SliderControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-500 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-gray-400">{value}%</span>
      </label>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-0.5 accent-[#A05068]"
      />
    </div>
  );
}

function RadioOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="accent-[#A05068]" />
      {label}
    </label>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
  "data-testid": dataTestId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  "data-testid"?: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#A05068]"
        data-testid={dataTestId}
      />
      {label}
    </label>
  );
}

function AnalysisCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
      <div className="text-xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] text-gray-400 mt-0.5">
        {label} ({sub})
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  );
}

function MidiCcMappings({ data }: { data: Record<string, number> }) {
  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        MIDI CC Mappings
      </h4>
      <div className="bg-gray-800/50 rounded px-2 py-1.5 text-[10px] font-mono">
        {Object.entries(data).map(([key, val]) => (
          <span key={key} className="mr-3">
            {key}: CC{val}
          </span>
        ))}
      </div>
    </div>
  );
}

function PipelineStep({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${active ? "bg-[#A05068]/10 text-[#B87888]" : done ? "text-[#B87888]" : "text-gray-500"}`}
    >
      {active ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : done ? (
        <div
          className="w-3 h-3 rounded-full flex items-center justify-center holo-gradient"
          style={{
            background:
              "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
          }}
        >
          <HolographicNoise />
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      ) : (
        <div className="w-3 h-3 rounded-full border border-gray-700" />
      )}
      <span className={active || done ? "holo-text" : ""}>{label}</span>
    </div>
  );
}

function GuidedPromptBuilder({
  onClose,
  onApply,
  currentMode,
}: {
  onClose: () => void;
  onApply: (prompt: string) => void;
  currentMode: PlayMode;
}) {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState(currentMode);
  const [style, setStyle] = useState("");
  const [instruments, setInstruments] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [harmonyPolicy, setHarmonyPolicy] = useState("match");
  const [scale, setScale] = useState("auto");
  const [meendEnabled, setMeendEnabled] = useState(false);
  const [form, setForm] = useState("AABA");
  const [buildCurve, setBuildCurve] = useState("gradual");
  const [renderQuality, setRenderQuality] = useState<"preview" | "full">("preview");
  const [notes, setNotes] = useState("");

  const INSTRUMENT_PALETTE = [
    { cat: "Keys", items: ["Piano", "Electric Piano", "Organ", "Clavinet", "Harpsichord"] },
    {
      cat: "Strings",
      items: ["Violin", "Viola", "Cello", "Double Bass", "String Ensemble", "Harp"],
    },
    {
      cat: "Winds",
      items: [
        "Flute",
        "Oboe",
        "Clarinet",
        "Bassoon",
        "Trumpet",
        "Trombone",
        "French Horn",
        "Saxophone",
      ],
    },
    { cat: "Synth", items: ["Analog Pad", "Lead Synth", "Pluck Synth", "Bass Synth", "Arp Synth"] },
    { cat: "Rhythm", items: ["Drum Kit", "Percussion", "Marimba", "Vibraphone", "Timpani"] },
    { cat: "Guitar", items: ["Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Sitar", "Oud"] },
  ];

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  };

  const steps = [
    { label: "Outcome", desc: "What do you want to create?" },
    { label: "Style", desc: "Describe the style or choose a reference" },
    { label: "Instrument Palette", desc: "Select instruments from the palette" },
    { label: "Custom Instruments", desc: "Add custom instruments or override" },
    { label: "Harmony", desc: "Match original or reharmonize?" },
    { label: "Scale & Expression", desc: "Scale and expression settings" },
    { label: "Build & Form", desc: "Energy curve and song form" },
    { label: "Quality", desc: "Render quality preference" },
    { label: "Review", desc: "Review your structured prompt" },
  ];

  const buildPrompt = () => {
    const allInstruments = [
      ...selectedInstruments,
      ...(instruments ? instruments.split(",").map((s) => s.trim()) : []),
    ].filter(Boolean);
    const parts = [
      `Outcome: ${outcome}`,
      style && `Style: ${style}`,
      allInstruments.length > 0 && `Instruments: ${allInstruments.join(", ")}`,
      `Harmony: ${harmonyPolicy}`,
      `Scale: ${scale}`,
      meendEnabled && "Expression: Indian Meend (continuous pitch bend) enabled",
      `Build Curve: ${buildCurve}`,
      `Form: ${form}`,
      `Render Quality: ${renderQuality}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean);
    return parts.join(". ");
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Guided Prompt Builder</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${i <= step ? "holo-gradient" : "bg-gray-200"}`}
              style={
                i <= step
                  ? {
                      background:
                        "linear-gradient(90deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
                    }
                  : undefined
              }
            >
              <HolographicNoise />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Step {step + 1}/{steps.length}: {steps[step].desc}
        </p>

        <div className="min-h-[120px]">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "composition",
                  "interpolation",
                  "chords",
                  "solo",
                  "patch",
                  "ensemble",
                ] as PlayMode[]
              ).map((m) => (
                <button
                  key={m}
                  onClick={() => setOutcome(m)}
                  className={`p-2 rounded-lg border text-left text-xs ${outcome === m ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-200"}`}
                  data-testid={`button-guided-outcome-${m}`}
                >
                  {MODE_CONFIG[m].label}
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <textarea
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. 'airy minimalist with marimba textures' or 'neo-soul with extended jazz harmonies'"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:border-[#A05068] bg-white text-gray-800"
              data-testid="input-guided-style"
            />
          )}
          {step === 2 && (
            <div className="space-y-3">
              {INSTRUMENT_PALETTE.map((cat) => (
                <div key={cat.cat}>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {cat.cat}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cat.items.map((inst) => (
                      <button
                        key={inst}
                        onClick={() => toggleInstrument(inst)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                          selectedInstruments.includes(inst)
                            ? "border-[#A05068] bg-[#A05068]/10 holo-text"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                        data-testid={`button-instrument-${inst.replace(/\s/g, "-").toLowerCase()}`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedInstruments.length > 0 && (
                <p className="text-[9px] holo-text">
                  {selectedInstruments.length} selected: {selectedInstruments.join(", ")}
                </p>
              )}
            </div>
          )}
          {step === 3 && (
            <textarea
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="Add custom instruments not in the palette, e.g. 'koto, tabla, kalimba'"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:border-[#A05068] bg-white text-gray-800"
              data-testid="input-guided-instruments"
            />
          )}
          {step === 4 && (
            <div className="space-y-2">
              {["match", "reharmonize"].map((h) => (
                <button
                  key={h}
                  onClick={() => setHarmonyPolicy(h)}
                  className={`w-full p-3 rounded-lg border text-left text-xs ${harmonyPolicy === h ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-200"}`}
                  data-testid={`button-guided-harmony-${h}`}
                >
                  <span className="font-medium capitalize">{h}</span>
                  <span className="text-gray-500 ml-2">
                    {h === "match" ? "Keep original harmony" : "Allow creative reharmonization"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500">Scale</label>
                <input
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  placeholder="auto (or e.g. 'D dorian', 'Bb mixolydian')"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-[#A05068] mt-1 bg-white text-gray-800"
                  data-testid="input-guided-scale"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={meendEnabled}
                  onChange={(e) => setMeendEnabled(e.target.checked)}
                  className="accent-[#A05068]"
                  data-testid="checkbox-guided-meend"
                />
                Enable Meend (continuous pitch bend / MPE)
              </label>
            </div>
          )}
          {step === 6 && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500">Build Curve</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[
                    { id: "gradual", label: "Gradual Build", desc: "Slow intensity increase" },
                    { id: "peak_valley", label: "Peak & Valley", desc: "Build-drop-build pattern" },
                    { id: "flat", label: "Flat / Constant", desc: "Steady intensity throughout" },
                  ].map((bc) => (
                    <button
                      key={bc.id}
                      onClick={() => setBuildCurve(bc.id)}
                      className={`p-2 rounded-lg border text-left ${buildCurve === bc.id ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-200"}`}
                      data-testid={`button-guided-build-${bc.id}`}
                    >
                      <div className="text-[10px] font-medium text-gray-800">{bc.label}</div>
                      <div className="text-[9px] text-gray-500">{bc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500">Form</label>
                <input
                  value={form}
                  onChange={(e) => setForm(e.target.value)}
                  placeholder="AABA, ABAB, through-composed..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-[#A05068] mt-1 bg-white text-gray-800"
                  data-testid="input-guided-form"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other instructions..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none h-16 focus:outline-none focus:border-[#A05068] mt-1 bg-white text-gray-800"
                  data-testid="input-guided-notes"
                />
              </div>
            </div>
          )}
          {step === 7 && (
            <div className="space-y-2">
              {(
                [
                  {
                    id: "preview",
                    label: "Preview (8-16 bars)",
                    desc: "Fast iteration, shorter output",
                  },
                  { id: "full", label: "Full Render", desc: "Complete arrangement, all bars" },
                ] as const
              ).map((q) => (
                <button
                  key={q.id}
                  onClick={() => setRenderQuality(q.id)}
                  className={`w-full p-3 rounded-lg border text-left text-xs ${renderQuality === q.id ? "border-[#A05068] bg-[#A05068]/5" : "border-gray-200"}`}
                  data-testid={`button-guided-quality-${q.id}`}
                >
                  <span className="font-medium">{q.label}</span>
                  <span className="text-gray-500 ml-2">{q.desc}</span>
                </button>
              ))}
            </div>
          )}
          {step === 8 && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200">
              {buildPrompt()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <Button
            onClick={() => setStep(Math.max(0, step - 1))}
            variant="outline"
            size="sm"
            disabled={step === 0}
            className="text-xs"
            data-testid="button-guided-back"
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              size="sm"
              className="text-xs text-white gap-1 holo-gradient"
              style={{
                background:
                  "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
              }}
              data-testid="button-guided-next"
            >
              <HolographicNoise />
              Next <ChevronRight className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              onClick={() => onApply(buildPrompt())}
              size="sm"
              className="text-xs text-white gap-1 holo-gradient"
              style={{
                background:
                  "linear-gradient(135deg, #4A1E34 0%, #7A3850 10%, #6B2C5A 22%, #9A6878 34%, #5E3870 46%, #8A5868 56%, #4A8E90 68%, #7A4E78 78%, #4A1E34 88%, #7A3850 100%)",
              }}
              data-testid="button-guided-apply"
            >
              <HolographicNoise />
              <Sparkles className="w-3 h-3" /> Apply Prompt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
