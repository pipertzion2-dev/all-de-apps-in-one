import type { OrbitEntityType, OrbitLinkType, OrbitProjectSourceType } from "../graph-constants";

/** Normalized ingest output — adapters produce this; persist layer writes to DB. */
export type IngestEntityDraft = {
  ref: string;
  entityType: OrbitEntityType;
  name: string;
  slug?: string;
  url?: string;
  description?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
};

export type IngestLinkDraft = {
  fromRef: string;
  toRef: string;
  linkType: OrbitLinkType;
  metadata?: Record<string, unknown>;
};

export type IngestSnapshot = {
  projectName: string;
  description?: string;
  productType: string;
  summary: Record<string, unknown>;
  entities: IngestEntityDraft[];
  links: IngestLinkDraft[];
};

export type IngestSourceInput = {
  sourceType: OrbitProjectSourceType;
  sourceRef: string;
  userId: string;
  manual?: {
    name: string;
    description?: string;
    productType?: string;
    metadata?: Record<string, unknown>;
  };
};

export type PersistedOrbitGraph = {
  projectId: string;
  entityCount: number;
  linkCount: number;
  snapshot: IngestSnapshot;
};
