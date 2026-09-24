import LandingPage from "./home-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { homepageJsonLdGraph } from "@/lib/seo/schema/builders";

export const metadata = buildSeoMetadata({
  title: "zzai zzai — AI API builder, Seeds, Orbit SEO & Klean Sneaks",
  description:
    "zzai zzai (ZZAI / zzaizzai.com) is an AI product workspace: prompt-to-API builder with schema validation and rollback, ZZAI Seeds, Orbit SEO/AEO, Poor Man Protection, ZZAI Show events, and Klean Sneaks on ZZAI Play. Start free.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={homepageJsonLdGraph()} />
      <LandingPage />
    </>
  );
}
