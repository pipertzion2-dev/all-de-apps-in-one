import type { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import type { OrbitProjectSourceType } from "@/lib/orbit/graph-constants";
import { loadSeedForUser } from "./adapters/seed";
import { loadPlaySessionForUser } from "./adapters/play";
import { loadApiProjectForUser } from "./adapters/api-project";

export async function assertIngestAccess(
  req: NextRequest,
  userId: string,
  sourceType: OrbitProjectSourceType,
  sourceRef: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  switch (sourceType) {
    case "seed": {
      const row = await loadSeedForUser(sourceRef, userId);
      if (!row) return { ok: false, error: "Seed not found or access denied", status: 403 };
      return { ok: true };
    }
    case "play": {
      const row = await loadPlaySessionForUser(sourceRef, userId);
      if (!row) return { ok: false, error: "Play session not found or access denied", status: 403 };
      return { ok: true };
    }
    case "api_project": {
      try {
        await loadApiProjectForUser(sourceRef, userId);
        return { ok: true };
      } catch {
        return { ok: false, error: "API project not found or access denied", status: 403 };
      }
    }
    case "url": {
      const isAdmin = await isOrbitAdminAllowed(req);
      if (!isAdmin) {
        return {
          ok: false,
          error: "URL ingest requires Orbit admin access",
          status: 403,
        };
      }
      try {
        const parsed = new URL(sourceRef);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return { ok: false, error: "URL must use http or https", status: 400 };
        }
      } catch {
        return { ok: false, error: "Invalid URL", status: 400 };
      }
      return { ok: true };
    }
    case "manual":
    case "campaign":
      return { ok: true };
    default:
      return { ok: false, error: "Unsupported source type", status: 400 };
  }
}

export function normalizeSourceRef(sourceType: OrbitProjectSourceType, sourceRef: string): string {
  if (sourceType === "url") {
    return sourceRef.trim().replace(/\/$/, "");
  }
  return sourceRef.trim();
}
