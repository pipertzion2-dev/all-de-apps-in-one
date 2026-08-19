import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to ZZAI — From seed to symphony.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
