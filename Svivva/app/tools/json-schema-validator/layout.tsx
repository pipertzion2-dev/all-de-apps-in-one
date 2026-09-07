import type { Metadata } from "next";
import { nativeToolMetadata } from "@/lib/tools/native-tool-meta";

export const metadata: Metadata = nativeToolMetadata({
  path: "/tools/json-schema-validator",
  title: "JSON Schema Validator | ZZAI",
  description:
    "Validate JSON against a schema in the browser before you ship an API endpoint. Free, instant feedback — no signup required.",
  keywords: [
    "json schema validator",
    "validate json online",
    "json schema checker",
    "api schema validation",
    "free json validator",
  ],
});

export default function JsonSchemaValidatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
