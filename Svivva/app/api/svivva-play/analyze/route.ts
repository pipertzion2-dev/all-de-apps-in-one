import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { runAnalysis } from "@/lib/svivva-play/pipeline";
import { execFile } from "child_process";
import { writeFile, unlink, mkdir, copyFile } from "fs/promises";
import path from "path";
import { analyzeWavFile } from "@/lib/svivva-play/server-audio-analysis";

function convertAudioToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      ["-y", "-nostdin", "-i", inputPath, "-acodec", "pcm_s16le", "-ar", "44100", outputPath],
      { timeout: 60000 },
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

function parseClientDetection(
  formData: FormData,
): { bpm: number; key: string; keyConfidence: number } | undefined {
  const bpmRaw = formData.get("detectedBpm");
  const keyRaw = formData.get("detectedKey");
  const confRaw = formData.get("detectedKeyConfidence");
  if (bpmRaw == null || keyRaw == null) return undefined;

  const bpm = Number(bpmRaw);
  const key = String(keyRaw).trim();
  const keyConfidence = confRaw != null ? Number(confRaw) : 50;

  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 300 || !key) return undefined;

  return {
    bpm: Math.round(bpm),
    key,
    keyConfidence: Number.isFinite(keyConfidence)
      ? Math.min(99, Math.max(0, Math.round(keyConfidence)))
      : 50,
  };
}

function mergeDetections(
  client?: { bpm: number; key: string; keyConfidence: number },
  server?: { bpm: number; key: string; keyConfidence: number },
): { bpm: number; key: string; keyConfidence: number } | undefined {
  if (!client && !server) return undefined;
  const bpmOk = (bpm: number) => bpm >= 40 && bpm <= 220;
  const keyOk = (d: { key: string; keyConfidence: number }) =>
    Boolean(d.key) && d.keyConfidence >= 25;

  const bpm =
    client && bpmOk(client.bpm)
      ? client.bpm
      : server && bpmOk(server.bpm)
        ? server.bpm
        : (client?.bpm ?? server?.bpm ?? 120);

  const key =
    client && keyOk(client)
      ? client.key
      : server && keyOk(server)
        ? server.key
        : (client?.key ?? server?.key ?? "C major");

  const keyConfidence = Math.max(
    client && keyOk(client) ? client.keyConfidence : 0,
    server && keyOk(server) ? server.keyConfidence : 0,
    client?.keyConfidence ?? 0,
    server?.keyConfidence ?? 0,
  );

  return { bpm, key, keyConfidence: keyConfidence || 50 };
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) userId = user.id;
    } catch {}

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const mode = (formData.get("mode") as string) || "composition";
    const userHint = (formData.get("userHint") as string) || "";
    const clientDetection = parseClientDetection(formData);
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const sessionId = uuidv4();
    const analysisId = uuidv4();

    await db.insert(playSessions).values({
      id: sessionId,
      userId,
      name: audioFile.name || "Untitled Session",
      mode,
      status: "analyzing",
      sourceAudioName: audioFile.name,
      sourceAudioDuration: null,
      analysisId,
    });

    const tmpDir = path.join(process.cwd(), "tmp");
    await mkdir(tmpDir, { recursive: true });
    const ext = path.extname(audioFile.name) || ".wav";
    tempFilePath = path.join(tmpDir, `${sessionId}${ext}`);
    const arrayBuffer = await audioFile.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(arrayBuffer));

    let realAnalysis: { bpm: number; key: string; keyConfidence: number } | undefined =
      clientDetection;

    if (clientDetection) {
      console.log("✅ Client key/tempo received:", clientDetection);
    }

    try {
      const debugCopy = path.join(tmpDir, `last_play_upload${ext}`);
      await copyFile(tempFilePath, debugCopy).catch(() => {});

      const wavPath = path.join(tmpDir, `${sessionId}.wav`);
      let analysisPath = tempFilePath;
      console.log("🔄 Attempting to normalize upload to WAV for analysis...");
      try {
        await convertAudioToWav(tempFilePath, wavPath);
        analysisPath = wavPath;
        console.log("✅ Audio converted to WAV");
      } catch (convertErr) {
        console.warn("⚠️ Audio conversion failed, falling back to raw upload:", convertErr);
      }

      if (!clientDetection || clientDetection.keyConfidence < 25) {
        console.log(
          "Running server key/tempo analysis for:",
          audioFile.name,
          "size:",
          audioFile.size,
        );
        const serverDetection = await analyzeWavFile(analysisPath);
        console.log("✅ Server analysis succeeded:", serverDetection);
        realAnalysis = mergeDetections(clientDetection, serverDetection);
      }
    } catch (err) {
      console.warn("⚠️ Server analysis failed:", err);
      if (clientDetection) {
        realAnalysis = clientDetection;
      } else {
        console.log(
          "File info - name:",
          audioFile.name,
          "type:",
          audioFile.type,
          "size:",
          audioFile.size,
        );
      }
    }

    const dspHint = realAnalysis
      ? `Detected BPM: ${realAnalysis.bpm}. Detected key: ${realAnalysis.key}.`
      : "";
    const combinedHint = [userHint, dspHint].filter(Boolean).join("\n");

    const result = await runAnalysis(
      {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      },
      combinedHint,
      realAnalysis,
    );

    if (!result.success || !result.data) {
      await db.update(playSessions).set({ status: "error" }).where(eq(playSessions.id, sessionId));
      return NextResponse.json({ error: result.error || "Analysis failed" }, { status: 500 });
    }

    const analysis = result.data;

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

    return NextResponse.json({
      sessionId,
      analysisId,
      analysis: {
        bpm: analysis.bpm,
        timeSignature: analysis.time_signature,
        key: analysis.key,
        keyConfidence: analysis.key_confidence,
        chords: analysis.chords,
        sections: analysis.sections,
        downbeats: analysis.downbeats,
        styleCompatibility: analysis.style_compatibility,
        timbreDescriptors: analysis.timbre_descriptors,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  } finally {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {}
    }
  }
}
