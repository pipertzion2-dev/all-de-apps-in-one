"use client";

import { useEffect, useRef, useState } from "react";
import { FrontCameraViewport } from "@/components/the-moves-like/FrontCameraViewport";
import { useFrontCamera } from "@/lib/the-moves-like/use-front-camera";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";

export function CreateScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const camera = useFrontCamera({ videoRef, audio: true, autoStart: true });
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("Take 1");
  const [elapsed, setElapsed] = useState(0);
  const addRecordingMeta = useMovesLikeStore((s) => s.addRecordingMeta);
  const recordingsMeta = useMovesLikeStore((s) => s.recordingsMeta);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  const startRecording = () => {
    if (!camera.stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "video/webm";
    try {
      const mr = new MediaRecorder(camera.stream, { mimeType: mime });
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        addRecordingMeta(label || "Untitled take");
      };
      mediaRecorderRef.current = mr;
      mr.start(200);
      setElapsed(0);
      setRecording(true);
    } catch {
      // Some iOS versions are picky about mime — retry without options
      const mr = new MediaRecorder(camera.stream);
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "video/mp4" });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        addRecordingMeta(label || "Untitled take");
      };
      mediaRecorderRef.current = mr;
      mr.start(200);
      setElapsed(0);
      setRecording(true);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="relative pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0">
      <FrontCameraViewport
        ref={videoRef}
        className="h-[100dvh] max-h-[100dvh] sm:h-[min(100dvh,920px)]"
        overlay={
          <>
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#90C4D8]">
                  Create · Front camera
                </p>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 w-[min(60vw,220px)] border-b border-white/30 bg-transparent text-lg font-semibold text-white outline-none"
                  aria-label="Take label"
                />
              </div>
              {recording ? (
                <span className="rounded-full bg-[#C44A9A] px-3 py-1 text-xs font-semibold text-white">
                  REC {elapsed}s
                </span>
              ) : (
                <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#90C4D8]">
                  {camera.active ? "Ready" : "Camera"}
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <p className="max-w-xs text-center text-xs text-white/80">
                Hold your phone like a selfie video. Front camera stays mirrored for framing.
              </p>

              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setScreen("learn")}
                  className="min-h-[44px] text-xs uppercase tracking-[0.14em] text-[#90C4D8]"
                >
                  Practice
                </button>

                {!recording ? (
                  <button
                    type="button"
                    disabled={!camera.active}
                    onClick={startRecording}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-[#C44A9A] disabled:opacity-40"
                    aria-label="Start recording"
                  >
                    <span className="h-14 w-14 rounded-full bg-[#C44A9A]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-white/20"
                    aria-label="Stop recording"
                  >
                    <span className="h-7 w-7 rounded-sm bg-[#C44A9A]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setScreen("play")}
                  className="min-h-[44px] text-xs uppercase tracking-[0.14em] text-[#E8A0D0]"
                >
                  Clash
                </button>
              </div>

              {!camera.active && !camera.starting ? (
                <button
                  type="button"
                  onClick={() => void camera.start()}
                  className="w-full max-w-sm min-h-[48px] bg-[#5B8DA8] text-sm font-semibold text-[#071014]"
                >
                  Enable front camera
                </button>
              ) : null}
              {camera.error ? (
                <p className="text-center text-xs text-[#E07070]">{camera.error}</p>
              ) : null}
            </div>
          </>
        }
      />

      {previewUrl ? (
        <section className="border-t border-white/10 bg-[#071014] px-4 py-6 sm:px-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
            Last take
          </h3>
          <video
            src={previewUrl}
            controls
            playsInline
            className="mt-3 aspect-[9/16] max-h-[50vh] w-full bg-black object-contain sm:max-w-sm"
          />
          <a
            href={previewUrl}
            download={`${label.replace(/\s+/g, "-").toLowerCase() || "take"}.webm`}
            className="mt-3 inline-block min-h-[44px] text-sm text-[#5B8DA8] underline-offset-2 hover:underline"
          >
            Download take
          </a>
        </section>
      ) : null}

      {recordingsMeta.length > 0 ? (
        <section className="px-4 pb-8 sm:px-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9BB0B8]">
            Saved takes
          </h3>
          <ul className="mt-2 space-y-1">
            {recordingsMeta.slice(0, 6).map((r) => (
              <li key={r.id} className="text-sm text-[#C8D8DE]">
                {r.label} · {new Date(r.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
