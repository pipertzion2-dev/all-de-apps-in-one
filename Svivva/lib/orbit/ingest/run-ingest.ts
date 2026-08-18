import type { IngestSourceInput, IngestSnapshot, PersistedOrbitGraph } from "./types";
import type { OrbitProjectSourceType } from "../graph-constants";
import { buildUrlIngestSnapshot } from "./adapters/url";
import { buildSeedIngestSnapshotForUser } from "./adapters/seed";
import { buildPlayIngestSnapshotForUser } from "./adapters/play";
import { buildApiProjectIngestSnapshotForUser } from "./adapters/api-project";
import { buildManualIngestSnapshot } from "./adapters/manual";
import {
  persistIngestSnapshot,
  markOrbitProjectIngestError,
  findOrbitProjectBySource,
} from "./graph-repository";
import { normalizeSourceRef } from "./access";

async function buildSnapshot(input: IngestSourceInput): Promise<IngestSnapshot> {
  const sourceRef = normalizeSourceRef(input.sourceType, input.sourceRef);

  switch (input.sourceType) {
    case "url":
      return buildUrlIngestSnapshot(sourceRef);
    case "seed":
      return buildSeedIngestSnapshotForUser(sourceRef, input.userId);
    case "play":
      return buildPlayIngestSnapshotForUser(sourceRef, input.userId);
    case "api_project":
      return buildApiProjectIngestSnapshotForUser(sourceRef, input.userId);
    case "manual":
    case "campaign": {
      if (!input.manual?.name?.trim()) {
        throw new Error("manual.name is required for manual/campaign ingest");
      }
      return buildManualIngestSnapshot({
        name: input.manual.name.trim(),
        description: input.manual.description,
        productType: input.manual.productType || input.sourceType,
        metadata: input.manual.metadata,
      });
    }
    default: {
      const _exhaustive: never = input.sourceType;
      throw new Error(`Unsupported source type: ${_exhaustive}`);
    }
  }
}

export async function runOrbitIngest(input: IngestSourceInput): Promise<PersistedOrbitGraph> {
  const sourceRef = normalizeSourceRef(input.sourceType, input.sourceRef);

  try {
    const snapshot = await buildSnapshot({ ...input, sourceRef });
    return await persistIngestSnapshot(input.userId, input.sourceType, sourceRef, snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await markOrbitProjectIngestError(input.userId, input.sourceType, sourceRef, message);
    throw e;
  }
}

export async function getExistingOrbitIngest(
  userId: string,
  sourceType: OrbitProjectSourceType,
  sourceRef: string,
) {
  return findOrbitProjectBySource(userId, sourceType, normalizeSourceRef(sourceType, sourceRef));
}
