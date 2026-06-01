"use client";

import { useMemo } from "react";
import { SvivvaPlayStage3D, type PlayStageModel } from "@/components/svivva-play-stage-3d";
import type { TranscribedNote } from "@/lib/svivva-play/audio-transcription";
import type { ChordSegment } from "@/lib/svivva-play/chord-from-chroma";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiLabel(midi: number): string {
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${oct}`;
}

export function SvivvaPlayStagePanel({
  model,
  waveformPeaks = [],
  audioNotes = [],
  midiNotes = [],
  chords = [],
  durationSec = 0,
  bpm = 120,
  playbackSec = 0,
  alignOffsetSec = 0,
  alignScore = 0,
  onAlignOffsetChange,
  isTranscribing = false,
  audioName,
  hasMelodyne = false,
  hasAudioTrack = false,
}: {
  model: PlayStageModel;
  waveformPeaks?: number[];
  audioNotes?: TranscribedNote[];
  midiNotes?: TranscribedNote[];
  chords?: ChordSegment[];
  durationSec?: number;
  bpm?: number;
  playbackSec?: number;
  alignOffsetSec?: number;
  alignScore?: number;
  onAlignOffsetChange?: (sec: number) => void;
  isTranscribing?: boolean;
  audioName?: string;
  hasMelodyne?: boolean;
  hasAudioTrack?: boolean;
}) {
  const minMidi = 48;
  const maxMidi = 84;
  const range = maxMidi - minMidi + 1;

  const playheadPct = durationSec > 0 ? Math.min(100, (playbackSec / durationSec) * 100) : 0;

  const gridNotes = useMemo(() => {
    const items: {
      id: string;
      midi: number;
      startPct: number;
      widthPct: number;
      lane: number;
      color: string;
    }[] = [];
    for (const n of audioNotes) {
      if (n.midi < minMidi - 6 || n.midi > maxMidi + 6) continue;
      items.push({
        id: `a-${n.startSec}-${n.midi}`,
        midi: n.midi,
        startPct: durationSec > 0 ? (n.startSec / durationSec) * 100 : 0,
        widthPct:
          durationSec > 0 ? Math.max(0.4, ((n.endSec - n.startSec) / durationSec) * 100) : 1,
        lane: maxMidi - Math.min(maxMidi, Math.max(minMidi, n.midi)),
        color: "rgba(160, 80, 104, 0.85)",
      });
    }
    for (const n of midiNotes) {
      const start = n.startSec;
      if (n.midi < minMidi - 6 || n.midi > maxMidi + 6) continue;
      items.push({
        id: `m-${start}-${n.midi}`,
        midi: n.midi,
        startPct: durationSec > 0 ? (start / durationSec) * 100 : 0,
        widthPct:
          durationSec > 0 ? Math.max(0.4, ((n.endSec - n.startSec) / durationSec) * 100) : 1,
        lane: maxMidi - Math.min(maxMidi, Math.max(minMidi, n.midi)),
        color: "rgba(91, 168, 160, 0.9)",
      });
    }
    return items;
  }, [audioNotes, midiNotes, durationSec]);

  return (
    <div className="rounded-lg border border-gray-800 bg-[#060606] overflow-hidden flex flex-col min-h-[280px]">
      <div className="px-3 py-2 border-b border-gray-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Play stage — audio + Melodyne
          </h4>
          <p className="text-[9px] text-gray-500 mt-0.5">
            {audioName || "Add your audio file and matching Melodyne .mid"} · rose = audio pitch ·
            teal = Melodyne harmonics
            {hasMelodyne && hasAudioTrack ? " · chords from both" : ""}
          </p>
        </div>
        {midiNotes.length > 0 && (
          <div className="flex items-center gap-2 text-[9px] text-gray-500">
            <span>Align</span>
            <input
              type="range"
              min={-2000}
              max={2000}
              step={10}
              value={Math.round(alignOffsetSec * 1000)}
              onChange={(e) => onAlignOffsetChange?.(Number(e.target.value) / 1000)}
              className="w-24 accent-[#5BA8A0]"
            />
            <span className="font-mono text-[#5BA8A0]">
              {(alignOffsetSec * 1000).toFixed(0)} ms · {(alignScore * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="relative h-14 mx-3 mt-2 rounded bg-[#0d0d0d] border border-gray-800 overflow-hidden">
        {waveformPeaks.length > 0 ? (
          <div className="absolute inset-0 flex items-center gap-px px-0.5">
            {waveformPeaks.map((p, i) => (
              <div
                key={i}
                className="flex-1 bg-[#A05068]/60 rounded-[1px]"
                style={{ height: `${Math.max(8, p * 100)}%`, alignSelf: "center" }}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-600">
            {isTranscribing ? "Transcribing pitch…" : "Waveform appears after import"}
          </div>
        )}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/70 z-10 pointer-events-none"
          style={{ left: `${playheadPct}%` }}
        />
      </div>

      <div className="relative mx-3 mt-2 mb-1 flex-1 min-h-[140px] rounded bg-[#0a0a0a] border border-gray-800 overflow-hidden">
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: range }).map((_, row) => (
            <div key={row} className="flex-1 border-b border-gray-900/60" />
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col text-[7px] text-gray-600 font-mono z-[1] pointer-events-none">
          {[72, 67, 62, 57, 52].map((m) => (
            <span key={m} className="flex-1 flex items-center pl-0.5">
              {midiLabel(m)}
            </span>
          ))}
        </div>
        <div className="absolute left-8 right-0 top-0 bottom-0">
          {gridNotes.map((n) => (
            <div
              key={n.id}
              className="absolute rounded-sm"
              style={{
                left: `${n.startPct}%`,
                width: `${n.widthPct}%`,
                top: `${(n.lane / range) * 100}%`,
                height: `${100 / range - 0.5}%`,
                background: n.color,
                boxShadow: "0 0 4px rgba(0,0,0,0.4)",
              }}
              title={midiLabel(n.midi)}
            />
          ))}
          {chords.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-5 flex">
              {chords.map((c, i) => {
                const w =
                  durationSec > 0 ? ((c.t1 - c.t0) / durationSec) * 100 : 100 / chords.length;
                const left = durationSec > 0 ? (c.t0 / durationSec) * 100 : i * w;
                return (
                  <div
                    key={`${c.symbol}-${i}`}
                    className="absolute bottom-0 text-[7px] text-center text-gray-400 truncate px-0.5 border-t border-[#A05068]/30"
                    style={{ left: `${left}%`, width: `${w}%` }}
                    title={`${c.symbol} (${c.confidence}%)`}
                  >
                    {c.symbol}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div
          className="absolute top-0 bottom-0 w-px bg-white/50 z-10 pointer-events-none"
          style={{ left: `calc(2rem + ${playheadPct}% * (100% - 2rem) / 100)` }}
        />
        {isTranscribing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-gray-400">
            Building pitch map & chord grid…
          </div>
        )}
      </div>

      <div className="px-3 pb-2 grid grid-cols-3 gap-2 text-[9px] text-gray-500">
        <span>{audioNotes.length} audio notes</span>
        <span>{midiNotes.length} MIDI notes</span>
        <span className="text-right">
          {bpm} BPM · {durationSec.toFixed(1)}s
        </span>
      </div>

      <SvivvaPlayStage3D model={model} className="mx-3 mb-3 shadow-inner" />
    </div>
  );
}
