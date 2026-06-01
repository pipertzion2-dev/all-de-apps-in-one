import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { buildMinimalPlayAnalysis, runAnalysis } from "@/lib/svivva-play/pipeline";
import { execFile } from "child_process";
import { writeFile, unlink, mkdir, copyFile } from "fs/promises";
import path from "path";
import os from "os";
import { analyzeWavFileHybrid } from "@/lib/svivva-play/server-audio-analysis";
import { mergeDetectionMeta, refineTempoKeyWithAI } from "@/lib/svivva-play/refine-tempo-key-ai";
import { finalizeHybridFromMeta, type DetectionMeta } from "@/lib/svivva-play/tempo-key-core";
import { getActiveAiProvider, getRuntimeLabel } from "@/lib/llm/openai";
import {
  isClientDetectionReliable,
  isClientBpmNeedsValidation,
  MAX_CLOUD_UPLOAD_BYTES,
  formatMegabytes,
} from "@/lib/svivva-play/upload-limits";

export const maxDuration = 120;
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = MAX_CLOUD_UPLOAD_BYTES;

function getTempDir(): string {
  return path.join(os.tmpdir(), "svivva-play");
}

function convertAudioToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      ["-y", "-nostdin", "-i", inputPath, "-acodec", "pcm_s16le", "-ar", "44100", outputPath],
      { timeout: 120000 },
      (error) => {
        if (error) {
          reject(new Error(`FFmpeg conversion failed: ${error.message}`));
        } else {
          resolve();
        }
      },
    );
  });
}

function parseClientDetectionMeta(formData: FormData): DetectionMeta | undefined {
  const raw = formData.get("detectionMeta");
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as DetectionMeta;
    if (!Array.isArray(parsed.bpmCandidates) || !Array.isArray(parsed.keyCandidates))
      return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function parseClientDetection(
  formData: FormData,
): { bpm: number; key: string; keyConfidence: number; bpmConfidence?: number } | undefined {
  const bpmRaw = formData.get("detectedBpm");
  const keyRaw = formData.get("detectedKey");
  const confRaw = formData.get("detectedKeyConfidence");
  const bpmConfRaw = formData.get("detectedBpmConfidence");
  if (bpmRaw == null || keyRaw == null) return undefined;

  const bpm = Number(bpmRaw);
  const key = String(keyRaw).trim();
  const keyConfidence = confRaw != null ? Number(confRaw) : 50;
  const bpmConfidence = bpmConfRaw != null ? Number(bpmConfRaw) : undefined;

  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 300 || !key) return undefined;

  return {
    bpm: Math.round(bpm),
    key,
    keyConfidence: Number.isFinite(keyConfidence)
      ? Math.min(99, Math.max(0, Math.round(keyConfidence)))
      : 50,
    bpmConfidence:
      bpmConfidence != null && Number.isFinite(bpmConfidence)
        ? Math.min(99, Math.max(0, Math.round(bpmConfidence)))
        : undefined,
  };
}

function toApiAnalysis(analysis: {
  bpm: number;
  time_signature: string;
  key: string;
  key_confidence: number;
  chords: unknown[];
  sections: unknown[];
  downbeats: unknown[];
  style_compatibility: unknown[];
  timbre_descriptors?: Record<string, unknown>;
}) {
  return {
    bpm: analysis.bpm,
    timeSignature: analysis.time_signature,
    key: analysis.key,
    keyConfidence: analysis.key_confidence,
    chords: analysis.chords,
    sections: analysis.sections,
    downbeats: analysis.downbeats,
    styleCompatibility: analysis.style_compatibility,
    timbreDescriptors: analysis.timbre_descriptors,
  };
}

