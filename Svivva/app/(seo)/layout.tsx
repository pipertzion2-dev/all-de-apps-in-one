import { MarketingAnalytics } from "@/components/seo/marketing-analytics";

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingAnalytics />
      {children}
    </>
  );
}
