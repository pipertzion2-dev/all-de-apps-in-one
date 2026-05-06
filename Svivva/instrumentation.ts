export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { hydratePlatformSecrets } = await import('./lib/platform-runtime-secrets');
      await hydratePlatformSecrets();
    } catch (err: unknown) {
      console.warn('[instrumentation] Platform secrets hydrate skipped:', err instanceof Error ? err.message : err);
    }
    try {
      const { initStripe } = await import('./lib/stripe/init');
      await initStripe();
    } catch (err: unknown) {
      console.warn('[instrumentation] Stripe init skipped:', err instanceof Error ? err.message : err);
    }
  }
}
