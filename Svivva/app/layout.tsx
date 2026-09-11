import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { PlatformProvider } from "@/lib/platform-context";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import { getSiteUrl } from "@/lib/site-url";
import { BRAND } from "@/lib/brand";
import { MEDIA } from "@/lib/media-assets";
import { rootJsonLdSchemas } from "@/lib/seo/root-json-ld";

const zcFont = localFont({
  src: "../media/fonts/Zc-Regular.ttf",
  variable: "--font-zc",
  display: "block",
  weight: "400",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  // Verification token resolution order:
  //   1. GOOGLE_SITE_VERIFICATION env var (deterministic, recommended for prod)
  //   2. DB row scoped to ADMIN_USER_ID (avoids the multi-tenant footgun of picking "any user's row")
  //   3. DB fallback: first row that has a token (compat with existing setups)
  let googleVerificationToken: string | null = process.env.GOOGLE_SITE_VERIFICATION || null;
  if (!googleVerificationToken) {
    try {
      const adminUserId = getPrimaryAdminUserId() || "";
      const rows = adminUserId
        ? await db
            .select({ tok: seedCredentials.googleVerificationToken })
            .from(seedCredentials)
            .where(eq(seedCredentials.userId, adminUserId))
            .limit(1)
        : await db
            .select({ tok: seedCredentials.googleVerificationToken })
            .from(seedCredentials)
            .limit(1);
      googleVerificationToken = rows[0]?.tok ?? null;
    } catch {}
  }

  const title = "ZZAI — AI API Builder | Prompt to Production Endpoint";
  const description =
    "Build production AI APIs from plain English. JSON schema validation, auto-generated evals, versioning, and rollback — free tier on zzaizzai.com.";

  return {
    title: {
      default: title,
      template: "%s · zzai zzai",
    },
    description,
    metadataBase: new URL(siteUrl),
    keywords: [
      "AI API builder",
      "prompt to API",
      "JSON schema validation",
      "LLM API",
      "zzai",
      "zzaizzai",
      "AI app generator",
    ],
    openGraph: {
      type: "website",
      siteName: "zzai zzai",
      title,
      description,
      url: siteUrl,
      images: [
        {
          url: MEDIA.logo,
          width: 1200,
          height: 630,
          alt: "zzai zzai",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [MEDIA.logo],
    },
    alternates: {
      canonical: siteUrl,
    },
    icons: {
      icon: [{ url: BRAND.logoPath, type: "image/png" }],
      apple: [{ url: BRAND.logoPath, type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    ...(googleVerificationToken ? { verification: { google: googleVerificationToken } } : {}),
  };
}

const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-QL8EXZZMS6";
const gadsId = process.env.NEXT_PUBLIC_GADS_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`min-h-full w-full ${zcFont.variable}`}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:"Zc";src:url("${MEDIA.fontZc}") format("truetype");font-weight:normal;font-style:normal;font-display:block;}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(rootJsonLdSchemas()),
          }}
        />
        {(gaId || gadsId) && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId || gadsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gaId ? `gtag('config','${gaId}');` : ""}${gadsId ? `gtag('config','${gadsId}');window.__GADS_ID__='${gadsId}';` : ""}`}
            </Script>
          </>
        )}
        {clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        )}
      </head>
      <body className="min-h-full w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme={undefined}
          storageKey="svivva-theme"
          disableTransitionOnChange
        >
          <PlatformProvider>
            <Providers>{children}</Providers>
            <Toaster />
          </PlatformProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
