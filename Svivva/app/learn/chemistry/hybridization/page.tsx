import type { Metadata } from "next";
import { HybridizationExplorer } from "@/components/ap-science/hybridization-explorer";

export const metadata: Metadata = {
  title: "Hybridization Explorer · AP Chemistry · ZZAI",
  description:
    "Interactive AP Chemistry hybridization lab: VSEPR, sp/sp²/sp³, sigma and pi bonding, misconceptions, and mastery.",
};

export default function HybridizationPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <HybridizationExplorer />
      </div>
    </main>
  );
}
