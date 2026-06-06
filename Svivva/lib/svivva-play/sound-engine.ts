"use client";

import * as Tone from "tone";
import { MEEND_PREVIEW, resolveInstrumentPreset, resolveOrchestralPercussionPreset, type InstrumentPreset } from "./instruments";
import {
  buildMeendLegatoTimeline,
  type MeendTimelineEvent,
} from "./meend-preview-audio";
import {
  isMeendAccentStem,
  MEEND_ACCENT_GAIN_DB,
  meendAccentSourceName,
} from "./meend-showcase-stem";
import { isOrchestralMeendStem } from "./orchestral-compose";
import {
  buildMeendStemExpression,
  stemHasOverlappingNotes,
} from "./scale-key-guard";

export interface MidiEvent {
  note: number;
  velocity: number;
  startBeat: number;
  duration: number;
  channel?: number;
}

export interface StemPlayback {
  name: string;
  role: string;
  instrumentHint: string;
  midiEvents: MidiEvent[];
  muted: boolean;
  soloed: boolean;
  pan: number;
  gainDb: number;
  expression?: {
    cc?: { beat: number; cc_number: number; value: number }[];
    pitchbend?: { beat: number; value: number }[];
    meend?: boolean;
    monophonic?: boolean;
  };
}

export type LoadStemsOptions = {
  /** Apply meend preview to every stem (matches Play UI checkbox). */
  forceMeend?: boolean;
};

export type WarmUpOptions = {
  /** Build routing only — skip Tone.start (safe from useEffect). */
  skipWarmUp?: boolean;
};

interface StemChannel {
  synth:
    | Tone.PolySynth
    | Tone.MonoSynth
    | Tone.MembraneSynth
    | Tone.MetalSynth
    | Tone.PluckSynth
    | Tone.NoiseSynth;
  panner: Tone.Panner;
  volume: Tone.Volume;
  effects: Tone.ToneAudioNode[];
  part: Tone.Part | null;
  previewGainDb: number;
}

export class SvivvaSoundEngine {
  private channels: Map<string, StemChannel> = new Map();
  private bpm: number = 120;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private duration: number = 0;
  private masterVolume: Tone.Volume | null = null;
  private loadMutex: Promise<void> = Promise.resolve();

  private isNodeDisposed(node: Tone.ToneAudioNode): boolean {
    return Boolean((node as { disposed?: boolean }).disposed);
  }

  /** Build routing graph without requiring a user gesture (suspended context is OK). */
  private prepareMasterBus(): void {
    if (this.masterVolume && !this.isNodeDisposed(this.masterVolume)) return;
    try {
      if (this.masterVolume) {
        try {
          this.masterVolume.dispose();
        } catch {
          /* skip */
        }
      }
      this.masterVolume = new Tone.Volume(6).toDestination();
    } catch (err) {
      console.warn("Master bus setup deferred:", err);
      this.masterVolume = null;
    }
  }

  private normalizeOscillatorType(type: string): string {
    const base = type.replace(/\d+$/, "");
    if (["sine", "triangle", "sawtooth", "square"].includes(base)) return base;
    if (base.startsWith("triangle") || type.includes("triangle")) return "triangle";
    if (base.startsWith("sawtooth") || type.includes("saw")) return "sawtooth";
    if (base.startsWith("sine")) return "sine";
    return "triangle";
  }

  /** Start/resume Web Audio — call from play() after user gesture. */
  private async ensureAudioRunning(): Promise<void> {
    try {
      await Tone.start();
      const ctx = Tone.getContext();
      if (ctx.state !== "running") {
        await ctx.resume();
      }
    } catch (err) {
      console.warn("AudioContext resume deferred:", err);
    }
    this.prepareMasterBus();
    this.isInitialized = true;
  }

  /** Prepare graph for stem scheduling (no Tone.start — safe from useEffect). */
  init() {
    this.prepareMasterBus();
  }

