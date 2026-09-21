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
import { resolveSiteAdsenseClient } from "@/lib/adsense-credentials";
import { homepageJsonLdGraph } from "@/lib/seo/schema/builders";

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

  const title = "zzai zzai — From seed to symphony";
  const description =
    "zzai zzai (ZZAI / zzaizzai.com) — From seed to symphony. One workspace to describe what you want, ship it with guardrails across software, hardware, growth, and IP protection — without babysitting infrastructure.";

  return {
    title: {
      default: title,
      template: "%s · zzai zzai",
    },
    description,
    metadataBase: new URL(siteUrl),
    keywords: [
      ...BRAND.aliases,
      BRAND.tagline,
      "AI API builder",
      "prompt to API",
      "OaaS",
      "ZZAI Seeds",
      "Poor Man Protection",
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
/** SearchDock site-agent — reads brand manifests + heartbeats for AEO. Empty env disables. */
const SEARCHDOCK_TOKEN =
  process.env.NEXT_PUBLIC_SEARCHDOCK_TOKEN?.trim() || "sd-ab55f04b597744436666877149dd1b56";
const SEARCHDOCK_ENDPOINT =
  process.env.NEXT_PUBLIC_SEARCHDOCK_ENDPOINT?.trim() ||
  "https://app.searchdock.io/api/v1/site-agent/heartbeat";
const SEARCHDOCK_SDK =
  process.env.NEXT_PUBLIC_SEARCHDOCK_SDK?.trim() ||
  "https://app.searchdock.io/api/v1/site-agent/sdk";
const searchdockEnabled = SEARCHDOCK_TOKEN.length > 0 && SEARCHDOCK_TOKEN !== "off";

function resolveAdsenseClient(): string | null {
  return resolveSiteAdsenseClient();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = resolveAdsenseClient();
  const adsenseBanner = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() || "";
  const adsenseInterstitial = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL?.trim() || "";
  const adsenseRewarded = process.env.NEXT_PUBLIC_ADSENSE_SLOT_REWARDED?.trim() || "";
  const adsenseRuntimeJs = adsenseClient
    ? `window.__ADSENSE_CLIENT__=${JSON.stringify(adsenseClient)};${
        /^\d+$/.test(adsenseBanner)
          ? `window.__ADSENSE_SLOT_BANNER__=${JSON.stringify(adsenseBanner)};`
          : ""
      }${
        /^\d+$/.test(adsenseInterstitial)
          ? `window.__ADSENSE_SLOT_INTERSTITIAL__=${JSON.stringify(adsenseInterstitial)};`
          : ""
      }${
        /^\d+$/.test(adsenseRewarded)
          ? `window.__ADSENSE_SLOT_REWARDED__=${JSON.stringify(adsenseRewarded)};`
          : ""
      }`
    : null;

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
            __html: JSON.stringify(homepageJsonLdGraph()),
          }}
        />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="llms-full.txt" />
        <link rel="alternate" type="application/json" href="/brand.json" title="brand.json" />
        {/* Consent Mode v2 defaults BEFORE GA / AdSense — required for Google CMP (Funding Choices) */}
        <script
          id="google-consent-mode-defaults"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'denied',
  functionality_storage:'granted',
  security_storage:'granted',
  wait_for_update:500
});
gtag('consent','default',{
  ad_storage:'granted',
  ad_user_data:'granted',
  ad_personalization:'granted',
  analytics_storage:'granted',
  region:['US','CA','AU','NZ','JP','KR','SG','IN','BR','MX']
});`,
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
        {adsenseRuntimeJs && (
          <Script id="adsense-runtime-config" strategy="beforeInteractive">
            {adsenseRuntimeJs}
          </Script>
        )}
        {adsenseClient && (
          // Native <script> in <head> — required for Google AdSense "Verify site ownership"
          // (same snippet AdSense shows: pagead2…adsbygoogle.js?client=ca-pub-…)
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        {searchdockEnabled && (
          // Native <script> — SearchDock site-agent SDK reads data-token / data-endpoint
          // from this element (same snippet SearchDock provides for zzaizzai.com).
          <script
            async
            src={SEARCHDOCK_SDK}
            data-token={SEARCHDOCK_TOKEN}
            data-endpoint={SEARCHDOCK_ENDPOINT}
          />
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
