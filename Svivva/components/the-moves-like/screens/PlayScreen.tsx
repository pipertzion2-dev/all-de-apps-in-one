"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getMove, MOVES_LIBRARY } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import {
  beatGridFromBpm,
  connectMediaElement,
  decodeAudioFile,
  detectTempoFromBuffer,
  emptyAudioSnapshot,
  readAnalyserSnapshot,
  type AudioSession,
} from "@/lib/the-moves-like/audio-analysis";
import type { AudioAnalysisSnapshot } from "@/lib/the-moves-like/types";

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  { ssr: false },
);

export function PlayScreen() {
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const challenges = useMovesLikeStore((s) => s.challenges);
  const createChallenge = useMovesLikeStore((s) => s.createChallenge);
  const addChallengeResponse = useMovesLikeStore((s) => s.addChallengeResponse);
  const voteResponse = useMovesLikeStore((s) => s.voteResponse);

  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionRef = useRef<AudioSession | null>(null);
  const [audio, setAudio] = useState<AudioAnalysisSnapshot>(emptyAudioSnapshot());
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [bpmManual, setBpmManual] = useState(120);
  const [tempoNote, setTempoNote] = useState("Upload a track to detect tempo from actual audio.");
  const [prompt, setPrompt] = useState(
    "Interpret the Body Roll in your own style — keep the wave, change the flavor.",
  );
  const [challengeMoveId, setChallengeMoveId] = useState("body-roll");
  const [author, setAuthor] = useState("You");
  const [note, setNote] = useState("");
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [responseVideo, setResponseVideo] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const session = sessionRef.current;
      if (!session) return;
      setAudio(
        readAnalyserSnapshot(session.analyser, {
          bpmHint: audio.bpm ?? bpmManual,
          reliableTempo: audio.reliableTempo,
          beatGrid: audio.beatGrid,
        }),
      );
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- analyser loop; bpm fields read from closure intentionally
  }, [trackUrl]);

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      if (trackUrl) URL.revokeObjectURL(trackUrl);
      if (responseVideo) URL.revokeObjectURL(responseVideo);
    };
  }, [trackUrl, responseVideo]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    sessionRef.current?.stop();
    if (trackUrl) URL.revokeObjectURL(trackUrl);
    const url = URL.createObjectURL(file);
    setTrackUrl(url);
    setTempoNote("Analyzing audio buffer…");

    const buffer = await decodeAudioFile(file);
    let bpm: number | null = null;
    let reliable = false;
    let beatGrid: number[] = [];
    if (buffer) {
      const detected = await detectTempoFromBuffer(buffer);
      bpm = detected.bpm;
      reliable = detected.reliableTempo;
      beatGrid = detected.beatGrid;
      if (reliable && bpm) {
        setBpmManual(bpm);
        setTempoNote(`Detected ≈ ${bpm} BPM (web-audio-beat-detector).`);
      } else {
        beatGrid = beatGridFromBpm(bpmManual, buffer.duration);
        setTempoNote("Auto tempo unreliable — using your manual BPM for the beat grid.");
      }
    } else {
      setTempoNote("Could not decode audio — use manual BPM.");
    }

    setAudio((prev) => ({
      ...prev,
      bpm: bpm ?? bpmManual,
      reliableTempo: reliable,
      beatGrid: beatGrid.length ? beatGrid : beatGridFromBpm(bpmManual, 60),
    }));

    // Wait a tick for audio element src
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      el.src = url;
      void el.play().catch(() => undefined);
      const session = connectMediaElement(el);
      sessionRef.current = session;
    });
  };

  const applyManualBpm = () => {
    const grid = beatGridFromBpm(bpmManual, 120);
    setAudio((prev) => ({
      ...prev,
      bpm: bpmManual,
      reliableTempo: true,
      beatGrid: grid,
    }));
    setTempoNote(`Beat grid locked to manual ${bpmManual} BPM.`);
  };

  const startChallenge = () => {
    const id = createChallenge(prompt, challengeMoveId);
    setActiveChallengeId(id);
  };

  const onResponseVideo = (file: File | null) => {
    if (!file) return;
    if (responseVideo) URL.revokeObjectURL(responseVideo);
    setResponseVideo(URL.createObjectURL(file));
  };

  const submitResponse = () => {
    const id = activeChallengeId ?? challenges[0]?.id;
    if (!id) return;
    addChallengeResponse(id, {
      authorLabel: author || "Dancer",
      note: note || "My take",
      videoObjectUrl: responseVideo ?? undefined,
    });
    setNote("");
  };

  const active = challenges.find((c) => c.id === (activeChallengeId ?? challenges[0]?.id));

  return (
    <div className="space-y-8 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Play</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">
          Rhythm Portal reacts to real audio analysis. Style Clash is asynchronous — no fake live
          opponents.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Rhythm Portal
        </h3>
        <div className="min-h-[260px] overflow-hidden tml-glass">
          <MovementStage
            moveIds={selectedMoveIds.length ? selectedMoveIds : ["afro-bounce", "jack-in"]}
            mode="rhythm"
            audio={audio}
          />
        </div>
        <div className="grid gap-3 tml-glass p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-[0.14em] text-[#9BB0B8]">
              Music file
              <input
                type="file"
                accept="audio/*,video/*"
                className="mt-2 block w-full text-sm text-[#C8D8DE]"
                onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <audio ref={audioRef} controls className="w-full" playsInline />
            <p className="text-xs text-[#C8D8DE]">{tempoNote}</p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs text-[#9BB0B8]">
              Manual BPM ({bpmManual})
              <input
                type="range"
                min={70}
                max={180}
                value={bpmManual}
                onChange={(e) => setBpmManual(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <button
              type="button"
              onClick={applyManualBpm}
              className="rounded-md border border-border/40 bg-white/5 backdrop-blur-md px-3 py-2 text-xs uppercase tracking-[0.12em] text-white"
            >
              Lock beat grid
            </button>
            <dl className="grid grid-cols-2 gap-2 text-xs text-[#C8D8DE]">
              <div>
                <dt className="text-[#9BB0B8]">Energy</dt>
                <dd>{audio.energy.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-[#9BB0B8]">Bass</dt>
                <dd>{audio.bass.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-[#9BB0B8]">Tempo</dt>
                <dd>
                  {audio.bpm ?? "—"} {audio.reliableTempo ? "(reliable)" : "(unreliable / manual)"}
                </dd>
              </div>
              <div>
                <dt className="text-[#9BB0B8]">Beats mapped</dt>
                <dd>{audio.beatGrid.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Style Clash · async
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 tml-glass p-4">
            <label className="block text-xs text-[#9BB0B8]">
              Challenge prompt
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-[#9BB0B8]">
              Reference move
              <select
                value={challengeMoveId}
                onChange={(e) => setChallengeMoveId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-3 py-2 text-sm text-white"
              >
                {MOVES_LIBRARY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={startChallenge}
              className="rounded-md bg-[#5B8DA8] px-4 py-2 text-sm font-semibold text-[#071014]"
            >
              Create challenge
            </button>
            <div className="h-40 overflow-hidden tml-glass">
              <MovementStage moveIds={[challengeMoveId]} mode="dna" interactive={false} />
            </div>
            <p className="text-xs text-[#9BB0B8]">
              Reference: {getMove(challengeMoveId)?.name}. Invite a friend by sharing the prompt —
              they respond when ready. Architecture is local-first for now; real-time multiplayer
              can plug into the same challenge model later.
            </p>
          </div>

          <div className="space-y-3 tml-glass p-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C44A9A]">
              Respond
            </h4>
            <label className="block text-xs text-[#9BB0B8]">
              Name
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-[#9BB0B8]">
              Note
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-md px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-[#9BB0B8]">
              Upload interpretation
              <input
                type="file"
                accept="video/*"
                className="mt-2 block w-full text-sm text-[#C8D8DE]"
                onChange={(e) => onResponseVideo(e.target.files?.[0] ?? null)}
              />
            </label>
            {responseVideo ? (
              <video
                src={responseVideo}
                controls
                className="aspect-video w-full bg-black"
                playsInline
              />
            ) : null}
            <button
              type="button"
              onClick={submitResponse}
              disabled={!challenges.length}
              className="rounded-md bg-[#C44A9A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Submit response
            </button>
          </div>
        </div>

        {active ? (
          <div className="tml-glass p-4">
            <h4 className="text-sm font-semibold text-white">{active.prompt}</h4>
            <p className="mt-1 text-xs text-[#9BB0B8]">
              Move: {getMove(active.moveId)?.name} · {active.responses.length} responses
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {active.responses.map((r) => (
                <li key={r.id} className="tml-glass bg-black/30 p-3">
                  <p className="text-sm font-semibold text-white">{r.authorLabel}</p>
                  <p className="text-xs text-[#9BB0B8]">{r.note}</p>
                  {r.videoObjectUrl ? (
                    <video
                      src={r.videoObjectUrl}
                      controls
                      className="mt-2 aspect-video w-full bg-black"
                      playsInline
                    />
                  ) : (
                    <p className="mt-2 text-xs text-[#9BB0B8]">
                      No video attached (text response).
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => voteResponse(active.id, r.id, "creativity")}
                      className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase text-[#90C4D8]"
                    >
                      Creativity {r.votesCreativity}
                    </button>
                    <button
                      type="button"
                      onClick={() => voteResponse(active.id, r.id, "style")}
                      className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase text-[#E8A0D0]"
                    >
                      Style {r.votesStyle}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-[#9BB0B8]">
                    Voting is subjective — no objective match score without pose analysis.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-[#9BB0B8]">Create a challenge to start Style Clash.</p>
        )}
      </section>
    </div>
  );
}
