import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export const metadata: Metadata = {
  title: { template: "%s | Marketing Hub", default: "Marketing Hub" },
  description:
    "Manage campaigns, leads, referrals, UTM tracking, content amplification, and A/B tests.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Marketing Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multi-channel marketing command center
          </p>
        </div>
        <MarketingNav />
        {children}
      </div>
    </div>
  );
}
