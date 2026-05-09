import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { playSessions, playAnalyses } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { runAnalysis } from "@/lib/svivva-play/pipeline";
import { execFile } from "child_process";
import { writeFile, unlink, mkdir, copyFile, access } from "fs/promises";
import path from "path";
import { constants } from "fs";

function convertMp3ToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      ["-i", inputPath, "-acodec", "pcm_s16le", "-ar", "44100", outputPath],
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

function runPythonAnalysis(
  filePath: string,
): Promise<{ bpm: number; key: string; keyConfidence: number }> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "analyze_audio.py");
    execFile("python", [scriptPath, filePath], { timeout: 120000 }, (error, stdout, stderr) => {
      if (stderr) {
        console.log("Python analysis debug:", stderr);
      }
      if (error) {
        console.error("Python analysis stderr:", stderr);
        reject(new Error(`Python analysis failed: ${error.message}`));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });
  });
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

    let realAnalysis: { bpm: number; key: string; keyConfidence: number } | undefined;
    try {
      const debugCopy = path.join(tmpDir, `last_play_upload${ext}`);
      await copyFile(tempFilePath, debugCopy).catch(() => {});

      let analysisPath = tempFilePath;
      // Convert MP3 to WAV if needed
      if (ext.toLowerCase() === ".mp3" || audioFile.type === "audio/mpeg") {
        console.log("🔄 Converting MP3 to WAV for analysis...");
        const wavPath = path.join(tmpDir, `${sessionId}.wav`);
        try {
          await convertMp3ToWav(tempFilePath, wavPath);
          analysisPath = wavPath;
          console.log("✅ MP3 converted to WAV");
        } catch (convertErr) {
          console.warn("⚠️ MP3 conversion failed, trying raw MP3:", convertErr);
          // Try with raw MP3 anyway
        }
      }

      console.log("Starting Python analysis for file:", audioFile.name, "size:", audioFile.size);
      realAnalysis = await runPythonAnalysis(analysisPath);
      console.log("✅ Python DSP analysis succeeded:", realAnalysis);
    } catch (err) {
      console.warn("⚠️ Python analysis failed, falling back to LLM:", err);
      console.log(
        "File info - name:",
        audioFile.name,
        "type:",
        audioFile.type,
        "size:",
        audioFile.size,
      );
    }

    const result = await runAnalysis(
      {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      },
      userHint,
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
