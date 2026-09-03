import type { Metadata } from "next";
import { HubIndexPage, hubIndexMetadata } from "@/components/seo/hub-index-page";

export const revalidate = 3600;

export const metadata: Metadata = hubIndexMetadata("cyber-security-mini-apps");

export default function CyberSecurityMiniAppsHubPage() {
  return <HubIndexPage hub="cyber-security-mini-apps" />;
}
