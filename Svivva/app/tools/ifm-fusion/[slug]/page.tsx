import { notFound } from "next/navigation";
import { IfmFusionWorkflowWidget } from "@/components/orbit/ifm-fusion-workflow-widget";
import { getFusionProductBySlug } from "@/lib/orbit/roadmap/fusion-product-registry";

type PageProps = { params: Promise<{ slug: string }> };

export default async function IfmFusionToolPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getFusionProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            IFM fusion product · shipped from Orbit roadmap
          </p>
          <h1 className="text-2xl font-bold">{product.spec.fusionTitle}</h1>
          <p className="text-muted-foreground mt-2">{product.spec.description}</p>
        </div>
        <IfmFusionWorkflowWidget spec={product.spec} />
        <p className="text-xs text-muted-foreground">
          Need the full sealing ceremony? Open{" "}
          <a href="/dashboard/orbit/ifm" className="text-[#5B8DA8] hover:underline">
            Orbit IFM
          </a>{" "}
          on ZZAI.
        </p>
      </div>
    </div>
  );
}
