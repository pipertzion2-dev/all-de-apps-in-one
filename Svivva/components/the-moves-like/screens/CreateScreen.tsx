"use client";

import { useEffect, useRef, useState } from "react";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";

export function CreateScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("Take 1");
  const addRecordingMeta = useMovesLikeStore((s) => s.addRecordingMeta);
  const recordingsMeta = useMovesLikeStore((s) => s.recordingsMeta);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stream, previewUrl]);

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      setError("Could not access camera/microphone. Check browser permissions.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const mr = new MediaRecorder(stream, { mimeType: mime });
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
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Create</h2>
        <p className="mt-1 text-sm text-[#9BB0B8]">
          Capture a take, review it, and prepare it for sharing or Style Clash responses.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden border border-white/10 bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          {!stream && (
            <div className="flex justify-center border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="rounded-md bg-[#5B8DA8] px-4 py-2 text-sm font-semibold text-[#071014]"
              >
                Open camera
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4 border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-xs uppercase tracking-[0.14em] text-[#90C4D8]">
            Take label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-2 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!stream || recording}
              onClick={startRecording}
              className="rounded-md bg-[#C44A9A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Record
            </button>
            <button
              type="button"
              disabled={!recording}
              onClick={stopRecording}
              className="rounded-md border border-white/25 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Stop
            </button>
          </div>
          {error ? <p className="text-sm text-[#E07070]">{error}</p> : null}
          {recording ? (
            <p className="text-xs uppercase tracking-[0.16em] text-[#C44A9A]">Recording…</p>
          ) : null}
          {previewUrl ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#90C4D8]">Review</p>
              <video
                src={previewUrl}
                controls
                className="aspect-video w-full bg-black"
                playsInline
              />
              <a
                href={previewUrl}
                download={`${label.replace(/\s+/g, "-").toLowerCase() || "take"}.webm`}
                className="mt-3 inline-block text-sm text-[#5B8DA8] underline-offset-2 hover:underline"
              >
                Download take
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
          Saved take metadata
        </h3>
        {recordingsMeta.length === 0 ? (
          <p className="mt-2 text-sm text-[#9BB0B8]">No takes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recordingsMeta.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border border-white/10 px-3 py-2 text-sm text-[#C8D8DE]"
              >
                <span>{r.label}</span>
                <span className="text-xs text-[#9BB0B8]">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