export async function POST(request: NextRequest) {
  const tempPaths: string[] = [];
  let sessionId: string | null = null;
  let dbAvailable = true;

  try {
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) userId = user.id;
    } catch {}

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const metadataOnly = formData.get("metadataOnly") === "1";
    const sourceName =
      (formData.get("sourceName") as string)?.trim() || audioFile?.name || "Untitled Session";
    const mode = (formData.get("mode") as string) || "composition";
    const userHint = (formData.get("userHint") as string) || "";
    const clientDetection = parseClientDetection(formData);
    const clientDetectionMeta = parseClientDetectionMeta(formData);
    const fastMode = formData.get("fast") === "1";

    if (!audioFile && !(metadataOnly && fastMode && clientDetection)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (audioFile && audioFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `Upload clip is too large (max ${formatMegabytes(MAX_UPLOAD_BYTES)}).`,
        },
        { status: 413 },
      );
    }

    sessionId = uuidv4();
    const analysisId = uuidv4();

    let detectionMeta: DetectionMeta = clientDetectionMeta ?? {
      bpmCandidates: [],
      keyCandidates: [],
    };

    if (clientDetection) {
      detectionMeta.bpmCandidates.push({
        bpm: clientDetection.bpm,
        weight: 1.0,
        source: "client-fusion",
      });
      detectionMeta.keyCandidates.push({
        key: clientDetection.key,
        confidence: clientDetection.keyConfidence,
        source: "client-fusion",
      });
      if (clientDetectionMeta?.durationSec) {
        detectionMeta.durationSec = clientDetectionMeta.durationSec;
      }
      console.log("✅ Client key/tempo received:", clientDetection);
    }

    const clientReliable = !!clientDetection && isClientDetectionReliable(clientDetection);
    const needsBpmValidation = !!clientDetection && isClientBpmNeedsValidation(clientDetection);

    const skipServerAudio = metadataOnly && !audioFile;
    if (fastMode && clientReliable && clientDetection && skipServerAudio) {
      let validated = {
        bpm: clientDetection.bpm,
        key: clientDetection.key,
        keyConfidence: clientDetection.keyConfidence,
        bpmConfidence: clientDetection.bpmConfidence ?? clientDetection.keyConfidence,
      };

      if (clientDetectionMeta?.onsetTimes?.length) {
        const fused = finalizeHybridFromMeta(detectionMeta, clientDetectionMeta.onsetTimes);
        validated = {
          bpm: fused.bpm,
          key: fused.key,
          keyConfidence: fused.keyConfidence,
          bpmConfidence: fused.bpmConfidence,
        };
        console.log(
          `✅ Server harmonic tempo validation: ${clientDetection.bpm} → ${validated.bpm} BPM`,
        );
      }

      if (needsBpmValidation && !clientDetectionMeta?.onsetTimes?.length) {
        console.warn(
          "⚠️ Client BPM needs validation but no onset metadata — trusting client value",
        );
      }
      try {
        await db.insert(playSessions).values({
          id: sessionId,
          userId,
          name: sourceName,
          mode,
          status: "analyzed",
          sourceAudioName: sourceName,
          sourceAudioDuration: detectionMeta.durationSec
            ? Math.round(detectionMeta.durationSec)
            : null,
          analysisId,
        });
      } catch (dbErr) {
        dbAvailable = false;
        console.warn("⚠️ DB session insert failed, continuing without persistence:", dbErr);
      }

      const realAnalysis = validated;
      const analysis = buildMinimalPlayAnalysis({
        bpm: realAnalysis.bpm,
        key: realAnalysis.key,
        keyConfidence: realAnalysis.keyConfidence,
        durationSec: detectionMeta.durationSec,
      });

      if (dbAvailable && sessionId) {
        try {
          await db.insert(playAnalyses).values({
            id: analysisId,
            sessionId,
            bpm: Math.round(analysis.bpm),
            timeSignature: analysis.time_signature,
            key: analysis.key,
            keyConfidence: Math.round(analysis.key_confidence),
            chords: analysis.chords as any,
            sections: analysis.sections as any,
            downbeats: analysis.downbeats as any,
            styleCompatibility: analysis.style_compatibility as any,
            timbreDescriptors: (analysis.timbre_descriptors || {}) as any,
            status: "complete",
          });
        } catch (dbErr) {
          console.warn("⚠️ DB fast analysis persist failed:", dbErr);
        }
      }

      return NextResponse.json({
        sessionId,
        analysisId,
        analysis: toApiAnalysis(analysis),
        persisted: dbAvailable,
        fast: true,
        metadataOnly,
      });
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: "Client detection was not reliable enough for metadata-only analysis." },
        { status: 422 },
      );
    }

    const tmpDir = getTempDir();
    await mkdir(tmpDir, { recursive: true });
    const ext = path.extname(audioFile.name) || ".wav";
    const tempFilePath = path.join(tmpDir, `${sessionId}${ext}`);
    tempPaths.push(tempFilePath);

    const arrayBuffer = await audioFile.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(arrayBuffer));

    try {
      await db.insert(playSessions).values({
        id: sessionId,
        userId,
        name: sourceName,
        mode,
        status: "analyzing",
        sourceAudioName: sourceName,
        sourceAudioDuration: null,
        analysisId,
      });
    } catch (dbErr) {
      dbAvailable = false;
      console.warn("⚠️ DB session insert failed, continuing without persistence:", dbErr);
    }

    let onsetTimes: number[] = [];

    try {
      await copyFile(tempFilePath, path.join(tmpDir, `last_play_upload${ext}`)).catch(() => {});

      const wavPath = path.join(tmpDir, `${sessionId}.wav`);
      tempPaths.push(wavPath);
      let analysisPath = tempFilePath;

      try {
        await convertAudioToWav(tempFilePath, wavPath);
        analysisPath = wavPath;
      } catch (convertErr) {
        console.warn(
          "⚠️ FFmpeg unavailable or conversion failed — using browser detection only:",
          convertErr,
        );
      }

      if (analysisPath.endsWith(".wav")) {
        try {
          const serverHybrid = await analyzeWavFileHybrid(analysisPath);
          detectionMeta = mergeDetectionMeta(detectionMeta, serverHybrid.meta);
          onsetTimes = serverHybrid.onsetTimes;
        } catch (serverErr) {
          console.warn("⚠️ Server hybrid analysis failed:", serverErr);
        }
      }
    } catch (err) {
      console.warn("⚠️ Server audio processing failed:", err);
    }

    const fused = finalizeHybridFromMeta(detectionMeta, onsetTimes);
    let realAnalysis = {
      bpm: fused.bpm,
      key: fused.key,
      keyConfidence: fused.keyConfidence,
      bpmConfidence: fused.bpmConfidence,
    };

    const refined = await refineTempoKeyWithAI(realAnalysis, detectionMeta, {
      name: audioFile.name,
      type: audioFile.type,
      durationSec: detectionMeta.durationSec,
    });
    realAnalysis = {
      bpm: refined.bpm,
      key: refined.key,
      keyConfidence: refined.keyConfidence,
      bpmConfidence: refined.bpmConfidence,
    };
    console.log(
      `✅ Final tempo/key (${refined.source}): ${refined.bpm} BPM, ${refined.key}`,
      refined.reason ?? "",
    );

    console.log(`✅ Runtime: ${getRuntimeLabel()}, AI: ${getActiveAiProvider()}`);

    if (!realAnalysis.bpm || !realAnalysis.key) {
      if (dbAvailable && sessionId) {
        await db
          .update(playSessions)
          .set({ status: "error" })
          .where(eq(playSessions.id, sessionId))
          .catch(() => {});
      }
      return NextResponse.json(
        {
          error:
            "Could not detect key or tempo from this file. Try a shorter clip or a different format (MP3/WAV).",
        },
        { status: 422 },
      );
    }

    const dspHint = `Detected BPM: ${realAnalysis.bpm}. Detected key: ${realAnalysis.key}.`;
    const combinedHint = [userHint, dspHint].filter(Boolean).join("\n");

    let analysis = buildMinimalPlayAnalysis({
      bpm: realAnalysis.bpm,
      key: realAnalysis.key,
      keyConfidence: realAnalysis.keyConfidence,
      durationSec: detectionMeta.durationSec,
    });

    const llmResult = await runAnalysis(
      {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        durationEstimate: detectionMeta.durationSec,
      },
      combinedHint,
      realAnalysis,
    );

    if (llmResult.success && llmResult.data) {
      analysis = llmResult.data;
      analysis.bpm = realAnalysis.bpm;
      analysis.key = realAnalysis.key;
      analysis.key_confidence = realAnalysis.keyConfidence;
    } else if (llmResult.error) {
      console.warn("LLM enrichment skipped (DSP-only analysis):", llmResult.error);
    }

    if (dbAvailable && sessionId) {
      try {
        await db.insert(playAnalyses).values({
          id: analysisId,
          sessionId,
          bpm: Math.round(analysis.bpm),
          timeSignature: analysis.time_signature,
          key: analysis.key,
          keyConfidence: Math.round(analysis.key_confidence),
          chords: analysis.chords as any,
          sections: analysis.sections as any,
          downbeats: analysis.downbeats as any,
          styleCompatibility: analysis.style_compatibility as any,
          timbreDescriptors: (analysis.timbre_descriptors || {}) as any,
          status: "complete",
        });

        await db
          .update(playSessions)
          .set({ status: "analyzed", analysisId })
          .where(eq(playSessions.id, sessionId));
      } catch (dbErr) {
        console.warn("⚠️ DB analysis persist failed, returning result anyway:", dbErr);
      }
    }

    return NextResponse.json({
      sessionId,
      analysisId,
      analysis: toApiAnalysis(analysis),
      persisted: dbAvailable,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    if (dbAvailable && sessionId) {
      await db
        .update(playSessions)
        .set({ status: "error" })
        .where(eq(playSessions.id, sessionId))
        .catch(() => {});
    }
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.all(tempPaths.map((p) => unlink(p).catch(() => {})));
  }
}
