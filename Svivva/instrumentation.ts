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
      const { probeAndCacheOllama, isOnVercelRuntime } = await import("./lib/llm/providers");
      if (!isOnVercelRuntime()) {
        const ollama = await probeAndCacheOllama();
        if (ollama) console.log("[instrumentation] Ollama auto-detected at", ollama);
      }
    } catch {
      /* optional local AI */
    }
    try {
      const { resetOpenAIClientCache, getActiveAiProvider, getRuntimeLabel } =
        await import("./lib/llm/openai");
      resetOpenAIClientCache();
      console.log(
        `[instrumentation] Runtime: ${getRuntimeLabel()}, Play AI: ${getActiveAiProvider()}`,
      );
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