  /** Unlock audio output — call from play button (user gesture). */
  async warmUpForPlayback(options?: WarmUpOptions): Promise<void> {
    if (options?.skipWarmUp) {
      this.init();
      return;
    }
    await this.ensureAudioRunning();
  }

  hasStems(): boolean {
    return this.channels.size > 0;
  }

  setMasterVolume(percent: number) {
    if (!this.masterVolume) return;
    const db = percent <= 0 ? -Infinity : 20 * Math.log10(percent / 100);
    this.masterVolume.volume.value = db;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
  }

  getBpm() {
    return this.bpm;
  }

  private beatToSeconds(beat: number): number {
    return (beat * 60) / this.bpm;
  }

  private noteToFreq(midiNote: number): string {
    return Tone.Frequency(midiNote, "midi").toNote();
  }

  private createEffectsChain(fxDefs?: InstrumentPreset["fx"]): Tone.ToneAudioNode[] {
    if (!fxDefs || fxDefs.length === 0) return [];
    const effects: Tone.ToneAudioNode[] = [];
    for (const fx of fxDefs) {
      try {
        switch (fx.type) {
          case "reverb":
            effects.push(
              new Tone.Reverb({
                wet: fx.wet,
                decay: (fx.decay as number) || 2,
                preDelay: (fx.preDelay as number) || 0.01,
              }),
            );
            break;
          case "delay":
            effects.push(
              new Tone.FeedbackDelay({
                wet: fx.wet,
                delayTime: (fx.delayTime as number) || 0.25,
                feedback: (fx.feedback as number) || 0.3,
              }),
            );
            break;
          case "chorus":
            effects.push(
              new Tone.Chorus({
                wet: fx.wet,
                frequency: (fx.frequency as number) || 1.5,
                delayTime: (fx.delayTime as number) || 3.5,
                depth: (fx.depth as number) || 0.5,
              }).start(),
            );
            break;
          case "distortion":
            effects.push(
              new Tone.Distortion({ wet: fx.wet, distortion: (fx.amount as number) || 0.3 }),
            );
            break;
          case "phaser":
            effects.push(
              new Tone.Phaser({
                wet: fx.wet,
                frequency: (fx.frequency as number) || 0.5,
                octaves: (fx.octaves as number) || 3,
                baseFrequency: (fx.baseFrequency as number) || 350,
              }),
            );
            break;
          case "compressor":
            effects.push(
              new Tone.Compressor({ threshold: -24, ratio: 4, attack: 0.003, release: 0.25 }),
            );
            break;
          case "eq":
            effects.push(
              new Tone.EQ3({
                low: (fx.low as number) || 0,
                mid: (fx.mid as number) || 0,
                high: (fx.high as number) || 0,
              }),
            );
            break;
        }
      } catch {
        // skip unsupported effect
      }
    }
    return effects;
  }

  /** Live preview: dry synth only (effects often fail without a user gesture). */
  private createLiveEffectsChain(): Tone.ToneAudioNode[] {
    return [];
  }

