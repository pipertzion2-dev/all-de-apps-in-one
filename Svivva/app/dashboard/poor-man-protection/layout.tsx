"use client";
import { ProGate } from "@/app/components/pro-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProGate feature="Poor Man Protection">{children}</ProGate>;
}
