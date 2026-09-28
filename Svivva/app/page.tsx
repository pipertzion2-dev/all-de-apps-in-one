import LandingPage from "./home-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { homepageJsonLdGraph } from "@/lib/seo/schema/builders";

export const metadata = buildSeoMetadata({
  title: `zzai zzai — ${PRODUCT_TAGLINE}`,
  description: `${PRODUCT_ONE_LINER} Verify seals at /protect/verify.`,
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
