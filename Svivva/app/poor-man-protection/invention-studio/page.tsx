"use client";

import { FeaturePageShell } from "@/components/feature-page-shell";
import { InventionProtectionStudioShell } from "@/components/poor-man-protection/invention-studio/studio-shell";

/** Invention Protection Studio — feature inside Poor Man Protection (Cube Protect). */
export default function InventionProtectionStudioPage() {
  return (
    <FeaturePageShell
      variant="security"
      subtitle="Document your ideas. Preserve your evidence. Prepare your inventions — inside Poor Man Protection."
      className="pb-10"
      heroCompact
    >
      <InventionProtectionStudioShell />
    </FeaturePageShell>
  );
}
