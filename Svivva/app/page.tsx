import LandingPage from "./home-page-client";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { BRAND } from "@/lib/brand";

export const metadata = buildSeoMetadata({
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "zzai zzai (ZZAI / zzaizzai.com) — From seed to symphony. One workspace to describe what you want, ship it with guardrails across software, hardware, growth, and IP protection — without babysitting infrastructure.",
  path: "/",
});

export default function HomePage() {
  return <LandingPage />;
}
