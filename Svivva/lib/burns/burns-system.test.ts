import { describe, expect, it } from "vitest";
import {
  BURNS_NODES,
  BURNS_STAGES,
  BURNS_STAGE_LABELS,
  burnsEdges,
  burnsEstimatedSeconds,
  burnsExecutionOrder,
  burnsNodesByStage,
  getBurnsNode,
} from "./burns-graph";
import { burnsNodesMissingExecutors, runBurnsSystem, type BurnsRunResult } from "./burns-runner";
import { FEATURE_BY_ID } from "@/lib/platform/feature-graph";

describe("burns graph integrity", () => {
  it("has nodes with unique ids", () => {
    const ids = BURNS_NODES.map((n) => n.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every dependency to a real node", () => {
    for (const node of BURNS_NODES) {
      for (const dep of node.dependsOn) {
        expect(getBurnsNode(dep), `${node.id} -> ${dep}`).toBeDefined();
      }
    }
  });

  it("is acyclic and orders dependencies before their dependents", () => {
    const order = burnsExecutionOrder();
    expect(order).toHaveLength(BURNS_NODES.length);
    const seen = new Set<string>();
    for (const node of order) {
      for (const dep of node.dependsOn) {
        expect(seen.has(dep), `${node.id} ran before dependency ${dep}`).toBe(true);
      }
      seen.add(node.id);
    }
  });

  it("uses only declared stages and labels every one", () => {
    for (const node of BURNS_NODES) {
      expect(BURNS_STAGES).toContain(node.stage);
      expect(BURNS_STAGE_LABELS[node.stage]).toBeTruthy();
    }
  });

  it("points featureId at real platform features", () => {
    // A typo here would render a blank feature name in the graph UI.
    for (const node of BURNS_NODES) {
      if (!node.featureId) continue;
      expect(FEATURE_BY_ID.get(node.featureId), `${node.id} -> ${node.featureId}`).toBeDefined();
    }
  });

  it("derives one edge per dependency", () => {
    const expected = BURNS_NODES.reduce((n, node) => n + node.dependsOn.length, 0);
    expect(burnsEdges()).toHaveLength(expected);
  });

  it("groups every node into a stage column", () => {
    const total = burnsNodesByStage().reduce((n, col) => n + col.nodes.length, 0);
    expect(total).toBe(BURNS_NODES.length);
  });

  it("gives every node a positive time estimate", () => {
    for (const node of BURNS_NODES) expect(node.estimatedSeconds).toBeGreaterThan(0);
    expect(burnsEstimatedSeconds()).toBeGreaterThan(0);
  });

  it("has an executor for every node", () => {
    // Guards the 6am job: a graph node with no executor would silently skip.
    expect(burnsNodesMissingExecutors()).toEqual([]);
  });
});

/** Executors that always succeed, recording call order. */
function stubExecutors(calls: string[], failing: string[] = []) {
  const out: Record<string, () => Promise<{ message: string }>> = {};
  for (const node of BURNS_NODES) {
    out[node.id] = async () => {
      calls.push(node.id);
      if (failing.includes(node.id)) throw new Error(`boom ${node.id}`);
      return { message: `${node.id} done` };
    };
  }
  return out;
}

describe("burns runner", () => {
  it("runs every node in dependency order and reports ok", async () => {
    const calls: string[] = [];
    const run = await runBurnsSystem({ executors: stubExecutors(calls), trigger: "cron" });

    expect(run.ok).toBe(true);
    expect(run.trigger).toBe("cron");
    expect(run.counts.ok).toBe(BURNS_NODES.length);
    expect(run.counts.failed).toBe(0);
    expect(calls).toEqual(burnsExecutionOrder().map((n) => n.id));
  });

  it("blocks dependents when a node fails, without aborting the whole run", async () => {
    const calls: string[] = [];
    // content-gaps has several dependents, so this exercises propagation.
    const run = await runBurnsSystem({
      executors: stubExecutors(calls, ["content-gaps"]),
    });

    const byId = new Map(run.nodes.map((n) => [n.id, n]));
    expect(byId.get("content-gaps")?.status).toBe("failed");
    expect(byId.get("quality-repair")?.status).toBe("blocked");
    expect(byId.get("index-submit")?.status).toBe("blocked");
    expect(run.ok).toBe(false);

    // Independent branches still run.
    expect(byId.get("growth-intel")?.status).toBe("ok");
    expect(calls).not.toContain("quality-repair");
  });

  it("keeps a node's failure message", async () => {
    const run = await runBurnsSystem({ executors: stubExecutors([], ["seo-monitor"]) });
    const node = run.nodes.find((n) => n.id === "seo-monitor");
    expect(node?.status).toBe("failed");
    expect(node?.message).toContain("boom seo-monitor");
  });

  it("stops on the time budget instead of overrunning the cron", async () => {
    let clock = 0;
    // Every call advances the clock 30s, so a 60s budget admits very few nodes.
    const run = await runBurnsSystem({
      executors: stubExecutors([]),
      budgetMs: 60_000,
      now: () => (clock += 30_000),
    });
    expect(run.truncated).toBe(true);
    expect(run.counts.skipped).toBeGreaterThan(0);
    expect(run.summary).toContain("time budget");
  });

  it("runs a single node on demand without blocking on unselected dependencies", async () => {
    const calls: string[] = [];
    const run = await runBurnsSystem({
      executors: stubExecutors(calls),
      only: ["index-health"],
    });
    expect(calls).toEqual(["index-health"]);
    expect(run.nodes).toHaveLength(1);
    expect(run.nodes[0].status).toBe("ok");
  });

  it("marks a node skipped when no executor is registered", async () => {
    const run = await runBurnsSystem({ executors: {}, only: ["growth-intel"] });
    expect(run.nodes[0].status).toBe("skipped");
    expect(run.nodes[0].message).toContain("No executor");
  });

  it("produces a JSON-serialisable result for persistence", async () => {
    const run = await runBurnsSystem({ executors: stubExecutors([]) });
    const round = JSON.parse(JSON.stringify(run)) as BurnsRunResult;
    expect(round.nodes).toHaveLength(run.nodes.length);
    expect(round.summary).toBe(run.summary);
  });
});
