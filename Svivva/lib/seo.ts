import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

type BuildSeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  noindex?: boolean;
};

export function buildSeoMetadata({
  title,
  description,
  path,
  imagePath = "/svivva-logo.png",
  noindex = false,
}: BuildSeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "Svivva",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
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
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
  };
}