  private createSynth(preset: InstrumentPreset): StemChannel["synth"] {
    const oscType = this.normalizeOscillatorType(preset.oscillator.type) as OscillatorType;

    switch (preset.synthType) {
      case "fm":
        return new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 24,
          voice: Tone.FMSynth,
          options: {
            oscillator: { type: oscType },
            envelope: preset.envelope,
            modulationIndex: preset.modulationIndex ?? 3,
            harmonicity: preset.harmonicity ?? 1,
            volume: preset.volume ?? -8,
          },
        } as any);
      case "am":
        return new Tone.PolySynth(Tone.AMSynth, {
          maxPolyphony: 24,
          voice: Tone.AMSynth,
          options: {
            oscillator: { type: oscType },
            envelope: preset.envelope,
            harmonicity: preset.harmonicity ?? 2,
            volume: preset.volume ?? -8,
          },
        } as any);
      case "mono":
        return new Tone.MonoSynth({
          oscillator: { type: oscType },
          envelope: preset.envelope,
          filter: preset.filter
            ? {
                type: preset.filter.type as BiquadFilterType,
                frequency: preset.filter.frequency,
                rolloff: preset.filter.rolloff as Tone.FilterRollOff,
                Q: preset.filter.Q,
              }
            : undefined,
          filterEnvelope: preset.filterEnvelope
            ? {
                attack: preset.filterEnvelope.attack,
                decay: preset.filterEnvelope.decay,
                sustain: preset.filterEnvelope.sustain,
                release: preset.filterEnvelope.release,
                baseFrequency: preset.filterEnvelope.baseFrequency,
                octaves: preset.filterEnvelope.octaves,
              }
            : undefined,
          volume: preset.volume ?? -8,
          portamento: preset.portamento ?? 0,
        });
      case "membrane":
        return new Tone.MembraneSynth({
          envelope: {
            attack: preset.envelope.attack,
            decay: preset.envelope.decay,
            sustain: preset.envelope.sustain,
            release: preset.envelope.release,
          },
          volume: preset.volume ?? -4,
          pitchDecay: 0.05,
          octaves: 6,
        });
      case "metal":
        return new Tone.MetalSynth({
          envelope: {
            attack: preset.envelope.attack,
            decay: preset.envelope.decay,
            release: preset.envelope.release,
          },
          volume: preset.volume ?? -12,
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5,
        });
      case "pluck":
        return new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.9,
          volume: preset.volume ?? -6,
        });
      case "noise":
        return new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: preset.envelope,
          volume: preset.volume ?? -12,
        });
      default:
        return new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 24,
          voice: Tone.Synth,
          options: {
            oscillator: { type: oscType },
            envelope: preset.envelope,
            volume: preset.volume ?? -8,
          },
        } as any);
    }
  }

  private resolveStemPreset(stem: StemPlayback): InstrumentPreset {
    const hint = (stem.instrumentHint ?? "").toLowerCase();
    const name = stem.name.toLowerCase();
    const role = (stem.role ?? "").toLowerCase();
    if (
      role === "percussion" ||
      /cymbal|triangle|cabasa|timpani|percussion/.test(hint) ||
      /cymbal|triangle|cabasa|timpani/.test(name)
    ) {
      if (/triangle/.test(hint) || /triangle/.test(name)) return resolveOrchestralPercussionPreset(45);
      if (/cabasa/.test(hint) || /cabasa/.test(name)) return resolveOrchestralPercussionPreset(47);
      if (/cymbal/.test(hint) || /cymbal/.test(name)) return resolveOrchestralPercussionPreset(43);
      if (/timpani/.test(hint) || /timpani/.test(name)) return resolveInstrumentPreset("timpani", "percussion");
      const firstNote = stem.midiEvents?.[0]?.note ?? 43;
      return resolveOrchestralPercussionPreset(firstNote);
    }
    return resolveInstrumentPreset(stem.instrumentHint, stem.role);
  }

  private previewGainDb(role: string, gainDb: number, forceMeend = false): number {
    const r = role.toLowerCase();
    if (forceMeend && (r === "melody" || r === "lead" || r === "solo" || r === "hocket")) {
      return gainDb + 6;
    }
    if (r === "melody" || r === "lead" || r === "solo" || r === "hocket" || r.includes("hocket")) {
      return gainDb + 4;
    }
    // Chords/harmony need a solid boost so they cut through clearly.
    if (r === "harmony" || r === "chords" || r === "comp" || r === "pad") return gainDb + 6;
    return gainDb;
  }

  private triggerNoteAt(
    synth: StemChannel["synth"],
    note: string,
    dur: number,
    time: number,
    vel: number,
    hasMeend: boolean,
  ): void {
    const duration = Math.max(0.05, dur);
    if (synth instanceof Tone.MonoSynth) {
      if (hasMeend) {
        synth.detune.value = 0;
        synth.triggerAttack(note, time, vel);
        synth.triggerRelease(time + duration);
      } else {
        synth.triggerAttackRelease(note, duration, time, vel);
      }
    } else if (synth instanceof Tone.MembraneSynth) {
      synth.triggerAttackRelease(note, duration, time, vel);
    } else if (synth instanceof Tone.MetalSynth) {
      synth.triggerAttackRelease(note, duration, time, vel);
    } else if (synth instanceof Tone.PluckSynth) {
      synth.triggerAttackRelease(note, duration, time, vel);
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease(duration, time, vel);
    } else if (synth instanceof Tone.PolySynth) {
      synth.triggerAttackRelease(note, duration, time, vel);
    }
  }

  private createSynthSafe(preset: InstrumentPreset): StemChannel["synth"] {
    try {
      return this.createSynth(preset);
    } catch (err) {
      console.warn("Synth preset fallback:", preset.oscillator.type, err);
      return new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 20,
        voice: Tone.Synth,
        options: {
          oscillator: { type: "triangle" },
          envelope: { attack: 0.02, decay: 0.25, sustain: 0.45, release: 0.35 },
          volume: -6,
        },
      } as any);
    }
  }

  /** Meend preview must stay monophonic — never fall back to PolySynth. */
  private createMeendSynth(preset: InstrumentPreset = MEEND_PREVIEW): Tone.MonoSynth {
    try {
      const synth = this.createSynth(preset);
      if (synth instanceof Tone.MonoSynth) {
        synth.volume.value = (preset.volume ?? -8) + 6;
        return synth;
      }
    } catch (err) {
      console.warn("Meend preset failed, using bare MonoSynth:", err);
    }
    return new Tone.MonoSynth({
      oscillator: { type: (preset.oscillator.type as "sine") || "sine" },
      envelope: preset.envelope,
      volume: (preset.volume ?? -8) + 6,
    });
  }

  async loadStems(stems: StemPlayback[], options?: LoadStemsOptions) {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prev = this.loadMutex;
    this.loadMutex = prev.then(() => gate);
    await prev;

    try {
      await this.loadStemsBody(stems, options);
    } finally {
      release();
    }
  }

  private async loadStemsBody(stems: StemPlayback[], options?: LoadStemsOptions) {
    const forceMeend = Boolean(options?.forceMeend);
    console.log("🎵 Loading", stems.length, "stems");
    this.prepareMasterBus();
    this.disposeChannels();
    const transport = Tone.getTransport();

    if (transport.state === "started" || transport.state === "paused") {
      transport.stop();
    }
    transport.position = 0;
    transport.bpm.value = this.bpm;
    transport.cancel();

    let maxBeat = 0;
    this.duration = 0;

    for (const stem of stems) {
      try {
        const events = (stem.midiEvents || []) as MidiEvent[];
        const sortedEvents = [...events].sort((a, b) => a.startBeat - b.startBeat);
        if (sortedEvents.length === 0) {
          console.warn(`Skipping stem "${stem.name}" — no MIDI events`);
          continue;
        }

        let midiEvents = sortedEvents;
        let pitchBends = stem.expression?.pitchbend ?? [];
        const polyphonic =
          typeof stem.expression?.monophonic === "boolean"
            ? !stem.expression.monophonic
            : stemHasOverlappingNotes(sortedEvents);
        const isMeendAccent = isMeendAccentStem(stem.name);
        const wantsMeend =
          forceMeend || pitchBends.length > 0 || Boolean(stem.expression?.meend);
        const isOrchMeend =
          Boolean(stem.expression?.meend) && isOrchestralMeendStem(stem.name) && !isMeendAccent;
        const useMeendMono =
          wantsMeend &&
          !polyphonic &&
          (isMeendAccent ||
            (Boolean(stem.expression?.meend) && Boolean(stem.expression?.monophonic)));

        if (useMeendMono && pitchBends.length === 0) {
          const built = buildMeendStemExpression(midiEvents, false);
          midiEvents = built.midiEvents as MidiEvent[];
          pitchBends = built.pitchbend;
        }

        const meendPreset = isOrchMeend
          ? resolveInstrumentPreset(stem.instrumentHint, stem.role)
          : MEEND_PREVIEW;
        const preset = useMeendMono ? meendPreset : this.resolveStemPreset(stem);
        const synth = useMeendMono
          ? this.createMeendSynth(meendPreset)
          : this.createSynthSafe(preset);
        const useLegatoMeend = useMeendMono;

        const panner = new Tone.Panner(stem.pan / 100);
        const previewGainDb = isMeendAccent
          ? (stem.gainDb ?? MEEND_ACCENT_GAIN_DB) + (isOrchestralMeendStem(meendAccentSourceName(stem.name) ?? "") ? 10 : 8)
          : isOrchMeend
            ? this.previewGainDb(stem.role, stem.gainDb || 0, true) + 8
            : this.previewGainDb(stem.role, stem.gainDb || 0, forceMeend);
        const volume = new Tone.Volume(previewGainDb);
        const effects = this.createLiveEffectsChain();

        const chain: Tone.ToneAudioNode[] = [synth as any, ...effects, panner, volume];
        for (let i = 0; i < chain.length - 1; i++) {
          chain[i].connect(chain[i + 1]);
        }
        if (this.masterVolume && !this.isNodeDisposed(this.masterVolume)) {
          chain[chain.length - 1].connect(this.masterVolume);
        } else {
          chain[chain.length - 1].toDestination();
        }

        let timeline: MeendTimelineEvent[] | {
          time: number;
          note: string;
          duration: number;
          velocity: number;
        }[] = [];

        if (useLegatoMeend) {
          const legatoTimeline = buildMeendLegatoTimeline(
            midiEvents,
            pitchBends,
            (b) => this.beatToSeconds(b),
            (midi) => this.noteToFreq(midi),
          );
          if (legatoTimeline.length === 0) {
            useLegatoMeend = false;
          } else {
            timeline = legatoTimeline;
            for (const evt of midiEvents) {
              maxBeat = Math.max(maxBeat, evt.startBeat + evt.duration);
            }
            const release = legatoTimeline.find((e) => e.type === "release");
            if (release) maxBeat = Math.max(maxBeat, (release.time * this.bpm) / 60);
          }
        }
        if (!useLegatoMeend) {
          const plain: { time: number; note: string; duration: number; velocity: number }[] = [];
          for (const evt of midiEvents) {
            const endBeat = evt.startBeat + evt.duration;
            if (endBeat > maxBeat) maxBeat = endBeat;
            plain.push({
              time: this.beatToSeconds(evt.startBeat),
              note: this.noteToFreq(evt.note),
              duration: this.beatToSeconds(evt.duration),
              velocity: Math.max(0.01, Math.min(1, evt.velocity / 127)),
            });
          }
          timeline = plain;
        }

        const legatoActive = useLegatoMeend;
        const part = new Tone.Part((time, value: MeendTimelineEvent | { note: string; duration: number; velocity: number }) => {
          try {
            if (!synth) return;
            if (legatoActive && "type" in value) {
              const ev = value as MeendTimelineEvent;
              if (!(synth instanceof Tone.MonoSynth)) return;
              if (ev.type === "attack") {
                synth.detune.value = 0;
                synth.triggerAttack(ev.note, time, ev.velocity);
              } else if (ev.type === "tailBend" || ev.type === "bend") {
                synth.detune.rampTo(ev.cents, ev.glide, time);
              } else if (ev.type === "release") {
                synth.detune.rampTo(0, 0.05, time);
                synth.triggerRelease(time);
              }
              return;
            }
            if ("note" in value && "duration" in value) {
              this.triggerNoteAt(
                synth,
                value.note,
                value.duration,
                time,
                value.velocity,
                false,
              );
            }
          } catch (e) {
            console.error("Part event error:", e);
          }
        }, timeline as MeendTimelineEvent[]);

        if (timeline.length === 0) {
          console.warn(`Skipping stem "${stem.name}" — empty playback timeline`);
          try {
            part.dispose();
            synth.dispose();
            panner.dispose();
            volume.dispose();
          } catch {
            /* skip */
          }
          continue;
        }

        this.channels.set(stem.name, {
          synth,
          panner,
          volume,
          effects,
          part,
          previewGainDb,
        });
      } catch (stemErr) {
        console.error(`🔴 Failed to load stem "${stem.name}":`, stemErr);
      }
    }

    if (this.channels.size === 0) {
      throw new Error("No stems could be loaded for playback");
    }

    const maxBeatDuration = maxBeat > 0 ? this.beatToSeconds(maxBeat) : 0;
    const releaseBuffer = 0.5;
    this.duration = maxBeatDuration + releaseBuffer;
    console.log(
      `🎵 Loaded ${this.channels.size}/${stems.length} stems, duration ${this.duration.toFixed(2)}s`,
    );
  }

  updateMix(stemName: string, opts: { muted?: boolean; pan?: number; gainDb?: number }) {
    const ch = this.channels.get(stemName);
    if (!ch) return;
    if (opts.muted !== undefined) {
      ch.volume.volume.value = opts.muted ? -Infinity : (opts.gainDb ?? 0);
    }
    if (opts.pan !== undefined) {
      ch.panner.pan.value = opts.pan / 100;
    }
    if (opts.gainDb !== undefined && !opts.muted) {
      ch.volume.volume.value = opts.gainDb;
    }
  }

  applySoloState(stems: { name: string; soloed: boolean; muted: boolean; gainDb: number }[]) {
    const anySoloed = stems.some((s) => s.soloed);
    for (const stem of stems) {
      const ch = this.channels.get(stem.name);
      if (!ch) continue;
      const gain = ch.previewGainDb ?? stem.gainDb ?? 0;
      if (anySoloed) {
        ch.volume.volume.value = stem.soloed ? gain : -Infinity;
      } else {
        ch.volume.volume.value = stem.muted ? -Infinity : gain;
      }
    }
  }

  async play() {
    try {
      await this.ensureAudioRunning();
      if (this.channels.size === 0) {
        throw new Error("No stems loaded for playback");
      }
      const transport = Tone.getTransport();
      console.log(
        "🎵 Starting playback, channels:",
        this.channels.size,
        "duration:",
        this.duration,
        "context:",
        Tone.getContext().state,
        "transport:",
        transport.state,
      );

      if (transport.state === "started" || transport.state === "paused") {
        transport.stop();
      }
      transport.position = 0;
      for (const ch of this.channels.values()) {
        try {
          ch.part?.stop(0);
          ch.part?.start(0);
        } catch {
          /* skip */
        }
      }
      transport.start();
      this.isPlaying = transport.state === "started";
    } catch (err) {
      console.error("🔴 Playback error:", err);
      throw err;
    }
  }

  private releaseAllVoices(): void {
    for (const ch of this.channels.values()) {
      try {
        if (ch.synth instanceof Tone.MonoSynth) {
          ch.synth.detune.value = 0;
          ch.synth.triggerRelease();
        } else if ("releaseAll" in ch.synth && typeof ch.synth.releaseAll === "function") {
          (ch.synth as Tone.PolySynth).releaseAll(0);
        }
      } catch {
        /* skip */
      }
    }
  }

  pause() {
    Tone.getTransport().pause();
    this.releaseAllVoices();
    this.isPlaying = false;
  }

  stop() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    for (const ch of this.channels.values()) {
      try {
        ch.part?.stop(0);
      } catch {
        /* skip */
      }
    }
    this.releaseAllVoices();
    this.isPlaying = false;
  }

  seek(seconds: number) {
    Tone.getTransport().seconds = seconds;
  }

  getPosition(): number {
    return Tone.getTransport().seconds;
  }

  getDuration(): number {
    return this.duration;
  }

  getPlayState(): boolean {
    return Tone.getTransport().state === "started";
  }

  async renderOffline(stems: StemPlayback[], durationSeconds?: number): Promise<Blob> {
    const dur = durationSeconds || this.duration || 30;

    const buffer = await Tone.Offline(({ transport }) => {
      transport.bpm.value = this.bpm;

      for (const stem of stems) {
        if (stem.muted) continue;
        const preset = resolveInstrumentPreset(stem.instrumentHint, stem.role);
        const synth = this.createSynth(preset);
        const panner = new Tone.Panner(stem.pan / 100);
        const vol = new Tone.Volume(stem.gainDb || 0);
        const effects = this.createEffectsChain(
          preset.fx?.filter((fx) => fx.type !== "reverb"),
        );

        const chain: Tone.ToneAudioNode[] = [synth as any, ...effects, panner, vol];
        for (let i = 0; i < chain.length - 1; i++) {
          chain[i].connect(chain[i + 1]);
        }
        chain[chain.length - 1].toDestination();

        const events = (stem.midiEvents || []) as MidiEvent[];
        for (const evt of events) {
          const time = (evt.startBeat * 60) / this.bpm;
          const evtDur = (evt.duration * 60) / this.bpm;
          const note = Tone.Frequency(evt.note, "midi").toNote();
          const vel = Math.max(0.01, Math.min(1, evt.velocity / 127));

          transport.schedule((t) => {
            try {
              if (synth instanceof Tone.MonoSynth) {
                synth.triggerAttackRelease(note, evtDur, t, vel);
              } else if (synth instanceof Tone.MembraneSynth) {
                synth.triggerAttackRelease(note, evtDur, t, vel);
              } else if (synth instanceof Tone.MetalSynth) {
                synth.triggerAttackRelease(evtDur, t, vel);
              } else if (synth instanceof Tone.PluckSynth) {
                synth.triggerAttack(note, t);
              } else if (synth instanceof Tone.NoiseSynth) {
                synth.triggerAttackRelease(evtDur, t, vel);
              } else if (synth instanceof Tone.PolySynth) {
                synth.triggerAttackRelease(note, evtDur, t, vel);
              }
            } catch {
              /* skip */
            }
          }, time);
        }
      }

      transport.start();
    }, dur);

    const wav = audioBufferToWav(buffer);
    return new Blob([wav], { type: "audio/wav" });
  }

  /** Tear down stem voices/schedules; keep master bus for the next load. */
  private disposeChannels() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    for (const [, ch] of this.channels) {
      try {
        ch.part?.dispose();
        if ("releaseAll" in ch.synth && typeof ch.synth.releaseAll === "function") {
          (ch.synth as any).releaseAll();
        }
        ch.synth.dispose();
        ch.panner.dispose();
        ch.volume.dispose();
        ch.effects.forEach((fx) => fx.dispose());
      } catch {
        /* skip */
      }
    }
    this.channels.clear();
    this.isPlaying = false;
  }

  dispose() {
    this.disposeChannels();
    try {
      this.masterVolume?.dispose();
    } catch {
      /* skip */
    }
    this.masterVolume = null;
    this.isInitialized = false;
    this.duration = 0;
  }
}

function audioBufferToWav(buffer: Tone.ToneAudioBuffer): ArrayBuffer {
  const abuf = buffer.get();
  if (!abuf) throw new Error("No audio buffer");
  const numChannels = abuf.numberOfChannels;
  const sampleRate = abuf.sampleRate;
  const length = abuf.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(abuf.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

let engineInstance: SvivvaSoundEngine | null = null;

export function getSoundEngine(): SvivvaSoundEngine {
  if (!engineInstance) {
    engineInstance = new SvivvaSoundEngine();
  }
  return engineInstance;
}
