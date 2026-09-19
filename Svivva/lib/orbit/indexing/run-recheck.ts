import type { RecheckResult } from "./index-types";
import { listIndexRecordsDueForRecheck, updateIndexRecordStatus } from "./index-repository";
import { probeIndexUrl } from "./url-probe";
import { computeNextCheckAt, statusAfterProbe } from "./index-state-machine";
import type { OrbitIndexStatus } from "../graph-constants";
import { emitIndexStatusChange } from "../analytics/emit-outcomes";

export async function runIndexRecheck(limit = 50): Promise<RecheckResult> {
  const due = await listIndexRecordsDueForRecheck(limit);
  const result: RecheckResult = {
    checked: 0,
    advanced: 0,
    failed: 0,
    records: [],
  };

  for (const record of due) {
    result.checked += 1;
    const probe = await probeIndexUrl(record.url);
    const from = record.status as OrbitIndexStatus;
    const to = statusAfterProbe(from, probe);

    await updateIndexRecordStatus(record.id, {
      status: to,
      lastCheckedAt: new Date(),
      nextCheckAt: computeNextCheckAt(to),
      failureReason: to === "failed" || to === "not_indexed" ? probe.notes : null,
      metadata: { lastProbe: probe },
    });

    if (to !== from) {
      result.advanced += 1;
      result.records.push({ id: record.id, url: record.url, from, to });
      await emitIndexStatusChange(
        { ...record, status: to, failureReason: to === "failed" || to === "not_indexed" ? probe.notes : null },
        from,
      );
    }
    if (to === "failed" || to === "not_indexed") {
      result.failed += 1;
    }
  }

  return result;
}
