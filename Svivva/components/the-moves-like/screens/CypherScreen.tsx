"use client";

import { useState } from "react";
import {
  TmlButton,
  TmlInput,
  TmlLabel,
  TmlPanel,
  TmlTextarea,
} from "@/components/the-moves-like/ui/tml";
import { SAMPLE_CHALLENGES, useMovesLikeStore } from "@/lib/the-moves-like/store";

export function CypherScreen() {
  const submissions = useMovesLikeStore((s) => s.submissions);
  const addSubmission = useMovesLikeStore((s) => s.addSubmission);
  const [activeId, setActiveId] = useState(SAMPLE_CHALLENGES[0]?.id ?? "");
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const active = SAMPLE_CHALLENGES.find((c) => c.id === activeId) ?? SAMPLE_CHALLENGES[0];
  const related = submissions.filter((s) => s.challengeId === active?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D91B3]">Cypher</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Community rounds</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Sample challenges only — not live users or engagement metrics. Local submissions stay on
        this device until a real backend is wired.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <ul className="space-y-3">
          {SAMPLE_CHALLENGES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  c.id === active?.id
                    ? "border-[#6D91B3]/45 bg-[rgba(109,145,179,0.12)]"
                    : "tml-glass hover:border-[#6D91B3]/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[rgba(172,129,175,0.18)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#AC81AF]">
                    {c.kind} · sample
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {c.focus}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.prompt}</p>
              </button>
            </li>
          ))}
        </ul>

        {active ? (
          <TmlPanel className="space-y-4 p-4">
            <div>
              <TmlLabel>Challenge detail</TmlLabel>
              <h2 className="text-2xl font-black">{active.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{active.prompt}</p>
            </div>

            <div className="space-y-2 border-t border-white/55 pt-4">
              <TmlLabel>Submit a response (local demo)</TmlLabel>
              <TmlInput
                placeholder="Your cypher name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <TmlTextarea
                placeholder="What did you hit?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <label className="inline-flex cursor-pointer text-xs font-semibold text-[#6D91B3]">
                Attach video (optional)
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                    setVideoUrl(URL.createObjectURL(f));
                  }}
                />
              </label>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="mt-2 aspect-video w-full rounded-lg bg-black"
                />
              ) : null}
              <TmlButton
                type="button"
                className="w-full"
                onClick={() => {
                  if (!author.trim()) return;
                  addSubmission({
                    challengeId: active.id,
                    authorLabel: author.trim(),
                    note: note.trim(),
                    videoObjectUrl: videoUrl ?? undefined,
                  });
                  setAuthor("");
                  setNote("");
                }}
              >
                Submit locally
              </TmlButton>
            </div>

            <div className="border-t border-white/55 pt-4">
              <TmlLabel className="mb-2">Local responses</TmlLabel>
              {!related.length ? (
                <p className="text-sm text-muted-foreground">No local submissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {related.map((s) => (
                    <li key={s.id} className="tml-glass p-3">
                      <p className="font-semibold">{s.authorLabel}</p>
                      <p className="text-sm text-muted-foreground">{s.note}</p>
                      {s.videoObjectUrl ? (
                        <video
                          src={s.videoObjectUrl}
                          controls
                          playsInline
                          className="mt-2 aspect-video w-full rounded bg-black"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TmlPanel>
        ) : null}
      </div>
    </div>
  );
}
