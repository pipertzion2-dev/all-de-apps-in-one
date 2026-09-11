import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { BRAND } from "@/lib/brand";
import HomePageClient from "./home-page-client";

export const metadata: Metadata = buildSeoMetadata({
  title: `${BRAND.name} — AI API Builder | Prompt to Production Endpoint`,
  description:
    "Build production AI APIs from plain English. JSON schema validation, auto-generated evals, versioning, and rollback — free tier, no credit card.",
  path: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
