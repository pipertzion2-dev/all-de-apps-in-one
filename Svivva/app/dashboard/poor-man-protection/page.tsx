"use client";

import { FeaturePageShell } from "@/components/feature-page-shell";
import { PoorManProtectionWizard } from "@/components/poor-man-protection/wizard";

export default function PoorManProtectionPage() {
  return (
    <FeaturePageShell
      variant="security"
      subtitle="A guided, court-oriented sealing ceremony — dual-axis hybridization, group patents from a dump of images, cyber integrity, and official delivery unique to ZZAI."
      className="pb-10"
    >
      <PoorManProtectionWizard />
    </FeaturePageShell>
  );
}
