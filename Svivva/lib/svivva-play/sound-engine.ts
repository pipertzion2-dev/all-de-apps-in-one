"use client";

import * as Tone from "tone";
import { resolveInstrumentPreset, type InstrumentPreset } from "./instruments";

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
  };
}

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
  scheduledIds: number[];
}

export class SvivvaSoundEngine {
  private channels: Map<string, StemChannel> = new Map();
  private bpm: number = 120;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private duration: number = 0;
  private masterVolume: Tone.Volume | null = null;

  /** Start/resume Web Audio — must run on user gesture before audible playback. */
  private async ensureAudioRunning(): Promise<void> {
    await Tone.start();
    const ctx = Tone.getContext();
    if (ctx.state !== "running") {
      await ctx.resume();
    }
    if (!this.masterVolume || this.masterVolume.disposed) {
      this.masterVolume = new Tone.Volume(3).toDestination();
    }
    this.isInitialized = true;
  }

  async init() {
    try {
      await this.ensureAudioRunning();
      console.log("🎵 Sound engine ready, context:", Tone.getContext().state);
    } catch (err) {
      console.error("🔴 Sound engine init error:", err);
      throw err;
    }
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

  private createSynth(preset: InstrumentPreset): StemChannel["synth"] {
    const oscType = preset.oscillator.type as any;

    switch (preset.synthType) {
      case "fm":
        return new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
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
          maxPolyphony: 16,
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
          maxPolyphony: 16,
          voice: Tone.Synth,
          options: {
            oscillator: { type: oscType },
            envelope: preset.envelope,
            volume: preset.volume ?? -8,
          },
        } as any);
    }
  }

  async loadStems(stems: StemPlayback[]) {
    console.log(
      "🎵 Loading",
      stems.length,
      "stems, masterVolume:",
      this.masterVolume ? "connected" : "null (will use destination)",
    );
    this.disposeChannels();
    const transport = Tone.getTransport();

    // Ensure transport is stopped and reset
    if (transport.state === "started" || transport.state === "paused") {
      transport.stop();
    }
    transport.position = 0;
    transport.bpm.value = this.bpm;
    transport.cancel();

    let maxBeat = 0;
    this.duration = 0;

    for (const stem of stems) {
      const preset = resolveInstrumentPreset(stem.instrumentHint, stem.role);
      const pitchBends = stem.expression?.pitchbend ?? [];
      const hasMeend = pitchBends.length > 0 || Boolean(stem.expression?.meend);
      const synth = this.createSynth(
        hasMeend ? { ...preset, synthType: "mono", portamento: 0.22 } : preset,
      );
      const panner = new Tone.Panner(stem.pan / 100);
      const volume = new Tone.Volume(stem.gainDb || 0);
      const effects = this.createEffectsChain(preset.fx);
      for (const fx of effects) {
        if (fx instanceof Tone.Reverb) {
          await fx.generate();
        }
      }

      const chain: Tone.ToneAudioNode[] = [synth as any, ...effects, panner, volume];
      for (let i = 0; i < chain.length - 1; i++) {
        chain[i].connect(chain[i + 1]);
      }
      const destination = this.masterVolume || Tone.getDestination();
      chain[chain.length - 1].connect(destination);
      console.log(`🎵 Stem "${stem.name}" connected (gain: ${stem.gainDb || 0}dB)`);

      const scheduledIds: number[] = [];
      const events = (stem.midiEvents || []) as MidiEvent[];
      const sortedEvents = [...events].sort((a, b) => a.startBeat - b.startBeat);

      for (const evt of sortedEvents) {
        const time = this.beatToSeconds(evt.startBeat);
        const dur = this.beatToSeconds(evt.duration);
        const note = this.noteToFreq(evt.note);
        const vel = Math.max(0.01, Math.min(1, evt.velocity / 127));
        const endBeat = evt.startBeat + evt.duration;
        if (endBeat > maxBeat) maxBeat = endBeat;

        const id = transport.schedule((t) => {
          try {
            if (synth instanceof Tone.MonoSynth) {
              if (hasMeend) synth.detune.value = 0;
              synth.triggerAttackRelease(note, dur, t, vel);
            } else if (synth instanceof Tone.MembraneSynth) {
              synth.triggerAttackRelease(note, dur, t, vel);
            } else if (synth instanceof Tone.MetalSynth) {
              synth.triggerAttackRelease(dur, t, vel);
            } else if (synth instanceof Tone.PluckSynth) {
              synth.triggerAttack(note, t);
            } else if (synth instanceof Tone.NoiseSynth) {
              synth.triggerAttackRelease(dur, t, vel);
            } else if (synth instanceof Tone.PolySynth) {
              synth.triggerAttackRelease(note, dur, t, vel);
            }
            if (evt === sortedEvents[0]) {
              console.log(`🔊 First note scheduled: ${stem.name}, note ${evt.note}, vel ${vel}`);
            }
          } catch (e) {
            console.error("Note trigger error:", e);
          }
        }, time);
        scheduledIds.push(id);

        if (hasMeend && synth instanceof Tone.MonoSynth) {
          for (const pb of pitchBends) {
            if (pb.beat < evt.startBeat - 0.001 || pb.beat > endBeat + 0.001) continue;
            const pbTime = this.beatToSeconds(pb.beat);
            scheduledIds.push(
              transport.schedule(() => {
                synth.detune.value = (pb.value / 8192) * 200;
              }, pbTime),
            );
          }
        }
      }

      this.channels.set(stem.name, {
        synth,
        panner,
        volume,
        effects,
        scheduledIds,
      });
    }

    // Calculate duration: convert max beat to seconds + add 0.5 sec buffer for note release/reverb decay
    const maxBeatDuration = maxBeat > 0 ? this.beatToSeconds(maxBeat) : 0;
    const releaseBuffer = 0.5; // Minimal buffer for synth release
    this.duration = maxBeatDuration + releaseBuffer;
    console.log(
      `🎵 Song duration: ${maxBeat} beats = ${maxBeatDuration.toFixed(2)}s + ${releaseBuffer}s buffer = ${this.duration.toFixed(2)}s total`,
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
      if (anySoloed) {
        ch.volume.volume.value = stem.soloed ? stem.gainDb || 0 : -Infinity;
      } else {
        ch.volume.volume.value = stem.muted ? -Infinity : stem.gainDb || 0;
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

      if (transport.state === "paused") {
        transport.start();
      } else if (transport.state !== "started") {
        transport.start();
      }
      this.isPlaying = true;
    } catch (err) {
      console.error("🔴 Playback error:", err);
      throw err;
    }
  }

  pause() {
    Tone.getTransport().pause();
    this.isPlaying = false;
  }

  stop() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
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
    return this.isPlaying;
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
