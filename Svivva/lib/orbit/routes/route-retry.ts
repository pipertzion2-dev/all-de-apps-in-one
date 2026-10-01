export type RouteRetryPolicy = {
  maxAttempts?: number;
  backoffMs?: number;
};

export function computeRouteRetryDelay(
  attempt: number,
  policy: RouteRetryPolicy,
): number {
  const base = policy.backoffMs ?? 1000;
  return base * Math.pow(2, Math.max(0, attempt - 1));
}

export function shouldRetryStep(attempt: number, policy: RouteRetryPolicy): boolean {
  const max = policy.maxAttempts ?? 3;
  return attempt < max;
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
