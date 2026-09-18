import { HomepageSeoHead } from "@/components/homepage-seo-head";
import LandingPage from "./home-page-client";

export default async function HomePage() {
  return (
    <>
      <HomepageSeoHead />
      <LandingPage />
    </>
  );
}
