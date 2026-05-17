import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export type BuildSeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  /** BCP-47 locale; hreflang scaffold for future locales */
  locale?: string;
};

/** Canonical metadata builder — use on every indexable route. */
export function buildSeoMetadata({
  title,
  description,
  path,
  imagePath = "/svivva-logo.png",
  noindex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  locale = "en",
}: BuildSeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        [locale]: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type,
      title,
      description,
      url: canonical,
      siteName: "Svivva",
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
