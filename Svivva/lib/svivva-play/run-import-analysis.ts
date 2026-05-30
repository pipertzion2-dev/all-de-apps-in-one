import { analyzeAudioFile } from "./client-audio-analysis";
import { buildInstantPlayAnalysis, type PlayAnalysisView } from "./instant-analysis";
import type { DetectionMeta } from "./tempo-key-core";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

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

export async function runImportAnalysis(options: {
  file: File;
  mode: string;
  userHint?: string;
  onInstantResult?: (analysis: PlayAnalysisView) => void;
}): Promise<ImportAnalysisResult> {
  const { file, mode, userHint, onInstantResult } = options;

  let clientDetection: ClientDetection | null = null;

  try {
    clientDetection = await analyzeAudioFile(file);
    if (clientDetection) {
      const instant = buildInstantPlayAnalysis(clientDetection);
      onInstantResult?.(instant);
    }
  } catch (err) {
    console.warn("Svivva Play client analysis failed:", err);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    if (clientDetection) {
      return {
        analysis: buildInstantPlayAnalysis(clientDetection),
        sessionId: null,
        warning:
          "File is over 12 MB — showing local tempo/key only. Use a shorter clip for full cloud analysis and MIDI generation.",
      };
    }
    return {
      analysis: null,
      sessionId: null,
      error: "Audio file is too large. Please use a file under 12 MB.",
    };
  }

  const formData = new FormData();
  formData.append("audio", file);
  formData.append("mode", mode);
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

  try {
    const res = await fetch("/api/svivva-play/analyze", { method: "POST", body: formData });
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
          warning:
            "Cloud enrichment unavailable — local tempo/key detection is active. You can still generate MIDI.",
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
            data.error ||
            "Cloud enrichment unavailable — local tempo/key detection is active. You can still generate MIDI.",
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
    console.error("Svivva Play import analysis failed:", err);
    if (clientDetection) {
      return {
        analysis: buildInstantPlayAnalysis(clientDetection),
        sessionId: null,
        warning:
          "Server analysis unavailable — showing local tempo/key detection. You can still generate and export MIDI.",
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
  }
}
