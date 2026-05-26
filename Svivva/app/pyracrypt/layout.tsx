import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clutter",
  description:
    "Clutter is embedded into Svivva (powered by Pyracrypt UI). This route redirects to /clutter.",
  keywords: [
    "file encryption",
    "browser encryption",
    "AES-256",
    "free file encryption",
    "client-side encryption",
    "encrypt files online",
    "no upload encryption",
    "Pyracrypt",
  ],
  openGraph: {
    title: "Clutter — embedded in Svivva",
    description:
      "Clutter is embedded into Svivva (powered by Pyracrypt UI). This route redirects to /clutter.",
    url: "https://svivva.com/clutter",
    siteName: "Svivva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutter — embedded in Svivva",
    description:
      "Clutter is embedded into Svivva (powered by Pyracrypt UI). This route redirects to /clutter.",
  },
  alternates: {
    canonical: "https://svivva.com/clutter",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Pyracrypt's free plan really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — completely free, no sign-up, no limits on the core encryption tool. Paid plans unlock advanced scanning, team seats, and reporting.",
      },
    },
    {
      "@type": "Question",
      name: "Where do my files go when I use Pyracrypt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nowhere. Pyracrypt processes everything locally in your browser using the Web Crypto API. Files never touch a server.",
      },
    },
    {
      "@type": "Question",
      name: "Can I decrypt Pyracrypt files without Pyracrypt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pyracrypt uses standard AES-256-GCM. Any tool that supports this cipher can decrypt your files if you have the key.",
      },
    },
    {
      "@type": "Question",
      name: "What encryption standard does Pyracrypt use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pyracrypt uses AES-256-GCM — the same standard used by government agencies and financial institutions worldwide. Encryption runs entirely in your browser via the Web Crypto API.",
      },
    },
    {
      "@type": "Question",
      name: "Does Pyracrypt work offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once loaded, Pyracrypt can encrypt and decrypt files without an internet connection, since all processing happens locally in your browser.",
      },
    },
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Clutter",
  operatingSystem: "Web",
  applicationCategory: "ProductivityApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Embedded Svivva mobile experience powered by Pyracrypt UI patterns. Redirects to /clutter.",
  url: "https://svivva.com/clutter",
};

export default function PyracryptLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, softwareSchema]) }}
      />
      {children}
    </>
  );
}
