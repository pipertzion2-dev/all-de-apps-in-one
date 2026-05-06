"use client";
import { ProGate } from "@/app/components/pro-gate";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProGate feature="Hypothesis Lab">{children}</ProGate>;
}
