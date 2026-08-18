"use client";

import { useSearchParams } from "next/navigation";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { PoorManProtectionWizard } from "@/components/poor-man-protection/wizard";
import type { PatentCategory } from "@/components/poor-man-protection/patent-kind-selector";

function modeFromSearchParams(mode: string | null): PatentCategory | undefined {
  if (mode === "digital" || mode === "physical" || mode === "group") return mode;
  return undefined;
}

export default function PoorManProtectionPage() {
  const searchParams = useSearchParams();
  const initialCategory = modeFromSearchParams(searchParams.get("mode"));

  return (
    <FeaturePageShell
      variant="security"
      subtitle="Poor man's patent UI for physical sketches and digital inventions — dual-axis hybridization, group patents, cyber integrity, and court-oriented delivery unique to ZZAI."
      className="pb-10"
    >
      <PoorManProtectionWizard initialCategory={initialCategory} />
    </FeaturePageShell>
  );
}
