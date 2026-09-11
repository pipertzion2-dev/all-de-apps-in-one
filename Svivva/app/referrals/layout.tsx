import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Referral Program — Earn Commission",
  description:
    "Join the ZZAI referral program. Earn up to 10% commission on subscriptions with multi-level rewards — share tools and grow your network.",
  path: "/referrals",
});

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
