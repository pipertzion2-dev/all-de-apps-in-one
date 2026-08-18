import type { IngestSnapshot } from "../types";

export function buildManualIngestSnapshot(input: {
  name: string;
  description?: string;
  productType?: string;
  metadata?: Record<string, unknown>;
}): IngestSnapshot {
  const productRef = "product";

  return {
    projectName: input.name,
    description: input.description,
    productType: input.productType || "manual",
    summary: {
      manual: true,
      ...input.metadata,
      ingestedAt: new Date().toISOString(),
    },
    entities: [
      {
        ref: productRef,
        entityType: "product",
        name: input.name,
        description: input.description,
        metadata: input.metadata ?? {},
      },
    ],
    links: [],
  };
}
