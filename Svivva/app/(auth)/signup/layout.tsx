import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Svivva account — From seed to symphony.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
