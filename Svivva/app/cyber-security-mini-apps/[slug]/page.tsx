import type { Metadata } from "next";
import {
  generateHubFeatureMetadata,
  generateHubFeatureStaticParams,
  HubFeaturePageView,
} from "@/components/seo/hub-feature-page";

export const revalidate = 3600;

export function generateStaticParams() {
  return generateHubFeatureStaticParams("cyber-security-mini-apps");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateHubFeatureMetadata("cyber-security-mini-apps", slug);
}

export default async function CyberFeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <HubFeaturePageView hub="cyber-security-mini-apps" slug={slug} />;
}
