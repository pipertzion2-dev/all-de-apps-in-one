/**
 * Automatically seal a reference-driven Klean UI remix via Poor Man Protection.
 */

import type { PoorManCertificate } from "@/lib/poor-man-protection/types";
import {
  clearPendingUiSeal,
  type KleanReferenceUiTheme,
  type PendingUiSeal,
  writePendingUiSeal,
  writeSavedReferenceUiTheme,
} from "@/lib/clean-sneaks/reference-ui-theme";

const VAULT_KEY = "zzai-poor-man-protection-vault-v1";

export type AutoSealResult =
  | { status: "sealed"; certificate: PoorManCertificate; theme: KleanReferenceUiTheme }
  | { status: "queued"; reason: "auth_required" | "network"; theme: KleanReferenceUiTheme }
  | { status: "error"; message: string; theme: KleanReferenceUiTheme };

function saveCertToVault(cert: PoorManCertificate) {
  if (typeof window === "undefined") return;
  try {
    const prev = JSON.parse(window.localStorage.getItem(VAULT_KEY) || "[]") as PoorManCertificate[];
    const next = [cert, ...prev.filter((c) => c.contentHash !== cert.contentHash)].slice(0, 40);
    window.localStorage.setItem(VAULT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

function buildProtectBody(
  theme: KleanReferenceUiTheme,
  opts?: { imageBase64?: string; mimeType?: string; fileName?: string },
) {
  const paletteLine = theme.palette.map((p) => `${p.role}:${p.hex}`).join(", ");
  const ref = theme.referenceText || theme.name;
  return {
    title: theme.name.slice(0, 200),
    description: [
      "Klean Sneaks reference UI remix — automatically sealed when the player applied a custom reference.",
      `Reference: ${ref}`,
      `Shell colors: bg ${theme.colors.bg}, accent ${theme.colors.accent}, highlight ${theme.colors.highlight}.`,
      `Nearest BALOON8 colorway: ${theme.nearestColorwayId}.`,
      "This certificate covers the player-authored UI skin derived from the reference (supporting evidence of anteriority — not a government registration).",
    ]
      .join("\n\n")
      .slice(0, 4000),
    formVariable: `Klean Sneaks HUD / shell layout remixed from reference · colorway ${theme.nearestColorwayId}`,
    paletteVariable: paletteLine || theme.colors.accent,
    formInterrogation: {
      silhouette: "Fullscreen game shell with colorway picker, HUD chips, and runner canvas",
      hierarchy: "Brand mark → reference remix controls → colorway → primary CTA",
      negativeSpace: "Dark atmospheric gradients with accent-lit interactive chips",
      distinctiveMarks: `Reference-driven CSS theme vars + nearest BALOON8 tint (${theme.nearestColorwayId})`,
    },
    paletteInterrogation: {
      emotionalIntent: "Player-authored atmosphere from their reference input",
      contrastStrategy: "Accent CTAs on deep shell with highlight text",
      forbiddenColors: "None — palette extracted or seeded from the reference",
      lightingContext: "In-game overlay / mobile fullscreen",
    },
    palette: theme.palette,
    contentHash: theme.contentHash,
    mimeType: opts?.mimeType || (opts?.imageBase64 ? "image/jpeg" : "application/zzai-klean-ui-theme"),
    fileName: opts?.fileName || `${theme.name.replace(/\s+/g, "-").slice(0, 48)}.json`,
    imageBase64: opts?.imageBase64,
    hybridizationMode: "emergent" as const,
    enableCyberSeal: true,
    mintCoin: true,
    chronology: {
      firstFixedOn: theme.createdAt.slice(0, 10),
      medium: "Interactive game UI theme (Klean Sneaks reference remix)",
      iterationNotes: "Auto-generated when the player applied a reference in Klean Sneaks.",
    },
    custodyLog: [
      {
        at: theme.createdAt,
        event: "reference_ui_applied",
        detail: ref.slice(0, 200),
      },
      {
        at: new Date().toISOString(),
        event: "auto_seal_requested",
        detail: "Klean Sneaks automatic Poor Man Protection",
      },
    ],
  };
}

export async function autoSealReferenceUiTheme(
  theme: KleanReferenceUiTheme,
  opts?: { imageBase64?: string; mimeType?: string; fileName?: string },
): Promise<AutoSealResult> {
  try {
    const res = await fetch("/api/poor-man-protection/protect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildProtectBody(theme, opts)),
    });
    const data = (await res.json()) as {
      certificate?: PoorManCertificate;
      error?: string;
    };

    if (res.status === 401) {
      const pending: PendingUiSeal = {
        theme,
        imageBase64: opts?.imageBase64,
        mimeType: opts?.mimeType,
        fileName: opts?.fileName,
        queuedAt: new Date().toISOString(),
      };
      writePendingUiSeal(pending);
      return { status: "queued", reason: "auth_required", theme };
    }

    if (!res.ok || !data.certificate) {
      return {
        status: "error",
        message: data.error || "Automatic seal failed",
        theme,
      };
    }

    clearPendingUiSeal();
    saveCertToVault(data.certificate);
    const sealedTheme: KleanReferenceUiTheme = {
      ...theme,
      sealContentHash: data.certificate.contentHash,
    };
    writeSavedReferenceUiTheme(sealedTheme);
    return { status: "sealed", certificate: data.certificate, theme: sealedTheme };
  } catch {
    writePendingUiSeal({
      theme,
      imageBase64: opts?.imageBase64,
      mimeType: opts?.mimeType,
      fileName: opts?.fileName,
      queuedAt: new Date().toISOString(),
    });
    return { status: "queued", reason: "network", theme };
  }
}

/** Retry a pending seal after the player signs in. */
export async function flushPendingUiSeal(
  pending: PendingUiSeal,
): Promise<AutoSealResult> {
  return autoSealReferenceUiTheme(pending.theme, {
    imageBase64: pending.imageBase64,
    mimeType: pending.mimeType,
    fileName: pending.fileName,
  });
}
