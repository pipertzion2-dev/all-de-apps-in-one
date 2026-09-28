import { BetaSurfaceBanner } from "@/components/beta-surface-banner";

export function ProductBetaShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BetaSurfaceBanner />
      {children}
    </>
  );
}
