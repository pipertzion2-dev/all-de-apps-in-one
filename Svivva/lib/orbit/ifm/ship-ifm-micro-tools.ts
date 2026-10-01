import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { emitOrbitEvent } from "../analytics/event-repository";
import { buildIfmBridgePageDraft } from "./bridge-page-generator";
import { getIfmPairingsForProject } from "./ifm-repository";
import { getOrbitProjectById } from "../ingest";
import {
  bridgeContentHasMicroTool,
  injectMicroToolIntoBridgeContent,
} from "./micro-tool-generator";
import type { IfmPairing } from "./ifm-types";

export type ShipMicroToolResult = {
  pairingId: string;
  slug: string;
  ok: boolean;
  reason?: string;
};

export type ShipIfmMicroToolsSummary = {
  shipped: number;
  skipped: number;
  results: ShipMicroToolResult[];
};

export async function shipIfmMicroToolsForProject(
  projectId: string,
  userId: string,
  opts: { pairingIds?: string[]; statusFilter?: IfmPairing["status"][] } = {},
): Promise<ShipIfmMicroToolsSummary> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const statusFilter = opts.statusFilter ?? ["generated", "indexed", "winner"];
  let pairings = await getIfmPairingsForProject(projectId, userId);
  pairings = pairings.filter((p) => statusFilter.includes(p.status));
  if (opts.pairingIds?.length) {
    const ids = new Set(opts.pairingIds);
    pairings = pairings.filter((p) => ids.has(p.id));
  }

  const results: ShipMicroToolResult[] = [];
  let shipped = 0;
  let skipped = 0;

  for (const pairing of pairings) {
    const draft = buildIfmBridgePageDraft(pairing);
    const [page] = await db
      .select({ id: seoLandingPages.id, content: seoLandingPages.content })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.slug, draft.slug))
      .limit(1);

    if (!page) {
      results.push({
        pairingId: pairing.id,
        slug: draft.slug,
        ok: false,
        reason: "bridge page not found — ship bridge first",
      });
      skipped += 1;
      continue;
    }

    if (bridgeContentHasMicroTool(page.content)) {
      results.push({ pairingId: pairing.id, slug: draft.slug, ok: true, reason: "already embedded" });
      skipped += 1;
      continue;
    }

    const nextContent = injectMicroToolIntoBridgeContent(page.content, pairing);
    await db
      .update(seoLandingPages)
      .set({ content: nextContent })
      .where(eq(seoLandingPages.id, page.id));

    shipped += 1;
    results.push({ pairingId: pairing.id, slug: draft.slug, ok: true });

    await emitOrbitEvent({
      orbitProjectId: projectId,
      eventType: "ifm_micro_tool_shipped",
      source: "internal",
      idempotencyKey: `ifm:micro:${projectId}:${pairing.id}`,
      dimensions: { pairingId: pairing.id, slug: draft.slug },
    });
  }

  return { shipped, skipped, results };
}
