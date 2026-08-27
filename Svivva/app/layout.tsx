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
    "zzai zzai — From seed to symphony. One workspace to describe what you want, ship it with guardrails, and grow it without babysitting infrastructure.";

  return {
    title: {
      default: title,
      template: "%s · zzai zzai",
    },
    description,
    metadataBase: new URL(siteUrl),
    keywords: ["zzai zzai", "zzai", "zzaizzai", "From seed to symphony"],
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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "zzai zzai",
                url: siteUrl,
                logo: new URL(MEDIA.logo, siteUrl).toString(),
                description:
                  "From seed to symphony — zzai zzai is one workspace to describe, ship, and grow products across software, hardware, audio, and go-to-market.",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "zzai zzai",
                url: siteUrl,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "zzai zzai",
                operatingSystem: "Web",
                applicationCategory: "DeveloperApplication",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                description:
                  "From seed to symphony — ship with schema validation, automated checks, versioning, and rollback from one workspace.",
                url: siteUrl,
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What is ZZAI?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "From seed to symphony: ZZAI turns plain-language intent into shipped product — with validation, evaluations, versioning, and rollback so quality does not drift.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How long does it take to ship with ZZAI?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Most teams get a working, tested endpoint live quickly. Describe what you need, define the output schema, deploy — ZZAI handles validation, rollback, and ops.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does ZZAI work with OpenAI and other AI models?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. ZZAI supports OpenAI (GPT-4o, GPT-4, GPT-3.5), Anthropic Claude, Google Gemini, and other LLMs. You can route between models automatically based on cost or quality thresholds.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Do I need to write code to use ZZAI?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. ZZAI's core workflow is entirely no-code — describe your API in plain English, set your output schema, and deploy. A TypeScript SDK is available for developers who want programmatic access.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is ZZAI free to start?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. ZZAI has a free tier with no credit card required. Paid plans start at $49/month and unlock unlimited endpoints, higher request volumes, and team features.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What happens if my endpoint returns bad data?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "ZZAI validates every response against your JSON schema and automatically retries or repairs malformed outputs. If quality drops below your threshold, auto-rollback reverts to the last good version.",
                    },
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                name: "How to ship with ZZAI",
                description:
                  "Build a production-ready endpoint from a plain-language prompt with ZZAI — schema validation, evaluations, and rollback included.",
                step: [
                  {
                    "@type": "HowToStep",
                    position: 1,
                    name: "Describe your API",
                    text: "Write what you want your API to do in plain English — no code required.",
                  },
                  {
                    "@type": "HowToStep",
                    position: 2,
                    name: "Define your output schema",
                    text: "Set the JSON structure you expect back. ZZAI will enforce and validate it on every call.",
                  },
                  {
                    "@type": "HowToStep",
                    position: 3,
                    name: "Auto-generate evaluations",
                    text: "ZZAI writes up to 200 test cases automatically — edge cases, adversarial inputs, and boundary conditions.",
                  },
                  {
                    "@type": "HowToStep",
                    position: 4,
                    name: "Deploy your endpoint",
                    text: "One click publishes a live, auto-scaling API endpoint with full OpenAPI documentation.",
                  },
                  {
                    "@type": "HowToStep",
                    position: 5,
                    name: "Monitor and rollback",
                    text: "Watch latency, success rate, and token costs in real time. Enable auto-rollback for hands-free quality control.",
                  },
                ],
              },
            ]),
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
