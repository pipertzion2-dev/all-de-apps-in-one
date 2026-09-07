import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export type NativeToolMetaInput = {
  path: `/tools/${string}`;
  title: string;
  description: string;
  keywords?: string[];
};

/** Metadata for indexable /tools/* lead magnets — each page must self-canonicalize. */
export function nativeToolMetadata({
  path,
  title,
  description,
  keywords = [],
}: NativeToolMetaInput): Metadata {
  const seo = buildSeoMetadata({
    title,
    description,
    path,
  });
  return keywords.length ? { ...seo, keywords } : seo;
}
