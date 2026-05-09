import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pyracrypt — Free Browser-Based File Encryption | Svivva Tools",
  description:
    "Encrypt any file with AES-256 directly in your browser. Zero uploads, zero sign-up, zero cost. Pyracrypt keeps your data private — nothing ever leaves your device.",
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
    title: "Pyracrypt — Free File Encryption in Your Browser",
    description:
      "AES-256 file encryption that runs entirely in your browser. No account, no uploads, no cost. Your files stay on your device.",
    url: "https://svivva.com/pyracrypt",
    siteName: "Svivva",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pyracrypt — Free AES-256 File Encryption",
    description:
      "Encrypt any file directly in your browser. Zero uploads. No sign-up. Integrates with the Svivva platform.",
  },
  alternates: {
    canonical: "https://svivva.com/pyracrypt",
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
  name: "Pyracrypt",
  operatingSystem: "Web",
  applicationCategory: "SecurityApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Free browser-based file encryption using AES-256-GCM. No sign-up, no server uploads. Files never leave your device.",
  url: "https://svivva.com/pyracrypt",
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
