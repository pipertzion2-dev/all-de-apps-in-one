import LandingPage from "../home-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { homepageJsonLdGraph } from "@/lib/seo/schema/builders";
import { CANONICAL_HOME_PATH } from "@/lib/homepage-path";

export const metadata = buildSeoMetadata({
  title: `zzai zzai — ${PRODUCT_TAGLINE}`,
  description: `${PRODUCT_ONE_LINER} Free Klean Sneaks demo at /clean-sneaks. Start free — no credit card.`,
  path: CANONICAL_HOME_PATH,
});

export default function RestAssuredHomePage() {
  return (
    <>
      <JsonLd data={homepageJsonLdGraph()} />
      <LandingPage />
    </>
  );
}
