import type { Metadata } from "next";
import { HubIndexPage, hubIndexMetadata } from "@/components/seo/hub-index-page";

export const revalidate = 3600;

export const metadata: Metadata = hubIndexMetadata("ai-tools-hub");

export default function AiToolsHubPage() {
  return <HubIndexPage hub="ai-tools-hub" />;
}
