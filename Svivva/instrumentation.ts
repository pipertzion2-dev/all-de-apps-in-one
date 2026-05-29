export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { hydratePlatformSecrets } = await import("./lib/platform-runtime-secrets");
      await hydratePlatformSecrets();
    } catch (err: unknown) {
      console.warn(
        "[instrumentation] Platform secrets hydrate skipped:",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      const { probeAndCacheOllama } = await import("./lib/llm/providers");
      const ollama = await probeAndCacheOllama();
      if (ollama) console.log("[instrumentation] Ollama auto-detected at", ollama);
    } catch {
      /* optional local AI */
    }
    try {
      const { resetOpenAIClientCache, getActiveAiProvider } = await import("./lib/llm/openai");
      resetOpenAIClientCache();
      console.log("[instrumentation] Play AI provider:", getActiveAiProvider());
    } catch {
      /* ignore */
    }
    try {
      const { initStripe } = await import("./lib/stripe/init");
      await initStripe();
    } catch (err: unknown) {
      console.warn(
        "[instrumentation] Stripe init skipped:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}
