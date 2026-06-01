import { analyzeAudioFile, analyzeAudioFileFast } from "./client-audio-analysis";
import { buildInstantPlayAnalysis, type PlayAnalysisView } from "./instant-analysis";
import type { DetectionMeta } from "./tempo-key-core";
import {
  formatMegabytes,
  getMaxLocalFileBytes,
  isClientDetectionReliable,
  isClientBpmNeedsValidation,
  isLocalFileTooLarge,
  MAX_CLOUD_UPLOAD_BYTES,
  needsCloudClip,
} from "./upload-limits";
import { buildWavUploadClip, isWavFile } from "./wav-utils";

const CLOUD_ENRICH_MS = 18_000;

export interface ImportAnalysisResult {
  analysis: PlayAnalysisView | null;
  sessionId: string | null;
  error?: string;
  warning?: string;
}

type ClientDetection = {
  bpm: number;
  key: string;
  keyConfidence: number;
  bpmConfidence: number;
  meta?: DetectionMeta;
};

async function prepareCloudUploadFile(
  file: File,
  clientDetection: ClientDetection | null,
): Promise<{ upload: File | null; metadataOnly: boolean }> {
  const reliable = clientDetection && isClientDetectionReliable(clientDetection);
  const needsBpmValidation = clientDetection && isClientBpmNeedsValidation(clientDetection);

  if (reliable && !needsBpmValidation) {
    return { upload: null, metadataOnly: true };
  }
  if (file.size <= MAX_CLOUD_UPLOAD_BYTES) {
    return { upload: file, metadataOnly: false };
  }
  if (isWavFile(file)) {
    try {
      const clip = await buildWavUploadClip(file);
      return { upload: clip, metadataOnly: false };
    } catch (err) {
      console.warn("WAV clip build failed:", err);
    }
  }
  return { upload: null, metadataOnly: true };
}

async function cloudEnrichImportAnalysis(options: {
  file: File;
  mode: string;
  userHint?: string;
  clientDetection: ClientDetection | null;
}): Promise<ImportAnalysisResult> {
  const { file, mode, userHint, clientDetection } = options;

  const { upload, metadataOnly } = await prepareCloudUploadFile(file, clientDetection);

  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("fast", "1");
  formData.append("sourceName", file.name);
  formData.append("sourceSize", String(file.size));
  if (metadataOnly) {
    formData.append("metadataOnly", "1");
  } else if (upload) {
    formData.append("audio", upload);
  }
  if (userHint?.trim()) formData.append("userHint", userHint.trim());
  if (clientDetection) {
    formData.append("detectedBpm", String(clientDetection.bpm));
    formData.append("detectedKey", clientDetection.key);
    formData.append("detectedKeyConfidence", String(clientDetection.keyConfidence));
    formData.append("detectedBpmConfidence", String(clientDetection.bpmConfidence));
    if (clientDetection.meta) {
      formData.append("detectionMeta", JSON.stringify(clientDetection.meta));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLOUD_ENRICH_MS);

  try {
    const res = await fetch("/api/svivva-play/analyze", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    const raw = await res.text();
    let data: {
      error?: string;
      sessionId?: string;
      analysis?: PlayAnalysisView;
    } = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      if (clientDetection) {
        return {
          analysis: buildInstantPlayAnalysis(clientDetection),
          sessionId: null,
          warning: "Cloud enrichment timed out — local tempo/key is active.",
        };
      }
      return {
        analysis: null,
        sessionId: null,
        error: `Analysis failed (HTTP ${res.status}). Server returned an invalid response.`,
      };
    }

    if (res.status !== 200 || data.error) {
      if (clientDetection) {
        return {
          analysis: buildInstantPlayAnalysis(clientDetection),
          sessionId: null,
          warning:
            data.error || "Cloud enrichment unavailable — local tempo/key detection is active.",
        };
      }
      return {
        analysis: null,
        sessionId: null,
        error: data.error || `Analysis failed (HTTP ${res.status})`,
      };
    }

    if (data.analysis) {
      return {
        analysis: data.analysis,
        sessionId: data.sessionId ?? null,
      };
    }

    if (clientDetection) {
      return {
        analysis: buildInstantPlayAnalysis(clientDetection),
        sessionId: null,
        warning: "Cloud returned an incomplete response — showing local tempo/key detection.",
      };
    }

    return { analysis: null, sessionId: null, error: "Invalid response from analysis" };
  } catch (err) {
    console.error("Svivva Play cloud enrichment failed:", err);
    if (clientDetection) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        analysis: buildInstantPlayAnalysis(clientDetection),
        sessionId: null,
        warning: aborted
          ? "Cloud refinement skipped (slow connection) — local tempo/key is ready to use."
          : "Server analysis unavailable — local tempo/key detection is active.",
      };
    }
    const detail = err instanceof Error ? err.message : "";
    return {
      analysis: null,
      sessionId: null,
      error:
        detail && !detail.includes("Failed to fetch")
          ? `Analysis failed: ${detail}`
          : "Analysis failed. Check your connection and try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runImportAnalysis(options: {
  file: File;
  mode: string;
  userHint?: string;
  onInstantResult?: (analysis: PlayAnalysisView) => void;
  onCloudComplete?: (result: ImportAnalysisResult) => void;
}): Promise<ImportAnalysisResult> {
  const { file, mode, userHint, onInstantResult, onCloudComplete } = options;

  if (isLocalFileTooLarge(file)) {
    const maxMb = formatMegabytes(getMaxLocalFileBytes(file));
    return {
      analysis: null,
      sessionId: null,
      error: `File is too large for browser analysis (max ${maxMb} for ${isWavFile(file) ? "WAV" : "this format"}).`,
    };
  }

  let clientDetection: ClientDetection | null = null;

  try {
    clientDetection = (await analyzeAudioFile(file)) ?? (await analyzeAudioFileFast(file));
    if (clientDetection) {
      onInstantResult?.(buildInstantPlayAnalysis(clientDetection));
    }
  } catch (err) {
    console.warn("Svivva Play client analysis failed:", err);
  }

  const largeFileNote =
    file.size > MAX_CLOUD_UPLOAD_BYTES
      ? needsCloudClip(file)
        ? " Large WAV — cloud session uses a short clip; full file stays in your browser for playback."
        : " Large file — cloud session saves metadata only; full file stays in your browser."
      : "";

  const instantResult: ImportAnalysisResult = clientDetection
    ? {
        analysis: buildInstantPlayAnalysis(clientDetection),
        sessionId: null,
        warning: largeFileNote.trim() || undefined,
      }
    : { analysis: null, sessionId: null };

  if (!clientDetection || !onCloudComplete) {
    const cloud = await cloudEnrichImportAnalysis({ file, mode, userHint, clientDetection });
    if (largeFileNote && cloud.warning) {
      cloud.warning = `${cloud.warning}${largeFileNote}`;
    } else if (largeFileNote && !cloud.error) {
      cloud.warning = largeFileNote.trim();
    }
    return cloud;
  }

  void cloudEnrichImportAnalysis({ file, mode, userHint, clientDetection }).then((cloud) => {
    if (largeFileNote && cloud.warning) {
      cloud.warning = `${cloud.warning}${largeFileNote}`;
    } else if (largeFileNote && !cloud.error) {
      cloud.warning = largeFileNote.trim();
    }
    onCloudComplete(cloud);
  });

  return instantResult;
}
