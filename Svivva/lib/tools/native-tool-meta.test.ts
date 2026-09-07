import { describe, expect, it } from "vitest";
import { nativeToolMetadata } from "@/lib/tools/native-tool-meta";

describe("nativeToolMetadata", () => {
  it("self-canonicalizes each /tools/* page", () => {
    const meta = nativeToolMetadata({
      path: "/tools/prompt-forge",
      title: "PromptForge | ZZAI",
      description: "Test prompts in the browser.",
    });
    expect(meta.alternates?.canonical).toBe("https://zzaizzai.com/tools/prompt-forge");
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });
});
