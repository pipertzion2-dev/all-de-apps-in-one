"use client";

import { useEffect, useRef, useState } from "react";
import {
  TmlButton,
  TmlInput,
  TmlLabel,
  TmlPanel,
  TmlSelect,
  TmlTextarea,
} from "@/components/the-moves-like/ui/tml";
import { createEmptyMovement, useMovesLikeStore } from "@/lib/the-moves-like/store";
import {
  MOVE_CATEGORIES,
  type MoveCategory,
  type MoveDifficulty,
} from "@/lib/the-moves-like/types";

async function videoDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      v.onloadedmetadata = () => resolve();
      v.onerror = () => reject(new Error("Could not read video"));
    });
    return Number.isFinite(v.duration) ? v.duration : 0;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function captureThumb(file: File): Promise<string | undefined> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.src = url;
    v.muted = true;
    await new Promise<void>((resolve) => {
      v.onloadeddata = () => resolve();
    });
    v.currentTime = Math.min(0.2, (v.duration || 1) * 0.1);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
    });
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function TrainScreen() {
  const upsertMovement = useMovesLikeStore((s) => s.upsertMovement);
  const attachVideo = useMovesLikeStore((s) => s.attachVideo);
  const setScreen = useMovesLikeStore((s) => s.setScreen);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MoveCategory>("footwork");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<MoveDifficulty>("intermediate");
  const [status, setStatus] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
  }, [rate, previewUrl]);

  const loadFile = async (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    if (!name) setName(f.name.replace(/\.[^.]+$/, "").slice(0, 48));
    setStatus(null);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFile(f);
  };

  const startCameraRecord = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        const f = new File([blob], `train-${Date.now()}.webm`, { type: mime });
        void loadFile(f);
        setRecording(false);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
    } catch {
      setCamError("Camera recording unavailable in this browser. Upload a video instead.");
    }
  };

  const stopCameraRecord = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const stepFrame = (dir: -1 | 1) => {
    const v = videoRef.current;
    if (!v || !previewUrl) return;
    v.pause();
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + dir * (1 / 24)));
  };

  const saveMove = async () => {
    if (!file) {
      setStatus("Upload or record a clip first.");
      return;
    }
    setStatus("Saving…");
    try {
      const durationSec = await videoDuration(file);
      const thumb = await captureThumb(file);
      const movement = createEmptyMovement({
        name: name.trim() || "Untitled move",
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes,
        difficulty,
        durationSec,
        thumbnailDataUrl: thumb,
      });
      upsertMovement(movement);
      await attachVideo(movement.id, file, { durationSec, thumbnailDataUrl: thumb });
      setStatus("Saved to Moves library.");
      setTimeout(() => setScreen("moves"), 600);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C6FF00]">Train</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Practice workspace</h1>
        <p className="mt-2 max-w-xl text-sm text-[#8B919A]">
          Upload or record a clip, scrub at any speed, then save it into your personal movement
          library.
        </p>

        <TmlPanel className="mt-5 overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={previewUrl ?? undefined}
              className="h-full w-full object-contain"
              controls={!recording}
              playsInline
            />
            {!previewUrl && !recording ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-[#8B919A]">
                <p>No clip loaded</p>
                <p className="text-xs">Upload a file or start a camera take</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#2A2E38] p-3">
            <TmlButton type="button" variant="secondary" onClick={() => videoRef.current?.play()}>
              Play
            </TmlButton>
            <TmlButton type="button" variant="secondary" onClick={() => videoRef.current?.pause()}>
              Pause
            </TmlButton>
            <TmlButton type="button" variant="ghost" onClick={() => stepFrame(-1)}>
              − Frame
            </TmlButton>
            <TmlButton type="button" variant="ghost" onClick={() => stepFrame(1)}>
              + Frame
            </TmlButton>
            <label className="ml-auto flex items-center gap-2 text-xs text-[#8B919A]">
              Speed
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="rounded border border-[#2A2E38] bg-[#08090B] px-2 py-1 text-white"
              >
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5].map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </TmlPanel>
      </div>

      <div className="space-y-4">
        <TmlPanel className="space-y-3 p-4">
          <TmlLabel>Capture</TmlLabel>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer">
              <span className="inline-flex min-h-10 items-center rounded-lg bg-[#C6FF00] px-4 text-sm font-semibold text-[#08090B]">
                Upload video
              </span>
              <input type="file" accept="video/*" className="hidden" onChange={onUpload} />
            </label>
            {!recording ? (
              <TmlButton type="button" variant="secondary" onClick={() => void startCameraRecord()}>
                Record camera
              </TmlButton>
            ) : (
              <TmlButton type="button" variant="danger" onClick={stopCameraRecord}>
                Stop recording
              </TmlButton>
            )}
          </div>
          {camError ? <p className="text-xs text-amber-300">{camError}</p> : null}
        </TmlPanel>

        <TmlPanel className="space-y-3 p-4">
          <TmlLabel>Save to Moves</TmlLabel>
          <div>
            <TmlLabel className="mb-1">Title</TmlLabel>
            <TmlInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Six-step clean"
            />
          </div>
          <div>
            <TmlLabel className="mb-1">Category</TmlLabel>
            <TmlSelect
              value={category}
              onChange={(e) => setCategory(e.target.value as MoveCategory)}
            >
              {MOVE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </TmlSelect>
          </div>
          <div>
            <TmlLabel className="mb-1">Difficulty</TmlLabel>
            <TmlSelect
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as MoveDifficulty)}
            >
              {(["beginner", "intermediate", "advanced", "pro"] as const).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </TmlSelect>
          </div>
          <div>
            <TmlLabel className="mb-1">Tags (comma separated)</TmlLabel>
            <TmlInput
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="foundation, circle"
            />
          </div>
          <div>
            <TmlLabel className="mb-1">Notes</TmlLabel>
            <TmlTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keep elbows tight…"
            />
          </div>
          <TmlButton type="button" className="w-full" onClick={() => void saveMove()}>
            Save movement
          </TmlButton>
          {status ? <p className="text-xs text-[#C6FF00]">{status}</p> : null}
        </TmlPanel>
      </div>
    </div>
  );
}
