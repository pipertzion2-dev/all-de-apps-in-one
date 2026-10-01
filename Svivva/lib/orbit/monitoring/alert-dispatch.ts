import type { ProjectHealthAlert } from "./project-health";

export type AlertDispatchResult = {
  dispatched: boolean;
  channel?: string;
  reason?: string;
};

/** Dispatch critical alerts to Slack webhook when configured. */
export async function dispatchProjectAlerts(input: {
  projectId: string;
  projectName: string;
  alerts: ProjectHealthAlert[];
}): Promise<AlertDispatchResult> {
  const critical = input.alerts.filter((a) => a.level === "critical");
  if (critical.length === 0) {
    return { dispatched: false, reason: "no_critical_alerts" };
  }

  const webhookUrl =
    process.env.ORBIT_ALERTS_SLACK_WEBHOOK?.trim() ||
    process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { dispatched: false, reason: "no_webhook_configured" };
  }

  const text = [
    `*Orbit alert* — ${input.projectName} (\`${input.projectId.slice(0, 8)}…\`)`,
    ...critical.map((a) => `• [${a.code}] ${a.message}`),
  ].join("\n");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    });
    return { dispatched: res.ok, channel: "slack", reason: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return {
      dispatched: false,
      channel: "slack",
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}
