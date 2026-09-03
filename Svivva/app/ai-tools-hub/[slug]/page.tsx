import type { Metadata } from "next";
import {
  generateHubFeatureMetadata,
  generateHubFeatureStaticParams,
  HubFeaturePageView,
} from "@/components/seo/hub-feature-page";

export const revalidate = 3600;

export function generateStaticParams() {
  return generateHubFeatureStaticParams("ai-tools-hub");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateHubFeatureMetadata("ai-tools-hub", slug);
}

export default async function AiHubFeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HubFeaturePageView hub="ai-tools-hub" slug={slug} />;
}
