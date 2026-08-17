import { ok } from "@/lib/http-response";
import {
  HYBRID_LAB_MAX_ORDER,
  featurePairCount,
  listFeatureHybridPairs,
  listHybridizableFeatures,
} from "@/lib/hybridization/feature-lab";

export const dynamic = "force-dynamic";

export async function GET() {
  const features = listHybridizableFeatures(true).map((f) => ({
    id: f.id,
    title: f.title,
    shortTitle: f.shortTitle,
    channelLabel: f.channelLabel,
    href: f.href,
    bus: f.bus,
    description: f.description,
    mainBus: f.mainBus,
  }));
  const pairs = listFeatureHybridPairs(true).map((p) => ({
    id: p.id,
    aId: p.a.id,
    bId: p.b.id,
    aLabel: `${p.a.channelLabel} ${p.a.shortTitle}`,
    bLabel: `${p.b.channelLabel} ${p.b.shortTitle}`,
  }));

  return ok({
    maxOrder: HYBRID_LAB_MAX_ORDER,
    featureCount: features.length,
    pairCount: featurePairCount(features.length),
    features,
    pairs,
  });
}
