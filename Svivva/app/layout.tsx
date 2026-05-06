import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { PlatformProvider } from "@/lib/platform-context";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";

export async function generateMetadata(): Promise<Metadata> {
  let googleVerificationToken: string | null = null;
  try {
    const rows = await db.select({ tok: seedCredentials.googleVerificationToken }).from(seedCredentials).limit(1);
    googleVerificationToken = rows[0]?.tok ?? null;
  } catch {}

  const title = "Svivva — From seed to symphony. AI APIs in 11 minutes.";
  const description =
    "Svivva is the AI-native API builder. Turn a plain-language prompt into a production endpoint with schema validation, model routing, cost policy, retries, billing, and docs — in the time it takes to refill your coffee. Free tier, no credit card.";

  return {
    title: {
      default: title,
      template: "%s | Svivva",
    },
    description,
    metadataBase: new URL(siteUrl),
    keywords: [
      "AI API builder",
      "build AI API",
      "prompt to API",
      "OpenAI API wrapper",
      "Claude API builder",
      "AI endpoint generator",
      "no-code AI API",
      "ship AI features fast",
      "Svivva",
    ],
    openGraph: {
      type: "website",
      siteName: "Svivva",
      title,
      description,
      url: siteUrl,
      images: [{ url: "/svivva-logo.png", width: 1200, height: 630, alt: "Svivva — AI API builder" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/svivva-logo.png"],
    },
    alternates: {
      canonical: siteUrl,
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

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const gadsId = process.env.NEXT_PUBLIC_GADS_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/Zc-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Svivva",
                url: siteUrl,
                logo: `${siteUrl}/logo.png`,
                description: "Svivva — build AI-powered APIs, generate full app suites, compose music, launch hardware products, and automate marketing from one workspace.",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Svivva",
                url: siteUrl,
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/blog?q={search_term_string}` },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Svivva AI API Builder",
                operatingSystem: "Web",
                applicationCategory: "DeveloperApplication",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                description: "Build, test, and deploy AI-powered APIs with schema-enforced JSON responses, auto-generated evaluations, versioning, and instant rollback.",
                url: siteUrl,
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What is Svivva?",
                    acceptedAnswer: { "@type": "Answer", text: "Svivva is an AI-native API builder that turns a plain-language prompt into a production endpoint with schema validation, model routing, auto-evaluations, versioning, cost controls, billing, and auto-generated docs — in minutes." },
                  },
                  {
                    "@type": "Question",
                    name: "How long does it take to build an AI API with Svivva?",
                    acceptedAnswer: { "@type": "Answer", text: "Most users have a working, tested API endpoint live in under 11 minutes. Write the prompt, define the output schema, click deploy — Svivva handles the rest." },
                  },
                  {
                    "@type": "Question",
                    name: "Does Svivva work with OpenAI and other AI models?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes. Svivva supports OpenAI (GPT-4o, GPT-4, GPT-3.5), Anthropic Claude, Google Gemini, and other LLMs. You can route between models automatically based on cost or quality thresholds." },
                  },
                  {
                    "@type": "Question",
                    name: "Do I need to write code to use Svivva?",
                    acceptedAnswer: { "@type": "Answer", text: "No. Svivva's core workflow is entirely no-code — describe your API in plain English, set your output schema, and deploy. A TypeScript SDK is available for developers who want programmatic access." },
                  },
                  {
                    "@type": "Question",
                    name: "Is Svivva free to start?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes. Svivva has a free tier with no credit card required. Paid plans start at $49/month and unlock unlimited endpoints, higher request volumes, and team features." },
                  },
                  {
                    "@type": "Question",
                    name: "What happens if my AI API returns bad data?",
                    acceptedAnswer: { "@type": "Answer", text: "Svivva validates every response against your JSON schema and automatically retries or repairs malformed outputs. If quality drops below your threshold, auto-rollback reverts to the last good version." },
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "HowTo",
                name: "How to build an AI API with Svivva",
                description: "Build a production-ready AI API from a plain-language prompt in under 11 minutes using Svivva.",
                step: [
                  { "@type": "HowToStep", position: 1, name: "Describe your API", text: "Write what you want your API to do in plain English — no code required." },
                  { "@type": "HowToStep", position: 2, name: "Define your output schema", text: "Set the JSON structure you expect back. Svivva will enforce and validate it on every call." },
                  { "@type": "HowToStep", position: 3, name: "Auto-generate evaluations", text: "Svivva writes up to 200 test cases automatically — edge cases, adversarial inputs, and boundary conditions." },
                  { "@type": "HowToStep", position: 4, name: "Deploy your endpoint", text: "One click publishes a live, auto-scaling API endpoint with full OpenAPI documentation." },
                  { "@type": "HowToStep", position: 5, name: "Monitor and rollback", text: "Watch latency, success rate, and token costs in real time. Enable auto-rollback for hands-free quality control." },
                ],
              },
            ]),
          }}
        />
        {(gaId || gadsId) && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId || gadsId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gaId ? `gtag('config','${gaId}');` : ''}${gadsId ? `gtag('config','${gadsId}');window.__GADS_ID__='${gadsId}';` : ''}`}
            </Script>
          </>
        )}
        {clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        )}
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme={undefined}
          storageKey="svivva-theme"
          disableTransitionOnChange
        >
          <PlatformProvider>
            <Providers>
              {children}
            </Providers>
            <Toaster />
          </PlatformProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
