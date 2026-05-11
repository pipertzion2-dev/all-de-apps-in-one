import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Svivva — From seed to symphony.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
